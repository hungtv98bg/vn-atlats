<?php

namespace Tests\Unit;

use App\Services\AdministrativeDataNormalizer;
use PHPUnit\Framework\TestCase;

class AdministrativeDataNormalizerTest extends TestCase
{
    public function test_nested_province_data_maps_metrics_and_calculates_missing_density(): void
    {
        $raw = ['tinh' => [['donVi' => [[
            'ten' => 'Đơn vị mẫu',
            'loai' => 'Xã',
            'maDinhDanh' => '001',
            'danSo' => 1200,
            'dienTichKm2' => 12,
            'matDo' => null,
            'viDo' => 10.5,
            'kinhDo' => 105.5,
        ]]]]];

        $result = (new AdministrativeDataNormalizer)->normalize($raw, 'sample', 'Tỉnh mẫu');

        $this->assertSame([
            'province' => ['slug' => 'sample', 'name' => 'Tỉnh mẫu'],
            'source' => null,
            'note' => null,
            'units' => [[
                'name' => 'Đơn vị mẫu',
                'slug' => null,
                'type' => 'Xã',
                'code' => '001',
                'population' => 1200.0,
                'area_km2' => 12.0,
                'density' => 100.0,
                'latitude' => 10.5,
                'longitude' => 105.5,
                'geometry' => null,
                'address' => null,
                'postal_code' => null,
                'region' => null,
                'website' => null,
                'merged_from' => [],
                'neighbors' => [],
                'adjacent' => [],
                'overview' => [],
                'legal_basis' => null,
                'boundary_area_km2' => null,
                'boundary_suspect' => false,
            ]],
        ], $result);
    }

    public function test_flat_unit_data_preserves_missing_metrics_and_supplied_density(): void
    {
        $raw = ['units' => [
            ['name' => 'Missing data', 'area_km2' => 0],
            ['name' => 'Known density', 'population' => '1,200', 'area_km2' => 12, 'density' => 99],
        ]];

        $result = (new AdministrativeDataNormalizer)->normalize($raw, 'sample', 'Sample');

        $this->assertSame(null, $result['units'][0]['population']);
        $this->assertSame(null, $result['units'][0]['density']);
        $this->assertSame(1200.0, $result['units'][1]['population']);
        $this->assertSame(99.0, $result['units'][1]['density']);
    }

    public function test_flat_latitude_longitude_ring_becomes_closed_geojson_polygon(): void
    {
        $raw = ['units' => [['name' => 'Sample', 'ranhGioi' => [[10, 105, 11, 105, 11, 106]]]]];

        $result = (new AdministrativeDataNormalizer)->normalize($raw, 'sample', 'Sample');

        $this->assertSame([
            'type' => 'Polygon',
            'coordinates' => [[[105.0, 10.0], [105.0, 11.0], [106.0, 11.0], [105.0, 10.0]]],
        ], $result['units'][0]['geometry']);
    }

    public function test_separate_islands_become_independent_polygons(): void
    {
        $raw = ['units' => [['name' => 'Islands', 'ranhGioi' => [
            [10, 105, 11, 105, 11, 106, 10, 105],
            [12, 107, 13, 107, 13, 108],
        ]]]];

        $result = (new AdministrativeDataNormalizer)->normalize($raw, 'sample', 'Sample');

        $this->assertSame([
            'type' => 'MultiPolygon',
            'coordinates' => [
                [[[105.0, 10.0], [105.0, 11.0], [106.0, 11.0], [105.0, 10.0]]],
                [[[107.0, 12.0], [107.0, 13.0], [108.0, 13.0], [107.0, 12.0]]],
            ],
        ], $result['units'][0]['geometry']);
    }

    public function test_invalid_boundaries_do_not_create_a_fabricated_area(): void
    {
        $raw = ['units' => [['name' => 'Sample', 'viDo' => 10.5, 'kinhDo' => 105.5, 'ranhGioi' => [
            [10, 105, 11],
            [95, 105, 11, 105, 11, 106],
            [10, 105, 10, 105, 10, 105],
            [10, 105, null, 105, 11, 106],
        ]]]];

        $result = (new AdministrativeDataNormalizer)->normalize($raw, 'sample', 'Sample');

        $this->assertNull($result['units'][0]['geometry']);
        $this->assertSame(10.5, $result['units'][0]['latitude']);
        $this->assertSame(105.5, $result['units'][0]['longitude']);
    }
}
