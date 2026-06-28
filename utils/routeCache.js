'use strict';

// Small in-memory TTL cache for the large route list (~5.4MB) that GET /
// and GET /json fetch on every request. Concurrent callers share a single
// in-flight fetch so a cold cache under load only hits the API once.
function createCache({ ttl = 5 * 60 * 1000, now = Date.now } = {}) {
    let value = null;
    let storedAt = 0;
    let inFlight = null;

    return {
        async get(fetchFn) {
            if (value !== null && now() - storedAt < ttl) {
                return value;
            }
            if (inFlight) {
                return inFlight;
            }
            inFlight = (async () => {
                const result = await fetchFn();
                value = result;
                storedAt = now();
                return result;
            })();
            try {
                return await inFlight;
            } finally {
                inFlight = null;
            }
        },
    };
}

module.exports = createCache;
