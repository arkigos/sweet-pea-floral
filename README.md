# Sweet Pea Floral: site prototype

A design prototype for Sweet Pea Floral, American Fork, Utah. Ordering hands off to the shop's current store.

- `index.html`: the home page. Pick an occasion, narrow by look and budget, open a design.
- `p/<design>/`: one real page per design, generated from `assets/products.js`.
- `assets/products.js`: the designs, prices, hours and policies.

Rebuild the design pages after changing the data:

    python tools/build_pages.py

Preview locally:

    python -m http.server 8000
