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
  revenue: "Early Stage ($500K-$1M/yr)",
  employees: "2-10",
  certifications: ["Woman-Owned Business"],
  categories: ["Snacks"],
  delivery_schedule: "Mon to Fri",
  min_order_quantity: "2 cases",
  logo: "/vendors/2betties/logo.jpeg",
  about: "2Betties makes better-for-you snacking easy and joyful. Certified Gluten-Free, Non-GMO, and Women-Owned.",
  owned: "Owned by: Nancy Becker and Bridget Greaney",
  story: "2Betties started in a college dorm room — co-founders on a mission to raise the bar one better bite at a time.",
  goals: ["Retail Product"],
  order_rules: {
    min_cases: 2, units_per_case: 6, min_units: 12, mix_and_match: true,
    mix_and_match_note: "Minimum 2 cases (12 units) required. Flavors are interchangeable to meet the minimum.",
  },
)

twobetties_flavors = [
  { id: "16820", name: "Bites (2-pack) - Chocolate Chip",   upc: "850004178164", image: "/vendors/2betties/chocolate-chip.png" },
  { id: "16821", name: "Bites (2-pack) - Chocolate Chunk",  upc: "861513000433", image: "/vendors/2betties/chocolate-chunk.png" },
  { id: "16822", name: "Bites (2-pack) - Lemon",            upc: "850004178201", image: "/products/2betties/2betties-lemon.png" },
  { id: "16823", name: "Bites (2-pack) - Maple Cinnamon",   upc: "861513000419", image: "/vendors/2betties/maple-cinnamon.png" },
  { id: "16824", name: "Bites (2-pack) - Sweet Almond",     upc: "850004178010", image: "/vendors/2betties/sweet-almond.png" },
]
twobetties.products = twobetties_flavors.map { |f|
  Product.new(
    id: f[:id], name: f[:name], upc: f[:upc], size: "1.4 oz",
    wholesale_unit_price: 1.89, msrp: 2.99, case_pack: 6, units_per_case: 6,
    wholesale_case_price: 68.20, case_minimum: 1,
    storage: "Dry/Ambient: 7-12 months",
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
  min_order_quantity: "1 case (12 units)",
  production: "Takoma Park Silver Spring Community Kitchen, 310 Tulip Ave, Takoma Park, MD",
  seasonal_offerings: "Farmers Markets, Holiday Markets, online",
  growth_goals: "At Ethiopian Delights, we are storytellers of Ethiopian culture through flavor. Our mission is to introduce authentic, high-quality Ethiopian-inspired cuisine to the D.C. metropolitan area.",
  logo: "/vendors/ethiopian-delights/logo.png",
  about: "Ethiopian Delights brings the rich and diverse flavors of Ethiopian cuisine to a global audience. We offer instant, ready-to-eat meals inspired by traditional Ethiopian dishes. All of our products are gluten-free and vegan.",
  story: "Beza Bisrat, MBA, is the founder of Ethiopian Delights. As an Ethiopian American, she felt disconnected from her culture when her career took her away from her home in Washington D.C. She found solace in cooking and was inspired to make authentic Ethiopian packaged food more accessible and visible.",
  owned: "Owned by: Beza Bisrat",
  goals: ["Retail Product"],
  social_links: { instagram: true, facebook: true },
  order_rules: {
    min_cases: 1, units_per_case: 12, min_units: 12, mix_and_match: true,
    mix_and_match_note: "Minimum 1 case (12 units) required. Flavors are interchangeable to meet the minimum.",
  },
)

ethiopian.products = [
  Product.new(
    id: "10616", name: "Spicy Red Lentil Stew", upc: "860012111305", size: "3.5 oz",
    wholesale_unit_price: 6.29, msrp: 8.99, case_pack: 12, units_per_case: 12,
    wholesale_case_price: 75.48, case_minimum: 1,
    storage: "1 year shelf life, no need for refrigeration",
    allergens: %w[Dairy-Free Peanut-Free Tree\ Nut-Free Seafood-Free Sesame-Free Egg-Free],
    dietary: ["Vegan", "Vegetarian", "Low-Sugar"],
    cuisine: "African", category: "Dry Goods",
    image: "/vendors/ethiopian-delights/spicy-red-lentil-stew.png", vendor: ethiopian,
  ),
  Product.new(
    id: "10617", name: "Mild Split Pea Stew", upc: "860012111312", size: "3.5 oz",
    wholesale_unit_price: 6.29, msrp: 8.99, case_pack: 12, units_per_case: 12,
    wholesale_case_price: 75.48, case_minimum: 1,
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
    min_cases: 2, units_per_case: 12, min_units: 24, mix_and_match: false,
    mix_and_match_note: "Minimum 2 cases (24 units) required.",
  },
)

open_seas.products = [
  Product.new(
    id: "16523", name: "Cold Brew, Can", upc: "12345678905", size: "12 oz",
    wholesale_unit_price: 3.25, msrp: 5.25, case_pack: 12, units_per_case: 12,
    wholesale_case_price: 39.00, case_minimum: 2,
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

PurchaseOrder.all.concat([
  PurchaseOrder.new(
    id: "004-CHARLES-00017",
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
    date_range: { start: "03/15/2026", end: "03/21/2026" },
    status: "Delivered", total: 889.00,
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
    date_range: { start: "02/10/2026", end: "02/24/2026" },
    status: "Cancelled", total: 412.00,
    cureator_name: "Cureate DMV", created_at: "2026-02-10",
    delivery_date: nil, delivery_date_short: nil,
    line_items: [],
  ),
])
