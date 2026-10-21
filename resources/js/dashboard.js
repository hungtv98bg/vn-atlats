import Chart from 'chart.js/auto';
import { AdministrativeMap } from './administrative-map';
import { animateIn, animateNumber, initializeInterface, notify, reducedMotion } from './interface';
import { typeColors, ramp, fold, hasPoint, validNumber, formatNumber, filterUnits, metricScale, safeUrl, featureCollection } from './geography';

const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const state = { current: null, units: [], visible: [], provinces: [], type: '', selected: null, comparison: new Map(), loading: false };
const metrics = {
    population: { label: 'Dân số', unit: 'người', digits: 0 },
    area_km2: { label: 'Diện tích', unit: 'km²', digits: 2 },
    density: { label: 'Mật độ dân số', unit: 'người/km²', digits: 1 },
};
let chart = null;
let requestId = 0;
let requestController;
let lastRequestedSlug = '';
export const mapView = new AdministrativeMap($('#administrative-map'), selectUnit);

function status(message, error = false) {
    $('#status').textContent = message;
    $('#status').closest('.directory-footer').classList.toggle('is-error', error);
    $('#retry-button').hidden = !error;
}

async function getJson(url, signal) {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal });
    if (!response.ok) throw new Error(`Không tải được dữ liệu (HTTP ${response.status}).`);
    return response.json();
}

function setBusy(busy) {
    state.loading = busy;
    $('#map-loading').hidden = !busy;
    $('.stats-grid').setAttribute('aria-busy', String(busy));
    $('#directory').setAttribute('aria-busy', String(busy));
    for (const selector of ['#unit-search', '#export-button', '#compare-button', '#fit-button']) {
        $(selector).disabled = busy || !state.current;
    }
    for (const button of document.querySelectorAll('.unit-card')) button.disabled = busy;
    updateCompareButton();
}

function total(units, metric) {
    const values = units.map(unit => unit[metric]).filter(validNumber);
    return values.length ? values.reduce((sum, value) => sum + value, 0) : null;
}

function renderStats() {
    const units = state.units;
    const boundaryCount = units.filter(unit => unit.geometry).length;
    const populationCount = units.filter(unit => validNumber(unit.population)).length;
    const areaCount = units.filter(unit => validNumber(unit.area_km2) && unit.area_km2 > 0).length;
    animateNumber($('#stat-units'), units.length);
    const types = [...new Set(units.map(unit => unit.type).filter(Boolean))];
    $('#stat-types').textContent = types.map(type => `${units.filter(unit => unit.type === type).length} ${type.toLowerCase()}`).join(' · ');
    animateNumber($('#stat-population'), total(units, 'population'));
    $('#stat-population-note').textContent = `người · ${populationCount}/${units.length} đơn vị có số liệu`;
    animateNumber($('#stat-area'), total(units, 'area_km2'), 2);
    $('#stat-area-note').textContent = `km² · ${areaCount}/${units.length} đơn vị có diện tích`;
    animateNumber($('#stat-coverage'), units.length ? boundaryCount / units.length * 100 : null, 1, '%');
    $('#stat-coverage-note').textContent = `${boundaryCount}/${units.length} đơn vị có ranh giới`;
    $('#province-title').textContent = state.current.province.name;
    $('#summary').textContent = `${units.length} đơn vị · ${boundaryCount} có ranh giới · ${units.filter(unit => !unit.geometry && hasPoint(unit)).length} chỉ có tọa độ`;
    const source = safeUrl(state.current.source);
    $('#source-link').hidden = !source;
    if (source) $('#source-link').href = source;
    $('#source-note').textContent = state.current.note ?? '';
}

function unitButton(unit) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `unit-card${state.selected === unit._key ? ' selected' : ''}`;
    button.dataset.key = unit._key;
    button.title = `${unit.type ?? 'Đơn vị'} ${unit.name}${unit.code ? ' · ' + unit.code : ''}`;
    button.setAttribute('aria-pressed', String(state.selected === unit._key));
    const category = unit.type === 'Phường' ? 'ward' : unit.type === 'Đặc khu' ? 'special' : '';
    button.innerHTML = `<span class="unit-card-icon ${category}">${icon(unit.geometry ? 'map' : 'pin')}</span><span class="unit-card-copy"><strong>${escapeHtml(unit.name)}</strong><small>${escapeHtml(unit.type ?? 'Đơn vị')} · ${unit.code ? escapeHtml(unit.code) : 'Chưa có mã'}${unit.geometry ? '' : ' · Điểm tọa độ'}</small></span>${icon('arrow')}`;
    button.addEventListener('click', () => selectUnit(unit._key));
    return button;
}

