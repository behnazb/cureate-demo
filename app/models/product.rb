# Product — PORO placeholder for the production ActiveRecord model.
#
# View templates rely on these readers:
#   product.id, product.name, product.upc, product.size,
#   product.wholesale_unit_price, product.msrp, product.case_pack,
#   product.units_per_case, product.wholesale_case_price, product.case_minimum,
#   product.storage, product.allergens (Array<String>), product.dietary (Array<String>),
#   product.cuisine, product.category, product.image, product.breadcrumb,
#   product.shipping_fee?  (true when this row represents a shipping fee line, not a product)
class Product
  ATTRS = %i[
    id name upc size wholesale_unit_price msrp case_pack units_per_case
    wholesale_case_price case_minimum unit_minimum unit_label units_per_item item_label
    storage allergens dietary cuisine
    category image breadcrumb is_shipping_fee vendor
    status inventory downloads
  ].freeze
  attr_accessor(*ATTRS)

  # ─── Vendor product management (E4) ────────────────────────────────────────
  #
  #   status     "published" — live in the buyer marketplace, orderable
  #              "draft"     — the vendor's private work-in-progress; buyers never see it
  #   inventory  units on hand. A NUMBER THE VENDOR MAINTAINS — deliberately NOT wired
  #              into the order lifecycle: confirming an order doesn't check or decrement
  #              it. If that changes, `can_confirm?` on PurchaseOrder is where it'd hook in.
  #   downloads  Array<Hash{name:, data:}> — spec sheets, sell sheets, COAs. `data` is a
  #              data-URL held in memory (see the upload note below).
  #
  # UPLOADS: images and PDFs are read in the BROWSER (FileReader → data URL) and posted as
  # text, so no disk or storage layer is needed. They live in the in-memory PORO and reset
  # when the server restarts. Real enough for a user-test session; swap for Active Storage
  # in production.
  STATUSES = %w[draft published].freeze

  def initialize(attrs = {})
    attrs.each { |k, v| public_send("#{k}=", v) }
    self.status    ||= "published"   # everything seeded is already on the marketplace
    self.allergens ||= []
    self.dietary   ||= []
    self.downloads ||= []
    self.inventory ||= 0
  end

  def published?
    status == "published"
  end

  def draft?
    status == "draft"
  end

  # ─── Listing quality (E4) ──────────────────────────────────────────────────
  #
  # Vendors don't fill in optional fields unless something asks them to, and a thin
  # listing is invisible on the marketplace. So the dashboard tells them exactly what's
  # missing and WHY it costs them — never a bare "incomplete" scold.
  #
  # Ordered by how much each gap actually hurts the listing on the buyer's side. The
  # photo is first by a distance: a buyer scanning a gallery scrolls past a grey square.
  # The photo, and the details a buyer needs to actually decide. Downloadables are
  # deliberately NOT checked: a spec sheet is a nice-to-have, and nagging vendors about
  # optional paperwork devalues the nudge for the thing that genuinely matters — the photo.
  # A nudge that asks for everything gets ignored like one that asks for nothing.
  LISTING_CHECKS = [
    { key: :image,   label: "Add a product photo",
      why: "Buyers scroll past listings without one." },
    { key: :storage, label: "Add storage & shelf life",
      why: "Buyers check this before they order food." },
    { key: :dietary, label: "Add dietary & allergen tags",
      why: "This is how buyers filter the marketplace — untagged products never surface." },
    { key: :upc,     label: "Add a UPC",
      why: "Needed for the buyer's receiving and inventory systems." },
    { key: :size,    label: "Add a unit size",
      why: "Buyers can't compare price without it." },
  ].freeze

  def listing_gap?(key)
    case key
    when :image   then image.blank?
    when :storage then storage.blank?
    when :dietary then Array(dietary).empty? && Array(allergens).empty?
    when :upc     then upc.blank?
    when :size    then size.blank?
    else false
    end
  end

  # The gaps, most damaging first.
  def listing_gaps
    LISTING_CHECKS.select { |c| listing_gap?(c[:key]) }
  end

  def listing_complete?
    listing_gaps.empty?
  end

  def listing_score
    [LISTING_CHECKS.size - listing_gaps.size, LISTING_CHECKS.size]
  end

  def shipping_fee?
    is_shipping_fee == true
  end

  # Dietary preference abbreviations used on the product detail page
  DIETARY_ABBR = {
    "Paleo"                     => "P",
    "Low-Fat"                   => "LF",
    "Low-Carb"                  => "LC",
    "Low-Sugar"                 => "LSU",
    "Low-Sodium"                => "LSO",
    "Vegan"                     => "V",
    "Vegetarian"                => "VG",
    "Gluten-Free"               => "GF",
    "Dairy-Free"                => "DF",
    "Keto"                      => "K",
    "High-Protein"              => "HP",
    "Organic / Naturally Grown" => "ON",
    "Keto-Friendly"             => "KF",
  }.freeze

  def dietary_abbr(pref)
    DIETARY_ABBR[pref] || pref.to_s.slice(0, 2).upcase
  end
end
