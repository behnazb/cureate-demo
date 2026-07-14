class PurchaseOrdersController < ApplicationController
  # The submit endpoint is a demo convenience (no auth/session) — skip CSRF for it.
  skip_before_action :verify_authenticity_token, only: :create, raise: false

  def index
    @search = params[:q].to_s
    @view = %w[table board].include?(params[:view]) ? params[:view] : "table"
    raw_tab = params[:tab]
    @active_tab = PurchaseOrder.normalize_tab(raw_tab)
    @tab_config = PurchaseOrder.tab_for(@active_tab)
    @date_range = params[:range].presence || "30"

    all = PurchaseOrder.all
    if @search.present?
      q = @search.downcase
      all = all.select { |po| po.id.downcase.include?(q) || po.status.downcase.include?(q) }
    end

    # Table view is filtered to the active status tab.
    @purchase_orders = all.select { |po| @tab_config[:statuses].include?(po.status) }

    # Board view: one column per status (same definitions that drive the tabs).
    @board_columns = PurchaseOrder::TAB_DEFINITIONS.map { |t|
      { label: t[:label], value: t[:value], pos: all.select { |po| t[:statuses].include?(po.status) } }
    }
  end

  def show
    @po = PurchaseOrder.find(params[:id])
    return render_not_found unless @po

    fulfillment = @po.fulfillment_by_vendor || {}
    @items_by_vendor = Vendor.all.map { |vendor|
      lines = @po.line_items.select { |li| li.vendor_id == vendor.id }
      next nil if lines.empty?
      subtotal = lines.sum { |li| li.extended_cost }
      { vendor: vendor, items: lines, vendor_subtotal: subtotal, fulfillment: fulfillment[vendor.id] }
    }.compact

    @subtotal       = @items_by_vendor.sum { |g| g[:vendor_subtotal] }
    @processing_fee = @subtotal * 0.10
    @total          = @subtotal + @processing_fee
  end

  # POST /purchase_orders
  # Registers a just-submitted cart as an in-memory PO so it's viewable ("View
  # Purchase Order") and appears in the list under "In Review". No database — the
  # record lives in the process and resets on restart. Mirrors what the production
  # app would persist server-side on submit.
  def create
    id = params[:id].to_s.strip
    return head(:unprocessable_entity) if id.blank?

    week = params[:delivery_week].to_s
    line_items = Array(params[:items]).filter_map do |it|
      vendor  = Vendor.find(it[:vendor_id])
      product = vendor&.products&.find { |p| p.id == it[:product_id] }
      next unless product
      frequency = %w[single weekly biweekly].include?(it[:frequency].to_s) ? it[:frequency].to_s : "single"
      # single → ISO date string; recurring → array of weekday abbrevs (multi-select)
      raw_spec = it[:delivery_spec]
      spec     = raw_spec.is_a?(Array) ? raw_spec.map(&:to_s).reject(&:blank?) : raw_spec.to_s
      repeat_until = it[:repeat_until].to_s.strip.presence
      POLineItem.new(
        vendor_id:         it[:vendor_id],
        product_id:        it[:product_id],
        quantity:          it[:quantity].to_i,
        unit:              it[:unit].presence || "units",
        unit_price:        product.wholesale_unit_price,
        delivery_fee:      0,
        frequency:         frequency,
        delivery_spec:     spec.presence,
        repeat_until:      repeat_until,
        delivery_schedule: schedule_label(frequency, spec, repeat_until),
        order_note:        it[:order_note].to_s.strip.presence,
      )
    end

    subtotal = line_items.sum(&:extended_cost)
    po = PurchaseOrder.new(
      id: id,
      status: "In Review",
      total: (subtotal * 1.10).round(2),
      cureator_name: "Cureate DMV",
      created_at: Date.today.iso8601,
      delivery_date: week.presence,
      delivery_date_short: short_delivery(week),
      date_range: nil,
      line_items: line_items,
    )

    # Idempotent — replace any existing record with this id (e.g. a re-submit).
    PurchaseOrder.all.reject! { |p| p.id == id }
    PurchaseOrder.all << po

    render json: { id: po.id }, status: :created
  end

  private

  DAY_NAMES = {
    "Mon" => "Monday", "Tue" => "Tuesday", "Wed" => "Wednesday",
    "Thu" => "Thursday", "Fri" => "Friday", "Sat" => "Saturday", "Sun" => "Sunday",
  }.freeze

  # Human-readable label for a line's frequency + spec, mirroring the strings the
  # seeds already use so submitted and seeded POs read the same in the views.
  #   single   + "2026-07-22"       → "Next delivery: 07/22/2026"
  #   weekly   + ["Mon"]            → "Weekly · Mondays"
  #   weekly   + ["Mon", "Wed"]     → "Weekly · Mondays & Wednesdays"
  #   biweekly + ["Fri"] + end date → "Bi-weekly · Fridays · until 09/30/2026"
  def schedule_label(frequency, spec, repeat_until = nil)
    case frequency
    when "weekly", "biweekly"
      days = Array(spec).map { |d| "#{DAY_NAMES.fetch(d.to_s, d.to_s)}s" }
      return nil if days.empty?
      list  = days.length > 1 ? "#{days[0..-2].join(', ')} & #{days[-1]}" : days[0]
      label = "#{frequency == 'weekly' ? 'Weekly' : 'Bi-weekly'} · #{list}"
      until_date = parse_iso(repeat_until)
      until_date ? "#{label} · until #{until_date.strftime('%m/%d/%Y')}" : label
    else
      date = parse_iso(spec)
      date && "Next delivery: #{date.strftime('%m/%d/%Y')}"
    end
  end

  def parse_iso(value)
    Date.iso8601(value.to_s)
  rescue ArgumentError, TypeError
    nil
  end

  def short_delivery(iso)
    return nil if iso.blank?
    Date.iso8601(iso).strftime("%b %-d")
  rescue ArgumentError
    nil
  end

  def render_not_found
    render file: Rails.root.join("public/404.html"), status: :not_found, layout: false
  end
end
