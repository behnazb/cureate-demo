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

## T18 — Product-level delivery frequency in the Draft PO

**Gap:** Per-line "Deliver by" (frequency + day) existed only on the review
screen, and the submit payload dropped it — the server never received or stored
frequency, so the submitted PO showed no per-line schedule.

**Change:** Frequency is now set at the product level in the Draft PO (cart
view) before submitting, and it survives the whole path:

- **Draft cart:** each line grows a `Deliver` row — frequency select
  (One-time / Weekly / Bi-weekly) + schedule select (a date within the PO week
  for one-time; the vendor's delivery weekday for recurring), plus a
  `Recurring` chip on weekly/bi-weekly lines. Defaults follow the vendor's
  `preferred_delivery_day`. The controls are the same ones the review screen
  renders — both are emitted by `#lineDeliveryControlsHTML`, and the defaulting
  rule lives in one place (`#lineDelivery`), which the submit payload also uses
  so the server stores exactly what the buyer saw.
- **Submit:** `POST /purchase_orders` items now carry `frequency` +
  `delivery_spec`. The controller validates the frequency, keeps both on the
  line item, and derives the human label (`Weekly · Mondays`,
  `Next delivery: 07/22/2026`) via `schedule_label`, matching the seed-string
  format so submitted and seeded POs read the same.
- **PO detail:** when a vendor's lines share one schedule the summary shows it
  (unchanged); when they differ the summary reads "Varies by product — see
  line items" and each line renders its own schedule, bold + ↻ for recurring.
- `POLineItem` gains `frequency` / `delivery_spec` / `repeat_until` attrs and
  `recurring?`; seeded lines (frequency nil) are unaffected.
- **Multi-day recurring:** for weekly/bi-weekly lines the schedule is
  multi-select day pills (e.g. Mon AND Wed) rather than a single-day select —
  `delivery_spec` becomes an array of weekday abbrevs, kept in the vendor's
  weekday order, minimum one day (the last pill can't be untoggled). Legacy
  single-string specs normalize to one-element arrays. Labels join naturally:
  "Weekly · Mondays, Wednesdays & Fridays".
- **Repeat until:** recurring lines get an end-date picker ("Repeat until");
  blank = no end. Ships as `repeat_until` and lands in the label as
  "· until 09/30/2026". (A "Recurring" chip shipped briefly and was removed as
  clutter — the selected day pills already say it.)
- **De-clutter pass:** the per-line MOQ tag ("Min met" / "Add N more") moved
  from under the price to sit right-aligned above the qty stepper; order-note
  placeholder is "Add an order note here".

## T19 — Draft PO detail: bottom CTAs replace the header "Add to Order"

**Change:** On a Draft PO's detail page, the header CTA is gone (non-draft
keeps "Duplicate PO"). The draft's two forward paths now sit at the bottom of
the details, after the totals card:

- **+ Add More to Order** (secondary) — loads this PO's lines into the cart
  *under its own PO# and delivery week* (new `cart.loadDraftForPO`, unlike
  `loadDraftItems` which mints a fresh PO#), opens the drawer, and navigates
  to the product gallery.
- **Submit PO for Review** (primary) — same load, then opens the drawer
  directly on the review/confirmation view via a `cart:open-confirmation`
  event. Submitting POSTs under this PO's id, which replaces the in-memory
  record as In Review; the success modal's auto-close/"Close" returns to this
  PO page (the event carries `returnTo`) so the status pill reloads as
  In-Review. "View Purchase Order" behaves as before.

Line-item payloads for these CTAs now include frequency / deliverySpec /
repeatUntil / orderNote, so a reloaded draft keeps its per-line schedule.
- **Order note (same section):** each line's Deliver row also carries an
  `Order note` input ("appears on the PO and vendor order emails"), persisted
  on the cart item (`cart.setItemNote`), saved on change/blur — not per
  keystroke, since the re-render would steal focus — HTML-escaped before
  re-interpolation, submitted as `order_note`, and rendered by the existing
  per-line italic note treatment on the PO detail page (both breakpoints).
