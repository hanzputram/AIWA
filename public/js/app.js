/* ============================================
   ProspectMap CRM — Main App Controller
   ============================================ */

const App = (() => {
  let currentPage = 'dashboard';

  async function init() {
    // Initialize all controllers
    await DashboardController.init();
    await MapController.init();
    await KanbanController.init();
    await ProspectController.init();
    await ServiceController.init();
    await ActivityController.init();

    // Setup navigation
    setupNavigation();
    setupSidebarToggle();
    setupModals();
    await populateServiceOptions();

    // Determine current page from DOM and trigger specific logic
    const activePageEl = document.querySelector('.page.active');
    if (activePageEl) {
        const pageId = activePageEl.id.replace('page-', '');
        currentPage = pageId;
        
        if (pageId === 'dashboard') await DashboardController.render();
        if (pageId === 'map') {
            setTimeout(() => {
                const map = MapController.getMap();
                if (map) map.invalidateSize();
            }, 100);
        }
        if (pageId === 'kanban') await KanbanController.render();
        if (pageId === 'prospects') await ProspectController.render();
        if (pageId === 'services') await ServiceController.render();
        if (pageId === 'activities') await ActivityController.render();
    }
  }

  // ---- Navigation ----
  async function navigateTo(pageId) {
    currentPage = pageId;
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageId);
    });
    document.querySelectorAll('.page').forEach(page => {
      page.classList.toggle('active', page.id === `page-${pageId}`);
    });

    if (pageId === 'dashboard') await DashboardController.render();
    if (pageId === 'map') {
      setTimeout(() => {
        const map = MapController.getMap();
        if (map) map.invalidateSize();
      }, 100);
    }
    if (pageId === 'kanban') await KanbanController.render();
    if (pageId === 'prospects') await ProspectController.render();
    if (pageId === 'services') await ServiceController.render();
    if (pageId === 'activities') await ActivityController.render();
  }

  function setupNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        // Fallback for real links vs old SPA approach
        const href = item.getAttribute('href');
        if (href && href !== '#') {
          window.location.href = href;
        } else {
          navigateTo(item.dataset.page);
        }
      });
    });
  }

  function setupSidebarToggle() {
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        setTimeout(() => {
          const map = MapController.getMap();
          if (map) map.invalidateSize();
        }, 400);
      });
    }
  }

  function setupModals() {
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => closeModal());
    });
    document.getElementById('modal-overlay')?.addEventListener('click', () => closeModal());
    document.getElementById('prospect-form')?.addEventListener('submit', handleProspectFormSubmit);
    document.getElementById('service-form')?.addEventListener('submit', handleServiceFormSubmit);
    document.getElementById('activity-form')?.addEventListener('submit', handleActivityFormSubmit);
    setupDataHandlers();
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    if (modal) modal.classList.add('visible');
    if (overlay) overlay.classList.add('visible');
  }

  function closeModal() {
    document.querySelectorAll('.modal, .modal-center').forEach(m => m.classList.remove('visible'));
    document.getElementById('modal-overlay')?.classList.remove('visible');
  }

  async function openAddProspect(status = 'lead') {
    const form = document.getElementById('prospect-form');
    if (!form) return;
    form.reset();
    form.dataset.mode = 'add';
    form.dataset.editId = '';
    document.getElementById('prospect-modal-title').textContent = 'Add New Prospect';
    document.getElementById('prospect-status').value = status;
    await populateServiceCheckboxes([]);
    openModal('prospect-modal');
  }

  async function openAddProspectFromMap(lat, lng, address) {
    await openAddProspect('lead');
    document.getElementById('prospect-address').value = address || '';
    document.getElementById('prospect-lat').value = lat || '';
    document.getElementById('prospect-lng').value = lng || '';
    document.getElementById('prospect-source').value = 'Map Search';
    MapController.removeTempMarker();
  }

  async function editProspect(id) {
    try {
      const prospect = await Store.getProspect(id);
      if (!prospect) return;

      const form = document.getElementById('prospect-form');
      if (!form) return;

      form.dataset.mode = 'edit';
      form.dataset.editId = id;
      document.getElementById('prospect-modal-title').textContent = 'Edit Prospect';

      document.getElementById('prospect-company').value = prospect.company_name || '';
      document.getElementById('prospect-industry').value = prospect.industry || '';
      document.getElementById('prospect-address').value = prospect.address || '';
      document.getElementById('prospect-lat').value = prospect.lat || '';
      document.getElementById('prospect-lng').value = prospect.lng || '';
      document.getElementById('prospect-phone').value = prospect.phone || '';
      document.getElementById('prospect-email').value = prospect.email || '';
      document.getElementById('prospect-website').value = prospect.website || '';
      document.getElementById('prospect-pic-name').value = prospect.pic_name || '';
      document.getElementById('prospect-pic-role').value = prospect.pic_role || '';
      document.getElementById('prospect-pic-phone').value = prospect.pic_phone || '';
      document.getElementById('prospect-pic-email').value = prospect.pic_email || '';
      document.getElementById('prospect-source').value = prospect.source || '';
      document.getElementById('prospect-status').value = prospect.status || 'lead';
      document.getElementById('prospect-deal-value').value = prospect.deal_value || '';
      document.getElementById('prospect-priority').value = prospect.priority || 'medium';
      document.getElementById('prospect-notes').value = prospect.notes || '';
      document.getElementById('prospect-followup').value = prospect.next_follow_up ? prospect.next_follow_up.split('T')[0] : '';
      document.getElementById('prospect-tags').value = (prospect.tags || []).join(', ');

      await populateServiceCheckboxes(prospect.services || []);
      openModal('prospect-modal');
    } catch (e) {
      Utils.showToast('Error loading prospect', 'error');
    }
  }

  async function populateServiceCheckboxes(selected = []) {
    const container = document.getElementById('prospect-services-list');
    if (!container) return;

    const services = await Store.getServices();
    container.innerHTML = services.map(svc => `
      <label class="checkbox-wrapper">
        <input type="checkbox" name="prospect-service" value="${svc.name}" ${selected.includes(svc.name) ? 'checked' : ''}>
        <span>${svc.icon} ${svc.name}</span>
      </label>
    `).join('');
  }

  async function handleProspectFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const selectedServices = [...form.querySelectorAll('input[name="prospect-service"]:checked')].map(cb => cb.value);
    const tagsStr = document.getElementById('prospect-tags').value;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    const data = {
      company_name: document.getElementById('prospect-company').value.trim(),
      industry: document.getElementById('prospect-industry').value.trim(),
      address: document.getElementById('prospect-address').value.trim(),
      lat: parseFloat(document.getElementById('prospect-lat').value) || null,
      lng: parseFloat(document.getElementById('prospect-lng').value) || null,
      phone: document.getElementById('prospect-phone').value.trim(),
      email: document.getElementById('prospect-email').value.trim(),
      website: document.getElementById('prospect-website').value.trim(),
      pic_name: document.getElementById('prospect-pic-name').value.trim(),
      pic_role: document.getElementById('prospect-pic-role').value.trim(),
      pic_phone: document.getElementById('prospect-pic-phone').value.trim(),
      pic_email: document.getElementById('prospect-pic-email').value.trim(),
      source: document.getElementById('prospect-source').value,
      status: document.getElementById('prospect-status').value,
      deal_value: parseInt(document.getElementById('prospect-deal-value').value) || 0,
      priority: document.getElementById('prospect-priority').value,
      notes: document.getElementById('prospect-notes').value.trim(),
      next_follow_up: document.getElementById('prospect-followup').value || null,
      services: selectedServices,
      tags: tags,
    };

    if (!data.company_name) return Utils.showToast('Company name is required', 'error');

    try {
      if (form.dataset.mode === 'edit') {
        data.id = form.dataset.editId;
        await Store.saveProspect(data);
        Utils.showToast(`"${data.company_name}" updated`, 'success');
      } else {
        await Store.saveProspect(data);
        Utils.showToast(`"${data.company_name}" added`, 'success');
      }
      closeModal();
      await refreshAll();
    } catch (err) {
      Utils.showToast('Failed to save prospect', 'error');
    }
  }

  async function openProspectDetail(id) {
    try {
      const prospect = await Store.getProspect(id);
      if (!prospect) return;
      const modal = document.getElementById('detail-modal');
      if (!modal) return;

      const activities = prospect.activities || [];
      const services = (prospect.services || []).map(s => `<span class="badge badge-blue">${s}</span>`).join('');
      const tags = (prospect.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

      modal.querySelector('.modal-body').innerHTML = `
        <div class="animate-fadeIn">
          <div class="flex items-center gap-4 mb-6">
            <div class="avatar lg" style="background:${Utils.generateAvatarColor(prospect.company_name)}">${Utils.getInitials(prospect.company_name)}</div>
            <div class="flex-1">
              <h2 style="font-size:1.25rem;font-weight:700">${prospect.company_name}</h2>
              <div class="text-sm text-secondary">${prospect.industry || 'No industry'}</div>
              <div class="flex gap-2 mt-2">
                ${Utils.getStatusBadgeHTML(prospect.status)}
                ${Utils.getPriorityBadgeHTML(prospect.priority)}
              </div>
            </div>
          </div>
          <div class="flex gap-2 mb-6">
            <button class="btn btn-primary btn-sm" onclick="App.editProspect('${id}')">✏️ Edit</button>
            ${prospect.pic_phone ? `<button class="btn btn-success btn-sm" onclick="Utils.openWhatsApp('${prospect.pic_phone}', 'Halo ${prospect.pic_name}, saya ingin mendiskusikan kerjasama...')">💬 WhatsApp</button>` : ''}
            ${prospect.lat ? `<button class="btn btn-secondary btn-sm" onclick="MapController.focusProspect('${id}')">🗺️ View on Map</button>` : ''}
            <button class="btn btn-danger btn-sm" onclick="App.deleteProspect('${id}')">🗑️ Delete</button>
          </div>
          
          <!-- Activity form below info -->
          <div class="card mb-4">
            <div class="card-header"><h3 class="card-title">➕ Log Activity</h3></div>
            <form id="activity-form" data-prospect-id="${id}">
              <div class="form-row mb-3">
                <div class="form-group" style="margin-bottom:0">
                  <select class="form-select" id="activity-type" required>
                    <option value="note">📝 Note</option>
                    <option value="call">📞 Call</option>
                    <option value="email">✉️ Email</option>
                    <option value="meeting">🤝 Meeting</option>
                    <option value="whatsapp">💬 WhatsApp</option>
                  </select>
                </div>
                <div class="form-group" style="margin-bottom:0">
                  <button type="submit" class="btn btn-primary" style="width:100%">Add Activity</button>
                </div>
              </div>
              <div class="form-group" style="margin-bottom:0">
                <textarea class="form-textarea" id="activity-note" placeholder="What happened?" rows="2" required></textarea>
              </div>
            </form>
          </div>
        </div>
      `;

      const actForm = modal.querySelector('#activity-form');
      if (actForm) actForm.addEventListener('submit', handleActivityFormSubmit);
      openModal('detail-modal');
    } catch (e) {
      Utils.showToast('Error loading details', 'error');
    }
  }

  async function handleActivityFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const prospect_id = form.dataset.prospectId;
    const type = form.querySelector('#activity-type')?.value;
    const note = form.querySelector('#activity-note')?.value?.trim();

    if (!note) return Utils.showToast('Please add a note', 'error');

    try {
      await Store.saveActivity({ prospect_id, type, note });
      Utils.showToast('Activity logged', 'success');
      if (prospect_id) await openProspectDetail(prospect_id);
      await refreshAll();
    } catch (err) {
      Utils.showToast('Failed to log activity', 'error');
    }
  }

  async function deleteProspect(id) {
    Utils.showConfirm('Delete Prospect?', 'Are you sure?', async () => {
      try {
        await Store.deleteProspect(id);
        Utils.showToast('Prospect deleted', 'success');
        closeModal();
        await refreshAll();
      } catch (err) {
        Utils.showToast('Delete failed', 'error');
      }
    });
  }

  function openServiceModal(service = null) {
    const form = document.getElementById('service-form');
    if (!form) return;
    form.reset();
    if (service) {
      form.dataset.editId = service.id;
      document.getElementById('service-modal-title').textContent = 'Edit Service';
      document.getElementById('service-name').value = service.name || '';
      document.getElementById('service-icon').value = service.icon || '';
      document.getElementById('service-description').value = service.description || '';
      document.getElementById('service-price').value = service.price_range || '';
      document.getElementById('service-color').value = service.color || '#6382ff';
    } else {
      form.dataset.editId = '';
      document.getElementById('service-modal-title').textContent = 'Add New Service';
    }
    openModal('service-modal');
  }

  async function handleServiceFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: document.getElementById('service-name').value.trim(),
      icon: document.getElementById('service-icon').value.trim() || '💼',
      description: document.getElementById('service-description').value.trim(),
      price_range: document.getElementById('service-price').value.trim(),
      color: document.getElementById('service-color').value || '#6382ff',
    };
    if (!data.name) return Utils.showToast('Service name is required', 'error');
    try {
      if (form.dataset.editId) data.id = form.dataset.editId;
      await Store.saveService(data);
      Utils.showToast(`Service saved`, 'success');
      closeModal();
      await ServiceController.render();
      await populateServiceOptions();
    } catch (err) {
      Utils.showToast('Failed to save service', 'error');
    }
  }

  function setupDataHandlers() {
    document.getElementById('btn-export-json')?.addEventListener('click', () => { window.location.href = '/api/export/json'; });
    document.getElementById('btn-export-csv')?.addEventListener('click', () => { window.location.href = '/api/export/csv'; });
    const importInput = document.getElementById('import-file');
    if (importInput) importInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/import/json', { method: 'POST', body: formData, headers: { 'X-CSRF-TOKEN': CSRF_TOKEN }});
        if (res.ok) { Utils.showToast('Data imported!', 'success'); await refreshAll(); }
        else Utils.showToast('Import failed', 'error');
      } catch (e) { Utils.showToast('Import error', 'error'); }
    });
    document.getElementById('btn-clear-data')?.addEventListener('click', () => {
      Utils.showConfirm('Clear All Data?', 'Permanently delete all?', async () => {
        try {
          await API.delete('/api/clear-data');
          Utils.showToast('Data cleared', 'success');
          await refreshAll();
        } catch (e) { Utils.showToast('Error', 'error'); }
      });
    });
  }

  async function refreshAll() {
    if (document.getElementById('page-dashboard')?.classList.contains('active')) await DashboardController.render();
    if (document.getElementById('page-map')?.classList.contains('active')) await MapController.refreshMarkers();
    if (document.getElementById('page-kanban')?.classList.contains('active')) await KanbanController.render();
    if (document.getElementById('page-prospects')?.classList.contains('active')) await ProspectController.render();
    if (document.getElementById('page-services')?.classList.contains('active')) await ServiceController.render();
    if (document.getElementById('page-activities')?.classList.contains('active')) await ActivityController.render();
    await populateServiceOptions();
  }

  async function populateServiceOptions() {
    const services = await Store.getServices();
    document.querySelectorAll('.service-filter-select').forEach(select => {
      const val = select.value;
      const firstOption = select.querySelector('option:first-child');
      select.innerHTML = '';
      if (firstOption) select.appendChild(firstOption);
      services.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = `${s.icon} ${s.name}`;
        select.appendChild(opt);
      });
      select.value = val;
    });
  }

  return { init, navigateTo, openAddProspect, openAddProspectFromMap, editProspect, openProspectDetail, deleteProspect, openServiceModal, closeModal, refreshAll };
})();

document.addEventListener('DOMContentLoaded', () => { App.init(); });
