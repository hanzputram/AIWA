/* ============================================
   ProspectMap CRM — Service Catalog
   ============================================ */

const ServiceController = (() => {

  async function init() {
    await render();
  }

  async function render() {
    const container = document.getElementById('service-grid');
    if (!container) return;

    try {
      const services = await Store.getServices();
      const prospects = await Store.getProspects();

      container.innerHTML = services.map(svc => {
        const svcProspects = prospects.filter(p => (p.services || []).includes(svc.name));
        const wonValue = svcProspects
          .filter(p => p.status === 'won')
          .reduce((s, p) => s + (Number(p.deal_value) || 0) / ((p.services || []).length || 1), 0);

        return `
          <div class="service-card">
            <div class="service-card-icon" style="background:${svc.color}22;color:${svc.color}">
              ${svc.icon}
            </div>
            <div class="service-card-name">${svc.name}</div>
            <div class="service-card-desc">${svc.description}</div>
            <div class="service-card-price">💰 ${svc.price_range}</div>
            <div class="service-card-stats">
              <div class="service-stat">
                <div class="service-stat-value" style="color:${svc.color}">${svcProspects.length}</div>
                <div class="service-stat-label">Prospects</div>
              </div>
              <div class="service-stat">
                <div class="service-stat-value text-success">${svcProspects.filter(p => p.status === 'won').length}</div>
                <div class="service-stat-label">Won</div>
              </div>
              <div class="service-stat">
                <div class="service-stat-value text-warning">${svcProspects.filter(p => !['won','lost'].includes(p.status)).length}</div>
                <div class="service-stat-label">Active</div>
              </div>
              <div class="service-stat">
                <div class="service-stat-value text-accent">${Utils.formatCompactCurrency(wonValue)}</div>
                <div class="service-stat-label">Revenue</div>
              </div>
            </div>
            <div class="service-card-actions">
              <button class="btn btn-sm btn-secondary" onclick="ServiceController.editService('${svc.id}')">✏️ Edit</button>
              <button class="btn btn-sm btn-danger" onclick="ServiceController.removeService('${svc.id}')">🗑️ Delete</button>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      container.innerHTML = '<div class="empty-state">Error loading services</div>';
    }
  }

  function openAddService() {
    App.openServiceModal();
  }

  async function editService(id) {
    const services = await Store.getServices();
    const svc = services.find(s => s.id == id);
    if (svc) App.openServiceModal(svc);
  }

  async function removeService(id) {
    const services = await Store.getServices();
    const svc = services.find(s => s.id == id);
    if (!svc) return;
    Utils.showConfirm(
      'Delete Service?',
      `Are you sure you want to delete "${svc.name}"?`,
      async () => {
        await Store.deleteService(id);
        await render();
        Utils.showToast(`Service "${svc.name}" deleted`, 'success');
      }
    );
  }

  return { init, render, openAddService, editService, removeService };
})();