function renderList() {
    $('#result-count').textContent = `${state.visible.length} / ${state.units.length}`;
    $('#unit-list').replaceChildren(...state.visible.map(unitButton));
    if (!state.visible.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'Không tìm thấy đơn vị phù hợp. Thử tên khác hoặc chọn “Tất cả”.';
        $('#unit-list').append(empty);
    }
}

function renderTable() {
    $('#units-table').replaceChildren(...state.visible.map(unit => {
        const row = document.createElement('tr');
        row.dataset.key = unit._key;
        row.classList.toggle('selected', unit._key === state.selected);
        const values = [unit.name, unit.type ?? '—', formatNumber(unit.population), formatNumber(unit.area_km2, 2), formatNumber(unit.density, 1), unit.geometry ? unit.boundary_suspect ? 'Cần kiểm tra' : 'Có ranh giới' : 'Chỉ tọa độ'];
        for (const value of values) {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.append(cell);
        }
        const cell = document.createElement('td');
        const button = document.createElement('button');
        button.className = 'table-focus';
        button.textContent = 'Xem bản đồ ↗';
        button.setAttribute('aria-label', `Xem ${unit.name} trên bản đồ`);
        button.addEventListener('click', () => {
            $('#map-section').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
            selectUnit(unit._key);
        });
        cell.append(button);
        row.append(cell);
        return row;
    }));
    if (!state.visible.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.className = 'empty-state';
        cell.textContent = 'Không có đơn vị phù hợp với bộ lọc.';
        row.append(cell);
        $('#units-table').append(row);
    }
}

function renderLegend() {
    const metric = $('#metric-select').value;
    let items;
    if (metric === 'type') {
        items = [...new Set(state.units.map(unit => unit.type).filter(Boolean))].map(type => ({ color: typeColors[type] ?? '#8c9d99', label: type }));
    } else {
        const { thresholds } = metricScale(state.units, metric);
        const config = metrics[metric];
        items = thresholds.length ? thresholds.map((value, index) => ({
            color: ramp[index],
            label: index === 0 ? `≤ ${formatNumber(value, config.digits)}` : `${formatNumber(thresholds[index - 1], config.digits)}–${formatNumber(value, config.digits)}`,
        })) : [];
        if (thresholds.length) items.push({ color: ramp[thresholds.length], label: `> ${formatNumber(thresholds.at(-1), config.digits)}` });
        if (state.units.some(unit => !validNumber(unit[metric]))) items.push({ color: '#bfc7bf', label: 'Chưa có số liệu' });
        if (!items.length) items = [{ color: '#bfc7bf', label: 'Chưa có số liệu' }];
    }
    const title = metric === 'type' ? 'LOẠI ĐƠN VỊ HÀNH CHÍNH' : `${metrics[metric].label.toUpperCase()} · ${metrics[metric].unit}`;
    $('#map-legend').innerHTML = `<p class="legend-title">${escapeHtml(title)}</p><div class="legend-items">${items.map(item => `<span class="legend-item"><i class="legend-swatch" style="background:${item.color}"></i>${escapeHtml(item.label)}</span>`).join('')}</div><p class="legend-note">● Điểm tọa độ &nbsp; · &nbsp; Nét đứt: nguồn đánh dấu cần kiểm tra</p>`;
}

function mapOptions() {
    return { boundaries: $('#show-boundaries').checked, points: $('#show-points').checked, labels: $('#show-labels').checked };
}

function renderMap() {
    mapView.render(state.visible, state.units, $('#metric-select').value, mapOptions());
    renderLegend();
}

function applyFilters(fit = false) {
    state.visible = filterUnits(state.units, $('#unit-search').value, state.type);
    const sort = $('#unit-sort').value;
    if (sort === 'name') state.visible.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    else if (sort !== 'source') state.visible.sort((a, b) => (b[sort] ?? -Infinity) - (a[sort] ?? -Infinity));
    $('#clear-filters').hidden = !$('#unit-search').value && !state.type && sort === 'source';
    if (state.selected && !state.visible.some(unit => unit._key === state.selected)) closeDetail(false);
    renderList();
    renderTable();
    renderMap();
    renderChart();
    $('#export-button').disabled = state.loading || !state.visible.length;
    if (fit && state.visible.length) mapView.fit();
}

