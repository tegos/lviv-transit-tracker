'use strict';

// Tracks which routes each connected client is subscribed to.
// socketId -> Set<routeCode>. activeRoutes() is derived, so it shrinks
// automatically on remove/disconnect (no zombie route list).
function createRegistry() {
    const clients = new Map();

    return {
        add(socketId, route) {
            if (!clients.has(socketId)) clients.set(socketId, new Set());
            clients.get(socketId).add(route);
        },
        remove(socketId, route) {
            clients.get(socketId)?.delete(route);
        },
        count(socketId) {
            return clients.get(socketId)?.size ?? 0;
        },
        has(socketId, route) {
            return clients.get(socketId)?.has(route) ?? false;
        },
        disconnect(socketId) {
            clients.delete(socketId);
        },
        activeRoutes() {
            return new Set([...clients.values()].flatMap((set) => [...set]));
        },
        subscribersOf(route) {
            return new Set(
                [...clients].filter(([, set]) => set.has(route)).map(([id]) => id)
            );
        },
    };
}

module.exports = createRegistry;
