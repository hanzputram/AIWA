/* ============================================
   ProspectMap CRM — Prospect Management
   ============================================ */

const ProspectController = (() => {
  let currentFilters = { status: '', service: '', priority: '', source: '', search: '' };

  async function init() {
    await render();
    setupFilters();
  }

  async function render() {
    await renderTable();
  }

  async function renderTable() {
    const container = document.getElementById('prospect-table-body');
    const countEl = document.getElementById('prospect-count');
    if (!container) return;

    try {
      const prospects = await Store.getProspects(currentFilters);
      if (countEl) countEl.textContent = `${prospects.length} prospects`;

      if (prospects.length === 0) {
        container.innerHTML = `
          <tr>
            <td colspan="8">
              <div class="empty-state" style="padding:40px">
                <div class="empty-icon">🔍</div>
                <div class="empty-title">No prospects found</div>
                <div class="empty-desc">Try adjusting your filters or add a new prospect</div>
                <button class="btn btn-primary" onclick="App.openAddProspect()">+ Add Prospect</button>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      container.innerHTML = prospects.map(p => `
        <tr onclick="App.openProspectDetail('${p.id}')">
          <td>
            <div class="flex items-center gap-3">
              <div class="avatar" style="background:${Utils.generateAvatarColor(p.company_name)}">
                ${Utils.getInitials(p.company_name)}
              </div>
              <div>
                <div class="font-semibold text-primary">${p.company_name}</div>
                <div class="text-xs text-tertiary">${p.industry || '-'}</div>
              </div>
            </div>
          </td>
          <td>${Utils.getStatusBadgeHTML(p.status)}</td>
          <td>
            <div class="flex flex-wrap gap-1">
              ${(p.services || []).slice(0, 2).map(s => `<span class="badge badge-blue">${s}</span>`).join('')}
              ${(p.services || []).length > 2 ? `<span class="badge badge-purple">+${p.services.length - 2}</span>` : ''}
            </div>
          </td>
          <td><span class="font-mono font-bold text-success">${p.deal_value ? Utils.formatCompactCurrency(p.deal_value) : '-'}</span></td>
          <td>${Utils.getPriorityBadgeHTML(p.priority)}</td>
          <td>
            <div class="text-sm">${p.pic_name || '-'}</div>
            <div class="text-xs text-tertiary">${p.pic_role || ''}</div>
          </td>
          <td><span class="text-xs font-mono text-secondary">${Utils.formatDate(p.created_at)}</span></td>
          <td>
            <div class="flex gap-1">
              ${p.pic_phone ? `<button class="btn btn-icon btn-ghost sm" onclick="event.stopPropagation(); Utils.openWhatsApp('${p.pic_phone}')" title="WhatsApp">💬</button>` : ''}
              <button class="btn btn-icon btn-ghost sm" onclick="event.stopPropagation(); App.editProspect('${p.id}')" title="Edit">✏️</button>
              <button class="btn btn-icon btn-ghost sm" onclick="event.stopPropagation(); App.deleteProspect('${p.id}')" title="Delete">🗑️</button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.error(e);
      container.innerHTML = `<tr><td colspan="8"><div class="empty-state">Error loading prospects</div></td></tr>`;
    }
  }

  function setupFilters() {
    const searchInput = document.getElementById('prospect-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(async (e) => {
        currentFilters.search = e.target.value;
        await renderTable();
      }, 250));
    }

    ['prospect-filter-status', 'prospect-filter-service', 'prospect-filter-priority', 'prospect-filter-source'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', async (e) => {
          const key = id.replace('prospect-filter-', '');
          currentFilters[key] = e.target.value;
          await renderTable();
        });
      }
    });
  }

  return { init, render };
})();
