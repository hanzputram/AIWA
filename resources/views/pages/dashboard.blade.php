@extends('layout')

@section('title', 'Dashboard')

@section('content')
<div class="page active" id="page-dashboard">
  <div class="page-header">
    <div class="page-header-left">
      <div>
        <h2 class="page-title">Dashboard</h2>
        <p class="page-subtitle">Overview performa prospecting Anda</p>
      </div>
    </div>
    <div class="page-header-right">
      <button class="btn btn-primary" onclick="App.openAddProspect()">+ New Prospect</button>
    </div>
  </div>
  <div class="page-body">
    <div class="dashboard-kpi-grid" id="dashboard-kpis"></div>

    <div class="dashboard-charts-row">
      <div class="chart-card">
        <div class="chart-card-header">
          <h3 class="chart-card-title">📊 Revenue by Service & Prospects</h3>
        </div>
        <div class="chart-wrapper" style="height:260px">
          <canvas id="revenue-chart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-card-header">
          <h3 class="chart-card-title">🔄 Pipeline Funnel</h3>
        </div>
        <div id="pipeline-funnel" class="funnel-container"></div>
      </div>
    </div>

    <div class="dashboard-bottom-row">
      <div class="chart-card">
        <div class="chart-card-header">
          <h3 class="chart-card-title">📈 Monthly Activity</h3>
        </div>
        <div class="chart-wrapper" style="height:200px">
          <canvas id="activity-chart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-card-header">
          <h3 class="chart-card-title">⏰ Upcoming Follow-ups</h3>
        </div>
        <div id="followup-list" class="followup-list"></div>
      </div>
    </div>

    <div class="dashboard-bottom-row mt-6">
      <div class="chart-card">
        <div class="chart-card-header">
          <h3 class="chart-card-title">🕐 Recent Activities</h3>
        </div>
        <div id="recent-activities" class="recent-activities"></div>
      </div>
      <div class="chart-card">
        <div class="chart-card-header">
          <h3 class="chart-card-title">🏆 Top Prospects</h3>
        </div>
        <div id="top-prospects" class="top-prospects-list"></div>
      </div>
    </div>
  </div>
</div>
@endsection
