@extends('layout')

@section('title', 'Service Catalog')

@section('content')
<div class="page active" id="page-services">
  <div class="page-header">
    <div class="page-header-left">
      <div>
        <h2 class="page-title">Service Catalog</h2>
        <p class="page-subtitle">Katalog jasa yang Anda tawarkan</p>
      </div>
    </div>
    <div class="page-header-right">
      <button class="btn btn-primary" onclick="App.openServiceModal()">+ Add Service</button>
    </div>
  </div>
  <div class="page-body">
    <div class="service-grid" id="service-grid"></div>
  </div>
</div>
@endsection
