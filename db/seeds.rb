# Seed data for Cureate Connect demo.
#
# In a real Rails app: `rails db:seed`. The POROs reset on every load.
# In production: replace this file with whatever loads your real Vendor / Product /
# PurchaseOrder records.

require_relative "../app/models/vendor"
require_relative "../app/models/product"
require_relative "../app/models/purchase_order"
require_relative "../app/models/po_line_item"

Vendor.reset!
PurchaseOrder.reset!

# ─── Vendors & Products ──────────────────────────────────────────────────────

twobetties = Vendor.new(
  id: "2betties",
  name: "2Betties",
  location: "Baltimore, MD",
  address: "1215 E. Fort Drive #004, Baltimore, MD 21230",
  website: "https://2betties.com",
  business_type: "Corporation",
  revenue: "501,000-600,000",
  employees: "2-5",
  # ── My Profile (vendor-managed shop details, 1:1 with the production edit view) ──
  # Shop banner (sprint 2 banner round) — picked from the category library.
  banner_image: "/banners/snacks/bakery-oven.jpg",
  banner_category: "Snacks",
  founder_photo: "/vendors/2betties/founder.jpg",
  owner_names: "Nancy Bridge",
  street_address: "1215 E. Fort Drive", address_line2: "#004",
  city: "Baltimore", state: "MD", zip: "21230",
  phone: "(410) 555-0164",
  insurance: ["General Liability Insurance"],
  health_clearance: "Yes",
  delivery_shipping: "We deliver across the Baltimore metro with a flat delivery fee of $10, " \
                     "and ship our snack packs regionally via UPS Ground — shipping is billed at cost.",
  moq_details: "Minimum 1 case (36 units) per order. SKUs are mix-and-match — " \
               "flavors are interchangeable to meet the minimum.",
  production: "Our production kitchen is in Locust Point, Baltimore.",
  shipping_days: %w[Tue],
  business_identity: ["Woman-Owned Business"],
  personal_identity: [],
  marketing_opportunities: "Yes",
  marketing_opportunities_details: "We offer in-store sampling demos and host quarterly pop-ups at partner " \
                                   "campuses — two weeks notice preferred.",
  # ── Sales channels (tabbed) — participation derived from channel_data ──
  sales_channels: ["Consumer Packaged Goods", "Customization & Gifting"],
  channel_data: {
    "cpg" => {
      "moq_threshold"       => "36",
      "moq_measure"         => "Units",
      "moq_label"           => "1 case (36 units) per order",
      "lead_time"           => "2-3 days",
      "production_planning" => "Weekly",
      "capacity"            => "Up to 40 cases with 1 week notice",
      "fulfillment_method"  => "Both",
      "who_delivers"        => "We deliver",
      "delivery_fee"        => "$10 flat delivery; shipping billed at cost",
      "delivery_radius"     => "DC, MD, VA",
      "shipping_radius"     => "DC, MD, VA",
      "carriers"            => ["UPS"],
      "ops"                 => "Yes",
      "certifications"      => ["GMP", "ServSafe"],
    },
    "gifting" => {
      "moq_threshold"       => "12",
      "moq_measure"         => "Units",
      "moq_label"           => "12 gift boxes",
      "lead_time"           => "1 week",
      "production_planning" => "Weekly",
      "capacity"            => "2 weeks for custom-labeled boxes",
      "fulfillment_method"  => "Both",
      "who_delivers"        => "We deliver",
      "delivery_fee"        => "$10 flat delivery",
      "delivery_radius"     => "DC, MD, VA",
      "shipping_radius"     => "DC, MD, VA",
      "carriers"            => ["UPS"],
      "ops"                 => "Depends",
      "certifications"      => ["GMP", "ServSafe"],
    },
  },
  seasonal_offerings: "Seasonal flavors rotate quarterly, plus holiday gift boxes each November and December.",
  growth_goals: "Over the next 5 years we're growing 2Betties into the go-to better-for-you snack " \
                "across mid-Atlantic campuses and hospitals, with a second production line for gifting.",
  social_links: { instagram: "https://www.instagram.com/2betties", facebook: "https://www.facebook.com/2betties" },
  certifications: ["Woman-owned Business"],
  categories: ["Snacks"],
  delivery_schedule: "Mon to Fri",
  delivery_days: %w[Mon Tue Wed Thu Fri], preferred_delivery_day: "Mon",
  min_order_quantity: "2 cases",
  logo: "/vendors/2betties/logo.jpeg",
  about: "2Betties makes better-for-you snacking easy and joyful. Certified Gluten-Free, Non-GMO, and Women-Owned.",
  owned: "Owned by: Nancy Bridge",
  story: "2Betties started in a college dorm room — co-founders on a mission to raise the bar one better bite at a time.",
  goals: ["Retail Product", "Gifting Product"],
  order_rules: {
    min_cases: 1, units_per_case: 36, min_units: 36, mix_and_match: true,
    mix_and_match_note: "Minimum 1 case (36 units) required. Flavors are interchangeable to meet the minimum.",
  },
  email: "hello@2betties.com",
  # No Stripe yet, so the invoice carries payment instructions instead of a pay button.
  # This is the bit to replace when the integration lands.
  remit_to: {
    method: "ACH / Wire transfer",
    bank: "M&T Bank",
    account_name: "2Betties LLC",
    account: "•••• 4417",
    routing: "052000113",
    terms: "Net 30",
  },
)

