export const typeColors = { 'Xã': '#4aa99c', 'Phường': '#7c87d7', 'Đặc khu': '#d4aa61' };
export const ramp = ['#dce8fc', '#adc8f4', '#7ea3e7', '#557bd2', '#344db2'];

export function fold(value) {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim();
}

export function hasPoint(unit) {
    return Number.isFinite(unit.latitude) && Number.isFinite(unit.longitude)
        && Math.abs(unit.latitude) <= 90 && Math.abs(unit.longitude) <= 180;
}

export function validNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

export function formatNumber(value, digits = 0) {
    return validNumber(value) ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(value) : '—';
}

export function filterUnits(units, query, type) {
    const term = fold(query);
    return units.filter(unit => (!type || unit.type === type)
        && (!term || fold([unit.name, unit.type, unit.code, unit.postal_code].join(' ')).includes(term)));
}

export function metricScale(units, metric) {
    const values = units.map(unit => unit[metric]).filter(validNumber).sort((a, b) => a - b);
    const thresholds = [...new Set([.2, .4, .6, .8].map(q => values[Math.floor((values.length - 1) * q)]))].filter(validNumber);
    return {
        thresholds,
        color(unit) {
            if (metric === 'type') return typeColors[unit.type] ?? '#8c9d99';
            if (!validNumber(unit[metric])) return '#bfc7bf';
            return ramp[thresholds.filter(threshold => unit[metric] > threshold).length];
        },
    };
}

export function safeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    const input = value.trim();
    try {
        const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`);
        return ['https:', 'http:'].includes(url.protocol) && url.hostname ? url.href : null;
    } catch {
        return null;
    }
}

export function featureCollection(units, province) {
    return {
        type: 'FeatureCollection',
        features: units.flatMap(unit => {
            const geometry = unit.geometry ?? (hasPoint(unit) ? { type: 'Point', coordinates: [unit.longitude, unit.latitude] } : null);
            if (!geometry) return [];
            const { geometry: ignored, _key: internalKey, ...properties } = unit;
            return [{ type: 'Feature', geometry, properties: { ...properties, province: province.name, province_slug: province.slug } }];
        }),
    };
}
