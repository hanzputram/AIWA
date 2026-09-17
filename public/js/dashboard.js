/* ============================================
   ProspectMap CRM — Dashboard Analytics
   ============================================ */

const DashboardController = (() => {
  let pipelineChart = null;
  let revenueChart = null;
  let activityChart = null;

  async function init() {
    await render();
  }

  async function render() {
    try {
      const analytics = await Store.getAnalytics();
      renderKPIs(analytics);
      renderPipelineFunnel(analytics);
      await renderCharts(analytics);
      renderRecentActivities(analytics);
      renderTopProspects(analytics);
      renderFollowUps(analytics);
    } catch (e) {
      console.error('Failed to render dashboard', e);
    }
  }

  function renderKPIs(data) {
    const container = document.getElementById('dashboard-kpis');
    if (!container) return;

    container.innerHTML = `
      <div class="kpi-card animate-fadeIn stagger-1">
        <div class="kpi-icon blue">🏢</div>
        <div class="kpi-label">Total Prospects</div>
        <div class="kpi-value">${data.totalProspects}</div>
      </div>
      <div class="kpi-card animate-fadeIn stagger-2">
        <div class="kpi-icon yellow">📞</div>
        <div class="kpi-label">Contacted</div>
        <div class="kpi-value">${data.totalContacted}</div>
      </div>
      <div class="kpi-card animate-fadeIn stagger-3">
        <div class="kpi-icon orange">📋</div>
        <div class="kpi-label">Proposals Sent</div>
        <div class="kpi-value">${data.byStatus.proposal || 0}</div>
      </div>
      <div class="kpi-card animate-fadeIn stagger-4">
        <div class="kpi-icon green">💰</div>
        <div class="kpi-label">Pipeline Value</div>
        <div class="kpi-value">${Utils.formatCompactCurrency(data.totalPipelineValue)}</div>
      </div>
      <div class="kpi-card animate-fadeIn stagger-5">
        <div class="kpi-icon cyan">📈</div>
        <div class="kpi-label">Win Rate</div>
        <div class="kpi-value">${data.winRate}%</div>
      </div>
    `;
  }

  function renderPipelineFunnel(data) {
    const container = document.getElementById('pipeline-funnel');
    if (!container) return;

    const maxCount = Math.max(...Object.values(data.byStatus), 1);
    const statuses = [
      { id: 'lead', label: 'New Lead', icon: '🔵', color: '#6382ff' },
      { id: 'contacted', label: 'Contacted', icon: '📞', color: '#fbbf24' },
      { id: 'proposal', label: 'Proposal', icon: '📋', color: '#fb923c' },
      { id: 'negotiation', label: 'Negotiation', icon: '🤝', color: '#a78bfa' },
      { id: 'won', label: 'Won', icon: '✅', color: '#34d399' }
    ];

    container.innerHTML = statuses.map(s => {
      const count = data.byStatus[s.id] || 0;
      const pct = Math.max((count / maxCount) * 100, 8);
      return `
        <div class="funnel-step">
          <div class="funnel-step-name">${s.icon} ${s.label}</div>
          <div class="funnel-bar-wrapper">
            <div class="funnel-bar" style="width:${pct}%;background:${s.color}">
              <span class="funnel-bar-label">${count}</span>
            </div>
          </div>
          <div class="funnel-step-count">${count}</div>
        </div>
      `;
    }).join('');
  }

  async function renderCharts(data) {
    await renderRevenueChart(data);
    renderActivityChart(data);
  }

  async function renderRevenueChart(data) {
    const ctx = document.getElementById('revenue-chart');
    if (!ctx) return;
    if (revenueChart) revenueChart.destroy();

    const services = Object.keys(data.revenueByService);
    const values = Object.values(data.revenueByService);
    const prospectCounts = services.map(s => data.prospectsByService[s] || 0);
    const allServices = await Store.getServices();
    const colors = services.map(sName => {
      const s = allServices.find(srv => srv.name === sName);
      return s ? s.color : '#6382ff';
    });

    revenueChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: services.map(s => s.length > 15 ? s.substring(0, 15) + '...' : s),
        datasets: [
          {
            label: 'Revenue (Won)',
            data: values,
            backgroundColor: colors.map(c => c + '33'),
            borderColor: colors,
            borderWidth: 1.5,
            borderRadius: 6,
            yAxisID: 'y',
          },
          {
            label: 'Prospects',
            data: prospectCounts,
            type: 'line',
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34, 211, 238, 0.1)',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#22d3ee',
            tension: 0.4,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: '#8b95b0', font: { family: "'Inter'", size: 11 } } },
          tooltip: {
            backgroundColor: '#1a2236', titleColor: '#f0f2f8', bodyColor: '#8b95b0',
            borderColor: 'rgba(99,130,255,0.2)', borderWidth: 1, padding: 10, cornerRadius: 8,
            callbacks: {
              label: function(context) {
                if (context.datasetIndex === 0) return ' Revenue: ' + Utils.formatCurrency(context.raw);
                return ' Prospects: ' + context.raw;
              }
            }
          },
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5a6480', font: { size: 10 } } },
          y: {
            position: 'left', grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#5a6480', font: { size: 10 }, callback: (v) => Utils.formatCompactCurrency(v) },
          },
          y1: {
            position: 'right', grid: { display: false },
            ticks: { color: '#22d3ee', font: { size: 10 }, stepSize: 1 },
          },
        },
      },
    });
  }

  function renderActivityChart(data) {
    const ctx = document.getElementById('activity-chart');
    if (!ctx) return;
    if (activityChart) activityChart.destroy();

    const months = Object.keys(data.monthlyActivities);
    const counts = Object.values(data.monthlyActivities);

    const monthLabels = months.map(m => {
      const [y, mo] = m.split('-');
      const d = new Date(y, parseInt(mo) - 1, 1);
      return d.toLocaleDateString('id-ID', { month: 'short' });
    });

    activityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthLabels,
        datasets: [{
          label: 'Activities', data: counts, borderColor: '#a78bfa',
          backgroundColor: 'rgba(167, 139, 250, 0.1)', borderWidth: 2.5,
          fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: '#a78bfa'
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5a6480' } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5a6480', stepSize: 1 }, beginAtZero: true },
        },
      },
    });
  }

  function renderRecentActivities(data) {
    const container = document.getElementById('recent-activities');
    if (!container) return;

    if (data.recentActivities.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:24px"><div class="empty-icon">📭</div><div class="empty-title">No activities yet</div></div>`;
      return;
    }

    const typeIcons = { 'note': '📝', 'call': '📞', 'email': '✉️', 'meeting': '🤝', 'whatsapp': '💬', 'status': '🔄' };
    const typeColors = { 'note': '#6382ff', 'call': '#fbbf24', 'email': '#34d399', 'meeting': '#a78bfa', 'whatsapp': '#22c55e', 'status': '#6b7280' };

    container.innerHTML = data.recentActivities.map(a => {
      const companyName = a.prospect ? a.prospect.company_name : 'Unknown';
      const tIcon = typeIcons[a.type] || '📝';
      const tColor = typeColors[a.type] || '#6382ff';
      return `
        <div class="activity-item">
          <div class="activity-dot" style="background:${tColor}"></div>
          <div class="activity-content">
            <div class="activity-text">
              <strong>${companyName}</strong> — ${a.note}
            </div>
            <div class="activity-time">${Utils.formatRelativeTime(a.created_at)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderTopProspects(data) {
    const container = document.getElementById('top-prospects');
    if (!container) return;

    if (data.topProspects.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:24px"><div class="empty-icon">🏆</div><div class="empty-title">No prospects yet</div></div>`;
      return;
    }

    container.innerHTML = data.topProspects.map(p => `
      <div class="top-prospect-item" onclick="App.openProspectDetail('${p.id}')">
        <div class="avatar" style="background:${Utils.generateAvatarColor(p.company_name)}">
          ${Utils.getInitials(p.company_name)}
        </div>
        <div class="top-prospect-info">
          <div class="top-prospect-name">${p.company_name}</div>
          <div class="top-prospect-service">${(p.services || []).join(', ') || '-'}</div>
        </div>
        <div class="top-prospect-value">${Utils.formatCompactCurrency(p.deal_value)}</div>
      </div>
    `).join('');
  }

  function renderFollowUps(data) {
    const container = document.getElementById('followup-list');
    if (!container) return;

    const all = [...data.overdueFollowups, ...data.todayFollowups]
      .sort((a, b) => new Date(a.next_follow_up) - new Date(b.next_follow_up));

    if (all.length === 0) {
      container.innerHTML = `<div class="empty-state" style="padding:24px"><div class="empty-icon">✅</div><div class="empty-title">No pending follow-ups</div><div class="empty-desc">All caught up!</div></div>`;
      return;
    }

    container.innerHTML = all.slice(0, 5).map(p => {
      const isOD = Utils.isOverdue(p.next_follow_up);
      const isT = Utils.isToday(p.next_follow_up);
      return `
        <div class="followup-item ${isOD ? 'overdue' : isT ? 'today' : ''}">
          <div class="avatar sm" style="background:${Utils.generateAvatarColor(p.company_name)}">
            ${Utils.getInitials(p.company_name)}
          </div>
          <div class="followup-info">
            <div class="followup-company">${p.company_name}</div>
            <div class="followup-date ${isOD ? 'overdue' : isT ? 'today' : ''}">
              ${isOD ? '⚠️ Overdue: ' : isT ? '📌 Today: ' : ''}${Utils.formatDate(p.next_follow_up)}
            </div>
          </div>
          <button class="btn btn-sm btn-ghost" onclick="App.openProspectDetail('${p.id}')">View</button>
        </div>
      `;
    }).join('');
  }

  return { init, render };
})();