twobetties_flavors = [
  { id: "16820", name: "Bites (2-pack) - Chocolate Chip",   upc: "850004178164", image: "/vendors/2betties/chocolate-chip.png" },
  { id: "16821", name: "Bites (2-pack) - Chocolate Chunk",  upc: "861513000433", image: "/vendors/2betties/chocolate-chunk.png" },
  { id: "16822", name: "Bites (2-pack) - Lemon",            upc: "850004178201", image: "/products/2betties/2betties-lemon.png" },
  { id: "16823", name: "Bites (2-pack) - Maple Cinnamon",   upc: "861513000419", image: "/vendors/2betties/maple-cinnamon.png" },
  # NO IMAGE — the realistic launch case. Most vendors onboard without product photos,
  # so the empty state must be a first-class citizen, not an edge case.
  { id: "16824", name: "Bites (2-pack) - Sweet Almond",     upc: "850004178010", image: nil },
]
twobetties.products = twobetties_flavors.map { |f|
  Product.new(
    id: f[:id], name: f[:name], upc: f[:upc], size: "1.4 oz",
    # Case Pack = 6 packs per case; a case = 36 units (6 packs × 6 units/pack).
    wholesale_unit_price: 1.89, msrp: 2.99, case_pack: 6, units_per_case: 36,
    wholesale_case_price: 68.20, case_minimum: 1, unit_label: "unit",
    units_per_item: 12, item_label: "2-pack",   # 1 click = one 2-pack = 12 units; case = 3 two-packs
    storage: "Dry/Ambient: 7-12 months",
    # Inventory is a number the vendor maintains — deliberately NOT wired into the order
    # lifecycle (confirming an order doesn't check or decrement it). See app/models/product.rb.
    inventory: { "16820" => 1240, "16821" => 860, "16822" => 42, "16823" => 0, "16824" => 610 }[f[:id]] || 300,
    status: "published",
    allergens: %w[Dairy-Free Gluten-Free Peanut-Free Soy-Free Egg-Free],
    dietary: ["Paleo", "Low-Fat", "Low-Carb", "Low-Sugar", "Low-Sodium"],
    category: "Snacks", image: f[:image], vendor: twobetties,
  )
}

ethiopian = Vendor.new(
  id: "ethiopian-delights",
  name: "Ethiopian Delights",
  location: "Silver Spring, MD",
  address: "13208 Bellevue Street, Silver Spring, MD 20904",
  website: "http://www.ethiodelights.com",
  business_type: "Partnership",
  revenue: "Start-Up (<$250K/yr)",
  employees: "2-10",
  certifications: ["Woman-owned Business", "Minority-owned Business"],
  categories: ["Dry Goods"],
  delivery_area: "Washington D.C., Baltimore, Culpeper-Charlottesville",
  delivery_schedule: "Self-distribute",
  delivery_days: %w[Mon Tue Wed Thu Fri], preferred_delivery_day: "Mon",
  min_order_quantity: "1 case (12 units)",
  production: "Takoma Park Silver Spring Community Kitchen, 310 Tulip Ave, Takoma Park, MD",
  seasonal_offerings: "Farmers Markets, Holiday Markets, online",
  growth_goals: "At Ethiopian Delights, we are storytellers of Ethiopian culture through flavor. Our mission is to introduce authentic, high-quality Ethiopian-inspired cuisine to the D.C. metropolitan area.",
  logo: "/vendors/ethiopian-delights/logo.png",
  about: "Ethiopian Delights brings the rich and diverse flavors of Ethiopian cuisine to a global audience. We offer instant, ready-to-eat meals inspired by traditional Ethiopian dishes. All of our products are gluten-free and vegan.",
  story: "Beza Bisrat, MBA, is the founder of Ethiopian Delights. As an Ethiopian American, she felt disconnected from her culture when her career took her away from her home in Washington D.C. She found solace in cooking and was inspired to make authentic Ethiopian packaged food more accessible and visible.",
  owned: "Owned by: Beza Bisrat",
  goals: ["Retail Product"],
  social_links: { instagram: "ethiopiandelights", facebook: "ethiopiandelights" },
  order_rules: {
    min_cases: 1, units_per_case: 12, min_units: 12, mix_and_match: true,
    mix_and_match_note: "Minimum 1 case (12 units) required. Flavors are interchangeable to meet the minimum.",
  },
)

