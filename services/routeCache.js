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
            } catch (err) {
                // Serve-stale-on-error: a brief upstream outage shouldn't take
                // the page down when a slightly-stale list is still in memory.
                // Only propagate when there's no previously-good value to fall
                // back to (cold cache).
                if (value !== null) return value;
                throw err;
            } finally {
                inFlight = null;
            }
        },
    };
}

module.exports = createCache;
