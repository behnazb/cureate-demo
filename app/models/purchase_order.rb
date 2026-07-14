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

  # ─── Vendor vocabulary (D1) ────────────────────────────────────────────────
  # ONE state machine, TWO label maps. The vendor PRD names five statuses that
  # don't match the buyer enum; they are labels over the same underlying values,
  # never a second enum. (Two enums would be a permanent bug factory.)
  #
  #   buyer enum   →  vendor label
  #   Draft        →  (hidden — buyer hasn't submitted)
  #   In Review    →  (hidden — Cureate hasn't released it to the vendor yet)
  #   Processing   →  Requested      ← the order reaches the vendor here
  #   Confirmed    →  Confirmed
  #   Delivered    →  Fulfillment
  #   Invoiced     →  Invoiced
  #   Paid         →  Paid           ← lives INSIDE the Invoiced tab, not folded into it
  #   Cancelled    →  Cancelled
  VENDOR_STATUS_LABELS = {
    "Processing" => "Requested",
    "Confirmed"  => "Confirmed",
    "Delivered"  => "Fulfillment",
    "Invoiced"   => "Invoiced",
    "Paid"       => "Paid",
    "Cancelled"  => "Cancelled",
  }.freeze

  # Statuses a vendor is never shown. The buyer is still drafting, or the order is
  # sitting with Cureate — either way it isn't the vendor's business yet.
  VENDOR_HIDDEN_STATUSES = ["Draft", "In Review"].freeze

  def self.vendor_label_for(status)
    VENDOR_STATUS_LABELS[status] || status
  end

  def self.vendor_visible?(status)
    !VENDOR_HIDDEN_STATUSES.include?(status)
  end

  # Vendor tabs, in PRD order (story 1). Same shape as TAB_DEFINITIONS so the
  # existing tab/board components render them without modification.
  VENDOR_TAB_DEFINITIONS = [
    { label: "Requested",   value: "requested",   statuses: ["Processing"] },
    { label: "Confirmed",   value: "confirmed",   statuses: ["Confirmed"] },
    { label: "Fulfillment", value: "fulfillment", statuses: ["Delivered"] },
    { label: "Invoiced",    value: "invoiced",    statuses: ["Invoiced", "Paid"] },
    { label: "Cancelled",   value: "cancelled",   statuses: ["Cancelled"] },
  ].freeze

  def self.vendor_tab_for(value)
    VENDOR_TAB_DEFINITIONS.find { |t| t[:value] == value } || VENDOR_TAB_DEFINITIONS.first
  end

  def self.normalize_vendor_tab(raw)
    return VENDOR_TAB_DEFINITIONS.first[:value] if raw.blank?
    VENDOR_TAB_DEFINITIONS.any? { |t| t[:value] == raw } ? raw : VENDOR_TAB_DEFINITIONS.first[:value]
  end

  ATTRS = %i[
    id status total cureator_name created_at delivery_date delivery_date_short
    date_range line_items fulfillment_method fulfillment_by_vendor
    buyer_org buyer_contact delivery_location delivery_address
    decline_reason decline_note invoiced_at paid_at
    invoice_number invoice_status invoice_due_date invoice_sent_at invoice_sent_to invoice_memo
  ].freeze
  attr_accessor(*ATTRS)

  # ─── Vendor-scoped views of a PO ───────────────────────────────────────────
  # A PO can span several vendors. From 2Betties' side of the table, "this order"
  # means only their own lines and only their own subtotal — never the buyer's
  # total, which includes other vendors' goods and Cureate's processing fee (D2).
  def line_items_for(vendor_id)
    line_items.select { |li| li.vendor_id == vendor_id }
  end

  def includes_vendor?(vendor_id)
    line_items.any? { |li| li.vendor_id == vendor_id }
  end

  def vendor_subtotal(vendor_id)
    line_items_for(vendor_id).sum(&:extended_cost)
  end

  def vendor_unit_count(vendor_id)
    line_items_for(vendor_id).sum { |li| li.quantity.to_i }
  end

  # ─── Delivery verification (E3) ────────────────────────────────────────────
  # The per-vendor fulfillment hash is written by the SEPARATE mobile data-ingestion
  # app, not by this dashboard. Its shape mirrors that app's fulfillment flow:
  #
  #   method:      "Delivery" (Cureate truck) | "Shipping" (UPS/FedEx/USPS)
  #   handling:    "Ambient" | "Cold" | "Frozen" | "Warm"
  #   parcels:     Integer
  #   carrier:     "UPS" | "FedEx" | "USPS"        (Shipping only)
  #   tracking:    String | nil                     (Shipping only; nil = "Add Later")
  #   tracking_updated_by / tracking_updated_at:    set when a vendor admin fills or
  #                                                 corrects it from THIS dashboard
  #   proof_photo / proof_captured_at / proof_captured_by:  (Truck only) the driver's
  #                                                 photo, captured at the drop-off
  #   buyer_response: "accepted" | "silent" | "issue" | nil (nil = 24h window still open)
  #   buyer_responded_at, issue_ticket, issue_note
  #
  # The dashboard treats all of it as read-only EXCEPT `tracking` — see D-E3.
  def fulfillment_for(vendor_id)
    (fulfillment_by_vendor || {})[vendor_id]
  end

  def shipping?(vendor_id)
    fulfillment_for(vendor_id)&.dig(:method) == "Shipping"
  end

  def truck_delivery?(vendor_id)
    fulfillment_for(vendor_id)&.dig(:method) == "Delivery"
  end

  # The deferred state the mobile app creates when the driver taps "Add Later".
  # This is the one thing the vendor dashboard exists to resolve — and the thing
  # that turns the orders index into a daily action queue.
  def tracking_needed?(vendor_id)
    shipping?(vendor_id) && fulfillment_for(vendor_id)[:tracking].blank?
  end

  def tracking_number(vendor_id)
    fulfillment_for(vendor_id)&.dig(:tracking).presence
  end

  # Proof photo exists only for truck deliveries — a shipped parcel has no Cureate
  # driver to photograph it. The carrier's tracking IS the proof for Shipping.
  def proof_photo(vendor_id)
    return nil unless truck_delivery?(vendor_id)
    fulfillment_for(vendor_id)[:proof_photo].presence
  end

  # Buyer acceptance (storyboard panel 8). The buyer has 24h to confirm or flag;
  # silence counts as acceptance. Collapsed to the two outcomes a VENDOR cares about.
  #
  #   :received  — buyer confirmed, or let the window lapse       → "Delivery Received"
  #   :issue     — buyer flagged it; ticket opened, Cureate triage → "Delivery Issue Found"
  #   :awaiting  — window still open                               → "Awaiting confirmation"
  def buyer_acceptance(vendor_id)
    f = fulfillment_for(vendor_id)
    return nil unless f
    case f[:buyer_response]
    when "issue"              then :issue
    when "accepted", "silent" then :received
    else :awaiting
    end
  end

  def issue_ticket(vendor_id)
    fulfillment_for(vendor_id)&.dig(:issue_ticket)
  end

  # Records a tracking number entered (or corrected) by a vendor admin in THIS
  # dashboard. In production this would also notify the buyer — PRD story 4.
  def set_tracking!(vendor_id, number, by:)
    # Once invoiced, nobody edits anything — including this.
    return false if vendor_locked?
    f = (self.fulfillment_by_vendor ||= {})[vendor_id]
    return false unless f
    f[:tracking] = number.to_s.strip
    f[:tracking_updated_by] = by
    f[:tracking_updated_at] = Time.now.strftime("%b %-d, %Y")
    true
  end

  # "New" treatment in the vendor list (PRD story 1: new requests clearly
  # highlighted). A Requested order the vendor hasn't acted on yet.
  def new_request?
    status == "Processing"
  end

  # ─── The vendor lifecycle ──────────────────────────────────────────────────
  #
  #   Requested ──confirm──▶ Confirmed ──fulfill──▶ Fulfillment ──invoice──▶ Invoiced ──▶ Paid
  #      │                                          ├─ Delivery: driver's proof photo
  #      │                                          └─ Shipping: carrier tracking code
  #      └──decline──▶ Cancelled
  #
  # Each step unlocks the next. The vendor's job is four decisions:
  # confirm → fulfil → prove → invoice. Everything else is the system reporting back.
  #
  # Two steps are NOT the vendor's to take:
  #   • proof of delivery — the driver captures it in the mobile ingestion app
  #   • Paid — the buyer pays; the vendor only sees it land

  # A shipped order is proven by its tracking code; a truck delivery by the driver's
  # photo. Until one exists the order isn't really fulfilled, and can't be invoiced.
  def fulfillment_proven?(vendor_id)
    return false unless status == "Delivered"
    shipping?(vendor_id) ? tracking_number(vendor_id).present? : proof_photo(vendor_id).present?
  end

  # The mirror of tracking_needed? — but the vendor CANNOT resolve this one. Only the
  # driver can, from the ingestion app.
  def proof_needed?(vendor_id)
    status == "Delivered" && truck_delivery?(vendor_id) && proof_photo(vendor_id).blank?
  end

  # Invoicing is gated on the delivery being proven AND the buyer's 24h window closing
  # clean. Silence past the window counts as acceptance, so this unlocks on its own;
  # a flagged issue keeps it shut while Cureate triages.
  def can_invoice?(vendor_id)
    fulfillment_proven?(vendor_id) && buyer_acceptance(vendor_id) == :received
  end

  # Why the invoice button is disabled — shown to the vendor verbatim, so the gate is
  # never mysterious.
  def invoice_blocked_reason(vendor_id)
    return nil if can_invoice?(vendor_id)
    return "Add the tracking code before invoicing."    if tracking_needed?(vendor_id)
    return "Waiting on the driver's proof of delivery." if proof_needed?(vendor_id)
    case buyer_acceptance(vendor_id)
    when :issue    then "#{buyer_org} reported an issue. Cureate is triaging it."
    when :awaiting then "#{buyer_org} has 24 hours to confirm the delivery."
    else "This order isn't ready to invoice yet."
    end
  end

  # Once invoiced the order is frozen — including the tracking number. Money has been
  # asked for; the record behind it stops moving.
  def vendor_locked?
    %w[Invoiced Paid Cancelled].include?(status)
  end

  # ── Transitions ────────────────────────────────────────────────────────────

  def confirm!
    return false unless status == "Processing"
    self.status = "Confirmed"
    true
  end

  # Out of stock, can't hit the date, MOQ not met. Moves to Cancelled WITH A REASON,
  # so Cureate and the buyer know why — rather than the order rotting in Requested.
  def decline!(reason:, note: nil)
    return false unless status == "Processing"
    self.status         = "Cancelled"
    self.decline_reason = reason
    self.decline_note   = note.presence
    true
  end

  # The vendor commits to HOW this order goes out. Writes the same fulfillment record
  # the mobile ingestion app writes, so the two products share one data model.
  #   Delivery → our truck; the driver will photograph the drop-off
  #   Shipping → a carrier; needs a tracking code (now, or deferred)
  def fulfill!(vendor_id, method:, carrier: nil, tracking: nil, handling: "Ambient", parcels: nil)
    return false unless status == "Confirmed"
    return false unless %w[Delivery Shipping].include?(method)

    self.status = "Delivered"
    self.fulfillment_method = method
    self.fulfillment_by_vendor ||= {}
    self.fulfillment_by_vendor[vendor_id] = {
      method:   method,
      handling: handling.presence || "Ambient",
      parcels:  (parcels.presence&.to_i || line_items_for(vendor_id).sum { |li| li.quantity.to_i }),
      carrier:  (method == "Shipping" ? carrier.presence : nil),
      tracking: (method == "Shipping" ? tracking.presence : nil),
    }
    true
  end

  # ─── Invoicing (E5) ────────────────────────────────────────────────────────
  #
  # RECONCILING THE PRD WITH THE FLOW:
  #
  # PRD story 7 lists five invoice statuses — Submitted, Approved, Payment Pending, Paid,
  # Overdue — but the vendor PO enum only has Invoiced and Paid. They aren't in conflict:
  # the PRD's five are the LIFE OF THE INVOICE, which begins where the ORDER's life ends.
  # So the invoice carries its own status, and the PO's "Invoiced" is simply "an invoice
  # exists". One order status, five invoice statuses, no contradiction.
  #
  #   Submitted        the vendor generated it; it's with the buyer
  #   Approved         the buyer approved it for payment
  #   Payment Pending  payment is in flight
  #   Paid             money landed          → drives PO.status = "Paid"
  #   Overdue          past the due date, unpaid  (derived, not stored)
  #
  # Overdue is DERIVED from the due date rather than stored — a stored "overdue" flag is
  # always one cron job away from lying.
  INVOICE_STATUSES = ["Submitted", "Approved", "Payment Pending", "Paid"].freeze
  PAYMENT_TERMS_DAYS = 30

  def invoice?
    invoice_number.present?
  end

  # The status a vendor actually sees, with Overdue layered on top of the stored value.
  def invoice_display_status
    return nil unless invoice?
    return "Paid" if invoice_status == "Paid"
    overdue? ? "Overdue" : invoice_status
  end

  def overdue?
    return false unless invoice? && invoice_status != "Paid" && invoice_due_date.present?
    Date.iso8601(invoice_due_date) < Date.today
  rescue ArgumentError
    false
  end

  def days_until_due
    return nil unless invoice_due_date.present?
    (Date.iso8601(invoice_due_date) - Date.today).to_i
  rescue ArgumentError
    nil
  end

  def invoice_paid?
    invoice_status == "Paid"
  end

  # Manual and irreversible. The vendor pulls this trigger; the invoice is generated FROM
  # the purchase order (nothing is re-keyed), issued to the buyer, and the order freezes.
  def issue_invoice!(vendor_id)
    return false unless can_invoice?(vendor_id)
    self.status           = "Invoiced"
    self.invoiced_at      = Date.today.iso8601
    self.invoice_number   = "INV-#{id.to_s.split('-').last}"
    self.invoice_status   = "Submitted"
    self.invoice_due_date = (Date.today + PAYMENT_TERMS_DAYS).iso8601
    true
  end

  def mark_invoice_sent!(recipients, memo = nil)
    return false unless invoice?
    self.invoice_sent_at  = Date.today.iso8601
    self.invoice_sent_to  = Array(recipients).reject(&:blank?)
    self.invoice_memo     = memo.presence || invoice_memo
    true
  end

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
