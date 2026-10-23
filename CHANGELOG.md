# Changelog

## 1.0.0 - 2026-10-23

- Pattern builder: prefix, code length and charset (unambiguous by default, no 0/O or 1/I confusion)
- Generate up to 50,000 unique codes with crypto-grade randomness (crypto.getRandomValues)
- Collision check against an existing-codes CSV you paste or upload
- Optional checksum character appended to every code
- Export a plain list, a Shopify discount CSV or a WooCommerce coupon CSV
