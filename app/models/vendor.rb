# Vendor — PORO placeholder for the production ActiveRecord model.
#
# View templates rely on these readers/methods:
#   vendor.id, vendor.name, vendor.location, vendor.address,
#   vendor.website, vendor.business_type, vendor.revenue, vendor.employees,
#   vendor.certifications (Array<String>), vendor.categories (Array<String>),
#   vendor.delivery_schedule, vendor.min_order_quantity,
#   vendor.logo, vendor.about, vendor.story, vendor.owned, vendor.goals,
#   vendor.products (Array<Product>),
#   vendor.order_rules (Hash w/ :min_cases, :units_per_case, :min_units, :mix_and_match, :mix_and_match_note)
#   vendor.goal_icon_path
#   vendor.short_certifications (cert names with " Business" stripped)
class Vendor
  ATTRS = %i[
    id name location address website business_type revenue employees
    certifications categories delivery_schedule delivery_area min_order_quantity
    delivery_days preferred_delivery_day
    logo about story owned goals order_rules products social_links
    insurance health_clearance production seasonal_offerings growth_goals
    email remit_to
    owner_names city state street_address address_line2 zip phone
    delivery_shipping moq_details
    banner_image banner_category founder_photo
    shipping_days business_identity personal_identity
    marketing_opportunities marketing_opportunities_details
    sales_channels channel_data
  ].freeze
  attr_accessor(*ATTRS)

  GOAL_ICONS = {
    "Retail Product"         => "/icons/icon_retail.svg",
    "Back-of-House Product"  => "/icons/icon_backofhouse.svg",
  }.freeze

  def initialize(attrs = {})
    attrs.each { |k, v| public_send("#{k}=", v) }
  end

  def short_certifications
    (certifications || []).map { |c| c.sub(/\s*Business\s*$/i, "") }
  end

  def goal_icon_path
    return nil if goals.blank?
    GOAL_ICONS[goals.first]
  end

  # In-memory registry
  class << self
    def all
      @all ||= []
    end

    def find(id)
      all.find { |v| v.id == id }
    end

    def reset!
      @all = []
    end
  end
end
