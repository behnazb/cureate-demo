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

  # Maps PO status to a Tailwind class pair (bg + text colors)
  PO_STATUS_CLASSES = {
    "Draft"      => "bg-[#e8e8e8] text-[#555]",
    "In Review"  => "bg-[#fef3c7] text-[#92400e]",
    "Processing" => "bg-[#fde8dc] text-[#a33500]",
    "Confirmed"  => "bg-[#d4f5e9] text-[#065f46]",
    "Delivered"  => "bg-[#dbeafe] text-[#1e40af]",
    "Invoiced"   => "bg-[#ede9fe] text-[#5b21b6]",
    "Paid"       => "bg-[#d1fae5] text-[#065f46]",
    "Cancelled"  => "bg-[#fce8e8] text-[#991b1b]",
  }.freeze

  def po_status_classes(status)
    PO_STATUS_CLASSES[status] || "bg-[#e8e8e8] text-[#555]"
  end

  # Buyer-facing label for a PO status (T05) — e.g. "Processing" → "Sent to Vendors".
  def po_status_label(status)
    PurchaseOrder.label_for(status)
  end

  # Returns the certifications minus the trailing " Business" suffix.
  def short_cert(cert)
    cert.to_s.sub(/\s*Business\s*$/i, "")
  end
end