ethiopian.products = [
  Product.new(
    id: "10616", name: "Spicy Red Lentil Stew", upc: "860012111305", size: "3.5 oz",
    wholesale_unit_price: 6.29, msrp: 8.99, case_pack: 12, units_per_case: 12,
    wholesale_case_price: 75.48, case_minimum: 1, unit_label: "pack",
    units_per_item: 12, item_label: "case",   # sold only by the case (12 packs); 1 click = 1 case
    storage: "1 year shelf life, no need for refrigeration",
    allergens: %w[Dairy-Free Peanut-Free Tree\ Nut-Free Seafood-Free Sesame-Free Egg-Free],
    dietary: ["Vegan", "Vegetarian", "Low-Sugar"],
    cuisine: "African", category: "Dry Goods",
    image: "/vendors/ethiopian-delights/spicy-red-lentil-stew.png", vendor: ethiopian,
  ),
  Product.new(
    id: "10617", name: "Mild Split Pea Stew", upc: "860012111312", size: "3.5 oz",
    wholesale_unit_price: 6.29, msrp: 8.99, case_pack: 12, units_per_case: 12,
    wholesale_case_price: 75.48, case_minimum: 1, unit_label: "pack",
    units_per_item: 12, item_label: "case",   # sold only by the case (12 packs); 1 click = 1 case
    storage: "1 year shelf life, no need for refrigeration",
    allergens: %w[Dairy-Free Peanut-Free Tree\ Nut-Free Seafood-Free Sesame-Free Egg-Free],
    dietary: ["Vegan", "Vegetarian", "Low-Sugar"],
    cuisine: "African", category: "Dry Goods",
    image: "/vendors/ethiopian-delights/mild-split-pea-stew.png", vendor: ethiopian,
  ),
]

open_seas = Vendor.new(
  id: "open-seas-coffee-roasters",
  name: "Open Seas Coffee Roasters",
  location: "Stevensville, MD",
  address: "100 Pier Ave Unit A, Stevensville, MD 21666",
  website: "http://www.openseascoffee.com",
  business_type: "Sole Proprietorship",
  revenue: "Early Stage ($500K-$1M/yr)",
  employees: "2-10",
  insurance: "General Liability Insurance, Auto Coverage, Workers' Compensation",
  health_clearance: "Yes",
  certifications: [],
  categories: ["Beverages"],
  delivery_area: "Anne Arundel, Baltimore County, Wicomico and Worcester. Free Shipping on 4 cases. Delivery fee $13.25",
  delivery_schedule: "Wed to Fri / Delivery every Fri",
  delivery_days: %w[Wed Thu Fri], preferred_delivery_day: "Wed",
  min_order_quantity: "2 case minimum",
  production: "Open Seas Coffee Roasters, 100 Pier Ave, Stevensville, MD 21666",
  logo: "/vendors/open-seas-coffee-roasters/logo.png",
  owned: "Owned by: Bryce Roszell",
  about: "Open Seas Coffee Roasters is a wholesale roastery located in Stevensville, MD. We define ourselves by our three core values: Intentional, Interconnected, and Quality Driven. You can find our coffee served at many locations along the East Coast, and across the country!",
  story: "Here at Open Seas Coffee we define ourselves by our three core values: intentional, interconnected, and quality driven. We were dreamt up in 2014 by Bryce & Erica Roszell while living in Laos picking coffee cherries with friends. After returning to the States in 2015 Bryce opened Open Seas Coffee. We have the pleasure of roasting some truly brilliant coffees delivered to us from origin pre-loaded with potential.",
  growth_goals: "We're stoked about our canned cold brew and are in talks with our co-packer about launching additional canned products in the near future!",
  goals: ["Retail Product", "Back-of-House Product"],
  social_links: { instagram: true, facebook: true },
  order_rules: {
    # Open Seas uses a dollar-amount MOQ, enforced in the cart. The case/unit fields are
    # retained so the product detail order flow keeps working until it's migrated to the
    # dollar gate too.
    min_amount: 78,
    min_cases: 2, units_per_case: 12, min_units: 24, mix_and_match: false,
    mix_and_match_note: "Minimum order of $78 (2 cases / 24 units) required.",
  },
)

open_seas.products = [
  Product.new(
    id: "16523", name: "Cold Brew, Can", upc: "12345678905", size: "12 oz",
    wholesale_unit_price: 3.25, msrp: 5.25, case_pack: 12, units_per_case: 12,
    wholesale_case_price: 39.00, case_minimum: 2,
    units_per_item: 12, item_label: "case",   # sold by the case (12 cans); 1 click = 1 case, no individual units
    storage: "Dry/Ambient: 7-12 months, Cold: 7-12 months, Warm: 7-12 months",
    allergens: %w[Dairy-Free Gluten-Free Peanut-Free Tree\ Nut-Free Seafood-Free Sesame-Free Soy-Free Casein-Free Egg-Free],
    dietary: ["Vegan", "Vegetarian", "Organic / Naturally Grown", "Paleo", "Keto-Friendly", "Low-Fat", "Low-Carb", "Low-Sugar", "Low-Sodium"],
    category: "Beverages", breadcrumb: "Beverages / Coffee",
    image: "/vendors/open-seas-coffee-roasters/cold-brew-can.png", vendor: open_seas,
  ),
  Product.new(
    id: "16524", name: "Shipping Fee", wholesale_unit_price: 13.25,
    category: "Beverages", is_shipping_fee: true, vendor: open_seas, allergens: [], dietary: [],
  ),
]

