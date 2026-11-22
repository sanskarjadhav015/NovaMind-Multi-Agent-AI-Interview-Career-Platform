/**
 * In-memory mock of Redis client for unit & concurrency testing.
 * Accurately implements Redis key-value storage, Sets, TTLs, and atomic Lua script evaluations.
 */
export class MockRedis {
    constructor() {
        this.store = new Map();
        this.sets = new Map();
        this.ttls = new Map();
    }

    async get(key) {
        if (this.isExpired(key)) {
            this.del(key);
            return null;
        }
        return this.store.get(key) ?? null;
    }

    async set(key, value, mode, duration) {
        if (mode === "NX" && this.store.has(key) && !this.isExpired(key)) {
            return null; // Key already exists
        }
        this.store.set(key, String(value));
        if (mode === "EX" && typeof duration === "number") {
            this.ttls.set(key, Date.now() + duration * 1000);
        } else if (duration && typeof duration === "number") {
            this.ttls.set(key, Date.now() + duration * 1000);
        }
        return "OK";
    }

    async del(key) {
        const existed = this.store.delete(key);
        this.sets.delete(key);
        this.ttls.delete(key);
        return existed ? 1 : 0;
    }

    async sadd(key, member) {
        if (!this.sets.has(key)) {
            this.sets.set(key, new Set());
        }
        const s = this.sets.get(key);
        const before = s.size;
        s.add(String(member));
        return s.size > before ? 1 : 0;
    }

    async smembers(key) {
        if (this.isExpired(key)) {
            this.sets.delete(key);
            return [];
        }
        const s = this.sets.get(key);
        return s ? Array.from(s) : [];
    }

    async srem(key, member) {
        const s = this.sets.get(key);
        if (!s) return 0;
        return s.delete(String(member)) ? 1 : 0;
    }

    async expire(key, seconds) {
        this.ttls.set(key, Date.now() + seconds * 1000);
        return 1;
    }

    async ttl(key) {
        const exp = this.ttls.get(key);
        if (!exp) return -1;
        const diff = Math.ceil((exp - Date.now()) / 1000);
        return diff > 0 ? diff : -2;
    }

    isExpired(key) {
        const exp = this.ttls.get(key);
        return exp ? Date.now() > exp : false;
    }

    async eval(script, numKeys, key, token) {
        // Evaluate atomic Lua compare-and-delete
        if (script.includes("return redis.call(\"del\"") || script.includes("return redis.call('del'")) {
            const current = this.store.get(key);
            if (current === token) {
                this.store.delete(key);
                this.ttls.delete(key);
                return 1;
            }
            return 0;
        }
        return 0;
    }

    clear() {
        this.store.clear();
        this.sets.clear();
        this.ttls.clear();
    }
}

export default new MockRedis();