function field(label, value) {
    return value ? `<p class="detail-field"><span>${escapeHtml(label)}:</span> ${escapeHtml(value)}</p>` : '';
}

function tags(values) {
    return Array.isArray(values) ? values.map(value => `<span>${escapeHtml(value)}</span>`).join('') : '';
}

function selectUnit(key) {
    if (state.loading) return;
    const unit = state.units.find(unit => unit._key === key);
    if (!unit) return;
    state.selected = key;
    const panel = $('#unit-detail');
    const website = safeUrl(unit.website);
    const osm = hasPoint(unit) ? `https://www.openstreetmap.org/?mlat=${unit.latitude}&mlon=${unit.longitude}#map=14/${unit.latitude}/${unit.longitude}` : null;
    const adjacent = unit.adjacent && typeof unit.adjacent === 'object'
        ? Object.entries(unit.adjacent).map(([direction, neighbors]) => field(direction, Array.isArray(neighbors) ? neighbors.join(', ') : '')).join('') : '';
    const parts = unit.geometry?.type === 'MultiPolygon' ? unit.geometry.coordinates.length : unit.geometry ? 1 : 0;
    panel.innerHTML = `<div class="detail-header"><div class="detail-top"><span class="unit-type-badge">${escapeHtml(unit.type ?? 'Đơn vị hành chính')}</span><button class="icon-button" id="close-detail" aria-label="Đóng thông tin đơn vị">${icon('close')}</button></div>
        <h3 tabindex="-1">${escapeHtml(unit.name)}</h3><p class="detail-province">${icon('pin')}${escapeHtml(state.current.province.name)}</p></div><div class="detail-body">
        <dl class="detail-metrics"><div><dt>Dân số · người</dt><dd>${formatNumber(unit.population)}</dd></div><div><dt>Diện tích · km²</dt><dd>${formatNumber(unit.area_km2, 2)}</dd></div><div><dt>Mật độ · người/km²</dt><dd>${formatNumber(unit.density, 1)}</dd></div><div><dt>Mã định danh</dt><dd>${escapeHtml(unit.code ?? '—')}</dd></div></dl>
        <section class="detail-section"><h4>Vị trí &amp; địa lý</h4>${field('Vùng kinh tế', unit.region)}${field('Trụ sở', unit.address)}${field('Mã bưu chính', unit.postal_code)}${field('Vĩ độ', validNumber(unit.latitude) ? unit.latitude.toFixed(5) + '°' : null)}${field('Kinh độ', validNumber(unit.longitude) ? unit.longitude.toFixed(5) + '°' : null)}${field('Ranh giới', parts ? `${parts} vùng địa lý` : 'Chưa có ranh giới, hiển thị theo tọa độ')}${field('Diện tích theo ranh', validNumber(unit.boundary_area_km2) ? formatNumber(unit.boundary_area_km2, 2) + ' km²' : null)}</section>
        ${unit.boundary_suspect ? '<p class="boundary-notice">Dữ liệu nguồn đánh dấu ranh giới này cần kiểm tra. Ranh giới được thể hiện bằng nét đứt.</p>' : ''}
        ${unit.merged_from?.length ? `<section class="detail-section"><h4>Hình thành từ</h4><div class="detail-tags">${tags(unit.merged_from)}</div></section>` : ''}
        ${adjacent ? `<section class="detail-section"><h4>Giáp ranh theo hướng</h4>${adjacent}</section>` : ''}
        ${unit.neighbors?.length ? `<section class="detail-section"><h4>Đơn vị lân cận</h4><div class="detail-tags">${tags(unit.neighbors)}</div></section>` : ''}
        ${unit.overview?.length ? `<details class="detail-section"><summary class="detail-field">Tổng quan địa phương</summary>${unit.overview.map(text => `<p class="detail-field">${escapeHtml(text)}</p>`).join('')}</details>` : ''}
        ${unit.legal_basis ? `<section class="detail-section"><h4>Căn cứ pháp lý</h4><p class="detail-field">${escapeHtml(unit.legal_basis)}</p></section>` : ''}
        </div><div class="detail-actions">${website ? `<a class="button" href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">Website ${icon('external')}</a>` : ''}${osm ? `<a class="button" href="${escapeHtml(osm)}" target="_blank" rel="noopener noreferrer">Mở bản đồ ${icon('external')}</a>` : ''}</div>`;
    panel.hidden = false;
    $('.map-zone').classList.add('has-selection');
    panel.querySelector('.detail-body').scrollTop = 0;
    animateIn(panel.querySelector('.detail-header'), { distance: 8 });
    animateIn(panel.querySelector('.detail-body'), { distance: 12, delay: 60 });
    $('#close-detail').addEventListener('click', () => closeDetail(true));
    mapView.select(key);
    syncSelection();
    if (matchMedia('(max-width: 1100px)').matches) panel.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest' });
}

