"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../src/logic.js");

// Deterministic RNG (mulberry-ish LCG) for tests.
function seeded(seed) {
  let s = seed >>> 0;
  return (max) => { s = (s * 1664525 + 1013904223) >>> 0; return Math.floor((s / 4294967296) * max); };
}

test("parsePattern reads prefix, separator and X run", () => {
  const p = L.parsePattern("SPRING-XXXXXX");
  assert.equal(p.prefix, "SPRING");
  assert.equal(p.separator, "-");
  assert.equal(p.randomLength, 6);
});

test("parsePattern supports {random:n} token form", () => {
  const p = L.parsePattern("VIP{random:8}");
  assert.equal(p.prefix, "VIP");
  assert.equal(p.randomLength, 8);
});

test("unambiguous charset excludes confusable characters", () => {
  const cs = L.CHARSETS.unambiguous;
  for (const bad of ["0", "O", "1", "I", "L"]) assert.ok(!cs.includes(bad), bad + " should be excluded");
});

test("generateCodes produces the requested count, all unique", () => {
  const codes = L.generateCodes({ pattern: "SALE-XXXX", count: 200, rng: seeded(42) });
  assert.equal(codes.length, 200);
  assert.equal(new Set(codes).size, 200);
  assert.ok(codes.every((c) => /^SALE-[A-Z2-9]{4}$/.test(c)));
});

test("generateCodes avoids codes in the existing list", () => {
  const first = L.generateCodes({ pattern: "A-XX", count: 5, rng: seeded(7) });
  const second = L.generateCodes({ pattern: "A-XX", count: 5, rng: seeded(7), existing: first });
  assert.equal(L.findCollisions(second, first).length, 0);
});

test("generateCodes throws when the pattern space is too small", () => {
  assert.throws(() => L.generateCodes({ pattern: "A-X", charset: "digits", count: 50, rng: seeded(1) }), /smaller/);
});

test("checksum character verifies and tampering fails", () => {
  const codes = L.generateCodes({ pattern: "CHK-XXXX", count: 10, checksum: true, rng: seeded(9) });
  for (const c of codes) assert.ok(L.verifyChecksum(c, L.CHARSETS.unambiguous, "-"));
  const tampered = codes[0].slice(0, -1) + (codes[0].endsWith("A") ? "B" : "A");
  assert.equal(L.verifyChecksum(tampered, L.CHARSETS.unambiguous, "-"), false);
});

test("parseExistingCodes reads first column and skips a header", () => {
  const codes = L.parseExistingCodes("code,note\nABC123,x\nDEF456,y\n");
  assert.deepEqual(codes, ["ABC123", "DEF456"]);
});

test("Shopify and WooCommerce CSV builders have the right headers", () => {
  const shop = L.buildShopifyCSV(["CODE1"], {});
  assert.ok(shop.startsWith("Code,Starts at,Ends at,Usage limit"));
  assert.ok(shop.includes("CODE1,,,1"));
  const woo = L.buildWooCommerceCSV(["CODE1"], { amount: "15" });
  assert.ok(woo.startsWith("coupon_code,discount_type,coupon_amount"));
  assert.ok(woo.includes("CODE1,percent,15,1,,"));
});
