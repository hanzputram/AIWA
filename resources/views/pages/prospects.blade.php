@extends('layout')

@section('title', 'Prospects')

@section('content')
<div class="page active" id="page-prospects">
  <div class="page-header">
    <div class="page-header-left">
      <div>
        <h2 class="page-title">Prospects</h2>
        <p class="page-subtitle">Kelola semua prospek perusahaan</p>
      </div>
    </div>
    <div class="page-header-right">
      <button class="btn btn-primary" onclick="App.openAddProspect()">+ New Prospect</button>
    </div>
  </div>
  <div class="prospect-list-container">
    <div class="prospect-list-toolbar">
      <div class="search-box" style="max-width:260px">
        <span class="search-icon">🔍</span>
        <input type="text" class="form-input" id="prospect-search" placeholder="Search prospects...">
      </div>
      <select class="filter-select" id="prospect-filter-status">
        <option value="">All Status</option>
        <option value="lead">🔵 New Lead</option>
        <option value="contacted">📞 Contacted</option>
        <option value="proposal">📋 Proposal</option>
        <option value="negotiation">🤝 Negotiation</option>
        <option value="won">✅ Won</option>
        <option value="lost">❌ Lost</option>
      </select>
      <select class="filter-select service-filter-select" id="prospect-filter-service">
        <option value="">All Services</option>
      </select>
      <select class="filter-select" id="prospect-filter-priority">
        <option value="">All Priority</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
      <select class="filter-select" id="prospect-filter-source">
        <option value="">All Sources</option>
        <option value="Map Search">Map Search</option>
        <option value="Referral">Referral</option>
        <option value="Cold Call">Cold Call</option>
        <option value="Social Media">Social Media</option>
        <option value="Website">Website</option>
        <option value="Event">Event</option>
        <option value="LinkedIn">LinkedIn</option>
        <option value="Other">Other</option>
      </select>
      <span class="prospect-count" id="prospect-count"></span>
    </div>
    <div class="prospect-table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Status</th>
            <th>Services</th>
            <th>Deal Value</th>
            <th>Priority</th>
            <th>PIC</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="prospect-table-body"></tbody>
      </table>
    </div>
  </div>
</div>
@endsection