Vendor.all.concat([twobetties, ethiopian, open_seas])

# ─── Purchase Orders ─────────────────────────────────────────────────────────

# Buyer organizations + delivery locations (E1, PRD story 2).
#
# The buyer prototype only ever showed one buyer (Johns Hopkins), because the buyer
# never needs to be told who they are. The vendor does: 2Betties delivers to several
# institutions, and "which buyer, which loading dock, which day" is the whole job.
# These are real Baltimore institutions with real addresses so user-test sessions
# don't get derailed by fake data.
JHU_CHARLES = {
  buyer_org: "Johns Hopkins University", buyer_contact: "Charles Ruiz",
  delivery_location: "Charles Commons Dining",
  delivery_address: "3301 N Charles St, Baltimore, MD 21218",
}.freeze
JHU_HOMEWOOD = {
  buyer_org: "Johns Hopkins University", buyer_contact: "Stephanie Doyle",
  delivery_location: "Homewood Campus — Levering Hall",
  delivery_address: "3400 N Charles St, Baltimore, MD 21218",
}.freeze
MERCY = {
  buyer_org: "Mercy Medical Center", buyer_contact: "Brenda Okafor",
  delivery_location: "Main Campus Café",
  delivery_address: "345 St Paul Pl, Baltimore, MD 21202",
}.freeze
CONVENTION = {
  buyer_org: "Baltimore Convention Center", buyer_contact: "Marcus Webb",
  delivery_location: "Pratt St Loading Dock",
  delivery_address: "1 W Pratt St, Baltimore, MD 21201",
}.freeze
UNDER_ARMOUR = {
  buyer_org: "Under Armour", buyer_contact: "Priya Raman",
  delivery_location: "Port Covington HQ — Employee Café",
  delivery_address: "1020 Hull St, Baltimore, MD 21230",
}.freeze

