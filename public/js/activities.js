/* ============================================
   ProspectMap CRM — Activity Log
   ============================================ */

const ActivityController = (() => {
  let filterType = '';

  const ACTIVITY_TYPES = [
    { id: 'note', label: 'Note', icon: '📝', color: '#6382ff' },
    { id: 'call', label: 'Call', icon: '📞', color: '#fbbf24' },
    { id: 'email', label: 'Email', icon: '✉️', color: '#34d399' },
    { id: 'meeting', label: 'Meeting', icon: '🤝', color: '#a78bfa' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#22c55e' },
    { id: 'status', label: 'Status Update', icon: '🔄', color: '#6b7280' },
  ];

  async function init() {
    await render();
    setupFilters();
  }

  async function render() {
    const container = document.getElementById('full-activity-timeline');
    if (!container) return;

    try {
      const filters = filterType ? { type: filterType } : {};
      let activities = await Store.getActivities(filters);

      if (activities.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <div class="empty-title">No activities yet</div>
            <div class="empty-desc">Activities will appear here when you interact with prospects</div>
          </div>
        `;
        return;
      }

      container.innerHTML = activities.slice(0, 100).map(a => {
        const type = ACTIVITY_TYPES.find(t => t.id === a.type);
        const prospect = a.prospect;

        return `
          <div class="activity-timeline-item">
            <div class="activity-timeline-dot ${a.type}" style="background:${type?.color || '#6382ff'}"></div>
            <div class="activity-timeline-card">
              <div class="activity-timeline-header">
                <span class="activity-timeline-type" style="color:${type?.color || '#6382ff'}">
                  ${type?.icon || '📝'} ${type?.label || a.type}
                </span>
                <span class="activity-timeline-time">${Utils.formatRelativeTime(a.created_at)}</span>
              </div>
              ${prospect ? `<div class="activity-timeline-company" onclick="App.openProspectDetail('${prospect.id}')" style="cursor:pointer;font-weight:bold">${prospect.company_name}</div>` : ''}
              <div class="activity-timeline-note" style="margin-top:4px">${a.note || ''}</div>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      container.innerHTML = '<div class="empty-state">Error loading activities</div>';
    }
  }

  function setupFilters() {
    const filterEl = document.getElementById('activity-filter-type');
    if (filterEl) {
      filterEl.addEventListener('change', async (e) => {
        filterType = e.target.value;
        await render();
      });
    }
  }

  return { init, render };
})();
