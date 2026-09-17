<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>ProspectMap CRM — @yield('title', 'Dashboard Berburu Prospek')</title>
  <meta name="description" content="CRM Dashboard untuk mencari perusahaan di peta dan melacak proses penawaran jasa programming">

  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />

  <!-- App CSS -->
  <link rel="stylesheet" href="{{ asset('css/main.css') }}">
  <link rel="stylesheet" href="{{ asset('css/components.css') }}">
  <link rel="stylesheet" href="{{ asset('css/map.css') }}">
  <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}">
  <link rel="stylesheet" href="{{ asset('css/kanban.css') }}">
</head>
<body>
  <!-- Background Decorations -->
  <div class="bg-decoration bg-decoration-1"></div>
  <div class="bg-decoration bg-decoration-2"></div>

  <div class="app-layout">
    <!-- ========== SIDEBAR ========== -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">🗺️</div>
        <div class="sidebar-brand">
          <h1>ProspectMap</h1>
          <span>CRM Dashboard</span>
        </div>
      </div>
      <button class="sidebar-toggle" id="sidebar-toggle" title="Toggle Sidebar">◀</button>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Main</div>
          <a href="{{ route('dashboard') }}" class="nav-item {{ request()->routeIs('dashboard') ? 'active' : '' }}">
            <span class="nav-icon">📊</span>
            <span class="nav-label">Dashboard</span>
          </a>
          <a href="{{ route('map') }}" class="nav-item {{ request()->routeIs('map') ? 'active' : '' }}">
            <span class="nav-icon">🗺️</span>
            <span class="nav-label">Peta Prospek</span>
          </a>
          <a href="{{ route('kanban') }}" class="nav-item {{ request()->routeIs('kanban') ? 'active' : '' }}">
            <span class="nav-icon">📋</span>
            <span class="nav-label">Pipeline</span>
          </a>
        </div>
        <div class="nav-section">
          <div class="nav-section-title">Manage</div>
          <a href="{{ route('prospects') }}" class="nav-item {{ request()->routeIs('prospects') ? 'active' : '' }}">
            <span class="nav-icon">🏢</span>
            <span class="nav-label">Prospects</span>
          </a>
          <a href="{{ route('services') }}" class="nav-item {{ request()->routeIs('services') ? 'active' : '' }}">
            <span class="nav-icon">💼</span>
            <span class="nav-label">Services</span>
          </a>
          <a href="{{ route('activities') }}" class="nav-item {{ request()->routeIs('activities') ? 'active' : '' }}">
            <span class="nav-icon">📅</span>
            <span class="nav-label">Activity Log</span>
          </a>
        </div>
      </nav>

      <div class="sidebar-footer">
        <a href="{{ route('data') }}" class="nav-item {{ request()->routeIs('data') ? 'active' : '' }}">
          <span class="nav-icon">⚙️</span>
          <span class="nav-label">Data & Export</span>
        </a>
      </div>
    </aside>

    <!-- ========== MAIN CONTENT ========== -->
    <main class="main-content">
      @yield('content')
    </main>
  </div>

  <!-- ========== MODALS ========== -->
  <div class="overlay" id="modal-overlay"></div>

  <!-- Prospect Add/Edit Modal -->
  @include('partials.prospect-modal')

  <!-- Prospect Detail Modal -->
  <div class="modal" id="detail-modal" style="width:620px">
    <div class="modal-header">
      <h3 class="modal-title">Prospect Detail</h3>
      <button class="modal-close" onclick="App.closeModal()">✕</button>
    </div>
    <div class="modal-body"></div>
  </div>

  <!-- Service Add/Edit Modal -->
  @include('partials.service-modal')

  <!-- Confirm Dialog -->
  <div class="modal-center" id="confirm-modal" style="width:380px">
    <div class="modal-body">
      <div class="confirm-dialog">
        <div class="confirm-icon">⚠️</div>
        <div class="confirm-title">Are you sure?</div>
        <div class="confirm-desc">This action cannot be undone.</div>
        <div class="confirm-actions">
          <button class="btn btn-ghost confirm-no">Cancel</button>
          <button class="btn btn-danger confirm-yes">Delete</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Container -->
  <div class="toast-container" id="toast-container"></div>

  <!-- ========== SCRIPTS ========== -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>

  <script src="{{ asset('js/utils.js') }}"></script>
  <script src="{{ asset('js/api.js') }}"></script>
  <script src="{{ asset('js/map.js') }}"></script>
  <script src="{{ asset('js/dashboard.js') }}"></script>
  <script src="{{ asset('js/kanban.js') }}"></script>
  <script src="{{ asset('js/prospects.js') }}"></script>
  <script src="{{ asset('js/services.js') }}"></script>
  <script src="{{ asset('js/activities.js') }}"></script>
  <script src="{{ asset('js/app.js') }}"></script>
</body>
</html>
