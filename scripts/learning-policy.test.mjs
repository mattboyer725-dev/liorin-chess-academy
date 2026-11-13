import test from "node:test";
import assert from "node:assert/strict";
import { LocalPolicy } from "../src/lib/learning/policy.mjs";

const storage = () => {
  const values = new Map();
  return {
    getItem: (k) => values.get(k),
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
  };
};
test("off by default, catalog bounded, invalid rewards rejected", () => {
  const p = new LocalPolicy("test", ["a", "b"]);
  assert.equal(p.choose(["a"]), null);
  p.setEnabled(true);
  assert.equal(p.choose(["unknown"]), null);
  assert.equal(p.expose("unknown"), null);
  const r = p.expose("a");
  assert.equal(p.reward(r, NaN), false);
  assert.equal(p.reward(r, 1), true);
  assert.equal(p.reward(r, 1), false);
  assert.equal(p.scores.a.q, 0.2);
});
test("learns from explicit reward, prioritizes unseen then preferred arms", () => {
  const p = new LocalPolicy("test", ["a", "b"], null, () => 0.5);
  p.setEnabled(true);
  p.reward(p.expose("a"), -1);
  assert.equal(p.choose(["a", "b"]), "b");
  p.reward(p.expose("b"), 1);
  assert.equal(p.choose(["a", "b"]), "b");
});
test("persists aggregates but not receipts; separate projects stay isolated", () => {
  const s = storage();
  const p = new LocalPolicy("liorin", ["a"], s);
  p.setEnabled(true);
  p.reward(p.expose("a"), 1);
  const q = new LocalPolicy("liorin", ["a"], s);
  assert.equal(q.count, 1);
  assert.equal(q.reward(1, 1), false);
  assert.equal(new LocalPolicy("orgone", ["a"], s).count, 0);
  q.forget();
  assert.equal(s.getItem("liorin"), undefined);
});
test("disable invalidates outstanding feedback", () => {
  const p = new LocalPolicy("test", ["a"]);
  p.setEnabled(true);
  const receipt = p.expose("a");
  p.setEnabled(false);
  assert.equal(p.reward(receipt, 1), false);
  p.setEnabled(true);
  assert.equal(p.reward(receipt, 1), false);
});
test("corrupt or blocked storage fails safely", () => {
  const s = storage();
  s.setItem("test", "{broken");
  assert.equal(new LocalPolicy("test", ["a"], s).enabled, false);
  const blocked = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("blocked");
    },
    removeItem() {
      throw Error("blocked");
    },
  };
  const p = new LocalPolicy("test", ["a"], blocked);
  p.setEnabled(true);
  assert.equal(p.reward(p.expose("a"), -1), true);
  assert.equal(p.persistent, false);
  assert.equal(p.forget(), false);
});
test("all score updates stay bounded and storage excludes events", () => {
  const s = storage();
  const p = new LocalPolicy("test", ["a"], s);
  p.setEnabled(true);
  for (let i = 0; i < 100; i++) p.reward(p.expose("a"), 1);
  assert.ok(p.scores.a.q <= 1);
  assert.deepEqual(Object.keys(JSON.parse(s.getItem("test"))).sort(), [
    "enabled",
    "scores",
    "version",
  ]);
});
