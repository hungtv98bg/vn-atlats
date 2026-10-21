<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use JsonException;
use RuntimeException;

class AdministrativeDataService
{
    public function __construct(
        private readonly AdministrativeDataNormalizer $normalizer
    ) {}

    public function allProvinces(): array
    {
        return config('administrative-data.provinces', []);
    }

    public function getProvince(string $slug): array
    {
        $provinces = $this->allProvinces();

        if (! array_key_exists($slug, $provinces)) {
            throw new RuntimeException('Không tìm thấy tỉnh/thành được yêu cầu.');
        }

        $path = config('administrative-data.directory').DIRECTORY_SEPARATOR.$slug.'.json';

        if (! is_file($path) || ! is_readable($path)) {
            throw new RuntimeException("Không đọc được file dữ liệu: {$slug}.json");
        }

        return Cache::remember(
            'administrative-data:geo-v1:'.$slug.':'.filemtime($path),
            now()->addMinutes(30),
            function () use ($slug, $provinces, $path) {
                try {
                    $raw = json_decode(
                        file_get_contents($path),
                        true,
                        512,
                        JSON_THROW_ON_ERROR
                    );
                } catch (JsonException $exception) {
                    throw new RuntimeException(
                        "JSON không hợp lệ trong file {$slug}.json",
                        previous: $exception
                    );
                }

                if (! is_array($raw)) {
                    throw new RuntimeException("Cấu trúc JSON không hợp lệ: {$slug}.json");
                }

                return $this->normalizer->normalize(
                    $raw,
                    $slug,
                    $provinces[$slug]
                );
            }
        );
    }

    public function compare(array $slugs): array
    {
        return array_map(
            fn ($slug) => $this->getProvince($slug),
            $slugs
        );
    }
}
