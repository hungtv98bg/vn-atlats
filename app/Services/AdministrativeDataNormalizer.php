<?php

namespace App\Services;

class AdministrativeDataNormalizer
{
    public function normalize(array $raw, string $slug, string $provinceName): array
    {
        $units = $this->findUnitList($raw);

        return [
            'province' => [
                'slug' => $slug,
                'name' => $provinceName,
            ],
            'source' => $raw['nguon'] ?? null,
            'note' => $raw['ghiChu'] ?? null,
            'units' => array_values(array_filter(array_map(
                fn ($unit) => $this->normalizeUnit($unit),
                $units
            ))),
        ];
    }

    private function findUnitList(array $raw): array
    {
        if (isset($raw['tinh']) && is_array($raw['tinh'])) {
            $units = [];

            foreach ($raw['tinh'] as $province) {
                if (is_array($province) && isset($province['donVi']) && is_array($province['donVi'])) {
                    array_push($units, ...array_values($province['donVi']));
                }
            }

            return $units;
        }

        // Thêm key tại đây sau khi kiểm tra cấu trúc JSON thực tế.
        $candidateKeys = [
            'units',
            'administrative_units',
            'wards',
            'communes',
            'data',
            'items',
        ];

        foreach ($candidateKeys as $key) {
            if (isset($raw[$key]) && is_array($raw[$key])) {
                return $this->isList($raw[$key])
                    ? $raw[$key]
                    : array_values($raw[$key]);
            }
        }

        // Trường hợp JSON gốc vốn là một danh sách đơn vị.
        if ($this->isList($raw)) {
            return $raw;
        }

        return [];
    }

    private function normalizeUnit(mixed $unit): ?array
    {
        if (! is_array($unit)) {
            return null;
        }

        $name = $this->firstValue($unit, [
            'name',
            'ten',
            'ten_don_vi',
            'unit_name',
            'administrative_unit_name',
        ]);

        if (! is_string($name) || trim($name) === '') {
            return null;
        }

        $population = $this->number($this->firstValue($unit, [
            'population',
            'danSo',
            'dan_so',
            'danso',
            'so_dan',
            'population_total',
        ]));

        $area = $this->number($this->firstValue($unit, [
            'area_km2',
            'dienTichKm2',
            'area',
            'dien_tich',
            'dientich',
            'area_km',
        ]));

        $density = $this->number($this->firstValue($unit, [
            'density',
            'matDo',
            'mat_do',
            'matdo',
            'population_density',
        ]));

        // Nếu file không có mật độ nhưng có dân số và diện tích, tự tính.
        if ($density === null && $population !== null && $area > 0) {
            $density = $population / $area;
        }

        return [
            'name' => trim($name),
            'slug' => $unit['slug'] ?? null,
            'type' => $this->firstValue($unit, [
                'type',
                'loai',
                'loai_hinh',
                'unit_type',
                'administrative_level',
            ]),
            'code' => $this->firstValue($unit, [
                'code',
                'maDinhDanh',
                'ma',
                'ma_dinh_danh',
                'unit_code',
            ]),
            'population' => $population,
            'area_km2' => $area,
            'density' => $density,
            'latitude' => $this->number($this->firstValue($unit, [
                'latitude',
                'viDo',
                'lat',
                'vi_do',
            ])),
            'longitude' => $this->number($this->firstValue($unit, [
                'longitude',
                'kinhDo',
                'lng',
                'lon',
                'kinh_do',
            ])),
            'geometry' => $this->normalizeBoundary($unit['ranhGioi'] ?? null),
            'address' => $unit['truSo'] ?? null,
            'postal_code' => $unit['maBuuChinh'] ?? null,
            'region' => $unit['vungKinhTe'] ?? null,
            'website' => $unit['website'] ?? null,
            'merged_from' => $unit['sapNhapTu'] ?? [],
            'neighbors' => $unit['lanCan'] ?? [],
            'adjacent' => $unit['giapRanh'] ?? [],
            'overview' => $unit['tongQuan'] ?? [],
            'legal_basis' => $unit['canCuPhapLy'] ?? $unit['nghiQuyet'] ?? null,
            'boundary_area_km2' => $this->number($unit['dienTichRanhKm2'] ?? null),
            'boundary_suspect' => (bool) ($unit['ranhNghiNgo'] ?? false),
        ];
    }

    private function normalizeBoundary(mixed $boundary): ?array
    {
        if (! is_array($boundary)) {
            return null;
        }

        $polygons = [];

        foreach ($boundary as $ring) {
            if (! is_array($ring) || count($ring) < 6 || count($ring) % 2 !== 0) {
                continue;
            }

            $coordinates = [];

            for ($index = 0; $index < count($ring); $index += 2) {
                $latitude = $this->number($ring[$index]);
                $longitude = $this->number($ring[$index + 1]);

                if ($latitude === null || $longitude === null || ! is_finite($latitude) || ! is_finite($longitude)
                    || abs($latitude) > 90 || abs($longitude) > 180) {
                    continue 2;
                }

                $coordinates[] = [$longitude, $latitude];
            }

            if (count(array_unique(array_map('serialize', $coordinates))) < 3) {
                continue;
            }

            if ($coordinates[0] !== $coordinates[array_key_last($coordinates)]) {
                $coordinates[] = $coordinates[0];
            }

            $polygons[] = [$coordinates];
        }

        return match (count($polygons)) {
            0 => null,
            1 => ['type' => 'Polygon', 'coordinates' => $polygons[0]],
            default => ['type' => 'MultiPolygon', 'coordinates' => $polygons],
        };
    }

    private function firstValue(array $source, array $keys): mixed
    {
        foreach ($keys as $key) {
            if (array_key_exists($key, $source) && $source[$key] !== '') {
                return $source[$key];
            }
        }

        return null;
    }

    private function number(mixed $value): ?float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (! is_string($value)) {
            return null;
        }

        // Hỗ trợ số dạng "72,822" hoặc "72.822".
        $normalized = str_replace(',', '', trim($value));

        return is_numeric($normalized)
            ? (float) $normalized
            : null;
    }

    private function isList(array $array): bool
    {
        return array_is_list($array);
    }
}
