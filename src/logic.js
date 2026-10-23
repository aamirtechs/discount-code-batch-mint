"use strict";
// Discount Code Batch Mint: core logic. Pure functions, no DOM, no fetch.

const CHARSETS = {
  unambiguous: "ABCDEFGHJKMNPQRSTUVWXYZ23456789", // no 0/O, 1/I/L, no lowercase
  alnum: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  digits: "0123456789",
  letters: "ABCDEFGHJKLMNPQRSTUVWXYZ"
};

// Parse a pattern like "SPRING-XXXXXX" or "{prefix}-{random:6}".
// Returns { prefix, separator, randomLength }.
function parsePattern(pattern) {
  const p = String(pattern || "").trim().toUpperCase();
  if (!p) throw new Error("Pattern is empty");
  const braceMatch = p.match(/^(.*?)\{random:(\d+)\}$/i);
  if (braceMatch) {
    const head = braceMatch[1].replace(/[-_]+$/, "");
    const sep = braceMatch[1].slice(head.length) || "-";
    return { prefix: head, separator: sep, randomLength: parseInt(braceMatch[2], 10) };
  }
  const runMatch = p.match(/^(.*?)([-_]?)(X+)$/);
  if (runMatch && runMatch[3].length >= 1 && runMatch[1] !== p) {
    return { prefix: runMatch[1], separator: runMatch[2] || "", randomLength: runMatch[3].length };
  }
  // No X run: treat whole pattern as prefix with a default random part.
  return { prefix: p.replace(/[-_]+$/, ""), separator: p.endsWith("-") || p.endsWith("_") ? p.slice(-1) : "-", randomLength: 6 };
}

function resolveCharset(nameOrCustom) {
  if (!nameOrCustom) return CHARSETS.unambiguous;
  if (CHARSETS[nameOrCustom]) return CHARSETS[nameOrCustom];
  const cleaned = String(nameOrCustom).replace(/\s+/g, "");
  if (cleaned.length < 2) throw new Error("Custom charset needs at least 2 characters");
  return Array.from(new Set(cleaned.split(""))).join("");
}

// Checksum: weighted sum of char codes mod charset size, mapped into charset.
function checksumChar(code, charset) {
  let sum = 0;
  for (let i = 0; i < code.length; i++) sum += code.charCodeAt(i) * (i + 1);
  return charset[sum % charset.length];
}

function verifyChecksum(code, charset, separator) {
  if (code.length < 2) return false;
  const body = code.slice(0, -1).split(separator || "").join("");
  return checksumChar(body, charset) === code.slice(-1);
}

// Generate unique codes. rng(maxExclusive) must return an integer in [0, max).
// Default rng uses crypto when available, else Math.random (tests inject their own).
function defaultRng(max) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function generateCodes(options) {
  const opts = options || {};
  const parsed = parsePattern(opts.pattern || "PROMO-XXXXXX");
  const charset = resolveCharset(opts.charset || "unambiguous");
  const count = Math.max(0, Math.min(50000, Math.floor(opts.count || 0)));
  const existing = new Set((opts.existing || []).map((c) => String(c).trim().toUpperCase()).filter(Boolean));
  const rng = opts.rng || defaultRng;
  const useChecksum = !!opts.checksum;
  const space = Math.pow(charset.length, parsed.randomLength);
  if (count > space) throw new Error("Pattern space (" + space + ") is smaller than the requested count (" + count + ")");
  const out = [];
  const seen = new Set(existing);
  let guard = 0;
  const maxTries = count * 50 + 1000;
  while (out.length < count && guard < maxTries) {
    guard++;
    let rand = "";
    for (let i = 0; i < parsed.randomLength; i++) rand += charset[rng(charset.length)];
    let code = (parsed.prefix ? parsed.prefix + parsed.separator : "") + rand;
    if (useChecksum) code += checksumChar(code.replace(/[^A-Z0-9]/g, ""), charset);
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  if (out.length < count) throw new Error("Could not generate enough unique codes; pattern space nearly exhausted");
  return out;
}

// Parse an existing-codes CSV/text: one code per line or first column of CSV.
function parseExistingCodes(text) {
  const codes = [];
  const lines = String(text || "").split(/\r?\n/);
  lines.forEach((line, idx) => {
    const first = line.split(",")[0].trim().replace(/^"|"$/g, "").toUpperCase();
    if (!first) return;
    if (idx === 0 && /^(code|coupon|discount)/i.test(first)) return; // header
    codes.push(first);
  });
  return codes;
}

function findCollisions(codes, existing) {
  const set = new Set((existing || []).map((c) => String(c).trim().toUpperCase()));
  return codes.filter((c) => set.has(String(c).toUpperCase()));
}

function csvEscape(value) {
  const s = String(value == null ? "" : value);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function buildPlainList(codes) {
  return codes.join("\n") + (codes.length ? "\n" : "");
}

function buildShopifyCSV(codes, opts) {
  const o = opts || {};
  const rows = [["Code", "Starts at", "Ends at", "Usage limit"]];
  codes.forEach((c) => rows.push([c, o.startsAt || "", o.endsAt || "", o.usageLimit || "1"]));
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n") + "\n";
}

function buildWooCommerceCSV(codes, opts) {
  const o = opts || {};
  const header = ["coupon_code", "discount_type", "coupon_amount", "usage_limit", "expiry_date", "description"];
  const rows = [header];
  codes.forEach((c) => rows.push([c, o.discountType || "percent", o.amount || "10", o.usageLimit || "1", o.expiryDate || "", o.description || ""]));
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n") + "\n";
}

const api = { CHARSETS, parsePattern, resolveCharset, checksumChar, verifyChecksum, generateCodes, parseExistingCodes, findCollisions, buildPlainList, buildShopifyCSV, buildWooCommerceCSV, csvEscape };
if (typeof module !== "undefined" && module.exports) { module.exports = api; }
if (typeof window !== "undefined") { window.DiscountCodeBatchMint = api; }
