# Cureate Connect — Rails / Hotwire Port

This directory contains the full UI rewritten as **Rails 7+ / Hotwire (Stimulus + Turbo) / Tailwind CSS 4** templates, controllers, and stylesheets — designed to be dropped into the production Rails application that lives elsewhere.

The original demo was built in Next.js/React on the wrong stack. This port replaces the React/Next.js implementation with idiomatic Rails-and-Hotwire equivalents while preserving the visual design 1:1.

---

## Where everything went

| Next.js file | Rails port |
|---|---|
| `app/layout.tsx` | `app/views/layouts/application.html.erb` |
| `app/page.tsx` (redirect) | `app/controllers/home_controller.rb` → redirects to `/products` |
| `app/error.tsx` | `app/views/errors/internal_server_error.html.erb` |
| `app/vendors/page.tsx` | `app/views/vendors/index.html.erb` |
| `app/vendors/[id]/page.tsx` | `app/views/vendors/show.html.erb` |
| `app/vendors/[id]/products/[productId]/page.tsx` | `app/views/products/show.html.erb` |
| `app/products/page.tsx` | `app/views/products/index.html.erb` |
| `app/purchase-orders/page.tsx` | `app/views/purchase_orders/index.html.erb` |
| `app/purchase-orders/[id]/page.tsx` | `app/views/purchase_orders/show.html.erb` |
| `components/Sidebar.tsx` | `app/views/shared/_sidebar.html.erb` + `sidebar_controller.js` |
| `components/MobileNav.tsx` | `app/views/shared/_mobile_nav.html.erb` + `mobile_nav_controller.js` |
| `components/CartDrawer.tsx` | `app/views/shared/_cart_drawer.html.erb` + `cart_drawer_controller.js` |
| `components/SearchBar.tsx` | `app/views/shared/_search_bar.html.erb` + `search_bar_controller.js` |
| `components/FilterDropdown.tsx` | `app/views/shared/_filter_dropdown.html.erb` + `filter_dropdown_controller.js` |
| `components/FilterPanel.tsx` | `app/views/shared/_filter_panel.html.erb` + `filter_panel_controller.js` |
| `components/ProductCard.tsx` | `app/views/shared/_product_card.html.erb` |
| `components/ViewToggle.tsx` | `app/views/shared/_view_toggle.html.erb` + `view_toggle_controller.js` |
| `components/AddToCartButton.tsx` | `app/views/shared/_add_to_cart_button.html.erb` + `add_to_cart_controller.js` |
| `components/ViewCartButton.tsx` | `app/views/shared/_view_cart_button.html.erb` + `view_cart_button_controller.js` |
| `components/POStatusBadge.tsx` | `app/views/shared/_po_status_badge.html.erb` |
| `components/PODropdownMenu.tsx` | `app/views/shared/_po_dropdown_menu.html.erb` + `po_dropdown_menu_controller.js` |
| `lib/cartContext.tsx` | `app/javascript/controllers/cart_controller.js` (single source of truth, localStorage-backed) |
| `lib/data.ts` | `app/models/vendor.rb` + `app/models/product.rb` + `db/seeds.rb` |
| `lib/purchaseOrdersData.ts` | `app/models/purchase_order.rb` + `app/models/po_line_item.rb` + `db/seeds.rb` |
| `lib/filterConfig.ts` | `app/models/filter_config.rb` |
| `lib/tokens.ts` | (inlined — Tailwind arbitrary values already encode the same px values) |
| `app/globals.css` | `app/assets/stylesheets/application.tailwind.css` |

---

## Assumptions baked in (judgment calls)

These were the architectural calls I made without you, with the reasoning:

### 1. Rails 7.1+ / Hotwire defaults
- **Turbo + Stimulus** (Hotwire). Full-page navigation by default; Stimulus handles every piece of client-side interaction (dropdowns, drawers, filters, cart counter).
- Turbo's morph/frames aren't used heavily — this app is mostly form-style interactions, no live-updating server data.

