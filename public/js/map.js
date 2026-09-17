/* ============================================
   ProspectMap CRM — Map Controller
   ============================================ */

const MapController = (() => {
  let map = null;
  let markersLayer = null;
  let osmMarkersLayer = null;
  let searchTimeout = null;

  const STATUS_COLORS = {
    lead: '#6382ff',
    contacted: '#fbbf24',
    proposal: '#fb923c',
    negotiation: '#a78bfa',
    won: '#34d399',
    lost: '#f87171',
  };

  async function init() {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;

    map = L.map('map', {
      center: [-6.2088, 106.8456],
      zoom: 12,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    if (typeof L.markerClusterGroup === 'function') {
      markersLayer = L.markerClusterGroup({
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
      });
      osmMarkersLayer = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
      });
    } else {
      markersLayer = L.layerGroup();
      osmMarkersLayer = L.layerGroup();
    }
    
    map.addLayer(osmMarkersLayer);
    map.addLayer(markersLayer);

    await refreshMarkers();
    setupMapSearch();
    setupActionButtons();

    // Map discovery feature
    map.on('moveend', debounceDiscoverBusinesses);
    const toggleDiscovery = document.getElementById('toggle-business-discovery');
    if (toggleDiscovery) {
      toggleDiscovery.addEventListener('change', (e) => {
        if (e.target.checked) {
          map.addLayer(osmMarkersLayer);
          discoverBusinesses();
        } else {
          map.removeLayer(osmMarkersLayer);
        }
      });
    }
    
    // Initial discovery
    setTimeout(discoverBusinesses, 1000);
  }

  function createMarkerIcon(status) {
    const color = STATUS_COLORS[status] || '#6382ff';
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 28px; height: 28px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid rgba(255,255,255,0.3);
        box-shadow: 0 2px 10px ${color}66;
        display: flex; align-items: center; justify-content: center;
      "><div style="
        width: 10px; height: 10px;
        background: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    });
  }

  function createOsmMarkerIcon() {
    return L.divIcon({
      className: 'osm-marker',
      html: `<div style="
        width: 16px; height: 16px;
        background: #6b7280;
        border-radius: 4px;
        border: 2px solid rgba(255,255,255,0.2);
        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
      "></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -8],
    });
  }

  function createPopupContent(prospect) {
    const services = (prospect.services || []).map(s => `<span class="kanban-card-service-tag">${s}</span>`).join('');
    return `
      <div class="popup-content">
        <div class="popup-header">
          <div class="avatar" style="background:${Utils.generateAvatarColor(prospect.company_name)}">${Utils.getInitials(prospect.company_name)}</div>
          <div>
            <div class="popup-company">${prospect.company_name}</div>
            <div class="popup-industry">${prospect.industry || 'N/A'}</div>
          </div>
        </div>
        <div class="popup-details">
          ${prospect.address ? `<div class="popup-detail-row">📍 ${Utils.truncate(prospect.address, 40)}</div>` : ''}
          ${prospect.phone ? `<div class="popup-detail-row">📞 ${prospect.phone}</div>` : ''}
          ${prospect.pic_name ? `<div class="popup-detail-row">👤 ${prospect.pic_name} (${prospect.pic_role || ''})</div>` : ''}
          <div class="popup-detail-row">${Utils.getStatusBadgeHTML(prospect.status)}</div>
          ${prospect.deal_value ? `<div class="popup-detail-row">💰 ${Utils.formatCurrency(prospect.deal_value)}</div>` : ''}
        </div>
        ${services ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">${services}</div>` : ''}
        <div class="popup-actions">
          <button class="btn btn-sm btn-primary" onclick="App.openProspectDetail('${prospect.id}')">Detail</button>
          ${prospect.pic_phone ? `<button class="btn btn-sm btn-success" onclick="Utils.openWhatsApp('${prospect.pic_phone}')">💬 WA</button>` : ''}
          <button class="btn btn-sm btn-ghost" onclick="App.editProspect('${prospect.id}')">✏️ Edit</button>
        </div>
      </div>
    `;
  }
  
  function createOsmPopupContent(biz) {
    const websiteLink = biz.website ? (biz.website.startsWith('http') ? biz.website : 'https://' + biz.website) : '#';
    const cleanAddress = (biz.address || '').replace(/'/g, "\\'");
    
    return `
      <div class="google-popup">
        <div class="google-popup-header">
          <div class="google-popup-title">${biz.name}</div>
          <div class="google-popup-subtitle">${biz.category || 'Business'}</div>
        </div>
        
        <div class="google-popup-actions">
          ${biz.website ? `<a href="${websiteLink}" target="_blank" class="google-action-btn" style="text-decoration:none">🌐 Situs</a>` : ''}
          <button class="google-action-btn" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${biz.lat},${biz.lng}', '_blank')">🧭 Rute</button>
          <button class="google-action-btn" onclick="alert('Ini adalah data OpenStreetMap gratis, ulasan tidak tersedia.')">💬 Ulasan</button>
          <button class="google-action-btn" onclick="App.openAddProspectFromMap(${biz.lat}, ${biz.lng}, '${cleanAddress}')">⭐ Simpan</button>
          ${biz.phone ? `<a href="tel:${biz.phone}" class="google-action-btn" style="text-decoration:none">📞 Telepon</a>` : ''}
        </div>
        
        <div class="google-popup-details">
          ${biz.address ? `
          <div class="google-detail-row">
            <div class="google-detail-icon">📍</div>
            <div class="google-detail-text"><strong>Alamat:</strong> ${biz.address}</div>
          </div>` : ''}
          
          ${biz.phone ? `
          <div class="google-detail-row">
            <div class="google-detail-icon">📞</div>
            <div class="google-detail-text"><strong>Telepon:</strong> ${biz.phone}</div>
          </div>` : ''}
          
          ${biz.opening_hours ? `
          <div class="google-detail-row">
            <div class="google-detail-icon">🕒</div>
            <div class="google-detail-text"><strong>Jam:</strong> ${biz.opening_hours}</div>
          </div>` : ''}
          
          ${biz.province ? `
          <div class="google-detail-row">
            <div class="google-detail-icon">🗺️</div>
            <div class="google-detail-text"><strong>Provinsi:</strong> ${biz.province}</div>
          </div>` : ''}
        </div>
        
        <div class="google-popup-footer" onclick="App.openAddProspectFromMap(${biz.lat}, ${biz.lng}, '${cleanAddress}')">
          Sarankan edit • Tambahkan ke CRM ProspectMap?
        </div>
      </div>
    `;
  }

  async function refreshMarkers() {
    if (!markersLayer) return;
    markersLayer.clearLayers();

    const prospects = await Store.getProspects();
    prospects.forEach(p => {
      if (p.lat && p.lng) {
        const marker = L.marker([p.lat, p.lng], { icon: createMarkerIcon(p.status) });
        marker.bindPopup(createPopupContent(p), { maxWidth: 300, minWidth: 260, className: 'custom-popup' });
        marker.prospectId = p.id;
        markersLayer.addLayer(marker);
      }
    });

    updateMapStats(prospects);
  }

  function updateMapStats(prospects) {
    const withCoords = prospects.filter(p => p.lat && p.lng);
    const el = document.getElementById('map-stats');
    if (el) {
      el.innerHTML = `
        <div class="map-stat"><div class="map-stat-value">${withCoords.length}</div><div class="map-stat-label">On Map</div></div>
        <div class="map-stat"><div class="map-stat-value">${prospects.length}</div><div class="map-stat-label">Total</div></div>
        <div class="map-stat"><div class="map-stat-value">${Utils.formatCompactCurrency(prospects.filter(p => p.status !== 'lost').reduce((s, p) => s + (Number(p.deal_value) || 0), 0))}</div><div class="map-stat-label">Pipeline</div></div>
      `;
    }
  }
  
  const debounceDiscoverBusinesses = Utils.debounce(discoverBusinesses, 1000);
  
  async function discoverBusinesses() {
    // Autodiscover is always enabled
    // Handle Zoom Warning UI
    let zoomWarning = document.getElementById('zoom-warning-overlay');
    if (!zoomWarning) {
      zoomWarning = document.createElement('div');
      zoomWarning.id = 'zoom-warning-overlay';
      zoomWarning.style.cssText = 'position:absolute; top:20px; left:50%; transform:translateX(-50%); z-index:400; background:var(--accent-red); color:white; padding:8px 16px; border-radius:20px; font-size:13px; font-weight:600; box-shadow:0 4px 12px rgba(0,0,0,0.3); pointer-events:none; transition:opacity 0.3s; opacity:0;';
      zoomWarning.innerHTML = '🔍 Perbesar (Zoom In) peta ke kota untuk mencari PT & CV';
      document.querySelector('.map-container').appendChild(zoomWarning);
    }
    
    if (map.getZoom() < 11) {
      zoomWarning.style.opacity = '1';
      return;
    } else {
      zoomWarning.style.opacity = '0';
    }
    
    const bounds = map.getBounds();
    try {
      const data = await Store.searchMapBusinesses(bounds);
      if (data && data.businesses) {
        renderOsmBusinesses(data.businesses);
      }
    } catch (e) {
      console.warn("Failed to fetch map businesses", e);
    }
  }
  
  function renderOsmBusinesses(businesses) {
    if (!osmMarkersLayer) return;
    osmMarkersLayer.clearLayers();
    
    businesses.forEach(biz => {
      const marker = L.marker([biz.lat, biz.lng], { icon: createOsmMarkerIcon() });
      marker.bindPopup(createOsmPopupContent(biz), { maxWidth: 300, minWidth: 260, className: 'custom-popup' });
      osmMarkersLayer.addLayer(marker);
    });
  }

  function setupMapSearch() {
    const input = document.getElementById('map-search-input');
    const resultsEl = document.getElementById('map-search-results');
    if (!input || !resultsEl) return;

    input.addEventListener('input', Utils.debounce(async (e) => {
      const query = e.target.value.trim();
      if (query.length < 3) { resultsEl.classList.remove('visible'); return; }
      await searchLocation(query);
    }, 400));

    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { resultsEl.classList.remove('visible'); input.blur(); } });
    document.addEventListener('click', (e) => { if (!e.target.closest('.map-search-wrapper')) resultsEl.classList.remove('visible'); });
  }

  async function searchLocation(query) {
    const resultsEl = document.getElementById('map-search-results');
    if (!resultsEl) return;
    resultsEl.innerHTML = `<div class="search-result-item"><div class="map-loading"><div class="spinner"></div><span class="map-loading-text">Searching...</span></div></div>`;
    resultsEl.classList.add('visible');

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&countrycodes=id`);
      const data = await response.json();
      if (data.length === 0) {
        resultsEl.innerHTML = `<div class="search-result-item"><div class="search-result-info"><div class="search-result-name">No results found</div><div class="search-result-address">Try different keywords</div></div></div>`;
        return;
      }
      resultsEl.innerHTML = data.map(item => `
        <div class="search-result-item" data-lat="${item.lat}" data-lng="${item.lon}" data-name="${item.display_name}">
          <div class="search-result-icon">📍</div>
          <div class="search-result-info">
            <div class="search-result-name">${item.name || item.display_name.split(',')[0]}</div>
            <div class="search-result-address">${item.display_name}</div>
            <div class="search-result-type">${item.type || item.class || ''}</div>
          </div>
        </div>
      `).join('');

      resultsEl.querySelectorAll('.search-result-item').forEach(el => {
        el.addEventListener('click', () => {
          const lat = parseFloat(el.dataset.lat);
          const lng = parseFloat(el.dataset.lng);
          const name = el.dataset.name;
          map.setView([lat, lng], 16);
          resultsEl.classList.remove('visible');
          document.getElementById('map-search-input').value = '';
          showTempMarker(lat, lng, name);
        });
      });
    } catch (err) {
      resultsEl.innerHTML = `<div class="search-result-item"><div class="search-result-info"><div class="search-result-name">Search failed</div><div class="search-result-address">Check your internet connection</div></div></div>`;
    }
  }

  function showTempMarker(lat, lng, address) {
    const tempMarker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: `<div style="width: 32px; height: 32px; background: linear-gradient(135deg, #6382ff, #22d3ee); border-radius: 50%; border: 3px solid white; box-shadow: 0 0 20px rgba(99,130,255,0.5); animation: pulse 1.5s infinite;"></div>`,
        iconSize: [32, 32], iconAnchor: [16, 16],
      }),
    }).addTo(map);

    const popup = L.popup({ maxWidth: 280, minWidth: 240, className: 'custom-popup' }).setContent(`
      <div class="popup-content">
        <div style="font-weight:700;margin-bottom:8px;">📍 Add as Prospect?</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">${Utils.truncate(address, 80)}</div>
        <div class="popup-actions">
          <button class="btn btn-sm btn-primary" onclick="App.openAddProspectFromMap(${lat}, ${lng}, '${address.replace(/'/g, "\\'")}')">+ Add Prospect</button>
          <button class="btn btn-sm btn-ghost" onclick="MapController.removeTempMarker()">Cancel</button>
        </div>
      </div>
    `);
    tempMarker.bindPopup(popup).openPopup();
    MapController._tempMarker = tempMarker;
  }

  function removeTempMarker() {
    if (MapController._tempMarker) { map.removeLayer(MapController._tempMarker); MapController._tempMarker = null; }
  }

  function setupActionButtons() {
    const locateBtn = document.getElementById('btn-locate');
    if (locateBtn) {
      locateBtn.addEventListener('click', () => {
        map.locate({ setView: true, maxZoom: 15 });
        map.once('locationfound', (e) => {
          L.circleMarker(e.latlng, { radius: 8, color: '#6382ff', fillColor: '#6382ff', fillOpacity: 0.5 }).addTo(map).bindPopup('📍 Your location').openPopup();
        });
      });
    }

    const fitBtn = document.getElementById('btn-fit-markers');
    if (fitBtn) {
      fitBtn.addEventListener('click', () => {
        if (markersLayer.getLayers().length > 0) { map.fitBounds(markersLayer.getBounds(), { padding: [50, 50] }); }
      });
    }

    const filterBtn = document.getElementById('btn-map-filter');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => {
        const panel = document.getElementById('map-filter-panel');
        if (panel) { panel.classList.toggle('visible'); filterBtn.classList.toggle('active'); }
      });
    }

    const statusFilter = document.getElementById('map-filter-status');
    const serviceFilter = document.getElementById('map-filter-service');
    if (statusFilter) statusFilter.addEventListener('change', applyMapFilters);
    if (serviceFilter) serviceFilter.addEventListener('change', applyMapFilters);
  }

  async function applyMapFilters() {
    const statusVal = document.getElementById('map-filter-status')?.value || '';
    const serviceVal = document.getElementById('map-filter-service')?.value || '';

    markersLayer.clearLayers();
    let prospects = await Store.getProspects();
    if (statusVal) prospects = prospects.filter(p => p.status === statusVal);
    if (serviceVal) prospects = prospects.filter(p => (p.services || []).includes(serviceVal));

    prospects.forEach(p => {
      if (p.lat && p.lng) {
        const marker = L.marker([p.lat, p.lng], { icon: createMarkerIcon(p.status) });
        marker.bindPopup(createPopupContent(p), { maxWidth: 300, minWidth: 260, className: 'custom-popup' });
        marker.prospectId = p.id;
        markersLayer.addLayer(marker);
      }
    });
    updateMapStats(prospects);
  }

  async function focusProspect(id) {
    const prospect = await Store.getProspect(id);
    if (prospect && prospect.lat && prospect.lng) {
      App.navigateTo('map');
      setTimeout(() => {
        map.setView([prospect.lat, prospect.lng], 16);
        markersLayer.eachLayer(layer => { if (layer.prospectId == id) layer.openPopup(); });
      }, 300);
    }
  }

  function getMap() { return map; }

  return { init, refreshMarkers, removeTempMarker, focusProspect, getMap, _tempMarker: null };
})();
