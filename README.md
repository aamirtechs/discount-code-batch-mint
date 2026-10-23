# Discount Code Batch Mint
Live page: https://aamirtechs.github.io/discount-code-batch-mint/

Single-use promo codes for inserts, influencer seeding and win-back campaigns cannot be made one by one in a platform admin without paid apps. Discount Code Batch Mint generates thousands of unique, human-typeable codes in your browser and exports them in the exact import formats Shopify and WooCommerce expect.

## Features
- Pattern builder: prefix, code length and charset (unambiguous by default, no 0/O or 1/I confusion)
- Generate up to 50,000 unique codes with crypto-grade randomness (crypto.getRandomValues)
- Collision check against an existing-codes CSV you paste or upload
- Optional checksum character appended to every code
- Export a plain list, a Shopify discount CSV or a WooCommerce coupon CSV

## How it works
Type a pattern such as SPRING-XXXXXX, choose a quantity and charset, and optionally paste your existing codes so none of them is reissued. The generator builds unique codes locally and offers plain, Shopify and WooCommerce downloads. It runs entirely in the browser.

## Privacy
Runs 100% in your browser. Your files never leave this device, nothing is uploaded,
and there is no tracking.

## Development
Core logic lives in `src/logic.js` and is shared by the page and the tests.
Run the tests with `npm test`.

## License
MIT, Copyright 2026 Amir Hussain.
