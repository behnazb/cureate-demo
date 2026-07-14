module ApplicationHelper
  # Canonical primary navigation — single source of truth so the desktop
  # sidebar (_sidebar) and the mobile drawer (_mobile_nav) can never drift
  # in order or items. Each renders its own styling; both read this list.
  def main_nav_links
    [
      { label: "Dashboard",       icon: "/icon_dashboard.svg",       href: root_path },
      { label: "Vendors",         icon: "/icon_vendors.svg",         href: vendors_path },
      { label: "All Orders",      icon: "/icon_all_orders.svg",      href: "#" },
      { label: "Purchase Orders", icon: "/icon_purchase_orders.svg", href: purchase_orders_path },
      { label: "Products",        icon: "/icon_products.svg",        href: products_path },
      { label: "Requests",        icon: "/icon_requests.svg",        href: "#" },
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
end
