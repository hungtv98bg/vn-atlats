<?php

namespace App\Http\Controllers;

use App\Services\AdministrativeDataService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __construct(
        private readonly AdministrativeDataService $dataService
    ) {}

    public function index(): View
    {
        return view('dashboard');
    }

    public function provinceList(): JsonResponse
    {
        $items = [];

        foreach ($this->dataService->allProvinces() as $slug => $name) {
            $items[] = compact('slug', 'name');
        }

        return response()->json($items);
    }

    public function province(string $slug): JsonResponse
    {
        abort_unless(array_key_exists($slug, $this->dataService->allProvinces()), 404);

        return response()->json(
            $this->dataService->getProvince($slug)
        );
    }

    public function compare(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slugs' => ['required', 'array', 'min:1', 'max:5'],
            'slugs.*' => ['required', 'string', 'distinct'],
        ]);

        $allowed = array_keys($this->dataService->allProvinces());

        foreach ($validated['slugs'] as $slug) {
            abort_unless(in_array($slug, $allowed, true), 404);
        }

        return response()->json(
            $this->dataService->compare($validated['slugs'])
        );
    }
}
