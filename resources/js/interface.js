export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const ease = 'cubic-bezier(.22,1,.36,1)';

export function animateIn(element, { distance = 10, duration = 340, delay = 0 } = {}) {
    if (!element || reducedMotion.matches || !element.animate) return;
    for (const animation of element.getAnimations()) {
        if (animation.id === 'atlas-enter') animation.cancel();
    }
    return element.animate([
        { opacity: 0, transform: `translateY(${distance}px)` },
        { opacity: 1, transform: 'translateY(0)' },
    ], { id: 'atlas-enter', duration, delay, easing: ease });
}

export function animateNumber(element, value, digits = 0, suffix = '') {
    cancelAnimationFrame(element.counterFrame);
    const format = number => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(number) + suffix;
    const previous = Number(element.dataset.value ?? 0);
    element.dataset.value = value ?? '';
    const final = typeof value === 'number' && Number.isFinite(value) ? format(value) : '—';
    element.setAttribute('aria-label', final);
    if (reducedMotion.matches || value === null || !Number.isFinite(value) || previous === value) {
        element.textContent = final;
        return;
    }
    const start = performance.now();
    const frame = time => {
        const progress = reducedMotion.matches ? 1 : Math.min((time - start) / 650, 1);
        const eased = 1 - (1 - progress) ** 4;
        element.textContent = format(previous + (value - previous) * eased);
        if (progress < 1) element.counterFrame = requestAnimationFrame(frame);
        else element.textContent = final;
    };
    element.counterFrame = requestAnimationFrame(frame);
}

let toastTimer;
export function notify(message) {
    const toast = document.querySelector('#toast');
    document.querySelector('#toast-message').textContent = message;
    clearTimeout(toastTimer);
    toast.hidden = false;
    animateIn(toast, { distance: 12 });
    toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
}

export function initializeInterface() {
    const root = document.documentElement;
    const themeButton = document.querySelector('#theme-toggle');
    const syncTheme = () => {
        const dark = root.dataset.theme === 'dark';
        themeButton.setAttribute('aria-pressed', String(dark));
        themeButton.setAttribute('aria-label', `Chuyển sang giao diện ${dark ? 'sáng' : 'tối'}`);
        document.querySelector('#theme-label').textContent = dark ? 'Chế độ sáng' : 'Chế độ tối';
        themeButton.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
        document.querySelector('meta[name="theme-color"]').content = dark ? '#0d1424' : '#f4f7fc';
    };
    syncTheme();
    themeButton.addEventListener('click', () => {
        root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem('vn-atlas-theme', root.dataset.theme); } catch { /* Storage may be unavailable. */ }
        syncTheme();
        document.dispatchEvent(new Event('atlas:theme-change'));
    });
    document.querySelector('#toast-close').addEventListener('click', () => {
        clearTimeout(toastTimer);
        document.querySelector('#toast').hidden = true;
    });
    const revealObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            animateIn(entry.target, { distance: 14, duration: 650 });
            revealObserver.unobserve(entry.target);
        }
    }, { threshold: .08 });
    for (const section of document.querySelectorAll('[data-reveal]')) revealObserver.observe(section);
    const links = [...document.querySelectorAll('.rail-links a')];
    const activateLink = link => {
        for (const item of links) {
            const selected = item === link;
            item.classList.toggle('active', selected);
            if (selected) item.setAttribute('aria-current', 'location');
            else item.removeAttribute('aria-current');
        }
    };
    let navigationFrame;
    const syncNavigation = () => {
        let active = links[0];
        if (!document.body.classList.contains('map-focused')) {
            for (const link of links) {
                const section = document.querySelector(link.hash);
                if (section && section.getBoundingClientRect().top <= innerHeight * .4) active = link;
            }
        }
        activateLink(active);
    };
    const scheduleNavigation = () => {
        cancelAnimationFrame(navigationFrame);
        navigationFrame = requestAnimationFrame(syncNavigation);
    };
    for (const link of links) {
        link.addEventListener('click', () => activateLink(link));
    }
    window.addEventListener('scroll', scheduleNavigation, { passive: true });
    window.addEventListener('resize', scheduleNavigation, { passive: true });
    document.addEventListener('atlas:layout-change', scheduleNavigation);
    syncNavigation();
    document.addEventListener('click', event => {
        if (reducedMotion.matches) return;
        const button = event.target.closest('.button, .icon-button, .filter-chip, .analysis-tabs button, .theme-toggle, .unit-card');
        if (!button || button.disabled || !button.animate) return;
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'press-ripple';
        ripple.setAttribute('aria-hidden', 'true');
        ripple.style.left = `${event.detail ? event.clientX - rect.left : rect.width / 2}px`;
        ripple.style.top = `${event.detail ? event.clientY - rect.top : rect.height / 2}px`;
        button.append(ripple);
        const animation = ripple.animate([{ transform: 'scale(0)', opacity: .14 }, { transform: 'scale(2.2)', opacity: 0 }], { id: 'atlas-ripple', duration: 600, easing: 'ease-out' });
        animation.finished.then(() => ripple.remove(), () => ripple.remove());
    });
    reducedMotion.addEventListener('change', event => {
        if (event.matches) {
            for (const animation of document.getAnimations()) {
                if (animation.id.startsWith('atlas-')) animation.cancel();
            }
        }
    });
}
