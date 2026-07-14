# POLineItem — PORO placeholder for the production ActiveRecord model.
#
# View templates rely on:
#   line_item.vendor_id, line_item.product_id,
#   line_item.quantity, line_item.unit ("units" | "cases"),
#   line_item.unit_price, line_item.delivery_fee,
#   line_item.delivery_schedule, line_item.order_note,
#   line_item.product (Product lookup), line_item.vendor (Vendor lookup),
#   line_item.extended_cost
#
# Per-line frequency (buyer sets it in the Draft PO before submitting):
#   frequency     — "single" | "weekly" | "biweekly" (nil on legacy/seeded lines)
#   delivery_spec — ISO date for "single"; array of weekday abbrevs
#                   (["Mon", "Wed"], multi-select) for recurring
#   repeat_until  — ISO date the recurrence ends on, nil = no end date
#   delivery_schedule stays the human-readable label views render.
class POLineItem
  ATTRS = %i[
    vendor_id product_id quantity unit unit_price
    delivery_fee delivery_schedule order_note
    frequency delivery_spec repeat_until
  ].freeze
  attr_accessor(*ATTRS)

  def recurring?
    %w[weekly biweekly].include?(frequency.to_s)
  end

  def initialize(attrs = {})
    attrs.each { |k, v| public_send("#{k}=", v) }
  end

  def vendor
    Vendor.find(vendor_id)
  end

  def product
    vendor&.products&.find { |p| p.id == product_id }
  end

  def extended_cost
    unit_price.to_f * quantity.to_i
  end
end