### 2. JS bundling: agnostic
- Stimulus controllers use plain ES module syntax. Compatible with both `importmap-rails` (Rails 7+ default) and `jsbundling-rails` (esbuild/webpack/rollup).
- If your production app uses `importmap-rails`, the existing `pin_all_from "app/javascript/controllers", under: "controllers"` will pick these up automatically.

### 3. CSS: Tailwind 4 (matches existing dependency)
- The original demo already used Tailwind 4 (`@tailwindcss/postcss`). I kept every utility class string verbatim from the JSX → ERB conversion. Arbitrary values like `text-[13px]` and `bg-[#28ba93]` are unchanged.
- In Rails, integrate via `tailwindcss-rails` gem (Rails 7+) or `cssbundling-rails` — both pick up `app/assets/stylesheets/application.tailwind.css`.
- The custom `.no-min-h`, `.scrollbar-hide`, and `.scrollbar-none` utilities from `globals.css` are preserved in `application.tailwind.css`.

### 4. Cart state — Stimulus singleton + localStorage
- React's `CartContext` shared cart state across all React components. Stimulus has no such mechanism, so I built one: the `cart_controller` is attached to `<body>` (declared in the layout), owns all cart state (items, selected PO, drawer open/close, delivery week, repeat mode), persists it to `localStorage`, and dispatches custom events for cross-controller coordination.
- Other controllers (`add_to_cart`, `view_cart_button`, `cart_drawer`) reach the cart controller via Stimulus's `application.getControllerForElementAndIdentifier(document.body, 'cart')`.
- Custom events used: `cart:changed`, `cart:opened`, `cart:closed`, `cart:po-changed`. Listeners re-render their own counts/labels.
- This pattern is the canonical Hotwire approach for client-side global state.

### 5. Data layer — placeholder models, NOT migrations
- I did **not** generate migrations or commit you to a schema. Instead, `app/models/{vendor,product,purchase_order,po_line_item}.rb` are lightweight POROs (plain Ruby objects) with the same shape as the original TypeScript types.
- `db/seeds.rb` loads the same fixture data the React demo used (all 3 vendors, ~10 products, 5 POs).
- **In your production app:** replace these POROs with the existing ActiveRecord models. The view templates only call attribute readers (`vendor.name`, `product.wholesale_unit_price`, etc.) and a few helper methods (`vendor.products`, `product.shipping_fee?`) — they're listed in each model file. As long as your AR models expose the same readers, no view changes are needed.

### 6. Animations — framer-motion is gone
- `framer-motion` was used heavily in the React app (drawer slides, dropdown fades, button micro-interactions, stagger reveals). I replaced these with:
  - **Tailwind `transition-*` classes** for simple fades/transforms (most cases).
  - **Stimulus `data-transitioning` classes** for slide-in/out drawers.
  - **Skipped:** the SVG-path-length checkmark animation on the success view (uses a static checkmark instead), and the staggered vendor-list reveal (just appears).
- If your production app already uses a JS animation library (Anime.js, GSAP, Motion One), the `cart_drawer_controller` etc. have clear extension points where animations would slot in. Look for `// TODO: animate` comments.

### 7. Routing — REST resources
- `config/routes.rb` uses standard Rails resource routing:
  - `resources :vendors do resources :products, only: [:show] end`
  - `resources :products, only: [:index]`
  - `resources :purchase_orders`
  - `root to: redirect("/products")`
- Query-param based PO tab filtering (`/purchase-orders?tab=draft`) is preserved as-is.
- Vendor pre-filter on products (`/products?vendor=2betties`) is preserved.

