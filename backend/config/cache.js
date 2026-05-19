/**
 * Simple in-memory cache with TTL support
 * Drop-in replacement for Redis for local development without Redis installed.
 * In production, swap this with ioredis.
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlSeconds = 30) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
    // Auto-cleanup
    setTimeout(() => this.store.delete(key), ttlSeconds * 1000);
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  del(key) {
    this.store.delete(key);
  }

  has(key) {
    const val = this.get(key);
    return val !== null;
  }
}

const cache = new MemoryCache();
module.exports = cache;
