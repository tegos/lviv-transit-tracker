import { io } from 'socket.io-client';
import { createMap, MapUtil } from './map.js';
import { installMarkerAnimate } from './markerAnimate.js';
import { handleVehiclesUpdate, handleRoutePath, clearRoute } from './events.js';
import Events from '../socket/events.js';

let mapUtil = null;

// Called by the Google Maps script once the API has loaded.
window.initMap = function () {
    installMarkerAnimate();

    const mapEl = document.getElementById('map');
    if (!mapEl) return; // pages without a map (e.g. /about)

    const map = createMap(mapEl, {
        zoom: 15,
        center: { lat: 49.802829, lng: 24.00145 },
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        disableDefaultUI: true,
    });
    mapUtil = new MapUtil(map);
};

function loadGoogleMaps(key) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=initMap&loading=async`;
    script.async = true;
    document.head.appendChild(script);
}

function wireRouteToggles(socket) {
    document.querySelectorAll('#route_stops input').forEach((input) => {
        input.addEventListener('change', () => {
            const routeCode = input.value;
            const row = input.closest('.route-row');
            if (input.checked) {
                if (row) row.classList.add('loading');
                socket.emit(Events.ROUTE_SUBSCRIBE, routeCode, (res) => {
                    if (res && !res.ok) {
                        console.error(`${Events.ROUTE_SUBSCRIBE} failed:`, res.error);
                        input.checked = false;
                        if (row) row.classList.remove('loading');
                    }
                });
            } else {
                socket.emit(Events.ROUTE_UNSUBSCRIBE, routeCode);
                if (mapUtil) clearRoute(mapUtil, routeCode);
            }
        });
    });
}

// Clears the loading spinner for a route once its first data arrives.
function clearLoading(routeCode) {
    const row = document.querySelector(`.route-row[data-code="${CSS.escape(String(routeCode))}"]`);
    if (row) row.classList.remove('loading');
}

// Client-side filter of the route sidebar by name or code.
function wireRouteSearch() {
    const search = document.getElementById('route-search');
    const list = document.getElementById('route_stops');
    if (!search || !list) return;

    let emptyEl = null;
    const showEmpty = (visible) => {
        if (!emptyEl) {
            emptyEl = document.createElement('div');
            emptyEl.className = 'route-empty';
            emptyEl.textContent = 'Маршрутів не знайдено';
            list.append(emptyEl);
        }
        emptyEl.style.display = visible === 0 ? '' : 'none';
    };

    search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        let visible = 0;
        list.querySelectorAll('.route-row').forEach((row) => {
            const name = (row.dataset.name || '').toLowerCase();
            const code = (row.dataset.code || '').toLowerCase();
            const show = !q || name.includes(q) || code.includes(q);
            row.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        showEmpty(visible);
    });
}

// Native horizontal-swipe handling for the route sidebar (replaces HammerJS).
function wireMenuSwipe() {
    const menu = document.getElementById('menu');
    if (!menu) return;

    const SWIPE_THRESHOLD = 40; // px
    let startX = 0;
    let startY = 0;

    menu.addEventListener('touchstart', (e) => {
        const touch = e.changedTouches[0];
        startX = touch.clientX;
        startY = touch.clientY;
    }, { passive: true });

    menu.addEventListener('touchend', (e) => {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return; // not a horizontal swipe
        menu.style.left = `${menu.offsetLeft + (dx < 0 ? -100 : 100)}px`;
    }, { passive: true });
}

// Replaces Bootstrap 3's jQuery-based collapse for the navbar toggle.
function wireNavbarToggle() {
    const toggle = document.querySelector('.navbar-toggle');
    const target = document.getElementById('navbar');
    if (!toggle || !target) return;
    toggle.addEventListener('click', () => {
        const open = target.classList.toggle('in');
        toggle.setAttribute('aria-expanded', String(open));
    });
}

// Re-subscribes every checked route. Runs on every (re)connect: the server
// tracks subscriptions per socket.id and purges them on disconnect, so without
// this a reconnect (deploy, network blip) leaves checkboxes checked while the
// map silently stops updating.
function resubscribeChecked(socket) {
    document.querySelectorAll('#route_stops input:checked').forEach((input) => {
        const row = input.closest('.route-row');
        if (row) row.classList.add('loading');
        socket.emit(Events.ROUTE_SUBSCRIBE, input.value, (res) => {
            if (res && !res.ok) {
                console.error(`${Events.ROUTE_SUBSCRIBE} failed:`, res.error);
                input.checked = false;
                if (row) row.classList.remove('loading');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const config = document.getElementById('app-config');
    const mapsKey = config ? config.dataset.mapsKey : '';

    const socket = io();

    // On reconnect the old map state is stale and the server has no record of
    // our subscriptions: clear what's drawn, then re-subscribe the checked
    // routes. The first connect is a no-op clear with nothing checked yet.
    let connectedBefore = false;
    socket.on('connect', () => {
        if (connectedBefore && mapUtil) {
            mapUtil.deleteMarkers();
            mapUtil.clearPaths();
        }
        connectedBefore = true;
        resubscribeChecked(socket);
    });

    socket.on(Events.VEHICLES_UPDATE, (vehicles, routeCode) => {
        clearLoading(routeCode);
        if (mapUtil) handleVehiclesUpdate(mapUtil, vehicles, routeCode);
    });
    socket.on(Events.ROUTE_PATH, (data) => {
        clearLoading(data.routeCode);
        if (mapUtil) handleRoutePath(mapUtil, data);
    });

    wireRouteToggles(socket);
    wireRouteSearch();
    wireMenuSwipe();
    wireNavbarToggle();

    if (mapsKey) loadGoogleMaps(mapsKey);
});
