@extends('layout')

@section('title', 'Data & Export')

@section('content')
<div class="page active" id="page-data">
  <div class="page-header">
    <div class="page-header-left">
      <div>
        <h2 class="page-title">Data Management</h2>
        <p class="page-subtitle">Export, import, and backup your data</p>
      </div>
    </div>
  </div>
  <div class="page-body">
    <div class="data-actions-grid">
      <div class="data-card">
        <div class="data-icon">📤</div>
        <h3>Export JSON</h3>
        <p>Download semua data prospek, services, dan activities dalam format JSON (Backup penuh).</p>
        <button class="btn btn-primary mt-3" onclick="App.exportJson()">Export JSON</button>
      </div>

      <div class="data-card">
        <div class="data-icon">📊</div>
        <h3>Export CSV</h3>
        <p>Download data prospek dalam format CSV yang bisa dibuka di Excel / Google Sheets.</p>
        <button class="btn btn-primary mt-3" onclick="App.exportCsv()">Export CSV</button>
      </div>

      <div class="data-card">
        <div class="data-icon">📥</div>
        <h3>Import JSON Backup</h3>
        <p>Restore data dari file JSON yang pernah Anda download sebelumnya.</p>
        <input type="file" id="import-file" style="display:none" accept=".json,.txt">
        <button class="btn btn-secondary mt-3" onclick="document.getElementById('import-file').click()">Select File & Import</button>
      </div>

      <div class="data-card data-card-danger">
        <div class="data-icon">⚠️</div>
        <h3>Clear All Data</h3>
        <p>Hapus semua data. Pastikan Anda sudah export JSON sebelum melakukan ini.</p>
        <button class="btn btn-danger mt-3" onclick="App.clearAllData()">Clear Data</button>
      </div>
    </div>
  </div>
</div>
@endsection
