module ApplicationHelper
  # Canonical primary navigation — single source of truth so the desktop
  # sidebar (_sidebar) and the mobile drawer (_mobile_nav) can never drift
  # in order or items. Each renders its own styling; both read this list.
  #
  # Persona-aware (E0): the buyer and the vendor see different destinations from
  # the same component. Switching persona swaps this list, nothing else.
  def main_nav_links
    vendor_persona? ? vendor_nav_links : buyer_nav_links
  end

  def buyer_nav_links
    [
      { label: "Dashboard",       icon: "/icon_dashboard.svg",       href: root_path },
      { label: "Vendors",         icon: "/icon_vendors.svg",         href: vendors_path },
      { label: "All Orders",      icon: "/icon_all_orders.svg",      href: "#" },
      { label: "Purchase Orders", icon: "/icon_purchase_orders.svg", href: purchase_orders_path },
      { label: "Products",        icon: "/icon_products.svg",        href: products_path },
      { label: "Requests",        icon: "/icon_requests.svg",        href: "#" },
    ]
  end

  # Vendor nav. "Invoices" (round 2, E5) is still a placeholder — same "#" convention
  # the buyer nav already uses for unbuilt screens.
  def vendor_nav_links
    [
      { label: "Dashboard",  icon: "/icon_dashboard.svg",       href: vendor_dashboard_path },
      { label: "Orders",     icon: "/icon_purchase_orders.svg", href: vendor_orders_path },
      { label: "Deliveries", icon: "/icon_all_orders.svg",      href: vendor_deliveries_path },
      { label: "Products",   icon: "/icon_products.svg",        href: vendor_listings_path },
      { label: "Invoices",   icon: "/icon_requests.svg",        href: vendor_invoices_path },
    ]
  end

  # Active-state rule shared by both navs. "#" placeholders never match, and
  # "/" only matches the exact root (so it doesn't match every path via start_with?).
  def nav_link_active?(href)
    return false if href == "#"
    href == "/" ? request.path == "/" : request.path.start_with?(href)
  end

  # Strips protocol + leading "www." for compact display.
  def display_url(url)
    return "" if url.blank?
    url.sub(%r{\Ahttps?://}, "").sub(/\Awww\./, "")
  end

  # Adds https:// + ensures no www prefix.
  def full_url(url)
    return "" if url.blank?
    "https://#{display_url(url)}"
  end

  # "Apr 22, 2026" — used in PO lists and detail pages.
  def format_delivery_date(iso)
    return "—" if iso.blank?
    y, m, d = iso.split("-").map(&:to_i)
    Date.new(y, m, d).strftime("%b %-d, %Y")
  rescue ArgumentError
    "—"
  end

  # "Monday, April 22, 2026" — used on PO detail when not in draft mode.
  def format_delivery_full(iso)
    return "—" if iso.blank?
    y, m, d = iso.split("-").map(&:to_i)
    Date.new(y, m, d).strftime("%A, %B %-d, %Y")
  rescue ArgumentError
    "—"
  end

  # Delivery week label, mirroring the cart drawer's selector exactly:
  # "Week of Jun 29 — Wednesday, July 1". `iso` is a date within the delivery week
  # (the cart stores that week's Wednesday); the Monday of the same week is derived.
  def delivery_week_label(iso)
    return "—" if iso.blank?
    y, m, d = iso.split("-").map(&:to_i)
    date = Date.new(y, m, d)
    monday = date - ((date.wday + 6) % 7)
    "Week of #{monday.strftime('%b %-d')} — #{date.strftime('%A, %B %-d')}"
  rescue ArgumentError
    "—"
  end

  # Palette A status colors — soft tinted chip (bg) + dark same-family text, all at a
  # consistent saturation. Keyed by underlying status, plus the two fulfillment methods
  # (Delivery / Shipping) so they read as distinct pills. Applied via inline style so
  # arbitrary hexes render without a Tailwind CSS rebuild.
  PO_STATUS_COLORS = {
    "Draft"      => ["#e8e8e8", "#555555"],   # neutral grey
    "In Review"  => ["#fef3c7", "#92400e"],   # amber — pending
    "Processing" => ["#fde8dc", "#a33500"],   # orange — in progress
    "Confirmed"  => ["#d4f5e9", "#065f46"],   # teal-green — agreed
    "Delivered"  => ["#dbeafe", "#1e40af"],   # blue — fallback for the Delivered status
    "Delivery"   => ["#dbeafe", "#1e40af"],   # blue — fulfilled by vendor delivery
    "Shipping"   => ["#cffafe", "#155e75"],   # cyan — fulfilled by shipping
    "Invoiced"   => ["#ede9fe", "#5b21b6"],   # violet — billed
    "Paid"       => ["#dcfce7", "#166534"],   # green — paid / settled
    "Cancelled"  => ["#fce8e8", "#991b1b"],   # red — void
  }.freeze

  def po_status_style(key)
    bg, text = PO_STATUS_COLORS[key] || PO_STATUS_COLORS["Draft"]
    "background-color:#{bg};color:#{text}"
  end

  # Buyer-facing label for a PO status (T05).
  def po_status_label(status)
    PurchaseOrder.label_for(status)
  end

  # Per-row / per-PO status label. Fulfillment POs show their actual method
  # (Delivery / Shipping); "In Review" shows the short "In-Review". Every other
  # status falls back to the standard label. The index tab/filter still shows the
  # fuller labels ("Fulfillment", "In Review by Cureate").
  def po_line_status_label(po)
    case po.status
    when "Delivered" then po.fulfillment_method.presence || "Delivery"
    when "In Review" then "In-Review"
    end
  end

  # Returns the certifications minus the trailing " Business" suffix.
  def short_cert(cert)
    cert.to_s.sub(/\s*Business\s*$/i, "")
  end

  # ─── Vendor experience (E1/E3) ─────────────────────────────────────────────

  # Same badge component, vendor vocabulary. See PurchaseOrder::VENDOR_STATUS_LABELS.
  def vendor_po_status_label(status)
    PurchaseOrder.vendor_label_for(status)
  end

  # Which Orders tab actually contains this order. Used as the back-link fallback, so a
  # cold load (pasted link, bookmark, new tab) still returns somewhere true instead of
  # always dumping the vendor on "Requested".
  def vendor_tab_value_for(status)
    tab = PurchaseOrder::VENDOR_TAB_DEFINITIONS.find { |t| t[:statuses].include?(status) }
    tab ? tab[:value] : PurchaseOrder::VENDOR_TAB_DEFINITIONS.first[:value]
  end

  # Vendor status colors key off the VENDOR LABEL, not the underlying buyer enum.
  #
  # This matters: the vendor's "Invoiced" tab contains both `Invoiced` and `Paid`
  # orders (the PRD gives vendors no Paid tab). Coloring by the raw status painted
  # them violet and green side by side in one tab — two colors for one thing.
  # One label, one color.
  # Requested is NEUTRAL, not an alert. A new order is the normal state of a healthy
  # business, not a problem — it doesn't warrant the same visual weight as the one
  # genuinely broken thing on this screen (Tracking Needed). Reserving the warm/red
  # end of the palette for real exceptions is what makes those exceptions legible.
  VENDOR_STATUS_COLORS = {
    "Requested"   => ["#f0f0f0", "#444955"],   # neutral grey — new, awaiting the vendor
    "Confirmed"   => ["#d4f5e9", "#065f46"],   # teal-green — agreed
    "Fulfillment" => ["#dbeafe", "#1e40af"],   # blue — moving
    "Invoiced"    => ["#ede9fe", "#5b21b6"],   # violet — billed, awaiting payment
    "Paid"        => ["#dcfce7", "#166534"],   # green — money in. Lives in the Invoiced tab.
    "Cancelled"   => ["#fce8e8", "#991b1b"],   # red — void
  }.freeze

  def vendor_po_status_style(status)
    bg, text = VENDOR_STATUS_COLORS[vendor_po_status_label(status)] || ["#e8e8e8", "#555555"]
    "background-color:#{bg};color:#{text}"
  end

  # ── The Fulfillment row status ─────────────────────────────────────────────
  # Mirrors the buyer's PO treatment (see po_line_status_label): the TAB is called
  # "Fulfillment", but a row inside it shows HOW the order is being fulfilled, not
  # the word "Fulfillment" again. One pill, never two:
  #
  #   Delivery         — our truck, and the driver's proof photo has landed
  #   Shipping         — carrier parcel, tracking code recorded
  #   Tracking Needed  — carrier parcel, code deferred ("Add Later") → the VENDOR acts
  #   Proof Needed     — our truck, no photo yet          → the DRIVER acts
  #
  # The "Needed" states REPLACE their base state rather than sitting beside it. An
  # order missing its tracking code isn't two facts, it's one unfinished one. Both
  # also block invoicing, which is what makes them worth shouting about.
  #
  # Returns [label, style] for any status; outside Fulfillment it's the normal pill.
  def vendor_row_status(po, vendor_id)
    return [vendor_po_status_label(po.status), vendor_po_status_style(po.status)] unless po.status == "Delivered"

    if po.tracking_needed?(vendor_id)
      ["Tracking Needed", "background-color:#fce8e8;color:#991b1b"]   # red — vendor must act
    elsif po.proof_needed?(vendor_id)
      ["Proof Needed",    "background-color:#fce8e8;color:#991b1b"]   # red — driver must act
    elsif po.shipping?(vendor_id)
      ["Shipping",        "background-color:#cffafe;color:#155e75"]   # cyan — carrier has it
    else
      ["Delivery",        "background-color:#dbeafe;color:#1e40af"]   # blue — our truck, proven
    end
  end

  # Handling requirement from the mobile ingestion app. Text + tint only — no emoji.
  # The colour already carries the temperature (blue = cold, cyan = frozen, orange =
  # warm), so a glyph would be saying the same thing twice, in a typeface we don't own.
  HANDLING_STYLES = {
    "Ambient" => ["#f4f4f4", "#555555"],
    "Cold"    => ["#dbeafe", "#1e40af"],
    "Frozen"  => ["#cffafe", "#155e75"],
    "Warm"    => ["#fde8dc", "#a33500"],
  }.freeze

  CHIP_CLASSES = "inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold".freeze

  def handling_chip(handling)
    bg, text_color = HANDLING_STYLES[handling] || HANDLING_STYLES["Ambient"]
    content_tag(:span, handling, class: CHIP_CLASSES,
                style: "background-color:#{bg};color:#{text_color}")
  end

  # Warning chip — the ⚠ "Tracking Code Needed" state the mobile app leaves behind
  # when the driver taps "Add Later". Deliberately the same red family as Cancelled,
  # because it means "a human has to do something".
  def warning_chip(text)
    content_tag(:span, "⚠ #{text}", class: CHIP_CLASSES,
                style: "background-color:#fce8e8;color:#991b1b")
  end

  # Uses the brand checkmark asset (public/icon_checkmark.svg) via the existing
  # `.icon-check` mask utility, NOT a typed "✓" glyph — the mask inherits the chip's
  # currentColor, so one asset serves every context at any size.
  def success_chip(text)
    content_tag(:span, class: CHIP_CLASSES,
                style: "background-color:#dcfce7;color:#166534") do
      safe_join([
        content_tag(:span, "", class: "icon-check w-2.5 h-2.5 shrink-0"),
        content_tag(:span, text),
      ])
    end
  end

  # ── Primary CTA ────────────────────────────────────────────────────────────
  # ONE token for the green primary action, so the vendor's "Add New Product" and the
  # buyer's "New Purchase Order" can't drift apart again. They were separately hand-rolled
  # and had already diverged on padding and gap.
  #
  # Labels are Title Case, always.
  def primary_cta_class(extra = nil)
    [
      "no-min-h inline-flex items-center gap-2 rounded-full px-4 h-[38px]",
      "bg-[#28ba93] hover:bg-[#22a882] text-white text-[13px] font-bold",
      "whitespace-nowrap transition-colors",
      extra,
    ].compact.join(" ")
  end

  # The brand plus, inlined with currentColor and cropped tight to the glyph so the
  # button's padding is the padding you actually see. See public/icons/icon_add.svg.
  def cta_plus_icon
    tag.svg(width: 11, height: 11, viewBox: "1.8 1.8 16.4 16.4", fill: "none",
            class: "shrink-0", "aria-hidden": "true") do
      tag.path(d: "M10 3.2v13.6M3.2 10h13.6", stroke: "currentColor",
               "stroke-width": "2.8", "stroke-linecap": "round")
    end
  end

  # ── Sparklines (E5 dashboard) ──────────────────────────────────────────────
  #
  # Hand-rolled SVG rather than a charting library. These are 4 sparklines on one screen;
  # pulling in Chart.js to draw them would add a dependency, a build step and a JS runtime
  # for something that is, literally, a list of points. Rendering server-side also means
  # the chart is in the HTML — no flash of empty canvas, and nothing to break when the JS
  # bundle is stale (which, on this project, it reliably is).
  #
  # Returns { line:, area: } path strings for a `viewBox="0 0 w h"`.
  def sparkline_paths(values, width: 100, height: 32)
    vals = Array(values).map(&:to_f)
    return { line: "", area: "" } if vals.size < 2

    max = vals.max
    min = vals.min
    # A flat series would divide by zero; float it to the middle instead of drawing a wall.
    span = (max - min).zero? ? 1.0 : (max - min)

    step = width.to_f / (vals.size - 1)
    pts = vals.each_with_index.map { |v, i|
      x = i * step
      # Inset by 1px top and bottom so the stroke isn't clipped by the viewBox.
      y = height - 1 - ((v - min) / span) * (height - 2)
      [x.round(2), y.round(2)]
    }

    line = "M " + pts.map { |x, y| "#{x} #{y}" }.join(" L ")
    area = "#{line} L #{width} #{height} L 0 #{height} Z"
    { line: line, area: area }
  end

  # "+12%" / "-4%" / "—". nil means there's no prior period to compare against, and we say
  # so rather than inventing a 0%.
  def delta_label(pct)
    return "—" if pct.nil?
    "#{pct.positive? ? '+' : ''}#{pct}%"
  end

  def delta_color(pct)
    return "#a1a4aa" if pct.nil? || pct.zero?
    pct.positive? ? "#166534" : "#991b1b"
  end

  # ── Delivery calendar entries (E2) ─────────────────────────────────────────
  # An entry on the calendar is a COMMITMENT, and its weight should reflect how firm
  # that commitment is:
  #
  #   Requested   — not a commitment yet. Ghosted: dashed outline, no fill. It shows
  #                 the vendor what lands on that day IF they say yes.
  #   Confirmed   — a real obligation. Solid. This is what production plans against.
  #   Fulfillment — already out the door. Muted; it's no longer work to do.
  #
  # Returns inline styles, deliberately — the calendar is new, and these three weights
  # are the whole point of it.
  def calendar_entry_style(po)
    case po.status
    when "Processing"                       # Requested — ghosted
      "background-color:#ffffff; border:1px dashed #c4c4c4; color:#777;"
    when "Confirmed"                        # committed — solid
      "background-color:#d4f5e9; border:1px solid #a5e6d0; color:#065f46;"
    else                                    # Fulfillment — done, muted
      "background-color:#eef4fd; border:1px solid #d7e5fa; color:#1e40af;"
    end
  end

  # Buyer acceptance, in the vendor's language (storyboard panel 8).
  #   received → buyer confirmed OR stayed silent past the 24h window (silence = accepted)
  #   issue    → buyer flagged it; ticket opened, Cureate triaging
  def buyer_acceptance_chip(state)
    case state
    when :received then success_chip("Delivery Received")
    when :issue    then warning_chip("Delivery Issue Found")
    else
      content_tag(:span, "Awaiting buyer confirmation", class: CHIP_CLASSES,
                  style: "background-color:#fef3c7;color:#92400e")
    end
  end
end
