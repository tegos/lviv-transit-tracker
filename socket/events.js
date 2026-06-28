'use strict';

// Socket.IO event names, shared by the server (socket/index.js) and the
// bundled client (src/). Single source of truth so the wire protocol can't
// drift between the two sides.
const SocketEvents = Object.freeze({
    // client -> server
    ROUTE_SUBSCRIBE: 'route:subscribe',
    ROUTE_UNSUBSCRIBE: 'route:unsubscribe',
    // server -> client
    ROUTE_PATH: 'route:path',
    VEHICLES_UPDATE: 'vehicles:update',
});

module.exports = SocketEvents;
