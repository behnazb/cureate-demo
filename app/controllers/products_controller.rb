class ProductsController < ApplicationController
  def index
    @vendors = Vendor.all
    # Drafts are the vendor's private work-in-progress — buyers only ever see published
    # products. This is what makes the vendor's "Publish" button mean something: hit it
    # as 2Betties, switch to the buyer persona, and the product is on the marketplace.
    @all_products = @vendors.flat_map { |v| v.products.reject(&:shipping_fee?).select(&:published?) }
    @filter_quick    = FilterConfig.quick_with_vendors(@vendors)
    @filter_advanced = FilterConfig.advanced_by_section
    @category_pills  = FilterConfig.category_pills
    @preselected_vendor = params[:vendor].presence
  end

  def show
    @vendor  = Vendor.find(params[:vendor_id])
    @product = @vendor&.products&.find { |p| p.id == params[:id] }
    return render_not_found unless @vendor && @product

    # A draft is 404 to a buyer — but the VENDOR can open their own draft's PDP, which is
    # exactly what "Preview" does: it shows the listing as a buyer would see it.
    return render_not_found if @product.draft? && !(vendor_persona? && current_vendor&.id == @vendor.id)
  end

  private

  def render_not_found
    render file: Rails.root.join("public/404.html"), status: :not_found, layout: false
  end
end