### 8. What is NOT included
- **No Gemfile.** A snippet of the gems you need is in `Gemfile.partial`. Merge into your existing Gemfile.
- **No `config/application.rb`, `config/environments/*`, no `bin/`, no `Procfile`, no `Dockerfile`.** Assume your production Rails app already has these.
- **No CSRF token plumbing.** Templates use `button_to`/`form_with` where appropriate; CSRF works automatically.
- **No authentication / authorization.** The hardcoded "Johns Hopkins University / buyer@jhu.edu" identity from the demo is in the sidebar partial — replace with `current_user.organization.name` etc. in your real app.
- **No API endpoints / Turbo Streams.** Cart state is purely client-side (matches the original demo). When you wire to your production data, you'll likely want Turbo Streams for cart updates.

### 9. Images / assets
- All asset paths in the original used `/vendors/...`, `/products/...`, `/icons/...` — these are preserved verbatim. In Rails, copy `public/vendors/`, `public/products/`, `public/icons/`, `public/cureate-logo.svg`, and `public/icon_*.svg` from this repo's `public/` dir into your production app's `public/` dir.
- The added SVG icons (`icon_backofhouse.svg`, `icon_retail.svg`) from the `assets/icons/` dir of this repo are referenced in `app/models/vendor.rb` for goal icons.

### 10. Cart drawer simplifications
The 1,128-line `CartDrawer.tsx` has been faithfully ported, with these explicit simplifications (called out so you can review):
- The "discard staged items?" overlay uses a CSS-only transition (no spring physics).
- The success-view countdown ticker is implemented with `setInterval` in the controller — functionally identical.
- The "Auto-save 'Draft saved' indicator" is event-driven (fires on `cart:changed`) and uses a simple opacity transition.
- The PO dropdown's "New" pill on newly-added POs uses a `data-new` attribute and CSS — functionally identical.

---

## How to integrate into your production Rails app

1. Copy `app/javascript/controllers/*.js` into your existing controllers directory. Stimulus's importmap config will auto-register them.
2. Copy `app/views/shared/_*.html.erb`, `app/views/{vendors,products,purchase_orders,home,errors}/*.html.erb`, and `app/views/layouts/application.html.erb` into your views directory. (Diff your existing `application.html.erb` first — you may need to merge.)
3. Copy `app/assets/stylesheets/application.tailwind.css` (or merge its `@layer` blocks into your existing entry).
4. Add the controller actions from `app/controllers/*.rb` to your existing controllers (or use them as-is).
5. Merge the routes from `config/routes.rb`.
6. Copy `public/` images from the demo repo into your production `public/` dir.
7. Replace the POROs in `app/models/` with your existing ActiveRecord models (or leave them as POROs if your data is config-driven).
8. Test each page in a browser. The cart state persists across pages via localStorage, so navigating Products → Vendors → Cart should preserve items.

---

## Open questions / things to confirm when you're back

These were edge cases I made calls on but want your eyes on:

1. **Production app's data model** — does it match the shape in `app/models/`? I assumed `Vendor has_many :products` and `PurchaseOrder has_many :po_line_items`. The view code calls `vendor.products`, `po.line_items`, `line_item.product`, `line_item.vendor`. Any mismatch needs a thin adapter.

2. **Cart persistence** — currently localStorage only. Your production app likely wants server-side cart persistence (cookie session or `current_user.cart`). The `cart_controller.js` has a clear `persist()` method that's the only place that would change.

3. **The `Add more to PO`, `Duplicate PO`, `Request support`, `Cancel PO` actions** in the dropdown menu — these were `console.log` placeholders in the React app. They remain placeholders here (dispatch a Stimulus event with the action name). Wire to your real controller actions.

4. **The seed data** — these are the same 3 vendors and 5 POs from the demo. Replace with real data, or drop `db/seeds.rb` entirely if your prod app already has data.

5. **Mobile bottom-sheet for PO "More" tab filter** — works via a Stimulus controller, but the spring physics from framer-motion are flattened to a CSS transition. If you want the bouncy feel, easy to add Motion One.

6. **Vendor goal icons (icon_backofhouse, icon_retail)** — referenced via `vendor.goal_icon_path` helper. Currently a static map; in production you'd likely move this to a `goal_icon` column on the vendor.