PurchaseOrder.all.concat([
  PurchaseOrder.new(
    id: "004-CHARLES-00017",
    **JHU_CHARLES,
    date_range: { start: "04/01/2026", end: "04/15/2026" },
    status: "In Review", total: 650.56,
    cureator_name: "Cureate DMV", created_at: "2026-04-01",
    delivery_date: "2026-04-22", delivery_date_short: "Apr 22",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16820", quantity: 2, unit: "cases",
                     unit_price: 68.20, delivery_fee: 0,
                     delivery_schedule: "Next delivery: 04/15/2026",
                     order_note: "Please deliver week of 4/15. Thank you!"),
      POLineItem.new(vendor_id: "2betties", product_id: "16821", quantity: 1, unit: "cases",
                     unit_price: 68.20,
                     delivery_schedule: "Next delivery: 04/15/2026",
                     order_note: "Please deliver week of 4/15. Thank you!"),
      POLineItem.new(vendor_id: "ethiopian-delights", product_id: "10616", quantity: 3, unit: "cases",
                     unit_price: 75.48,
                     delivery_schedule: "Next delivery: 04/15/2026",
                     order_note: "Self-distribute — call ahead please."),
    ],
  ),
  PurchaseOrder.new(
    id: "005-BRENDA-00098",
    **MERCY,
    date_range: { start: "03/22/2026", end: "03/28/2026" },
    status: "Confirmed", total: 274.00,
    cureator_name: "Cureate DMV", created_at: "2026-03-22",
    delivery_date: "2026-03-25", delivery_date_short: "Mar 25",
    line_items: [
      POLineItem.new(vendor_id: "open-seas-coffee-roasters", product_id: "16523", quantity: 7, unit: "cases",
                     unit_price: 39.00, delivery_schedule: "Next delivery: 03/28/2026"),
    ],
  ),
  PurchaseOrder.new(
    id: "006-STEPH-00001",
    **JHU_HOMEWOOD,
    date_range: { start: "03/15/2026", end: "03/21/2026" },
    status: "Delivered", total: 889.00, fulfillment_method: "Delivery",
    # Per-vendor fulfillment: 2Betties ships (UPS + tracking); Ethiopian self-delivers.
    fulfillment_by_vendor: {
      "2betties"           => { method: "Shipping", carrier: "UPS", tracking: "1Z999AA10123456784" },
      "ethiopian-delights" => { method: "Delivery" },
    },
    cureator_name: "Cureate DMV", created_at: "2026-03-15",
    delivery_date: "2026-03-18", delivery_date_short: "Mar 18",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16822", quantity: 5, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Delivered 03/21/2026"),
      POLineItem.new(vendor_id: "ethiopian-delights", product_id: "10617", quantity: 4, unit: "cases",
                     unit_price: 75.48, delivery_schedule: "Delivered 03/21/2026"),
    ],
  ),
  PurchaseOrder.new(
    id: "007-MARKET-00001",
    **CONVENTION,
    date_range: nil,
    status: "Draft", total: 29.68,
    cureator_name: "Cureate DMV", created_at: "2026-04-10",
    delivery_date: "2026-04-29", delivery_date_short: "Apr 29",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16823", quantity: 1, unit: "cases", unit_price: 68.20),
    ],
  ),
  PurchaseOrder.new(
    id: "003-CHARLES-00014",
    **JHU_CHARLES,
    date_range: { start: "02/10/2026", end: "02/24/2026" },
    status: "Cancelled", total: 412.00,
    cureator_name: "Cureate DMV", created_at: "2026-02-10",
    delivery_date: nil, delivery_date_short: nil,
    line_items: [],
  ),

  # ── Additional sample POs to populate the board across statuses ──────────────
  PurchaseOrder.new(
    id: "008-MARKET-00002",
    **CONVENTION,
    date_range: { start: "05/01/2026", end: "05/13/2026" },
    status: "Processing", total: 341.00,
    cureator_name: "Cureate DMV", created_at: "2026-05-01",
    delivery_date: "2026-05-13", delivery_date_short: "May 13",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16820", quantity: 5, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Next delivery: 05/13/2026"),
    ],
  ),
  PurchaseOrder.new(
    id: "009-CHARLES-00021",
    **JHU_CHARLES,
    date_range: { start: "05/04/2026", end: "05/20/2026" },
    status: "Processing", total: 226.44,
    cureator_name: "Cureate DMV", created_at: "2026-05-04",
    delivery_date: "2026-05-20", delivery_date_short: "May 20",
    line_items: [
      POLineItem.new(vendor_id: "ethiopian-delights", product_id: "10616", quantity: 3, unit: "cases",
                     unit_price: 75.48, delivery_schedule: "Next delivery: 05/20/2026"),
    ],
  ),
  PurchaseOrder.new(
    id: "010-BRENDA-00102",
    **MERCY,
    date_range: { start: "05/11/2026", end: "05/27/2026" },
    status: "Confirmed", total: 78.00,
    cureator_name: "Cureate DMV", created_at: "2026-05-11",
    delivery_date: "2026-05-27", delivery_date_short: "May 27",
    line_items: [
      POLineItem.new(vendor_id: "open-seas-coffee-roasters", product_id: "16523", quantity: 2, unit: "cases",
                     unit_price: 39.00, delivery_schedule: "Next delivery: 05/27/2026"),
    ],
  ),
  PurchaseOrder.new(
    id: "011-MARKET-00003",
    **CONVENTION,
    date_range: { start: "06/01/2026", end: "06/17/2026" },
    status: "In Review", total: 204.60,
    cureator_name: "Cureate DMV", created_at: "2026-06-01",
    delivery_date: "2026-06-17", delivery_date_short: "Jun 17",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16820", quantity: 3, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Next delivery: 06/17/2026"),
    ],
  ),
  PurchaseOrder.new(
    id: "002-STEPH-00007",
    **JHU_HOMEWOOD,
    date_range: { start: "02/02/2026", end: "02/18/2026" },
    status: "Paid", total: 477.40,
    # ── Invoice (E5). PRD story 7's five statuses are the life of the INVOICE, which
    # begins where the order's life ends. Paid here drives PO.status = "Paid".
    invoice_number: "INV-00007", invoice_status: "Paid",
    invoiced_at: "2026-02-19", invoice_due_date: "2026-03-21",
    invoice_sent_at: "2026-02-19", invoice_sent_to: ["stephanie.doyle@jhu.edu"],
    cureator_name: "Cureate DMV", created_at: "2026-02-02",
    delivery_date: "2026-02-18", delivery_date_short: "Feb 18",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16821", quantity: 7, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Delivered 02/18/2026"),
    ],
  ),
  PurchaseOrder.new(
    id: "001-CHARLES-00009",
    **JHU_CHARLES,
    date_range: { start: "01/14/2026", end: "01/28/2026" },
    status: "Invoiced", total: 377.40,
    invoice_number: "INV-00009", invoice_status: "Approved",
    invoiced_at: "2026-06-28", invoice_due_date: "2026-07-28",
    invoice_sent_at: "2026-06-28", invoice_sent_to: ["charles.ruiz@jhu.edu"],
    cureator_name: "Cureate DMV", created_at: "2026-01-14",
    delivery_date: "2026-01-28", delivery_date_short: "Jan 28",
    line_items: [
      POLineItem.new(vendor_id: "ethiopian-delights", product_id: "10617", quantity: 5, unit: "cases",
                     unit_price: 75.48, delivery_schedule: "Delivered 01/28/2026"),
    ],
  ),

  # ── 2Betties vendor pipeline (E0/E1) ────────────────────────────────────────
  # The vendor persona needs every tab populated, with dates around "today"
  # (July 2026) so Requested/Confirmed read as work still ahead of them rather
  # than as a pile of overdue orders. Five buyers across five locations, so the
  # buyer / location / date filters (PRD story 2) have something real to filter.

  # Requested — new, unactioned. These carry the "New" highlight (PRD story 1).
  PurchaseOrder.new(
    id: "012-CHARLES-00024",
    **JHU_CHARLES,
    date_range: { start: "07/13/2026", end: "07/24/2026" },
    status: "Processing", total: 750.20,
    cureator_name: "Cureate DMV", created_at: "2026-07-10",
    delivery_date: "2026-07-22", delivery_date_short: "Jul 22",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16820", quantity: 6, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Next delivery: 07/22/2026",
                     order_note: "Fall semester move-in. Dock opens 6am."),
      POLineItem.new(vendor_id: "2betties", product_id: "16824", quantity: 5, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Next delivery: 07/22/2026"),
    ],
  ),
  PurchaseOrder.new(
    id: "013-UA-00004",
    **UNDER_ARMOUR,
    date_range: { start: "07/13/2026", end: "07/29/2026" },
    status: "Processing", total: 272.80,
    cureator_name: "Cureate DMV", created_at: "2026-07-11",
    delivery_date: "2026-07-29", delivery_date_short: "Jul 29",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16822", quantity: 4, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Next delivery: 07/29/2026",
                     order_note: "Employee café restock — lemon is the favorite."),
    ],
  ),

  # Confirmed — vendor has accepted; production is committed.
  PurchaseOrder.new(
    id: "014-BRENDA-00110",
    **MERCY,
    date_range: { start: "07/06/2026", end: "07/17/2026" },
    status: "Confirmed", total: 545.60,
    cureator_name: "Cureate DMV", created_at: "2026-07-02",
    delivery_date: "2026-07-17", delivery_date_short: "Jul 17",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16821", quantity: 4, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Next delivery: 07/17/2026",
                     order_note: "Staff appreciation week."),
      POLineItem.new(vendor_id: "2betties", product_id: "16823", quantity: 4, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Next delivery: 07/17/2026"),
    ],
  ),
  PurchaseOrder.new(
    id: "015-MARKET-00008",
    **CONVENTION,
    date_range: { start: "07/06/2026", end: "07/15/2026" },
    status: "Confirmed", total: 409.20,
    cureator_name: "Cureate DMV", created_at: "2026-07-01",
    delivery_date: "2026-07-15", delivery_date_short: "Jul 15",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16820", quantity: 3, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Next delivery: 07/15/2026",
                     order_note: "Regional food expo — booth catering."),
      POLineItem.new(vendor_id: "2betties", product_id: "16824", quantity: 3, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Next delivery: 07/15/2026"),
    ],
  ),

  # ── Fulfillment (E3) ────────────────────────────────────────────────────────
  # `fulfillment_by_vendor` is written by the MOBILE DATA-INGESTION APP, not here.
  # These seeds reproduce the four states that app can leave an order in, because
  # each one renders differently in the vendor dashboard:
  #
  #   016  Shipping + tracking entered      → ✓ Tracking added
  #   017  Truck + driver photo + accepted  → proof photo, Delivery Received
  #   020  Shipping, driver hit "Add Later" → ⚠ Tracking code needed  ← THE ACTION
  #   021  Truck + photo + buyer flagged    → Delivery Issue Found (ticket open)

  # Shipping, tracking already captured on the driver's phone.
  PurchaseOrder.new(
    id: "016-STEPH-00012",
    **JHU_HOMEWOOD,
    date_range: { start: "06/29/2026", end: "07/08/2026" },
    status: "Delivered", total: 613.80, fulfillment_method: "Shipping",
    fulfillment_by_vendor: {
      "2betties" => {
        method: "Shipping", handling: "Ambient", parcels: 9,
        carrier: "UPS", tracking: "1Z999AA10987654321",
        buyer_response: "accepted", buyer_responded_at: "Jul 8, 2026",
      },
    },
    cureator_name: "Cureate DMV", created_at: "2026-06-26",
    delivery_date: "2026-07-08", delivery_date_short: "Jul 8",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16822", quantity: 5, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Shipped 07/06/2026"),
      POLineItem.new(vendor_id: "2betties", product_id: "16821", quantity: 4, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Shipped 07/06/2026"),
    ],
  ),

  # Truck delivery — driver photographed the drop-off. Buyer stayed silent past 24h,
  # which counts as acceptance.
  PurchaseOrder.new(
    id: "017-UA-00006",
    **UNDER_ARMOUR,
    date_range: { start: "06/29/2026", end: "07/10/2026" },
    status: "Delivered", total: 204.60, fulfillment_method: "Delivery",
    fulfillment_by_vendor: {
      "2betties" => {
        method: "Delivery", handling: "Ambient", parcels: 3,
        proof_photo: "/delivery-proof.jpg",
        proof_captured_at: "Jul 10, 2026 · 2:14 PM",
        proof_captured_by: "Dev O. (driver)",
        buyer_response: "silent", buyer_responded_at: "Jul 11, 2026",
      },
    },
    cureator_name: "Cureate DMV", created_at: "2026-06-25",
    delivery_date: "2026-07-10", delivery_date_short: "Jul 10",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16823", quantity: 3, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Delivered 07/10/2026"),
    ],
  ),

  # ⚠ THE ONE THAT NEEDS THE VENDOR. Driver tapped "Add Later" in the mobile app —
  # the parcels are with FedEx but nobody has entered the tracking code. This is the
  # deferred state the dashboard exists to resolve.
  PurchaseOrder.new(
    id: "020-CHARLES-00026",
    **JHU_CHARLES,
    date_range: { start: "07/06/2026", end: "07/11/2026" },
    status: "Delivered", total: 340.00, fulfillment_method: "Shipping",
    fulfillment_by_vendor: {
      "2betties" => {
        method: "Shipping", handling: "Ambient", parcels: 6,
        carrier: "FedEx", tracking: nil,   # ← "Add Later"
      },
    },
    cureator_name: "Cureate DMV", created_at: "2026-07-03",
    delivery_date: "2026-07-11", delivery_date_short: "Jul 11",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16824", quantity: 3, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Shipped 07/09/2026"),
      POLineItem.new(vendor_id: "2betties", product_id: "16820", quantity: 2, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Shipped 07/09/2026"),
    ],
  ),

  # ⚠ PROOF NEEDED. The vendor marked this for truck delivery, but the driver hasn't
  # uploaded the drop-off photo yet. Unlike Tracking Needed, the VENDOR can't fix this
  # one — only the driver can. It still blocks invoicing, which is why it's loud.
  PurchaseOrder.new(
    id: "022-UA-00009",
    **UNDER_ARMOUR,
    date_range: { start: "07/06/2026", end: "07/11/2026" },
    status: "Delivered", total: 409.20, fulfillment_method: "Delivery",
    fulfillment_by_vendor: {
      "2betties" => {
        method: "Delivery", handling: "Ambient", parcels: 6,
        proof_photo: nil,   # ← driver hasn't captured it
      },
    },
    cureator_name: "Cureate DMV", created_at: "2026-07-04",
    delivery_date: "2026-07-11", delivery_date_short: "Jul 11",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16821", quantity: 6, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Out for delivery 07/11/2026"),
    ],
  ),

  # Buyer flagged a problem inside the 24h window → ticket opened, Cureate triaging.
  PurchaseOrder.new(
    id: "021-BRENDA-00112",
    **MERCY,
    date_range: { start: "07/06/2026", end: "07/09/2026" },
    status: "Delivered", total: 272.80, fulfillment_method: "Delivery",
    fulfillment_by_vendor: {
      "2betties" => {
        method: "Delivery", handling: "Cold", parcels: 4,
        proof_photo: "/delivery-proof.jpg",
        proof_captured_at: "Jul 9, 2026 · 7:52 AM",
        proof_captured_by: "Dev O. (driver)",
        buyer_response: "issue", buyer_responded_at: "Jul 9, 2026",
        issue_ticket: "TKT-3041",
        issue_note: "Two cases arrived warm. Cold-chain check requested.",
      },
    },
    cureator_name: "Cureate DMV", created_at: "2026-07-02",
    delivery_date: "2026-07-09", delivery_date_short: "Jul 9",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16821", quantity: 4, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Delivered 07/09/2026"),
    ],
  ),

  # Invoiced — billed / settled.
  PurchaseOrder.new(
    id: "018-BRENDA-00105",
    **MERCY,
    date_range: { start: "06/08/2026", end: "06/19/2026" },
    status: "Invoiced", total: 477.40,
    # OVERDUE — due June 30, unpaid, and today is July 12. Overdue is DERIVED from the due
    # date, never stored: a stored flag is always one cron job away from lying.
    invoice_number: "INV-00105", invoice_status: "Submitted",
    invoiced_at: "2026-05-31", invoice_due_date: "2026-06-30",
    invoice_sent_at: "2026-05-31", invoice_sent_to: ["brenda.okafor@mercy.com"],
    invoice_memo: "Thanks again — please remit within terms.",
    cureator_name: "Cureate DMV", created_at: "2026-06-05",
    delivery_date: "2026-06-19", delivery_date_short: "Jun 19",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16820", quantity: 7, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Delivered 06/19/2026"),
    ],
  ),

  # SUBMITTED — freshly issued, well inside terms. (The only other Submitted invoice,
  # INV-00105, has aged past its due date and therefore DISPLAYS as Overdue.)
  PurchaseOrder.new(
    id: "025-CHARLES-00030",
    **JHU_CHARLES,
    date_range: { start: "06/29/2026", end: "07/06/2026" },
    status: "Invoiced", total: 613.80, fulfillment_method: "Delivery",
    fulfillment_by_vendor: {
      "2betties" => {
        method: "Delivery", handling: "Ambient", parcels: 9,
        proof_photo: "/delivery-proof.jpg",
        proof_captured_at: "Jul 6, 2026 · 7:40 AM", proof_captured_by: "Dev O. (driver)",
        buyer_response: "accepted", buyer_responded_at: "Jul 6, 2026",
      },
    },
    invoice_number: "INV-00030", invoice_status: "Submitted",
    invoiced_at: "2026-07-08", invoice_due_date: "2026-08-07",
    invoice_sent_at: "2026-07-08", invoice_sent_to: ["charles.ruiz@jhu.edu"],
    cureator_name: "Cureate DMV", created_at: "2026-06-26",
    delivery_date: "2026-07-06", delivery_date_short: "Jul 6",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16823", quantity: 5, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Delivered 07/06/2026"),
      POLineItem.new(vendor_id: "2betties", product_id: "16820", quantity: 4, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Delivered 07/06/2026"),
    ],
  ),

  # ── Invoices (E5) — the remaining PRD statuses, on 2Betties orders ──────────
  # PRD story 7 names five: Submitted, Approved, Payment Pending, Paid, Overdue.
  # Paid = 002, Overdue (derived) = 018. These two supply Approved and Payment Pending.
  PurchaseOrder.new(
    id: "023-UA-00011",
    **UNDER_ARMOUR,
    date_range: { start: "06/15/2026", end: "06/24/2026" },
    status: "Invoiced", total: 545.60, fulfillment_method: "Delivery",
    fulfillment_by_vendor: {
      "2betties" => {
        method: "Delivery", handling: "Ambient", parcels: 8,
        proof_photo: "/delivery-proof.jpg",
        proof_captured_at: "Jun 24, 2026 · 9:05 AM", proof_captured_by: "Dev O. (driver)",
        buyer_response: "accepted", buyer_responded_at: "Jun 24, 2026",
      },
    },
    invoice_number: "INV-00011", invoice_status: "Approved",
    invoiced_at: "2026-06-25", invoice_due_date: "2026-07-25",
    invoice_sent_at: "2026-06-25", invoice_sent_to: ["priya.raman@underarmour.com", "ap@underarmour.com"],
    cureator_name: "Cureate DMV", created_at: "2026-06-12",
    delivery_date: "2026-06-24", delivery_date_short: "Jun 24",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16820", quantity: 4, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Delivered 06/24/2026"),
      POLineItem.new(vendor_id: "2betties", product_id: "16822", quantity: 4, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Delivered 06/24/2026"),
    ],
  ),
  PurchaseOrder.new(
    id: "024-MARKET-00012",
    **CONVENTION,
    date_range: { start: "06/22/2026", end: "07/01/2026" },
    status: "Invoiced", total: 409.20, fulfillment_method: "Shipping",
    fulfillment_by_vendor: {
      "2betties" => {
        method: "Shipping", handling: "Ambient", parcels: 6,
        carrier: "UPS", tracking: "1Z999AA10555512345",
        buyer_response: "silent", buyer_responded_at: "Jul 2, 2026",
      },
    },
    invoice_number: "INV-00012", invoice_status: "Payment Pending",
    invoiced_at: "2026-07-02", invoice_due_date: "2026-08-01",
    invoice_sent_at: "2026-07-02", invoice_sent_to: ["marcus.webb@bccenter.org"],
    invoice_memo: "Regional food expo — thanks for having us.",
    cureator_name: "Cureate DMV", created_at: "2026-06-19",
    delivery_date: "2026-07-01", delivery_date_short: "Jul 1",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16824", quantity: 3, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Shipped 06/29/2026"),
      POLineItem.new(vendor_id: "2betties", product_id: "16821", quantity: 3, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Shipped 06/29/2026"),
    ],
  ),

  # Cancelled — buyer pulled the order after it reached the vendor.
  PurchaseOrder.new(
    id: "019-MARKET-00005",
    **CONVENTION,
    date_range: { start: "06/15/2026", end: "06/26/2026" },
    status: "Cancelled", total: 136.40,
    cureator_name: "Cureate DMV", created_at: "2026-06-12",
    delivery_date: "2026-06-26", delivery_date_short: "Jun 26",
    line_items: [
      POLineItem.new(vendor_id: "2betties", product_id: "16824", quantity: 2, unit: "cases",
                     unit_price: 68.20, delivery_schedule: "Cancelled 06/18/2026",
                     order_note: "Event postponed to fall."),
    ],
  ),
])