function syncSelection() {
    for (const node of document.querySelectorAll('[data-key]')) {
        const selected = node.dataset.key === state.selected;
        node.classList.toggle('selected', selected);
        if (node.matches('button')) node.setAttribute('aria-pressed', String(selected));
    }
}

function closeDetail(focus = false) {
    const previousKey = state.selected;
    state.selected = null;
    $('#unit-detail').hidden = true;
    $('.map-zone').classList.remove('has-selection');
    mapView.select(null, false);
    syncSelection();
    if (focus) document.querySelector(`.unit-card[data-key="${previousKey}"]`)?.focus({ preventScroll: true });
}

function provinceMetric(data, metric) {
    if (metric !== 'density') return total(data.units, metric);
    const paired = data.units.filter(unit => validNumber(unit.population) && validNumber(unit.area_km2) && unit.area_km2 > 0);
    const area = total(paired, 'area_km2');
    return area ? total(paired, 'population') / area : null;
}

function renderChart() {
    if (!state.current) return;
    const metric = $('#chart-metric').value;
    const config = metrics[metric];
    const theme = getComputedStyle(document.documentElement);
    const gridColor = theme.getPropertyValue('--chart-grid').trim();
    const textColor = theme.getPropertyValue('--chart-text').trim();
    let entries;
    if (state.comparison.size) {
        const selected = new Map([[state.current.province.slug, state.current], ...state.comparison]);
        entries = [...selected.values()].map(data => ({ name: data.province.name, value: provinceMetric(data, metric) })).filter(item => validNumber(item.value));
        $('#chart-title').textContent = `So sánh ${config.label.toLowerCase()} giữa các tỉnh · chỉ tính đơn vị có số liệu`;
    } else {
        entries = state.visible.filter(unit => validNumber(unit[metric])).sort((a, b) => b[metric] - a[metric]).slice(0, 10).map(unit => ({ name: unit.name, value: unit[metric] }));
        $('#chart-title').textContent = `10 đơn vị có ${config.label.toLowerCase()} cao nhất · kết quả đang lọc`;
    }
    $('#chart-empty').hidden = entries.length > 0;
    $('#units-chart').parentElement.hidden = !entries.length;
    chart?.destroy();
    chart = new Chart($('#units-chart'), {
        type: 'bar',
        data: { labels: entries.map(item => item.name), datasets: [{ data: entries.map(item => item.value), label: config.label, backgroundColor: entries.map((_, index) => index === 0 ? '#6478ed' : index < 3 ? '#9daaf5' : '#bdc8f9'), hoverBackgroundColor: '#5369e2', borderRadius: 5, barThickness: 17 }] },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y', animation: { duration: reducedMotion.matches ? 0 : 420, easing: 'easeOutQuart' },
            layout: { padding: { right: 12 } },
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${formatNumber(context.raw, config.digits)} ${config.unit}` } } },
            scales: {
                x: { beginAtZero: true, grid: { color: gridColor }, border: { display: false }, ticks: { color: textColor, font: { size: 11 }, callback: value => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value) } },
                y: { grid: { display: false }, border: { display: false }, ticks: { color: textColor, font: { size: 12 } } },
            },
        },
    });
}

function updateCompareButton() {
    const pinned = state.current && state.comparison.has(state.current.province.slug);
    const button = $('#compare-button');
    button.innerHTML = `${icon('chart')}${pinned ? 'Đã thêm so sánh' : 'Thêm so sánh'}`;
    button.classList.toggle('is-pinned', Boolean(pinned));
    button.disabled = state.loading || !state.current || pinned || state.comparison.size >= 4;
    button.title = state.comparison.size >= 4 ? 'Đã chọn tối đa 4 tỉnh để so sánh. Bỏ một tỉnh trong phần biểu đồ để chọn tỉnh khác.' : 'Ghim tỉnh hiện tại vào biểu đồ so sánh';
}

function renderComparison() {
    $('#comparison-chips').replaceChildren(...[...state.comparison].map(([slug, data]) => {
        const chip = document.createElement('span');
        chip.className = 'comparison-chip';
        const label = document.createElement('span');
        label.textContent = data.province.name;
        const button = document.createElement('button');
        button.innerHTML = icon('close');
        button.setAttribute('aria-label', `Bỏ so sánh ${data.province.name}`);
        button.addEventListener('click', () => { state.comparison.delete(slug); renderComparison(); renderChart(); });
        chip.append(label, button);
        return chip;
    }));
    updateCompareButton();
}

async function loadProvince(slug) {
    if (!slug) return;
    lastRequestedSlug = slug;
    const id = ++requestId;
    requestController?.abort();
    requestController = new AbortController();
    setBusy(true);
    status('Đang tải dữ liệu tỉnh, thành…');
    try {
        const data = await getJson(`/api/provinces/${encodeURIComponent(slug)}`, requestController.signal);
        if (id !== requestId) return;
        state.current = data;
        state.units = data.units.map((unit, index) => ({ ...unit, _key: String(index) }));
        state.type = '';
        state.selected = null;
        $('#unit-detail').hidden = true;
        $('.map-zone').classList.remove('has-selection');
        mapView.selectedKey = null;
        $('#unit-search').value = '';
        $('#unit-sort').value = 'source';
        for (const chip of document.querySelectorAll('#type-filters button')) {
            const selected = chip.dataset.type === '';
            chip.classList.toggle('selected', selected);
            chip.setAttribute('aria-pressed', String(selected));
        }
        $('#province-select').value = slug;
        renderStats();
        applyFilters(true);
        animateIn($('#unit-list'), { distance: 8, duration: 400 });
        renderComparison();
        status(`Đã tải ${state.units.length} đơn vị hành chính.`);
        const url = new URL(location.href);
        url.searchParams.set('province', slug);
        history.replaceState(null, '', url);
    } catch (error) {
        if (error.name === 'AbortError' || id !== requestId) return;
        status('Không thể tải dữ liệu. Vui lòng thử lại.', true);
        if (state.current) $('#province-select').value = state.current.province.slug;
        else $('#unit-list').innerHTML = '<p class="empty-state">Chưa tải được dữ liệu tỉnh, thành. Chọn “Thử lại” để tiếp tục.</p>';
    } finally {
        if (id === requestId) setBusy(false);
    }
}

async function initialize() {
    setBusy(true);
    status('Đang tải danh sách tỉnh, thành…');
    try {
        const provinces = await getJson('/api/provinces');
        state.provinces = provinces;
        $('#province-select').replaceChildren(...provinces.map(province => {
            const option = document.createElement('option');
            option.value = province.slug;
            option.textContent = province.name;
            return option;
        }));
        $('#province-select').disabled = !provinces.length;
        $('#province-count').textContent = `${provinces.length} tỉnh, thành`;
        const requested = new URLSearchParams(location.search).get('province');
        const initial = provinces.find(province => province.slug === requested) ?? provinces[0];
        if (initial) await loadProvince(initial.slug);
        else { status('Chưa có dữ liệu tỉnh, thành.'); setBusy(false); }
    } catch {
        status('Chưa tải được danh sách tỉnh, thành.', true);
        setBusy(false);
    }
}

$('#province-select').addEventListener('change', event => loadProvince(event.target.value));
$('#retry-button').addEventListener('click', () => state.provinces.length ? loadProvince(lastRequestedSlug) : initialize());
$('#unit-search').addEventListener('input', () => applyFilters(true));
$('#unit-sort').addEventListener('change', () => {
    applyFilters();
    animateIn($('#unit-list'), { distance: 6, duration: 260 });
});
$('#clear-filters').addEventListener('click', () => {
    $('#unit-search').value = '';
    $('#unit-sort').value = 'source';
    state.type = '';
    for (const chip of document.querySelectorAll('#type-filters button')) {
        const selected = chip.dataset.type === '';
        chip.classList.toggle('selected', selected);
        chip.setAttribute('aria-pressed', String(selected));
    }
    applyFilters(true);
    $('#unit-search').focus({ preventScroll: true });
});
$('#type-filters').addEventListener('click', event => {
    const button = event.target.closest('button[data-type]');
    if (!button || state.loading) return;
    state.type = button.dataset.type;
    for (const chip of document.querySelectorAll('#type-filters button')) {
        const selected = chip === button;
        chip.classList.toggle('selected', selected);
        chip.setAttribute('aria-pressed', String(selected));
    }
    applyFilters(true);
});
$('#metric-select').addEventListener('change', renderMap);
for (const selector of ['#show-boundaries', '#show-points', '#show-labels']) $(selector).addEventListener('change', renderMap);
$('#muted-basemap').addEventListener('change', event => $('#administrative-map').classList.toggle('map-muted', event.target.checked));
$('#fit-button').addEventListener('click', () => { closeDetail(); mapView.fit(); });
$('#directory-toggle').addEventListener('click', () => {
    const hidden = $('.explorer-body').classList.toggle('directory-hidden');
    $('#directory-toggle').setAttribute('aria-expanded', String(!hidden));
    $('#directory').inert = hidden;
});
let directoryWasHidden = false;
function toggleFocus(force) {
    const focused = force ?? !document.body.classList.contains('map-focused');
    if (focused) directoryWasHidden = $('.explorer-body').classList.contains('directory-hidden');
    document.body.classList.toggle('map-focused', focused);
    $('#focus-toggle').setAttribute('aria-pressed', String(focused));
    $('#focus-toggle').setAttribute('aria-label', focused ? 'Thu gọn bản đồ' : 'Mở rộng bản đồ');
    $('#focus-toggle').title = focused ? 'Thu gọn bản đồ · Esc' : 'Mở rộng bản đồ';
    $('#focus-toggle use').setAttribute('href', focused ? '#i-close' : '#i-expand');
    for (const element of document.querySelectorAll('.navigation-rail,.topbar,.page-heading,.stats-grid,#analysis-section,#source-info')) element.inert = focused;
    const hideDirectory = focused && matchMedia('(max-width: 700px)').matches ? true : directoryWasHidden;
    $('.explorer-body').classList.toggle('directory-hidden', hideDirectory);
    $('#directory').inert = hideDirectory;
    $('#directory-toggle').setAttribute('aria-expanded', String(!hideDirectory));
    requestAnimationFrame(() => {
        document.dispatchEvent(new Event('atlas:layout-change'));
        mapView.map.invalidateSize({ pan: false });
        if (state.selected) mapView.select(state.selected);
        else mapView.fit();
    });
    $('#focus-toggle').focus({ preventScroll: true });
}
$('#focus-toggle').addEventListener('click', () => toggleFocus());
$('#compare-button').addEventListener('click', () => {
    if (!state.current || state.loading || state.comparison.size >= 4) return;
    state.comparison.set(state.current.province.slug, state.current);
    renderComparison();
    renderChart();
    status(`Đã thêm ${state.current.province.name} vào so sánh.`);
    notify(`Đã thêm ${state.current.province.name} vào biểu đồ so sánh.`);
});
$('#chart-metric').addEventListener('change', renderChart);
for (const button of document.querySelectorAll('.analysis-tabs button')) button.addEventListener('click', () => {
    const table = button.dataset.view === 'table';
    $('#table-view').hidden = !table;
    $('#chart-view').hidden = table;
    animateIn(table ? $('#table-view') : $('#chart-view'), { distance: 7, duration: 300 });
    for (const tab of document.querySelectorAll('.analysis-tabs button')) {
        tab.classList.toggle('selected', tab === button);
        tab.setAttribute('aria-pressed', String(tab === button));
    }
    if (!table) chart?.resize();
});
$('#export-button').addEventListener('click', () => {
    if (!state.current || !state.visible.length) return;
    const collection = featureCollection(state.visible, state.current.province);
    collection.source = state.current.source;
    const blob = new Blob([JSON.stringify(collection)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.current.province.slug}${state.type ? '-' + fold(state.type).replaceAll(' ', '-') : ''}.geojson`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status(`Đã xuất ${collection.features.length} đơn vị ra GeoJSON.`);
    notify(`Đã xuất ${collection.features.length} đơn vị sang GeoJSON.`);
});
for (const button of document.querySelectorAll('[data-open-help]')) button.addEventListener('click', () => $('#help-dialog').showModal());
for (const selector of ['#close-help', '#start-exploring']) $(selector).addEventListener('click', () => $('#help-dialog').close());
document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input,textarea,select,[contenteditable]') && !$('#help-dialog').open) {
        event.preventDefault();
        $('#unit-search').focus();
    }
    if (event.key === 'Escape' && !$('#help-dialog').open) {
        if (state.selected) closeDetail(true);
        else if (document.body.classList.contains('map-focused')) toggleFocus(false);
    }
});

document.addEventListener('atlas:theme-change', renderChart);
reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
        chart?.stop();
        mapView.map.stop();
        renderChart();
    }
});
initializeInterface();
initialize();
