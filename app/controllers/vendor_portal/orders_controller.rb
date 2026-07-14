# Vendor Orders (E1) — PRD stories 1 & 2.
#
# The vendor mirror of PurchaseOrdersController#index. Same tab/board/filter
# machinery, three differences that matter:
#   1. Scoped: only POs containing this vendor's line items.
#   2. Re-labelled: buyer statuses shown in the vendor's vocabulary (see D1).
#   3. Re-totalled: the vendor's own subtotal, never the buyer's total (see D2).
module VendorPortal
  class OrdersController < BaseController
    def index
      @search     = params[:q].to_s
      @view       = %w[table board].include?(params[:view]) ? params[:view] : "table"
      @active_tab = PurchaseOrder.normalize_vendor_tab(params[:tab])
      @tab_config = PurchaseOrder.vendor_tab_for(@active_tab)

      # Filters (PRD story 2). Buyer and location are multi-select, matching the
      # buyer app's product filter drawer — a vendor typically wants "these two
      # campuses", not one at a time.
      @buyer_filters    = Array(params[:buyers]).reject(&:blank?)
      @location_filters = Array(params[:locations]).reject(&:blank?)
      @date_filter      = params[:date].presence
      @group_by         = params[:group_by].presence   # nil | "location"

      scoped = vendor_orders

      # Option lists are computed BEFORE filtering, so a selection never removes the
      # other options from the drawer.
      @buyer_options    = scoped.map(&:buyer_org).compact.uniq.sort
      @location_options = scoped.map(&:delivery_location).compact.uniq.sort

      scoped = apply_search(scoped)
      scoped = scoped.select { |po| @buyer_filters.include?(po.buyer_org) }         if @buyer_filters.any?
      scoped = scoped.select { |po| @location_filters.include?(po.delivery_location) } if @location_filters.any?
      scoped = scoped.select { |po| po.delivery_date == @date_filter }              if @date_filter

      @filtered = scoped

      # Drives the "Filters (n)" pill on the trigger button.
      @active_filter_count = @buyer_filters.size + @location_filters.size +
                             (@date_filter ? 1 : 0) + (@group_by ? 1 : 0)

      # Counts sit on the tabs (PRD story 1) and reflect the active filters, so the
      # numbers always agree with what a click actually shows.
      @counts = PurchaseOrder::VENDOR_TAB_DEFINITIONS.to_h { |t|
        [t[:value], scoped.count { |po| t[:statuses].include?(po.status) }]
      }

      @orders = scoped.select { |po| @tab_config[:statuses].include?(po.status) }
                      .sort_by { |po| po.delivery_date.to_s }

      # "Group by delivery location" (PRD story 2) — same orders, grouped.
      @location_groups = @orders.group_by { |po| po.delivery_location || "Unassigned" }
                                .sort_by { |loc, _| loc.to_s }

      @board_columns = PurchaseOrder::VENDOR_TAB_DEFINITIONS.map { |t|
        { label: t[:label], value: t[:value],
          pos: scoped.select { |po| t[:statuses].include?(po.status) } }
      }
    end

    def show
      @po = PurchaseOrder.find(params[:id])
      return render_not_found unless @po && @po.includes_vendor?(@vendor.id) &&
                                     PurchaseOrder.vendor_visible?(@po.status)

      # Only this vendor's lines. The buyer's other vendors, and Cureate's 10%
      # processing fee, are none of 2Betties' business (D2).
      @items       = @po.line_items_for(@vendor.id)
      @subtotal    = @po.vendor_subtotal(@vendor.id)
      @fulfillment = @po.fulfillment_for(@vendor.id)
    end

    # ── Lifecycle transitions ──────────────────────────────────────────────
    # Guards live on the model (confirm!/decline!/fulfill!/issue_invoice! each return
    # false if the order isn't in the right state), so a stale tab or a double-submit
    # can't skip a step. The controller only translates the result into a message.

    # Requested → Confirmed. "I have the stock, the date works, it's going out."
    def confirm
      load_order or return
      if @po.confirm!
        redirect_to vendor_order_path(@po.id),
          notice: "Order confirmed. #{@po.buyer_org} knows it's coming."
      else
        redirect_to vendor_order_path(@po.id), alert: "That order can no longer be confirmed."
      end
    end

    # Requested → Cancelled, with a reason. Better than the order rotting in Requested
    # because the vendor had no way to say "I can't do this one".
    def decline
      load_order or return
      reason = params[:reason].presence
      if reason && @po.decline!(reason: reason, note: params[:note])
        redirect_to vendor_orders_path(tab: "requested"),
          notice: "#{@po.id} declined. Cureate and #{@po.buyer_org} have been notified."
      else
        redirect_to vendor_order_path(@po.id), alert: "Choose a reason for declining."
      end
    end

    # Confirmed → Fulfillment. The vendor commits to HOW it goes out.
    def fulfill
      load_order or return
      method = params[:method_choice].to_s

      if @po.fulfill!(@vendor.id,
                      method:   method,
                      carrier:  params[:carrier],
                      tracking: params[:tracking],
                      handling: params[:handling])
        msg = if method == "Shipping" && params[:tracking].blank?
                "Marked as shipping. Add the tracking code when you have it."
              elsif method == "Shipping"
                "Marked as shipping. #{@po.buyer_org} can track the parcels."
              else
                "Marked for delivery. Proof of delivery is captured by the driver at drop-off."
              end
        redirect_to vendor_order_path(@po.id), notice: msg
      else
        redirect_to vendor_order_path(@po.id), alert: "Choose how this order will be fulfilled."
      end
    end

    # PATCH /vendor/orders/:id/tracking — E3.
    #
    # Resolves the deferred "Add Later" the mobile ingestion app allows, or corrects a
    # typo'd number. Everything else on the delivery panel was captured by that app and
    # is read-only here. In production this also notifies the buyer (PRD story 4).
    def tracking
      load_order or return

      if @po.vendor_locked?
        redirect_to vendor_order_path(@po.id),
          alert: "This order is invoiced and can no longer be changed." and return
      end

      number = params[:tracking].to_s.strip
      if number.blank?
        redirect_to vendor_order_path(@po.id), alert: "Enter a tracking number." and return
      end

      @po.set_tracking!(@vendor.id, number, by: @vendor.name)
      redirect_to vendor_order_path(@po.id),
        notice: "Tracking number saved. #{@po.buyer_org} has been notified."
    end

    # Fulfillment → Invoiced. Manual, and the last thing anyone can change.
    def invoice
      load_order or return
      if @po.issue_invoice!(@vendor.id)
        redirect_to vendor_order_path(@po.id),
          notice: "Invoice issued to #{@po.buyer_org}. This order is now locked."
      else
        redirect_to vendor_order_path(@po.id),
          alert: @po.invoice_blocked_reason(@vendor.id)
      end
    end

    private

    def load_order
      @po = PurchaseOrder.find(params[:id])
      return true if @po && @po.includes_vendor?(@vendor.id)
      render_not_found
      false
    end

    # Every PO that contains at least one of this vendor's SKUs, minus the statuses
    # a vendor should never see (Draft / In Review — still with the buyer or Cureate).
    def vendor_orders
      PurchaseOrder.all.select { |po|
        po.includes_vendor?(@vendor.id) && PurchaseOrder.vendor_visible?(po.status)
      }
    end

    def apply_search(orders)
      return orders if @search.blank?
      q = @search.downcase
      orders.select { |po|
        po.id.to_s.downcase.include?(q) ||
          po.buyer_org.to_s.downcase.include?(q) ||
          po.delivery_location.to_s.downcase.include?(q) ||
          PurchaseOrder.vendor_label_for(po.status).downcase.include?(q)
      }
    end

    def render_not_found
      render file: Rails.root.join("public/404.html"), status: :not_found, layout: false
    end
  end
end
