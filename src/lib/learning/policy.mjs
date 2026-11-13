/**
 * Bounded explicit-feedback bandit. No network, timers, or implicit rewards.
 * Each app owns a separate key, catalog and copy of this module.
 */
export class LocalPolicy {
  constructor(key, catalog, storage = null, random = Math.random) {
    this.key = key;
    this.catalog = [...new Set(catalog)];
    this.storage = storage;
    this.random = random;
    this.enabled = false;
    this.scores = {};
    this.pending = new Map();
    this.serial = 0;
    this.persistent = Boolean(storage);
    try {
      const raw = storage?.getItem(key);
      if (raw && raw.length < 20000) {
        const data = JSON.parse(raw);
        if (data.version === 1 && typeof data.enabled === "boolean") {
          this.enabled = data.enabled;
          for (const id of this.catalog) {
            const s = data.scores?.[id];
            if (
              s &&
              Number.isFinite(s.q) &&
              s.q >= -1 &&
              s.q <= 1 &&
              Number.isSafeInteger(s.n) &&
              s.n >= 0 &&
              s.n <= 1000000
            ) {
              this.scores[id] = { q: s.q, n: s.n };
            }
          }
        }
      }
    } catch {
      // Corrupt data never opts a user in; unavailable storage is memory-only.
      this.enabled = false;
      this.persistent = false;
    }
  }
  save() {
    if (!this.persistent) return;
    try {
      this.storage.setItem(
        this.key,
        JSON.stringify({
          version: 1,
          enabled: this.enabled,
          scores: this.scores,
        }),
      );
    } catch {
      this.persistent = false;
    }
  }
  setEnabled(enabled) {
    this.enabled = enabled === true;
    this.pending.clear();
    this.save();
  }
  choose(candidates) {
    if (!this.enabled) return null;
    const allowed = [...new Set(candidates)].filter((id) =>
      this.catalog.includes(id),
    );
    if (!allowed.length) return null;
    const unseen = allowed.filter((id) => !this.scores[id]?.n);
    let pool = unseen;
    if (!pool.length) {
      if (this.random() < 0.1) pool = allowed;
      else {
        const best = Math.max(...allowed.map((id) => this.scores[id]?.q ?? 0));
        pool = allowed.filter((id) => (this.scores[id]?.q ?? 0) === best);
      }
    }
    const draw = Math.max(0, Math.min(0.999999, this.random()));
    return pool[Math.floor(draw * pool.length)];
  }
  expose(id) {
    if (!this.enabled || !this.catalog.includes(id)) return null;
    const receipt = ++this.serial;
    this.pending.set(receipt, id);
    // Bounded session-only receipts. No historical user events are retained.
    if (this.pending.size > 64)
      this.pending.delete(this.pending.keys().next().value);
    return receipt;
  }
  reward(receipt, value) {
    if (!this.enabled || (value !== -1 && value !== 1)) return false;
    const id = this.pending.get(receipt);
    if (!id) return false;
    this.pending.delete(receipt);
    const old = this.scores[id] ?? { q: 0, n: 0 };
    this.scores[id] = {
      q: old.q + 0.2 * (value - old.q),
      n: Math.min(1000000, old.n + 1),
    };
    this.save();
    return true;
  }
  forget() {
    this.enabled = false;
    this.scores = {};
    this.pending.clear();
    try {
      this.storage?.removeItem(this.key);
      return true;
    } catch {
      this.persistent = false;
      return false;
    }
  }
  get count() {
    return Object.values(this.scores).reduce((sum, s) => sum + s.n, 0);
  }
}
