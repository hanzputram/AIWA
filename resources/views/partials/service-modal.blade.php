<div class="modal-center" id="service-modal" style="width:440px">
  <div class="modal-header">
    <h3 class="modal-title" id="service-modal-title">Add New Service</h3>
    <button class="modal-close" onclick="App.closeModal()">✕</button>
  </div>
  <div class="modal-body">
    <form id="service-form">
      <div class="form-group">
        <label class="form-label">Service Name *</label>
        <input type="text" class="form-input" id="service-name" required placeholder="e.g. Bot Trading">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Icon (emoji)</label>
          <input type="text" class="form-input" id="service-icon" placeholder="🤖">
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <input type="color" class="form-input" id="service-color" value="#6382ff" style="height:38px;padding:4px">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Price Range</label>
        <input type="text" class="form-input" id="service-price" placeholder="Rp 5.000.000 - Rp 50.000.000">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="service-description" rows="3" placeholder="Deskripsi jasa..."></textarea>
      </div>
      <div class="modal-footer" style="padding:16px 0 0;border-top:1px solid var(--border-secondary)">
        <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">💾 Save Service</button>
      </div>
    </form>
  </div>
</div>
