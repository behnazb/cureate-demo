# Vendor dashboard (E5) — the shop home.
#
# Three jobs, in order: tell the vendor who they are, tell them what needs doing today,
# and tell them how the shop is performing. Nothing else.
#
# WHERE THE NUMBERS COME FROM — this matters for user testing:
#   orders, revenue, conversion  → REAL, derived from the vendor's actual POs
#   visits                       → SYNTHETIC. There's no analytics pipeline in the
#                                  prototype, so visits are generated deterministically
#                                  from the date + vendor id (same numbers every reload,
#                                  never a random reshuffle mid-demo). Conversion is real
#                                  orders over synthetic visits, so treat it as shape,
#                                  not truth.
module VendorPortal
  class DashboardController < BaseController
    RANGES = { "7" => "Last 7 days", "30" => "Last 30 days", "90" => "Last 90 days" }.freeze

    def index
      @range = RANGES.key?(params[:range]) ? params[:range] : "30"
      @range_label = RANGES[@range]
      days = @range.to_i

      @today = Date.today
      @dates = ((@today - (days - 1))..@today).to_a

      orders = vendor_orders

      # ── Daily series ─────────────────────────────────────────────────────
      @visits_series = @dates.map { |d| synthetic_visits(d) }
      @orders_series = @dates.map { |d|
        orders.count { |po| parse_date(po.created_at) == d }
      }
      @revenue_series = @dates.map { |d|
        orders.select { |po| parse_date(po.created_at) == d }
              .sum { |po| po.vendor_subtotal(@vendor.id) }
      }
      # Conversion = orders ÷ visits, per day.
      @conversion_series = @dates.each_with_index.map { |_, i|
        v = @visits_series[i]
        v.zero? ? 0.0 : (@orders_series[i].to_f / v * 100)
      }

      @visits     = @visits_series.sum
      @orders     = @orders_series.sum
      @revenue    = @revenue_series.sum
      @conversion = @visits.zero? ? 0.0 : (@orders.to_f / @visits * 100)

      # Prior period, same length — so every stat can say whether it's up or down. A number
      # with nothing to compare it to isn't a metric, it's trivia.
      prev_dates = ((@today - (days * 2 - 1))..(@today - days)).to_a
      prev_visits  = prev_dates.sum { |d| synthetic_visits(d) }
      prev_orders  = orders.count { |po| prev_dates.include?(parse_date(po.created_at)) }
      prev_revenue = orders.select { |po| prev_dates.include?(parse_date(po.created_at)) }
                           .sum { |po| po.vendor_subtotal(@vendor.id) }
      prev_conv    = prev_visits.zero? ? 0.0 : (prev_orders.to_f / prev_visits * 100)

      @deltas = {
        visits:     pct_change(@visits, prev_visits),
        orders:     pct_change(@orders, prev_orders),
        conversion: pct_change(@conversion, prev_conv),
        revenue:    pct_change(@revenue, prev_revenue),
      }

      # ── Top tasks ────────────────────────────────────────────────────────
      # Each card names the two things that would actually make a vendor click into it.
      products = @vendor.products.reject(&:shipping_fee?)

      @tasks = [
        {
          label: "Orders", href: vendor_orders_path,
          lines: [
            { n: orders.count { |po| po.status == "Processing" },                  text: "new requests to confirm" },
            { n: orders.count { |po| po.tracking_needed?(@vendor.id) },            text: "missing a tracking code" },
          ],
        },
        {
          label: "Service Requests", href: "#",   # not built — round 3
          lines: [
            { n: 0, text: "open opportunities" },
            { n: 0, text: "responses due" },
          ],
          soon: true,
        },
        {
          label: "Products", href: vendor_listings_path,
          lines: [
            { n: products.count { |p| p.image.blank? },        text: "missing a product photo" },
            { n: products.count { |p| p.inventory.to_i.zero? }, text: "out of stock" },
          ],
        },
      ]

      @active_listings = products.count(&:published?)
      @shop_url = "connect.cureate.co/vendors/#{@vendor.id}"
    end

    private

    def vendor_orders
      PurchaseOrder.all.select { |po|
        po.includes_vendor?(@vendor.id) && PurchaseOrder.vendor_visible?(po.status)
      }
    end

    # Deterministic, not random: the same date always yields the same number, so the demo
    # doesn't reshuffle under the user mid-session. Weekends dip, which makes the shape
    # read as plausible rather than as noise.
    def synthetic_visits(date)
      seed = "#{@vendor.id}-#{date.iso8601}".chars.sum(&:ord)
      base = 18 + (seed % 26)
      base = (base * 0.55).round if [0, 6].include?(date.wday)
      base
    end

    def pct_change(now, before)
      return nil if before.to_f.zero?
      ((now - before) / before.to_f * 100).round
    end

    def parse_date(iso)
      return nil if iso.blank?
      Date.iso8601(iso)
    rescue ArgumentError
      nil
    end
  end
end
