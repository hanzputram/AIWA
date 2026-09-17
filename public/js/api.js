const CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

const API = {
  async get(url) {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': CSRF_TOKEN
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  async put(url, data) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': CSRF_TOKEN
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  async delete(url) {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 
        'Accept': 'application/json',
        'X-CSRF-TOKEN': CSRF_TOKEN
      }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

const Store = {
  PIPELINE_STATUSES: [
    { id: 'lead', label: 'New Lead', icon: '🔵', color: '#6382ff' },
    { id: 'contacted', label: 'Contacted', icon: '📞', color: '#fbbf24' },
    { id: 'proposal', label: 'Proposal', icon: '📋', color: '#fb923c' },
    { id: 'negotiation', label: 'Negotiation', icon: '🤝', color: '#a78bfa' },
    { id: 'won', label: 'Won', icon: '✅', color: '#34d399' },
    { id: 'lost', label: 'Lost', icon: '❌', color: '#f87171' }
  ],

  // --- PROSPECTS ---
  async getProspects(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.source) params.append('source', filters.source);
    if (filters.service) params.append('service', filters.service);
    if (filters.search) params.append('search', filters.search);
    
    return await API.get('/api/prospects?' + params.toString());
  },
  
  async getProspect(id) {
    return await API.get('/api/prospects/' + id);
  },
  
  async saveProspect(data) {
    const isUpdate = !!data.id;
    if (isUpdate) {
      return await API.put('/api/prospects/' + data.id, data);
    } else {
      return await API.post('/api/prospects', data);
    }
  },
  
  async deleteProspect(id) {
    return await API.delete('/api/prospects/' + id);
  },

  // --- SERVICES ---
  async getServices() {
    return await API.get('/api/services');
  },
  
  async saveService(data) {
    const isUpdate = !!data.id;
    if (isUpdate) {
      return await API.put('/api/services/' + data.id, data);
    } else {
      return await API.post('/api/services', data);
    }
  },
  
  async deleteService(id) {
    return await API.delete('/api/services/' + id);
  },

  // --- ACTIVITIES ---
  async getActivities(filters = {}) {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.prospect_id) params.append('prospect_id', filters.prospect_id);
    
    return await API.get('/api/activities?' + params.toString());
  },
  
  async saveActivity(data) {
    return await API.post('/api/activities', data);
  },
  
  async deleteActivity(id) {
    return await API.delete('/api/activities/' + id);
  },

  // --- ANALYTICS ---
  async getAnalytics() {
    return await API.get('/api/analytics');
  },

  // --- MAP DISCOVERY ---
  async searchMapBusinesses(bounds) {
    const params = new URLSearchParams({
      south: bounds.getSouth(),
      west: bounds.getWest(),
      north: bounds.getNorth(),
      east: bounds.getEast()
    });
    return await API.get('/api/map/businesses?' + params.toString());
  }
};
