@extends('layout')

@section('title', 'Peta Prospek')

@section('content')
<div class="page active" id="page-map">
  <div class="map-container">
    <div id="map"></div>

    <!-- Map Search Overlay -->
    <div class="map-search-overlay">
      <div class="map-search-wrapper">
        <span class="map-search-icon">🔍</span>
        <input type="text" id="map-search-input" class="map-search-input" placeholder="Search companies, locations...">
        <div id="map-search-results" class="map-search-results"></div>
      </div>
      <div class="map-actions">
        <button class="map-action-btn" id="btn-locate" title="My Location">📍</button>
        <button class="map-action-btn" id="btn-fit-markers" title="Fit All Markers">🔲</button>
        <button class="map-action-btn" id="btn-map-filter" title="Filter Markers">🔽</button>
        <button class="map-action-btn" onclick="App.openAddProspect()" title="Add Prospect">➕</button>
      </div>
    </div>

    <!-- Map Filter Panel -->
    <div id="map-filter-panel" class="map-filter-panel">
      <div class="map-filter-title">Filter Markers</div>
      <div class="map-filter-group">
        <label>Status</label>
        <select class="form-select" id="map-filter-status">
          <option value="">All Status</option>
          <option value="lead">🔵 New Lead</option>
          <option value="contacted">📞 Contacted</option>
          <option value="proposal">📋 Proposal Sent</option>
          <option value="negotiation">🤝 Negotiation</option>
          <option value="won">✅ Won</option>
          <option value="lost">❌ Lost</option>
        </select>
      </div>
      <div class="map-filter-group">
        <label>Service</label>
        <select class="form-select service-filter-select" id="map-filter-service">
          <option value="">All Services</option>
        </select>
      </div>
    </div>

    <!-- Map Legend -->
    <div class="map-info-panel">
      <div class="map-legend">
        <div class="map-legend-title">Status & Bisnis</div>
        <div class="map-legend-item"><div class="map-legend-dot" style="background:#6382ff"></div> New Lead</div>
        <div class="map-legend-item"><div class="map-legend-dot" style="background:#fbbf24"></div> Contacted</div>
        <div class="map-legend-item"><div class="map-legend-dot" style="background:#fb923c"></div> Proposal</div>
        <div class="map-legend-item"><div class="map-legend-dot" style="background:#a78bfa"></div> Negotiation</div>
        <div class="map-legend-item"><div class="map-legend-dot" style="background:#34d399"></div> Won</div>
        <div class="map-legend-item"><div class="map-legend-dot" style="background:#f87171"></div> Lost</div>
        <div class="map-legend-item" style="margin-top:4px;border-top:1px solid #333;padding-top:4px"><div class="map-legend-dot" style="background:#6b7280;border-radius:2px"></div> Bisnis (OSM)</div>
      </div>
    </div>

    <!-- Map Stats -->
    <div class="map-stats" id="map-stats"></div>
    
  </div>
</div>
@endsection
