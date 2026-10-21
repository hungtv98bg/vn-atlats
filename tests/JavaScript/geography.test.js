import test from 'node:test';
import assert from 'node:assert/strict';
import { filterUnits, featureCollection, metricScale, safeUrl, formatNumber } from '../../resources/js/geography.js';

test('search finds Vietnamese names without accents, codes and combined type filters', () => {
    const units = [{ name: 'Bình Đức', type: 'Phường', code: '30292' }, { name: 'Đức Hòa', type: 'Xã', code: '001' }];
    assert.deepEqual(filterUnits(units, 'binh duc', ''), [units[0]]);
    assert.deepEqual(filterUnits(units, '30292', 'Phường'), [units[0]]);
    assert.deepEqual(filterUnits(units, 'duc', 'Xã'), [units[1]]);
    assert.deepEqual(filterUnits(units, 'không có', ''), []);
});

test('GeoJSON retains separate islands and falls back to longitude-latitude points', () => {
    const geometry = { type: 'MultiPolygon', coordinates: [[[[105, 10], [105, 11], [106, 11], [105, 10]]]] };
    const result = featureCollection([
        { name: 'Island', _key: '0', geometry },
        { name: 'Point', latitude: 10.5, longitude: 105.5, geometry: null },
        { name: 'Unknown', latitude: null, longitude: null },
        { name: 'Invalid', latitude: 95, longitude: 105 },
    ], { name: 'Sample', slug: 'sample' });
    assert.equal(result.features.length, 2);
    assert.deepEqual(result.features[0].geometry, geometry);
    assert.equal('_key' in result.features[0].properties, false);
    assert.deepEqual(result.features[1].geometry, { type: 'Point', coordinates: [105.5, 10.5] });
    assert.equal(result.features[1].properties.province_slug, 'sample');
});

test('color scale distinguishes zero from missing values and tolerates empty data', () => {
    const units = [null, 0, 10, 20, 40, 80].map(population => ({ population }));
    const scale = metricScale(units, 'population');
    assert.notEqual(scale.color(units[0]), scale.color(units[1]));
    assert.notEqual(scale.color(units[1]), scale.color(units.at(-1)));
    assert.equal(metricScale([], 'population').color({ population: null }), '#bfc7bf');
    assert.equal(formatNumber(null), '—');
    assert.equal(formatNumber(0), '0');
});

test('external links allow web addresses and reject executable schemes', () => {
    assert.equal(safeUrl('binhduc.angiang.gov.vn'), 'https://binhduc.angiang.gov.vn/');
    assert.equal(safeUrl('javascript:alert(1)'), null);
    assert.equal(safeUrl('data:text/html,hello'), null);
    assert.equal(safeUrl(null), null);
    assert.equal(safeUrl('https://example.org/source'), 'https://example.org/source');
});
