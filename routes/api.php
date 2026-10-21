<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/provinces', [DashboardController::class, 'provinceList'])->name('provinces.index');
Route::get('/provinces/{slug}', [DashboardController::class, 'province'])->name('provinces.show');
