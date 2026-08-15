# Pilgrim — Senior Shopify Developer Technical Assignment

> **Author:** Ravi Sharma  
> **Position:** Senior Shopify Developer  
> **Time taken:** ~3 hours  
> **Submitted:** August 2026

---

## Overview

Production-quality **custom Shopify product page section** built with Liquid, HTML, CSS, and vanilla JavaScript — no external libraries, no build tools required.

### Relevant Files

```
sections/pilgrim-product-info.liquid   ← Main section (Liquid + schema)
snippets/
  icon-caret.liquid                    ← Dropdown arrow SVG
  icon-minus.liquid                    ← Qty stepper minus SVG
  icon-plus.liquid                     ← Qty stepper plus SVG
  icon-check.liquid                    ← Benefit checkmark SVG
assets/
  pilgrim-product-info.css             ← Scoped BEM styles
  pilgrim-product-info.js              ← JS controller (loaded with defer)
config/settings_schema.json            ← Theme settings (Product Section Colors group)
screenshots/
  desktop.png                          ← Desktop layout
  mobile.png                           ← Mobile layout
```

---

## Installation

1. Copy `sections/pilgrim-product-info.liquid` → theme `sections/`
2. Copy `snippets/icon-*.liquid` → theme `snippets/`
3. Copy `assets/pilgrim-product-info.css` and `assets/pilgrim-product-info.js` → theme `assets/`
4. Merge the "Product Section Colors" group from `config/settings_schema.json` into your theme's schema.
5. Update `templates/product.json`:

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

6. Open Theme Editor to customise benefit bullets under **"Why Customers Love This Product"**.

---

## Features

### Core Requirements
| Feature | Implementation |
|---|---|
| Product Title | `{{ product.title }}` — semantic `<h1>` |
| Price | `{{ variant.price | money }}` — live-updates on variant change |
| Compare-at price | Strikethrough + % savings badge |
| Variant Selector | `<select>` driven by JSON data island |
| Quantity Selector | Custom stepper (+/–) with min/max guards |
| Add to Cart | AJAX via `routes.cart_add_url` Cart API |
| Benefit Bullets | 3 × `type: "text"` in `{% schema %}`, editable in Theme Editor |

### Bonus & Architecture
| Feature | Detail |
|---|---|
| Section Rendering API | Sends `sections: [sectionId]` in AJAX `/cart/add.js` payload; returns re-rendered section HTML for cart drawers |
| Deferred JS | External `pilgrim-product-info.js` loaded with `defer` — zero render-blocking |
| Modular SVG Snippets | Icons extracted into reusable `snippets/icon-*.liquid` files |
| Theme Settings Integration | Colors configurable via `settings_schema.json` → CSS custom properties |
| Loading state | Spinner + opacity on ATC button during fetch |
| Variant validation | Inline error if variant unavailable |
| Sold-out handling | Button disabled, text → "Sold Out", availability indicator updates |
| Responsive layout | CSS Grid: 1 column mobile, 55/45 split desktop |
| Accessible | `aria-live`, `aria-label`, `role="group"`, `:focus-visible`, `prefers-reduced-motion` |
| No external libraries | Zero dependencies — vanilla JS (~3 KB), no jQuery |
| Scoped CSS | BEM + CSS Custom Properties, no `!important` |
| `routes.cart_add_url` | Correct Shopify Cart AJAX endpoint |
| Theme Editor reload | `shopify:section:load` event re-initialises controller |

---

## Technical Architecture

### Liquid & Snippets
- `product.selected_or_first_available_variant` for correct initial state
- SVG icons in modular snippets (`icon-caret`, `icon-minus`, `icon-plus`, `icon-check`)
- Variant data as `<script type="application/json">` island — decouples Liquid from JS
- `{% unless product.has_only_default_variant %}` hides select for single-variant products

### CSS
- BEM methodology: `.pilgrim-product-info__element--modifier`
- CSS Custom Properties (design tokens) on root block, overridden by theme settings
- `clamp()` for fluid typography, `aspect-ratio` for image, `fit-content` for qty stepper
- `@media (prefers-reduced-motion)` disables animations

### JavaScript
- External file loaded with `defer` — non-blocking, executes after DOM parse
- Auto-discovers sections via `[data-section-type]` — no Liquid inside JS
- AJAX `fetch()` to `routes.cart_add_url` with error body parsing
- Dispatches `cart:add` custom event for cart drawer integrations

---

## Loom Walkthrough Script

1. **Desktop layout** — 2-column grid, image, title, price, variant selector
2. **Change variant** — price/savings update live (no page reload)
3. **Theme Editor** — edit benefit bullets, show live preview
4. **Theme Settings** — change Product Section Colors, show live color update
5. **Quantity stepper** — increment/decrement, button disables at min
6. **Add to cart** — loading spinner, disabled state, success message
7. **Sold-out variant** — button → "Sold Out", disabled
8. **Mobile** — stacked single-column layout
9. **Code walk** — schema, snippets, deferred JS, BEM CSS tokens
