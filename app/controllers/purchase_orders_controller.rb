class PurchaseOrdersController < ApplicationController
  def index
    @search = params[:q].to_s
    raw_tab = params[:tab]
    @active_tab = PurchaseOrder.normalize_tab(raw_tab)
    @tab_config = PurchaseOrder.tab_for(@active_tab)
    @date_range = params[:range].presence || "30"

    matching = PurchaseOrder.all.select { |po| @tab_config[:statuses].include?(po.status) }
    if @search.present?
      q = @search.downcase
      matching = matching.select { |po|
        po.id.downcase.include?(q) || po.status.downcase.include?(q)
      }
    end
    @purchase_orders = matching
  end

  def show
    @po = PurchaseOrder.find(params[:id])
    return render_not_found unless @po

    @items_by_vendor = Vendor.all.map { |vendor|
      lines = @po.line_items.select { |li| li.vendor_id == vendor.id }
      next nil if lines.empty?
      subtotal = lines.sum { |li| li.extended_cost }
      { vendor: vendor, items: lines, vendor_subtotal: subtotal }
    }.compact

    @subtotal       = @items_by_vendor.sum { |g| g[:vendor_subtotal] }
    @processing_fee = @subtotal * 0.10
    @total          = @subtotal + @processing_fee
  end

  private

  def render_not_found
    render file: Rails.root.join("public/404.html"), status: :not_found, layout: false
  end
end
