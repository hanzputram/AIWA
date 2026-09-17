/* ============================================
   ProspectMap CRM — Utility Functions
   ============================================ */

const Utils = (() => {

  // ---- Currency Formatting ----
  function formatCurrency(amount) {
    if (!amount && amount !== 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatCompactCurrency(amount) {
    if (!amount) return 'Rp 0';
    if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(1)}M`;
    if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1)}Jt`;
    if (amount >= 1000) return `Rp ${(amount / 1000).toFixed(0)}K`;
    return `Rp ${amount}`;
  }

  // ---- Date Formatting ----
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function formatRelativeTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  }

  function isOverdue(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date(new Date().toDateString());
  }

  function isToday(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr).toDateString();
    return d === new Date().toDateString();
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date(new Date().toDateString());
    return Math.ceil((d - now) / 86400000);
  }

  // ---- String Helpers ----
  function truncate(str, maxLen = 50) {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
  }

  function getInitials(name) {
    if (!name) return '??';
    return name.split(' ')
      .map(w => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  function generateAvatarColor(str) {
    const colors = [
      '#6382ff', '#22d3ee', '#a78bfa', '#34d399', '#fb923c',
      '#f472b6', '#fbbf24', '#f87171', '#818cf8', '#2dd4bf'
    ];
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // ---- DOM Helpers ----
  function $(selector, parent = document) {
    return parent.querySelector(selector);
  }

  function $$(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
  }

  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, val]) => {
      if (key === 'className') el.className = val;
      else if (key === 'innerHTML') el.innerHTML = val;
      else if (key === 'textContent') el.textContent = val;
      else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), val);
      else if (key === 'dataset') Object.entries(val).forEach(([k, v]) => el.dataset[k] = v);
      else if (key === 'style' && typeof val === 'object') Object.assign(el.style, val);
      else el.setAttribute(key, val);
    });
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child) el.appendChild(child);
    });
    return el;
  }

  // ---- Toast Notifications ----
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = createElement('div', { className: `toast ${type}` }, [
      createElement('span', { className: 'toast-icon', textContent: icons[type] || 'ℹ️' }),
      createElement('span', { className: 'toast-message', textContent: message }),
      createElement('button', {
        className: 'toast-close',
        textContent: '✕',
        onClick: () => toast.remove(),
      }),
    ]);

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ---- Debounce ----
  function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // ---- Download File ----
  function downloadFile(content, filename, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- WhatsApp Link ----
  function openWhatsApp(phone, message = '') {
    let cleaned = phone.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
    if (!cleaned.startsWith('+') && !cleaned.startsWith('62')) cleaned = '62' + cleaned;
    cleaned = cleaned.replace('+', '');
    const url = `https://wa.me/${cleaned}${message ? '?text=' + encodeURIComponent(message) : ''}`;
    window.open(url, '_blank');
  }

  // ---- Confirm Dialog ----
  function showConfirm(title, description, onConfirm) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('confirm-modal');
    if (!overlay || !modal) return;

    modal.querySelector('.confirm-title').textContent = title;
    modal.querySelector('.confirm-desc').textContent = description;

    const confirmBtn = modal.querySelector('.confirm-yes');
    const cancelBtn = modal.querySelector('.confirm-no');

    const cleanup = () => {
      overlay.classList.remove('visible');
      modal.classList.remove('visible');
      confirmBtn.replaceWith(confirmBtn.cloneNode(true));
      cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    };

    overlay.classList.add('visible');
    modal.classList.add('visible');

    modal.querySelector('.confirm-yes').addEventListener('click', () => {
      cleanup();
      onConfirm();
    });

    modal.querySelector('.confirm-no').addEventListener('click', cleanup);
    overlay.addEventListener('click', cleanup, { once: true });
  }

  // ---- Pipeline Status Helpers ----
  function getStatusBadgeHTML(status) {
    const s = Store.PIPELINE_STATUSES.find(ps => ps.id === status);
    if (!s) return `<span class="status-badge">${status}</span>`;
    return `<span class="status-badge ${s.id}">${s.icon} ${s.label}</span>`;
  }

  function getPriorityBadgeHTML(priority) {
    const labels = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
    const icons = { low: '🔹', medium: '🔸', high: '🔶', urgent: '🔴' };
    return `<span class="priority-badge ${priority}">${icons[priority] || ''} ${labels[priority] || priority}</span>`;
  }

  // ---- Public API ----
  return {
    formatCurrency,
    formatCompactCurrency,
    formatDate,
    formatDateTime,
    formatRelativeTime,
    isOverdue,
    isToday,
    daysUntil,
    truncate,
    getInitials,
    generateAvatarColor,
    $,
    $$,
    createElement,
    showToast,
    debounce,
    downloadFile,
    openWhatsApp,
    showConfirm,
    getStatusBadgeHTML,
    getPriorityBadgeHTML,
  };
})();
