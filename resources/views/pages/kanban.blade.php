@extends('layout')

@section('title', 'Pipeline Board')

@section('content')
<div class="page active" id="page-kanban">
  <div class="page-header">
    <div class="page-header-left">
      <div>
        <h2 class="page-title">Pipeline Board</h2>
        <p class="page-subtitle">Drag & drop prospects between stages</p>
      </div>
    </div>
    <div class="page-header-right">
      <button class="btn btn-primary" onclick="App.openAddProspect()">+ New Prospect</button>
    </div>
  </div>
  <div class="kanban-container" id="kanban-container"></div>
</div>
@endsection
