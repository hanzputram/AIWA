/* ============================================
   ProspectMap CRM — Kanban Board
   ============================================ */

const KanbanController = (() => {

  async function init() {
    await render();
  }

  async function render() {
    const container = document.getElementById('kanban-container');
    if (!container) return;

    try {
      const prospects = await Store.getProspects();
      
      const statuses = [
        { id: 'lead', label: 'New Lead', icon: '🔵', color: '#6382ff' },
        { id: 'contacted', label: 'Contacted', icon: '📞', color: '#fbbf24' },
        { id: 'proposal', label: 'Proposal', icon: '📋', color: '#fb923c' },
        { id: 'negotiation', label: 'Negotiation', icon: '🤝', color: '#a78bfa' },
        { id: 'won', label: 'Won', icon: '✅', color: '#34d399' },
        { id: 'lost', label: 'Lost', icon: '❌', color: '#f87171' }
      ];

      container.innerHTML = statuses.map(status => {
        const items = prospects.filter(p => p.status === status.id);
        const totalValue = items.reduce((s, p) => s + (Number(p.deal_value) || 0), 0);

        return `
          <div class="kanban-column" data-status="${status.id}">
            <div class="kanban-column-header">
              <div class="kanban-column-title">
                <span class="column-icon">${status.icon}</span>
                ${status.label}
              </div>
              <span class="kanban-column-count">${items.length}</span>
            </div>
            <div class="kanban-cards" data-status="${status.id}" id="kanban-col-${status.id}">
              ${items.map(p => renderCard(p)).join('')}
              <button class="kanban-add-card" onclick="App.openAddProspect('${status.id}')">
                + Add
              </button>
            </div>
            <div class="kanban-column-footer">
              <span>Total Value</span>
              <span class="kanban-column-total">${Utils.formatCompactCurrency(totalValue)}</span>
            </div>
          </div>
        `;
      }).join('');

      setupDragAndDrop();
    } catch (e) {
      container.innerHTML = '<div class="empty-state">Error loading Kanban</div>';
    }
  }

  function renderCard(prospect) {
    const services = (prospect.services || []).slice(0, 3).map(s =>
      `<span class="kanban-card-service-tag">${s}</span>`
    ).join('');

    const moreServices = (prospect.services || []).length > 3
      ? `<span class="kanban-card-service-tag">+${prospect.services.length - 3}</span>`
      : '';

    return `
      <div class="kanban-card" draggable="true" data-id="${prospect.id}">
        <div class="kanban-card-header">
          <div class="kanban-card-company">${prospect.company_name}</div>
          <button class="kanban-card-menu" onclick="event.stopPropagation(); App.openProspectDetail('${prospect.id}')">⋮</button>
        </div>
        ${prospect.industry ? `<div class="kanban-card-industry">${prospect.industry}</div>` : ''}
        ${services ? `<div class="kanban-card-services">${services}${moreServices}</div>` : ''}
        <div class="kanban-card-footer">
          <span class="kanban-card-value">${prospect.deal_value ? Utils.formatCompactCurrency(prospect.deal_value) : '-'}</span>
          <span class="kanban-card-priority ${prospect.priority}">${prospect.priority}</span>
        </div>
        ${prospect.next_follow_up ? `
          <div style="margin-top:6px;">
            <span class="kanban-card-date ${Utils.isOverdue(prospect.next_follow_up) ? 'text-danger' : Utils.isToday(prospect.next_follow_up) ? 'text-warning' : ''}">
              ${Utils.isOverdue(prospect.next_follow_up) ? '⚠️' : '📅'} ${Utils.formatDate(prospect.next_follow_up)}
            </span>
          </div>
        ` : ''}
        <div class="kanban-card-quick-actions">
          <button class="kanban-quick-btn" onclick="event.stopPropagation(); App.openProspectDetail('${prospect.id}')" title="View Detail">👁️</button>
          <button class="kanban-quick-btn" onclick="event.stopPropagation(); App.editProspect('${prospect.id}')" title="Edit">✏️</button>
          ${prospect.pic_phone ? `<button class="kanban-quick-btn wa" onclick="event.stopPropagation(); Utils.openWhatsApp('${prospect.pic_phone}')" title="WhatsApp">💬</button>` : ''}
          ${prospect.lat && prospect.lng ? `<button class="kanban-quick-btn" onclick="event.stopPropagation(); MapController.focusProspect('${prospect.id}')" title="View on Map">🗺️</button>` : ''}
        </div>
      </div>
    `;
  }

  function setupDragAndDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.kanban-cards');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.id);
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        columns.forEach(col => col.classList.remove('drag-over'));
      });

      card.addEventListener('click', () => {
        App.openProspectDetail(card.dataset.id);
      });
    });

    columns.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.classList.add('drag-over');

        const dragging = document.querySelector('.dragging');
        if (dragging) {
          const afterEl = getDragAfterElement(col, e.clientY);
          if (afterEl) {
            col.insertBefore(dragging, afterEl);
          } else {
            const addBtn = col.querySelector('.kanban-add-card');
            if (addBtn) col.insertBefore(dragging, addBtn);
            else col.appendChild(dragging);
          }
        }
      });

      col.addEventListener('dragleave', (e) => {
        if (!col.contains(e.relatedTarget)) {
          col.classList.remove('drag-over');
        }
      });

      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');

        const prospectId = e.dataTransfer.getData('text/plain');
        const newStatus = col.dataset.status;

        if (prospectId && newStatus) {
          try {
            await Store.saveProspect({ id: prospectId, status: newStatus });
            Utils.showToast(`Moved to ${newStatus}`, 'success');
            await App.refreshAll();
          } catch (e) {
            Utils.showToast('Failed to move prospect', 'error');
          }
        }
      });
    });
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  return { init, render };
})();
