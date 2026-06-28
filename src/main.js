import { io } from 'socket.io-client';
import Hammer from 'hammerjs';
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

    document.querySelectorAll('.clear-marker').forEach((el) => {
        el.addEventListener('click', () => mapUtil.deleteMarkers());
    });
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
            if (input.checked) {
                socket.emit(Events.ROUTE_SUBSCRIBE, routeCode, (res) => {
                    if (res && !res.ok) {
                        console.error(`${Events.ROUTE_SUBSCRIBE} failed:`, res.error);
                        input.checked = false;
                    }
                });
            } else {
                socket.emit(Events.ROUTE_UNSUBSCRIBE, routeCode);
                if (mapUtil) clearRoute(mapUtil, routeCode);
            }
        });
    });
}

function wireMenuSwipe() {
    const menu = document.getElementById('menu');
    if (!menu) return;
    const hammer = new Hammer.Manager(menu);
    hammer.add(new Hammer.Swipe());
    hammer.on('swipeleft', () => { menu.style.left = `${menu.offsetLeft - 100}px`; });
    hammer.on('swiperight', () => { menu.style.left = `${menu.offsetLeft + 100}px`; });
}

// Replaces Bootstrap 3's jQuery-based collapse for the navbar toggle.
function wireNavbarToggle() {
    const toggle = document.querySelector('.navbar-toggle');
    const target = document.getElementById('navbar');
    if (!toggle || !target) return;
    toggle.addEventListener('click', () => target.classList.toggle('in'));
}

document.addEventListener('DOMContentLoaded', () => {
    const config = document.getElementById('app-config');
    const mapsKey = config ? config.dataset.mapsKey : '';

    const socket = io();
    socket.on(Events.VEHICLES_UPDATE, (vehicles, routeCode) => {
        if (mapUtil) handleVehiclesUpdate(mapUtil, vehicles, routeCode);
    });
    socket.on(Events.ROUTE_PATH, (data) => { if (mapUtil) handleRoutePath(mapUtil, data); });

    wireRouteToggles(socket);
    wireMenuSwipe();
    wireNavbarToggle();

    if (mapsKey) loadGoogleMaps(mapsKey);
});