# ─── Evergreen delivery dates ─────────────────────────────────────────────────
# The open orders above (Processing/"Requested" and Confirmed) carry hardcoded
# delivery dates that drift into the past as real time moves on — leaving the
# Deliveries page with nothing upcoming and a wall of overdue flags. Re-date
# them relative to today at boot so the demo always exercises every delivery-
# management use case: a couple genuinely overdue (the flagging story), and the
# rest spread across the next four weeks (the calendar + 30-day list stories).
# Done/Cancelled orders keep their fixed dates — history is allowed to age.
require "date"
open_pos = PurchaseOrder.all.select { |po|
  %w[Processing Confirmed].include?(po.status) && !po.delivery_date.to_s.empty?
}
vendor_open, other_open = open_pos.partition { |po| po.includes_vendor?("2betties") }

# Days from today for the demo vendor's open orders, in original date order:
# two stay overdue, the rest land ahead — nearest first so "upcoming" is never empty.
offsets = [-6, -2, 2, 5, 9, 14, 21, 28]
vendor_open.sort_by(&:delivery_date).each_with_index do |po, i|
  d = Date.today + (offsets[i] || (28 + 7 * (i - offsets.size + 1)))
  po.delivery_date       = d.iso8601
  po.delivery_date_short = d.strftime("%b %-d")
end

# Open orders that don't involve the demo vendor just stay plausibly current.
other_open.each do |po|
  d = Date.today + 3
  po.delivery_date       = d.iso8601
  po.delivery_date_short = d.strftime("%b %-d")
end
