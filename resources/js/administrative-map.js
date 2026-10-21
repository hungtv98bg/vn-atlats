import L from 'leaflet';
import { hasPoint, formatNumber, metricScale } from './geography';
import { reducedMotion } from './interface';

export class AdministrativeMap {
    constructor(element, onSelect) {
        this.element = element;
        this.onSelect = onSelect;
        this.units = [];
        this.layers = new Map();
        this.metric = 'type';
        this.selectedKey = null;
        this.options = { boundaries: true, points: true, labels: false };
        this.map = L.map(element, { zoomControl: false, preferCanvas: true, minZoom: 4, maxZoom: 18 })
            .setView([16.1, 106.2], 6);
        L.control.zoom({ position: 'topright', zoomInTitle: 'Phóng to', zoomOutTitle: 'Thu nhỏ' }).addTo(this.map);
        L.control.scale({ position: 'bottomright', imperial: false }).addTo(this.map);
        this.tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }).addTo(this.map);
        let tileErrors = 0;
        this.tiles.on('tileerror', () => {
            if (++tileErrors >= 4) document.querySelector('#tile-notice').hidden = false;
        });
        this.tiles.on('tileload', () => {
            document.querySelector('#tile-notice').hidden = true;
            tileErrors = 0;
        });
        this.boundaries = L.featureGroup().addTo(this.map);
        this.points = L.featureGroup().addTo(this.map);
        this.map.on('mousemove', event => {
            const { lat, lng } = event.latlng;
            document.querySelector('#map-coordinate').textContent = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'B' : 'N'} · ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'Đ' : 'T'}`;
        });
        this.resizeObserver = new ResizeObserver(() => this.map.invalidateSize({ pan: false }));
        this.resizeObserver.observe(element);
    }

    render(units, allUnits, metric, options) {
        this.units = units;
        this.metric = metric;
        this.options = { ...this.options, ...options };
        this.scale = metricScale(allUnits, metric);
        this.boundaries.clearLayers();
        this.points.clearLayers();
        this.layers.clear();

        for (const unit of units) {
            const record = { unit, polygon: null, point: null };
            if (unit.geometry) {
                record.polygon = L.geoJSON(unit.geometry, { style: () => this.style(unit) });
                this.bind(record.polygon, unit);
                if (this.options.boundaries) this.boundaries.addLayer(record.polygon);
            }
            if (hasPoint(unit)) {
                record.point = L.circleMarker([unit.latitude, unit.longitude], this.pointStyle(unit));
                this.bind(record.point, unit, true);
                if (this.options.points) this.points.addLayer(record.point);
            }
            this.layers.set(unit._key, record);
        }
        this.element.dataset.boundaries = this.boundaries.getLayers().length;
        this.element.dataset.points = this.points.getLayers().length;
    }

    bind(layer, unit, isPoint = false) {
        const tooltip = document.createElement('span');
        tooltip.textContent = this.metric === 'type'
            ? `${unit.type ?? ''} ${unit.name}`
            : `${unit.type ?? ''} ${unit.name} · ${formatNumber(unit[this.metric], this.metric === 'population' ? 0 : 1)}`;
        const permanent = this.options.labels && (isPoint || !this.options.points || !hasPoint(unit));
        layer.bindTooltip(tooltip, { permanent, direction: 'center', className: permanent ? 'unit-label' : '', opacity: 1 });
        layer.on('click', () => this.onSelect(unit._key));
        layer.on('mouseover', () => { if (unit._key !== this.selectedKey) layer.setStyle({ weight: 2.4, fillOpacity: .55 }); });
        layer.on('mouseout', () => layer.setStyle(layer instanceof L.CircleMarker ? this.pointStyle(unit) : this.style(unit)));
    }

    style(unit) {
        const selected = unit._key === this.selectedKey;
        return {
            color: selected ? '#405bd7' : this.scale.color(unit),
            fillColor: this.scale.color(unit),
            weight: selected ? 3 : 1.3,
            opacity: 1,
            fillOpacity: selected ? .64 : .36,
            dashArray: unit.boundary_suspect ? '5 4' : null,
        };
    }

    pointStyle(unit) {
        const selected = unit._key === this.selectedKey;
        return { radius: selected ? 8 : unit.geometry ? 4 : 6, color: selected ? '#405bd7' : '#fff', weight: selected ? 2.5 : 1.7, fillColor: this.scale.color(unit), fillOpacity: 1 };
    }

    select(key, zoom = true) {
        clearTimeout(this.focusTimer);
        cancelAnimationFrame(this.pulseFrame);
        this.selectionPulse?.remove();
        this.selectedKey = key;
        for (const [unitKey, { unit, polygon, point }] of this.layers) {
            polygon?.setStyle(this.style(unit));
            point?.setStyle(this.pointStyle(unit));
            point?.setRadius(this.pointStyle(unit).radius);
            if (unitKey === key) {
                polygon?.bringToFront();
                point?.bringToFront();
            }
        }
        const record = this.layers.get(key);
        if (!zoom || !record) return;
        this.focusTimer = setTimeout(() => {
            if (this.selectedKey !== key) return;
            this.map.invalidateSize({ pan: false });
            this.map.stop();
            const { unit, polygon } = record;
            if (polygon && this.options.boundaries) {
                this.map.flyToBounds(polygon.getBounds(), {
                    paddingTopLeft: [30, 85], paddingBottomRight: [30, 115], maxZoom: 14,
                    duration: .65, animate: !reducedMotion.matches,
                });
            } else if (hasPoint(unit)) {
                this.map.flyTo([unit.latitude, unit.longitude], 12, { duration: .65, animate: !reducedMotion.matches });
            }
            this.pulse(unit);
        }, reducedMotion.matches ? 0 : 340);
    }

    pulse(unit) {
        if (reducedMotion.matches || !hasPoint(unit)) return;
        cancelAnimationFrame(this.pulseFrame);
        this.selectionPulse?.remove();
        const pulse = L.circleMarker([unit.latitude, unit.longitude], {
            radius: 9, color: '#6983f2', weight: 2, fill: false, interactive: false,
        }).addTo(this.map);
        this.selectionPulse = pulse;
        const start = performance.now();
        const frame = time => {
            const progress = (time - start) / 1000;
            if (progress >= 1 || reducedMotion.matches) { pulse.remove(); return; }
            pulse.setRadius(9 + 23 * progress);
            pulse.setStyle({ opacity: .75 * (1 - progress) });
            this.pulseFrame = requestAnimationFrame(frame);
        };
        this.pulseFrame = requestAnimationFrame(frame);
    }

    fit() {
        clearTimeout(this.focusTimer);
        const bounds = L.latLngBounds([]);
        for (const { unit, polygon } of this.layers.values()) {
            if (polygon) bounds.extend(polygon.getBounds());
            if (hasPoint(unit)) bounds.extend([unit.latitude, unit.longitude]);
        }
        if (bounds.isValid()) this.map.stop().fitBounds(bounds, { paddingTopLeft: [30, 85], paddingBottomRight: [30, 110], maxZoom: 12, animate: !reducedMotion.matches, duration: .45 });
    }
}
