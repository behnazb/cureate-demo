# Notes

## T08 — Persistent qty + state across PDP / gallery / cart

**Bug:** The product detail page (PDP) kept its own local quantity state (always
started at 1) and computed the MOQ progress bar from that single "about to add"
amount, so a qty set on the gallery card didn't carry into the PDP (and vice
versa) and the MOQ number disagreed between the PDP and the cart drawer.

**Fix:** Made the PDP quantity cart-backed — it reads/writes the product's
quantity in the active draft (keyed by delivery week, per T01) via a new
`cart.setQuantity`, and computes the MOQ progress from the cart's actual vendor
total (the same number the cart drawer shows). Because the active draft is keyed
by the persisted delivery week, navigating PDP ↔ gallery ↔ vendor page no longer
switches the draft or the MOQ.
