# Good first issues

## Add a pronounceable pattern mode
Add an optional consonant-vowel alternating pattern (like KODA-4821 style syllables) so codes are easier to read aloud on support calls.
Keep the generator logic in src/logic.js and add tests for the new pattern.

## Add per-code expiry dates to exports
Let the user set an expiry date that is written into the Shopify and WooCommerce export columns.
Default to no expiry when the field is blank.

## Add a code strength estimate
Show an estimated entropy figure for the chosen pattern and charset before generating.
Warn when the pattern space is smaller than the requested quantity.
