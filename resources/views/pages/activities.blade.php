@extends('layout')

@section('title', 'Activity Log')

@section('content')
<div class="page active" id="page-activities">
  <div class="page-header">
    <div class="page-header-left">
      <div>
        <h2 class="page-title">Activity Log</h2>
        <p class="page-subtitle">Riwayat seluruh aktivitas pada prospek</p>
      </div>
    </div>
  </div>
  <div class="page-body">
    <div class="activity-timeline" id="full-activity-timeline"></div>
  </div>
</div>
@endsection
