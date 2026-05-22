# PurchaseOrder — PORO placeholder for the production ActiveRecord model.
#
# View templates rely on:
#   po.id, po.status, po.total, po.cureator_name, po.created_at,
#   po.delivery_date (ISO string), po.delivery_date_short,
#   po.date_range (Hash{start:, end:} or nil),
#   po.line_items (Array<POLineItem>),
#   po.draft?, po.locked?
class PurchaseOrder
  STATUSES = %w[Draft In\ Review Processing Confirmed Delivered Invoiced Paid Cancelled].freeze

  ATTRS = %i[
    id status total cureator_name created_at delivery_date delivery_date_short
    date_range line_items
  ].freeze
  attr_accessor(*ATTRS)

  def initialize(attrs = {})
    attrs.each { |k, v| public_send("#{k}=", v) }
    self.line_items ||= []
  end

  def draft?
    status == "Draft"
  end

  def locked?
    %w[Delivered Cancelled].include?(status)
  end

  # Tab grouping used by the index page
  TAB_DEFINITIONS = [
    { label: "Draft",      value: "draft",      statuses: ["Draft"] },
    { label: "In Review",  value: "in-review",  statuses: ["In Review"] },
    { label: "Processing", value: "processing", statuses: ["Processing"] },
    { label: "Confirmed",  value: "confirmed",  statuses: ["Confirmed"] },
    { label: "Delivered",  value: "delivered",  statuses: ["Delivered"] },
    { label: "Invoiced",   value: "invoiced",   statuses: ["Invoiced"] },
    { label: "Paid",       value: "paid",       statuses: ["Paid"] },
    { label: "Cancelled",  value: "cancelled",  statuses: ["Cancelled"] },
  ].freeze

  def self.tab_for(value)
    TAB_DEFINITIONS.find { |t| t[:value] == value } || TAB_DEFINITIONS.first
  end

  def self.normalize_tab(raw)
    return "in-review" if raw == "submitted"
    raw.presence || "draft"
  end

  class << self
    def all
      @all ||= []
    end

    def find(id)
      all.find { |p| p.id == id }
    end

    def reset!
      @all = []
    end
  end
end
