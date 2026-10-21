<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#f4f7fc">
    <meta name="description" content="Khám phá ranh giới, dân số và thông tin địa lý các đơn vị hành chính Việt Nam trên bản đồ tương tác.">
    <title>Dashboard dữ liệu hành chính | VN Atlas</title>
    <script>
        try {
            document.documentElement.dataset.theme = localStorage.getItem('vn-atlas-theme') || 'light';
        } catch {
            document.documentElement.dataset.theme = 'light';
        }
    </script>
    @vite(['resources/css/app.css', 'resources/js/app.js', 'resources/js/dashboard.js'])
</head>
<body>
    <svg class="icon-library" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <symbol id="i-map" viewBox="0 0 24 24"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15"/></symbol>
        <symbol id="i-pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></symbol>
        <symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></symbol>
        <symbol id="i-layers" viewBox="0 0 24 24"><path d="m12 3 10 5-10 5L2 8l10-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/></symbol>
        <symbol id="i-people" viewBox="0 0 24 24"><circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4m1-17a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2"/></symbol>
        <symbol id="i-area" viewBox="0 0 24 24"><path d="M3 9V3h6m6 0h6v6m0 6v6h-6m-6 0H3v-6M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6"/></symbol>
        <symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 3v18h17M9 16V9m5 7V5m5 11v-4"/></symbol>
        <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M6 18 18 6"/></symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></symbol>
        <symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></symbol>
        <symbol id="i-list" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h1m-1 6h1m-1 6h1"/></symbol>
        <symbol id="i-external" viewBox="0 0 24 24"><path d="M14 3h7v7m0-7L10 14m0-10H3v17h17v-7"/></symbol>
        <symbol id="i-moon" viewBox="0 0 24 24"><path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z"/></symbol>
        <symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></symbol>
        <symbol id="i-expand" viewBox="0 0 24 24"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></symbol>
        <symbol id="i-sparkles" viewBox="0 0 24 24"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4"/></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></symbol>
    </svg>
    <a href="#map-section" class="skip-link">Đến bản đồ</a>
    <div class="app-shell">
        <nav class="navigation-rail" aria-label="Điều hướng chính">
            <a href="#" class="brand-mark" aria-label="VN Atlas trang chủ"><svg class="icon"><use href="#i-layers"/></svg><span>ATLAS</span></a>
            <div class="rail-links">
                <a href="#map-section" class="rail-link active" aria-label="Bản đồ" title="Bản đồ"><svg class="icon"><use href="#i-map"/></svg><span>Bản đồ</span></a>
                <a href="#analysis-section" class="rail-link" aria-label="Phân tích dữ liệu" title="Phân tích dữ liệu"><svg class="icon"><use href="#i-chart"/></svg><span>Phân tích</span></a>
                <a href="#source-info" class="rail-link" aria-label="Nguồn dữ liệu" title="Nguồn dữ liệu"><svg class="icon"><use href="#i-layers"/></svg><span>Dữ liệu</span></a>
            </div>
            <button class="rail-link help-button" id="help-button" data-open-help aria-label="Hướng dẫn sử dụng" title="Hướng dẫn sử dụng"><svg class="icon"><use href="#i-info"/></svg><span>Trợ giúp</span></button>
            <span class="rail-caption">VIỆT NAM</span>
        </nav>
        <div class="workspace">
            <header class="topbar flex items-center justify-between gap-4">
                <a href="#" class="wordmark">VN<span>ATLAS</span><span class="wordmark-divider"></span><span class="wordmark-subtitle">Bản đồ &amp; dữ liệu hành chính</span></a>
                <div class="topbar-right flex items-center gap-4"><span class="live-badge"><span></span><span id="province-count">34 tỉnh, thành</span></span><button id="theme-toggle" class="theme-toggle" aria-label="Chuyển sang giao diện tối" aria-pressed="false"><svg class="icon"><use href="#i-moon"/></svg><span id="theme-label">Chế độ tối</span></button><button class="icon-button mobile-help" data-open-help aria-label="Hướng dẫn sử dụng"><svg class="icon"><use href="#i-info"/></svg></button></div>
            </header>
            <main class="main-content">
                <section class="page-heading flex flex-wrap items-center justify-between gap-4" data-reveal>
                    <div class="hero-copy"><p class="eyebrow"><svg class="icon"><use href="#i-sparkles"/></svg>KHÁM PHÁ KHÔNG GIAN DỮ LIỆU</p><h1>Mỗi vùng đất.<br><span>Một góc nhìn mới.</span></h1><p class="page-description">Kết nối địa lý, con người và những câu chuyện qua từng tọa độ.</p></div>
                    <div class="hero-actions"><span class="hero-coordinate"><svg class="icon"><use href="#i-pin"/></svg>VIỆT NAM · KHÔNG GIAN ĐỊA LÝ</span><a href="#map-section" class="button button-primary">Khám phá bản đồ<svg class="icon"><use href="#i-arrow"/></svg></a><button id="export-button" class="button button-white" disabled><svg class="icon"><use href="#i-download"/></svg>Xuất GeoJSON</button></div>
                </section>
                <section class="stats-grid grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Tổng quan tỉnh thành">
                    <article class="stat-card"><span class="stat-icon green"><svg class="icon"><use href="#i-map"/></svg></span><div><p>Đơn vị hành chính</p><strong id="stat-units">—</strong><span id="stat-types" class="stat-caption">Đang tải dữ liệu</span></div></article>
                    <article class="stat-card"><span class="stat-icon blue"><svg class="icon"><use href="#i-people"/></svg></span><div><p>Dân số trong dữ liệu</p><strong id="stat-population">—</strong><span id="stat-population-note" class="stat-caption">người</span></div></article>
                    <article class="stat-card"><span class="stat-icon amber"><svg class="icon"><use href="#i-area"/></svg></span><div><p>Diện tích trong dữ liệu</p><strong id="stat-area">—</strong><span id="stat-area-note" class="stat-caption">km²</span></div></article>
                    <article class="stat-card"><span class="stat-icon violet"><svg class="icon"><use href="#i-layers"/></svg></span><div><p>Độ phủ ranh giới</p><strong id="stat-coverage">—</strong><span id="stat-coverage-note" class="stat-caption">đơn vị có ranh giới</span></div></article>
                </section>
                <section id="map-section" class="explorer-card" aria-label="Khám phá bản đồ hành chính">
                    <div class="explorer-toolbar flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-3"><span class="section-icon"><svg class="icon"><use href="#i-map"/></svg></span><div><div class="map-title-line"><h2 id="province-title">Bản đồ hành chính</h2><span class="interactive-badge">Tương tác trực tiếp</span></div><p id="summary">Chọn tỉnh, thành để bắt đầu khám phá</p></div></div>
                        <div class="map-toolbar-actions flex flex-wrap items-center gap-2"><button id="directory-toggle" class="button button-small directory-toggle" aria-expanded="true" aria-controls="directory"><svg class="icon"><use href="#i-list"/></svg><span>Danh sách</span></button><button id="compare-button" class="button button-small" disabled><svg class="icon"><use href="#i-chart"/></svg>Thêm so sánh</button><button id="fit-button" class="button button-small" disabled><svg class="icon"><use href="#i-area"/></svg>Vừa khung</button><button id="focus-toggle" class="icon-button focus-toggle" aria-label="Mở rộng bản đồ" aria-pressed="false" title="Mở rộng bản đồ"><svg class="icon"><use href="#i-expand"/></svg></button></div>
                    </div>
                    <div class="explorer-body">
                        <aside id="directory" class="directory" aria-label="Tìm đơn vị hành chính">
                            <div class="directory-filters">
                                <label class="field-label" for="province-select">TỈNH / THÀNH PHỐ</label>
                                <select id="province-select" class="province-select" disabled><option value="">Đang tải danh sách…</option></select>
                                <div class="search-field"><svg class="icon"><use href="#i-search"/></svg><input id="unit-search" type="search" placeholder="Tìm tên, mã đơn vị…" aria-label="Tìm tên hoặc mã đơn vị" autocomplete="off" disabled><kbd>/</kbd></div>
                                <div id="type-filters" class="type-filters" role="group" aria-label="Lọc loại đơn vị"><button class="filter-chip selected" data-type="" aria-pressed="true">Tất cả</button><button class="filter-chip" data-type="Xã" aria-pressed="false">Xã</button><button class="filter-chip" data-type="Phường" aria-pressed="false">Phường</button><button class="filter-chip" data-type="Đặc khu" aria-pressed="false">Đặc khu</button></div>
                                <div class="directory-list-heading"><span>ĐƠN VỊ HÀNH CHÍNH</span><span id="result-count">—</span></div>
                                <div class="list-sort"><label for="unit-sort" class="sr-only">Sắp xếp danh sách</label><select id="unit-sort"><option value="source">Thứ tự mặc định</option><option value="name">Tên: A → Z</option><option value="population">Dân số cao nhất</option><option value="area_km2">Diện tích lớn nhất</option></select><button id="clear-filters" class="text-button" hidden>Xóa lọc</button></div>
                            </div>
                            <div id="unit-list" class="unit-list"><p class="empty-state">Đang chuẩn bị bản đồ…</p></div>
                            <div class="directory-footer"><span class="status-dot"></span><p id="status" role="status" aria-live="polite">Đang tải dữ liệu…</p><button id="retry-button" hidden class="text-button">Thử lại</button></div>
                        </aside>
                        <div class="map-zone">
                            <div id="administrative-map" class="map-canvas map-muted" role="region" aria-label="Bản đồ tương tác đơn vị hành chính" tabindex="0"></div>
                            <div class="map-tools">
                                <div class="metric-control"><svg class="icon"><use href="#i-layers"/></svg><label for="metric-select" class="sr-only">Tô màu bản đồ theo</label><select id="metric-select"><option value="type">Loại đơn vị</option><option value="population">Dân số</option><option value="area_km2">Diện tích</option><option value="density">Mật độ dân số</option></select></div>
                                <details class="layer-control"><summary><svg class="icon"><use href="#i-layers"/></svg><span>Lớp bản đồ</span></summary><div class="layer-options"><label><input id="show-boundaries" type="checkbox" checked>Ranh giới hành chính</label><label><input id="show-points" type="checkbox" checked>Điểm tọa độ</label><label><input id="show-labels" type="checkbox">Tên đơn vị</label><label><input id="muted-basemap" type="checkbox" checked>Nền bản đồ dịu màu</label></div></details>
                            </div>
                            <div id="map-loading" class="map-loading"><div class="loading-orbit"><svg class="icon"><use href="#i-map"/></svg></div><p>Đang kết nối những vùng đất…</p><span>Chuẩn bị ranh giới và dữ liệu địa phương</span></div>
                            <div id="tile-notice" class="tile-notice" role="status" hidden>Chưa tải được bản đồ nền. Ranh giới và tọa độ vẫn có thể xem.</div>
                            <div id="map-legend" class="map-legend" aria-label="Chú giải bản đồ"></div>
                            <div class="map-coordinate" id="map-coordinate" aria-hidden="true">VIỆT NAM · WGS 84</div>
                            <aside id="unit-detail" class="detail-panel" aria-label="Thông tin đơn vị được chọn" hidden></aside>
                        </div>
                    </div>
                </section>
                <section id="analysis-section" class="analysis-card" data-reveal>
                    <div class="analysis-heading flex flex-wrap items-center justify-between gap-3"><div class="analysis-heading-copy"><span class="section-icon"><svg class="icon"><use href="#i-chart"/></svg></span><div><p class="eyebrow">HIỂU HƠN QUA DỮ LIỆU</p><h2>Nhìn sâu vào từng vùng đất</h2></div></div><div class="analysis-tabs" role="group" aria-label="Chế độ xem dữ liệu"><button class="selected" data-view="chart" aria-pressed="true"><svg class="icon"><use href="#i-chart"/></svg>Biểu đồ</button><button data-view="table" aria-pressed="false"><svg class="icon"><use href="#i-list"/></svg>Bảng dữ liệu</button></div></div>
                    <div id="comparison-chips" class="comparison-chips"></div>
                    <div id="chart-view"><div class="chart-heading"><h3 id="chart-title">10 đơn vị có dân số cao nhất</h3><label for="chart-metric" class="sr-only">Chỉ số biểu đồ</label><select id="chart-metric"><option value="population">Dân số</option><option value="area_km2">Diện tích (km²)</option><option value="density">Mật độ (người/km²)</option></select></div><div class="chart-container"><canvas id="units-chart" aria-label="Biểu đồ thống kê đơn vị hành chính" role="img"></canvas></div><p id="chart-empty" class="empty-state" hidden>Chưa có số liệu cho lựa chọn này.</p></div>
                    <div id="table-view" class="table-wrapper" hidden><table><thead><tr><th>Đơn vị</th><th>Loại</th><th>Dân số</th><th>Diện tích (km²)</th><th>Mật độ</th><th>Ranh giới</th><th></th></tr></thead><tbody id="units-table"></tbody></table></div>
                </section>
                <footer id="source-info" class="page-footer"><div><span class="footer-brand"><svg class="icon"><use href="#i-layers"/></svg>VN ATLAS</span><span>Địa lý gần hơn. Dữ liệu rõ hơn.</span></div><details class="source-details"><summary>Nguồn &amp; ghi chú dữ liệu <svg class="icon"><use href="#i-info"/></svg></summary><div><p>Ranh giới và tọa độ được hiển thị theo các tệp dữ liệu tỉnh, thành. Số liệu thiếu được giữ nguyên; tổng số chỉ tính các đơn vị có dữ liệu.</p><a id="source-link" target="_blank" rel="noopener noreferrer" hidden>Xem nguồn dữ liệu ↗</a><p id="source-note"></p></div></details></footer>
            </main>
        </div>
    </div>
    <div id="toast" class="toast" role="status" hidden><span class="toast-icon"><svg class="icon"><use href="#i-check"/></svg></span><p id="toast-message"></p><button id="toast-close" class="icon-button" aria-label="Đóng thông báo"><svg class="icon"><use href="#i-close"/></svg></button></div>
    <dialog id="help-dialog" class="help-dialog"><div class="flex items-center justify-between"><p class="eyebrow">CHÀO MỪNG ĐẾN VN ATLAS</p><button id="close-help" class="icon-button" aria-label="Đóng hướng dẫn"><svg class="icon"><use href="#i-close"/></svg></button></div><h2>Khám phá bản đồ theo cách của bạn.</h2><ol><li>Chọn tỉnh, thành và tìm đơn vị trong danh sách. Có thể tìm không dấu hoặc bằng mã định danh.</li><li>Chạm vào ranh giới, điểm tọa độ hoặc tên đơn vị để xem thông tin chi tiết.</li><li>Đổi cách tô màu theo dân số, diện tích hoặc mật độ. Bật và tắt các lớp trong “Lớp bản đồ”.</li><li>Thêm các tỉnh vào so sánh hoặc tải GeoJSON của kết quả đang lọc.</li></ol><p class="help-note">Các đơn vị chưa có ranh giới được biểu diễn bằng điểm tọa độ. Ranh giới được nguồn đánh dấu cần kiểm tra có nét đứt.</p><button id="start-exploring" class="button button-primary">Bắt đầu khám phá<svg class="icon"><use href="#i-arrow"/></svg></button></dialog>
    <noscript><p class="noscript-notice">Vui lòng bật JavaScript để xem bản đồ và tìm kiếm dữ liệu hành chính.</p></noscript>
</body>
</html>
