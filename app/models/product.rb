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
  ].freeze
  attr_accessor(*ATTRS)

  def initialize(attrs = {})
    attrs.each { |k, v| public_send("#{k}=", v) }
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
