<div class="modal" id="prospect-modal">
  <div class="modal-header">
    <h3 class="modal-title" id="prospect-modal-title">Add New Prospect</h3>
    <button class="modal-close" onclick="App.closeModal()">✕</button>
  </div>
  <div class="modal-body">
    <form id="prospect-form">
      <h4 class="text-sm font-semibold text-secondary mb-3">🏢 Company Info</h4>
      <div class="form-group">
        <label class="form-label">Company Name *</label>
        <input type="text" class="form-input" id="prospect-company" required placeholder="PT Contoh Sukses">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Industry</label>
          <input type="text" class="form-input" id="prospect-industry" placeholder="e.g. Fintech, E-commerce">
        </div>
        <div class="form-group">
          <label class="form-label">Source</label>
          <select class="form-select" id="prospect-source">
            <option value="Map Search">Map Search</option>
            <option value="Referral">Referral</option>
            <option value="Cold Call">Cold Call</option>
            <option value="Social Media">Social Media</option>
            <option value="Website">Website</option>
            <option value="Event">Event</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Address</label>
        <input type="text" class="form-input" id="prospect-address" placeholder="Jl. Example No. 123, Jakarta">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Latitude</label>
          <input type="number" step="any" class="form-input" id="prospect-lat" placeholder="-6.2088">
        </div>
        <div class="form-group">
          <label class="form-label">Longitude</label>
          <input type="number" step="any" class="form-input" id="prospect-lng" placeholder="106.8456">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input type="text" class="form-input" id="prospect-phone" placeholder="021-xxxxxxx">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" id="prospect-email" placeholder="info@company.com">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Website</label>
        <input type="url" class="form-input" id="prospect-website" placeholder="https://company.com">
      </div>

      <h4 class="text-sm font-semibold text-secondary mb-3 mt-6">👤 Contact Person (PIC)</h4>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">PIC Name</label>
          <input type="text" class="form-input" id="prospect-pic-name" placeholder="Budi Santoso">
        </div>
        <div class="form-group">
          <label class="form-label">PIC Role</label>
          <input type="text" class="form-input" id="prospect-pic-role" placeholder="CTO, Director, etc">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">PIC Phone (WhatsApp)</label>
          <input type="text" class="form-input" id="prospect-pic-phone" placeholder="08xxxxxxxxxx">
        </div>
        <div class="form-group">
          <label class="form-label">PIC Email</label>
          <input type="email" class="form-input" id="prospect-pic-email" placeholder="name@company.com">
        </div>
      </div>

      <h4 class="text-sm font-semibold text-secondary mb-3 mt-6">💼 Deal Info</h4>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="prospect-status">
            <option value="lead">🔵 New Lead</option>
            <option value="contacted">📞 Contacted</option>
            <option value="proposal">📋 Proposal Sent</option>
            <option value="negotiation">🤝 Negotiation</option>
            <option value="won">✅ Won</option>
            <option value="lost">❌ Lost</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-select" id="prospect-priority">
            <option value="low">🔹 Low</option>
            <option value="medium" selected>🔸 Medium</option>
            <option value="high">🔶 High</option>
            <option value="urgent">🔴 Urgent</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Deal Value (IDR)</label>
          <input type="number" class="form-input" id="prospect-deal-value" placeholder="10000000">
        </div>
        <div class="form-group">
          <label class="form-label">Next Follow-Up</label>
          <input type="date" class="form-input" id="prospect-followup">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Services Offered</label>
        <div id="prospect-services-list" style="display:flex;flex-wrap:wrap;gap:8px 16px"></div>
      </div>

      <div class="form-group">
        <label class="form-label">Tags (comma separated)</label>
        <input type="text" class="form-input" id="prospect-tags" placeholder="fintech, crypto, vip">
      </div>

      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="prospect-notes" rows="3" placeholder="Catatan tentang prospek ini..."></textarea>
      </div>

      <div class="modal-footer" style="padding:16px 0 0;border-top:1px solid var(--border-secondary)">
        <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">💾 Save Prospect</button>
      </div>
    </form>
  </div>
</div>
