class ProductsController < ApplicationController
  def index
    @vendors = Vendor.all
    @all_products = @vendors.flat_map { |v| v.products.reject(&:shipping_fee?) }
    @filter_quick    = FilterConfig.quick_with_vendors(@vendors)
    @filter_advanced = FilterConfig.advanced_by_section
    @category_pills  = FilterConfig.category_pills
    @preselected_vendor = params[:vendor].presence
  end

  def show
    @vendor  = Vendor.find(params[:vendor_id])
    @product = @vendor&.products&.find { |p| p.id == params[:id] }
    return render_not_found unless @vendor && @product
  end

  private

  def render_not_found
    render file: Rails.root.join("public/404.html"), status: :not_found, layout: false
  end
end
