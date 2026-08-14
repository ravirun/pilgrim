# Pilgrim — Senior Shopify Developer Technical Assignment

> **Author:** Ravi Sharma  
> **Position:** Senior Shopify Developer  
> **Time taken:** ~3 hours  
> **Submitted:** August 2026

---

## Overview

This submission contains a production-quality **custom Shopify product page section** built with Liquid, HTML, CSS, and vanilla JavaScript — no external libraries, no build tools required.

### File Structure

```
pilgrim-shopify-assignment/
├── sections/
│   └── pilgrim-product-info.liquid   ← Main section (Liquid + JS + schema)
├── snippets/
│   ├── icon-caret.liquid             ← Reusable dropdown arrow SVG snippet
│   ├── icon-minus.liquid             ← Reusable stepper minus SVG snippet
│   ├── icon-plus.liquid              ← Reusable stepper plus SVG snippet
│   └── icon-check.liquid             ← Reusable benefit checkmark SVG snippet
├── assets/
│   └── pilgrim-product-info.css      ← Scoped section styles
├── screenshots/
│   ├── desktop.png                   ← Desktop layout
│   └── mobile.png                    ← Mobile layout
└── README.md
```

---

## Installation

1. Copy `sections/pilgrim-product-info.liquid` → your theme's `sections/` directory.
2. Copy `snippets/icon-*.liquid` → your theme's `snippets/` directory.
3. Copy `assets/pilgrim-product-info.css` → your theme's `assets/` directory.
4. Update `templates/product.json` to include the section:

```json
{
  "sections": {
    "pilgrim-product-info": {
      "type": "pilgrim-product-info",
      "settings": {}
    }
  },
  "order": ["pilgrim-product-info"]
}
```

5. Open the Theme Editor to customise the three editable bullet points under **"Why Customers Love This Product"**.

---

## Features Implemented

### Core Requirements
| Feature | Implementation |
|---|---|
| Product Title | `{{ product.title }}` — semantic `<h1>` |
| Price | `{{ variant.price | money }}` — live-updates on variant change |
| Compare-at price | Shown with strikethrough + % savings badge |
| Variant Selector | `<select>` driven by `product.variants` data island |
| Quantity Selector | Custom stepper (+/–) with min/max guards |
| Add to Cart | AJAX via `routes.cart_add_url` Cart API |
| Benefit Bullets | 3 × `type: "text"` in `{% schema %}`, editable in Theme Editor |

### Bonus Features & Architecture Highlights
| Feature | Detail |
|---|---|
| Modular SVG Snippets | Inline SVGs extracted into reusable `snippets/icon-*.liquid` files |
| Loading state | Spinning SVG + opacity on button text during fetch |
| Disabled state | Button disabled + `aria-disabled` while submitting |
| Variant validation | Shows inline error if variant unavailable |
| Sold-out handling | Button disabled, text changes to "Sold Out", availability indicator updates |
| Price update on variant change | Pure JS — no page reload, price row updates from JSON data island |
| Responsive layout | CSS Grid: 1 column on mobile, 55/45 split on ≥768 px |
| Accessible labels | `aria-label`, `aria-live`, `aria-describedby`, `role="group"` |
| Keyboard-friendly | Full keyboard navigation, `:focus-visible` states |
| No external libraries | Zero dependencies — vanilla JS, no jQuery, no frameworks |
| Minimal DOM manipulation | JS only touches price/availability/button text nodes |
| Scoped CSS | All selectors under `.pilgrim-product-info` BEM block |
| `routes.cart_add_url` | Correct Shopify Cart AJAX endpoint — no hardcoded paths |
| Theme editor live-reload | `shopify:section:load` event listener for editor re-init |
| Reduced motion support | `@media (prefers-reduced-motion: reduce)` applied |

---

## Technical Architecture

### Liquid & Snippets
- Uses `product.selected_or_first_available_variant` for correct initial state.
- Extracted all SVG icons into clean, modular Liquid snippets (`icon-caret.liquid`, `icon-minus.liquid`, `icon-plus.liquid`, `icon-check.liquid`) to keep the section template clean and SVG assets reusable.
- Variant data serialised as a `<script type="application/json">` island — avoids `data-*` attribute sprawl and keeps Liquid/JS coupling minimal.
- Schema settings provide sensible defaults so the reviewer sees content immediately in the Theme Editor.
- `{% unless product.has_only_default_variant %}` hides the select for single-variant products.

### CSS
- **BEM methodology**: `.pilgrim-product-info__element--modifier`.
- **CSS Custom Properties** (design tokens) declared on the root block for easy theming.
- **No `!important`**, no inline styles, no utility class soup.
- `clamp()` for fluid typography, `aspect-ratio` for image container, `fit-content` for quantity stepper width.
- `@media (prefers-reduced-motion)` disables animations for accessibility.

### JavaScript
- Fully encapsulated IIFE — zero global scope pollution.
- Variant switching updates price, savings badge, availability status, and ATC button state from a pre-built `Map`.
- AJAX `fetch()` posts JSON to `routes.cart_add_url`; handles 4xx/5xx responses by parsing the Shopify error body.
- Dispatches a `cart:add` custom event for cart drawer integrations (Rebuy, etc.).
- Qty stepper clamps to `[min, max]` and disables the relevant button at boundaries.
- `shopify:section:load` re-initialises the controller after Theme Editor live-reload.

---

## Loom Walkthrough Script

1. **Open product page on desktop** — show 2-column layout, image, title, price, variant selector.
2. **Change variant** — price and savings badge update live (no page reload).
3. **Open Theme Editor** — navigate to the section, edit all three benefit bullets, show live preview.
4. **Change quantity** — decrement/increment, show button disables at min.
5. **Add to cart** — observe loading spinner, button disabled, success message.
6. **Select sold-out variant** — button becomes "Sold Out", disabled.
7. **Resize to mobile** — show stacked single-column layout, full-width ATC button.
8. **Brief code walk** — show schema, modular Liquid icon snippets, JS IIFE, CSS BEM tokens.

---

## Design Decisions

- **Modular SVG Snippets** — Keeps HTML lean and decouples icon assets from template markup following Shopify theme design patterns.
- **No JS framework** — Shopify themes ship to millions of users; shipping React/Vue for a product form is wasteful. Vanilla JS keeps the bundle at ~3 KB.
- **JSON data island** — decouples Liquid rendering from JS logic. No hidden `<input>` arrays, no template literals with Liquid inside JS strings.
- **BEM + CSS Custom Properties** — BEM scopes styles to the section; custom properties make the palette trivially overridable by the theme's global design tokens.
- **ARIA live regions** — price row, availability, and feedback message all have `aria-live="polite"` so screen reader users hear variant and cart updates.
