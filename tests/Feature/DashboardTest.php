<?php

namespace Tests\Feature;

use Tests\TestCase;

class DashboardTest extends TestCase
{
    public function test_homepage_renders_the_dashboard(): void
    {
        $this->withoutVite();

        $response = $this->get('/');

        $response->assertOk()
            ->assertViewIs('dashboard')
            ->assertSee('Dashboard dữ liệu hành chính');
    }

    public function test_province_options_include_the_available_provinces(): void
    {
        $response = $this->getJson('/api/provinces');

        $response->assertOk()
            ->assertJsonCount(34)
            ->assertJsonFragment(['slug' => 'an-giang', 'name' => 'An Giang']);
    }

    public function test_province_returns_units_from_the_existing_json_file(): void
    {
        $response = $this->getJson('/api/provinces/an-giang');

        $response->assertOk()
            ->assertJsonPath('province.slug', 'an-giang')
            ->assertJsonCount(102, 'units')
            ->assertJsonPath('units.0.name', 'Kiên Hải')
            ->assertJsonPath('units.0.code', '31108')
            ->assertJsonPath('units.0.population', null)
            ->assertJsonPath('units.0.latitude', 10.213);
    }

    public function test_unknown_province_returns_404(): void
    {
        $response = $this->getJson('/api/provinces/unknown');

        $response->assertNotFound();
    }

    public function test_map_api_preserves_islands_point_fallback_and_geographic_details(): void
    {
        $response = $this->getJson('/api/provinces/an-giang');

        $response->assertOk()
            ->assertJsonPath('source', 'https://tinhthanhvn.com/province/an-giang')
            ->assertJsonPath('units.0.geometry', null)
            ->assertJsonPath('units.1.geometry.type', 'MultiPolygon')
            ->assertJsonCount(16, 'units.1.geometry.coordinates')
            ->assertJsonPath('units.1.geometry.coordinates.0.0.0', [104.00622, 10.4476])
            ->assertJsonPath('units.3.address', 'Phường Bình Khánh (169 Hàm Nghi)')
            ->assertJsonPath('units.3.postal_code', '90112')
            ->assertJsonPath('units.3.merged_from.0', 'Phường Bình Khánh')
            ->assertJsonPath('units.3.adjacent.Đông.0', 'phường Long Xuyên')
            ->assertJsonPath('units.3.boundary_suspect', false);
    }
}
