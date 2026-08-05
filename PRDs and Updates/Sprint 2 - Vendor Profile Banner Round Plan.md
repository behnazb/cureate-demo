# Sprint 2 · Vendor Profile — Banner Round & Next Steps

Sources: Jul 31 design review (Kim × Naz) + "Cureate Vendor Profile Banner" handoff
(Claude Design bundle: public profile + edit-with-banner prototypes).

## Round A — Shop banner + profile images (edit page) — THIS ROUND

- Banner block at the top of My Profile: 230px frame, bottom scrim, "Shop banner"
  label pill, persistent **Edit banner** pill (Facebook Pages convention).
- Picker popover: shop-category select → suggested images (3–5 tiles), optimistic
  preview in the frame, green ring + check on the selected tile, **Use this image**
  commits (saved with Save Profile), **Cancel** reverts, **Remove banner** clears to
  the neutral fallback. No in-popover upload (removed at designer's request);
  "upload your own" affordance TBD by product.
- Profile Images card: founder photo (140×140) + logo (75×75) with hover
  Edit-Image overlays (stubs), caption + 300kb/300px note. Kim: card must carry
  BOTH the selfie image and the logo — both are used in marketing.
- Library: Snacks has 1 real photo (bakery oven, from handoff) + 4 hatched
  placeholders; all other categories fall back to neutral placeholder tiles.

## Round B — Public vendor page redesign (next)

Handoff "Vendor Profile - Public": banner (210px) at top; overlapping identity
card (founder 140×140 + caption from Business Owner Name, logo 75×75, uppercase
location + 34px name, identity + sales-channel pills, website/social row);
products grid moved directly under the header (say "Products", NOT "In the
Shop" — Kim); two-column body (The Business / Our Story / Logistics rows with
day chips + sidebar cards: Contact & Location, Business Details, How They Sell,
Categories, Vendor Resources); vendor-only PREVIEW bar with "← Back to editing".

## Round C — Decided form changes (no dependencies, from Jul 31 review)

- Social row: LinkedIn replaces X/Twitter. (Prototype shows Instagram, TikTok,
  Facebook, X → final set swaps X for LinkedIn.)
- Phone moves up next to Email; "Contact & Location" becomes **Business
  Headquarters Location** (address fields only). Card city/state is derived,
  not directly editable.
- Business Type and Revenue become dropdowns (single-select; frees real estate).
- Everything in the left panel is required.
- Business Certifications: only Woman-owned + Minority-owned; remove Cureate
  Courses Alumni; add **PDF upload** per certification. Insurance and Health
  Dept. clearance also get PDF uploads.
- Self-identification (pronouns/gender identity/ethnicity) moves to the sidebar
  ("nits about you"; main column = operations). Exact term labels from Kim.
- Production moves into About ("Where is your product being produced?" — e.g.
  HQ Rockville, production Wisconsin). Drop last-minute-orders copy; add ghost
  text. No turnaround times for now.
- Downloadables/extra certifications section at the bottom of the profile page.

## Round D — Waiting on Kim (spreadsheets/Slack)

- Sales channels final set (multi-select, expandable descriptions; copy from
  Stacy/Kim): **CPG (Consumer Packaged Goods)** [was Retail Product], **Gifts &
  Customization**, **Back-of-House**, **Events/Catering Service**, **Grab & Go
  Meals** [replaces Restaurant], **Food Truck**. Brick & Mortar removed.
- Per-channel Logistics & Fulfillment (tabs within Sales Channels): fields per
  channel incl. lead time, delivery vs shipping, fees, MOQs — from Kim's
  spreadsheet. Buyer-side implication noted per channel.
- Granular Revenue + Employees option lists (tracking revenue/job growth).
- Parent → child category list → banner image libraries (~3 images per child
  category; generate via AI or stock, designer's call).
- Product-level "Is this product customizable?" + explainer fields (products
  drawer) tying gifting products to logistics.

## Round E — Design-for-later

- Teams & user roles: owner vs vendor rep/admin under a settings/Teams section
  (Kaya example: owner Dave, ops Lauren). Interim: owner name field only.
- Banner "upload your own" (JPG/PNG, ≥1600×400, <2MB, cropped to aspect).
- MOQ breakdown into specific actions (Kim to split the sheet content).

## Timeline notes

- Naz OOO Aug 7–23; wrap vendor UX before then via this round + async feedback.
- Engineering handoff continues via code on `vendor-ux-sprint-2`.
