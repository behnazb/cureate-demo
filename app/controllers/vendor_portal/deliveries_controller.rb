# Delivery Schedule (E2) — PRD story 3.
#
# "As a vendor, I want a delivery calendar showing upcoming fulfillment deadlines so
# that I can plan production and logistics."
#
# This is a PRODUCTION-PLANNING tool, which is what separates it from the Orders page.
# Orders answers "what is the state of this order?"; Deliveries answers "what do I have
# to make, and by when?" So it shows commitments on a time axis, not statuses in a list.
module VendorPortal
  class DeliveriesController < BaseController
    # Statuses that represent work still ahead of the vendor. Invoiced/Paid are done;
    # Cancelled never happened. Neither belongs on a forward-looking calendar.
    SCHEDULED = %w[Processing Confirmed Delivered].freeze

    def index
      @view  = %w[calendar list].include?(params[:view]) ? params[:view] : "calendar"
      @today = Date.today

      # Month being viewed; defaults to the current one. ?month=2026-08
      @month = begin
        params[:month].present? ? Date.strptime(params[:month], "%Y-%m") : @today.beginning_of_month
      rescue ArgumentError
        @today.beginning_of_month
      end
      @month = @month.beginning_of_month

      @orders = scheduled_orders

      # Calendar grid: whole weeks, Sunday-first, so the month always renders as a
      # complete rectangle (leading/trailing days come from the neighbouring months).
      first = @month.beginning_of_month
      last  = @month.end_of_month
      @grid_start = first - first.wday
      @grid_end   = last + (6 - last.wday)
      @weeks = (@grid_start..@grid_end).each_slice(7).to_a

      @by_date = @orders.group_by { |po| parse_date(po.delivery_date) }
      @by_date.delete(nil)

      # PRD: "Upcoming deliveries are visible at least 30 days out." The list view is
      # that promise made literal — the next 30 days, regardless of month boundaries.
      @upcoming = @orders
        .select { |po| (d = parse_date(po.delivery_date)) && d >= @today && d <= @today + 30 }
        .sort_by { |po| parse_date(po.delivery_date) }
        .group_by { |po| parse_date(po.delivery_date) }

      # PRD: "Overdue fulfillment items are flagged." An order is overdue when its
      # delivery date has passed and the vendor still hasn't sent it out — i.e. it's
      # sitting in Requested or Confirmed. Once it's in Fulfillment it has left the
      # building, and lateness is the carrier's or the driver's problem, not production's.
      @overdue = @orders
        .select { |po| (d = parse_date(po.delivery_date)) && d < @today && %w[Processing Confirmed].include?(po.status) }
        .sort_by { |po| parse_date(po.delivery_date) }
    end

    private

    def scheduled_orders
      PurchaseOrder.all.select { |po|
        po.includes_vendor?(@vendor.id) && SCHEDULED.include?(po.status)
      }
    end

    def parse_date(iso)
      return nil if iso.blank?
      Date.iso8601(iso)
    rescue ArgumentError
      nil
    end
  end
end
