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

  # Display labels (T05). The underlying status enum above is unchanged — only the
  # text shown to buyers differs: "In Review" is clarified to "In-Review by Cureate".
  STATUS_LABELS = {
    "In Review"  => "In-Review by Cureate",
    # "Delivered" is now shown as "Fulfillment" — orders can be fulfilled by the
    # vendor's own delivery or by shipping. Underlying enum stays "Delivered".
    "Delivered"  => "Fulfillment",
  }.freeze

  def self.label_for(status)
    STATUS_LABELS[status] || status
  end

  ATTRS = %i[
    id status total cureator_name created_at delivery_date delivery_date_short
    date_range line_items fulfillment_method fulfillment_by_vendor
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

  # Tab grouping used by the index page. Visible-by-default tabs come first;
  # rarely-clicked statuses are flagged `overflow:` and demoted in the UI (T05).
  # `value` (URL param) and `statuses` (underlying enum) are unchanged.
  TAB_DEFINITIONS = [
    { label: "Draft",                value: "draft",      statuses: ["Draft"] },
    { label: "In-Review by Cureate", value: "in-review",  statuses: ["In Review"] },
    { label: "Processing",           value: "processing", statuses: ["Processing"] },
    { label: "Confirmed",            value: "confirmed",  statuses: ["Confirmed"] },
    { label: "Fulfillment",          value: "delivered",  statuses: ["Delivered"] },
    { label: "Paid",                 value: "paid",       statuses: ["Paid"] },
    { label: "Invoiced",             value: "invoiced",   statuses: ["Invoiced"],  overflow: true },
    { label: "Cancelled",            value: "cancelled",  statuses: ["Cancelled"], overflow: true },
  ].freeze

  def self.primary_tabs
    TAB_DEFINITIONS.reject { |t| t[:overflow] }
  end

  def self.overflow_tabs
    TAB_DEFINITIONS.select { |t| t[:overflow] }
  end

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
