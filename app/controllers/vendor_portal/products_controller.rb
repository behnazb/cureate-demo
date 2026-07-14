# Vendor products & inventory (E4).
#
# The vendor's own catalogue — the same product data the buyer sees on the PDP, but as
# EDITABLE fields. Scoping is absolute: @vendor.products is the entire universe here, so
# a vendor can never see or touch another vendor's listing.
#
# Publish/draft is the only real state: a draft is private to the vendor; publishing puts
# the product on the buyer marketplace immediately (ProductsController#index filters to
# published), which makes the persona toggle a genuine round trip.
module VendorPortal
  class ProductsController < BaseController
    def index
      @products = @vendor.products.reject(&:shipping_fee?)

      @filter = %w[all published draft attention].include?(params[:filter]) ? params[:filter] : "all"
      @counts = {
        "all"       => @products.size,
        "published" => @products.count(&:published?),
        "draft"     => @products.count(&:draft?),
        "attention" => @products.reject(&:listing_complete?).size,
      }

      @visible = case @filter
                 when "published" then @products.select(&:published?)
                 when "draft"     then @products.select(&:draft?)
                 when "attention" then @products.reject(&:listing_complete?)
                 else @products
                 end

      # The listing-quality nudge. Grouped by GAP, not by product, because a vendor fixes
      # these in batches ("let me shoot photos of the four that need one"), and because
      # "3 listings have no photo" is a sentence a vendor acts on. "Product X is 4/6
      # complete" is one they ignore.
      @gap_summary = Product::LISTING_CHECKS.filter_map { |check|
        n = @products.count { |p| p.listing_gap?(check[:key]) }
        next if n.zero?
        check.merge(count: n)
      }

      # The drawer is prefilled when editing an existing product, blank when adding.
      @editing = @vendor.products.find { |p| p.id == params[:edit] } if params[:edit].present?
    end

    def create
      product = Product.new(product_attrs.merge(
        id:     next_product_id,
        vendor: @vendor,
        status: publish_requested? ? "published" : "draft",
      ))
      @vendor.products << product

      redirect_to vendor_listings_path, notice: success_message(product, created: true)
    end

    def update
      product = @vendor.products.find { |p| p.id == params[:id] }
      return render_not_found unless product

      # Edits apply immediately, including to live listings. Prices already committed on
      # an existing PO are frozen there (POLineItem stores its own unit_price), so changing
      # a price never rewrites history.
      product_attrs.each { |k, v| product.public_send("#{k}=", v) }
      product.status = "published" if publish_requested?
      product.status = "draft"     if params[:commit] == "draft"

      redirect_to vendor_listings_path, notice: success_message(product, created: false)
    end

    private

    def publish_requested?
      params[:commit] == "publish"
    end

    def success_message(product, created:)
      verb = created ? "created" : "updated"
      if product.published?
        "#{product.name} #{verb} and published. Buyers can order it now."
      else
        "#{product.name} saved as a draft. Buyers can't see it yet."
      end
    end

    def product_attrs
      {
        name:                 params[:name].to_s.strip,
        upc:                  params[:upc].presence,
        size:                 params[:size].presence,
        category:             params[:category].presence,
        storage:              params[:storage].presence,
        wholesale_unit_price: params[:wholesale_unit_price].to_f,
        msrp:                 params[:msrp].to_f,
        wholesale_case_price: params[:wholesale_case_price].to_f,
        units_per_case:       params[:units_per_case].to_i,
        case_minimum:         params[:case_minimum].to_i,
        inventory:            params[:inventory].to_i,
        allergens:            Array(params[:allergens]).reject(&:blank?),
        dietary:              Array(params[:dietary]).reject(&:blank?),
        image:                params[:image].presence,        # data-URL or existing path
        downloads:            parsed_downloads,
      }.compact
    end

    # Downloads arrive as a JSON blob from the drawer (name + data-URL per file), since the
    # harness has no storage layer. See the note in app/models/product.rb.
    def parsed_downloads
      raw = params[:downloads].to_s
      return [] if raw.blank?
      JSON.parse(raw).map { |d| { name: d["name"], data: d["data"] } }
    rescue JSON::ParserError
      []
    end

    # Seeded ids are 5-digit strings ("16820"). Keep new ones in the same shape so nothing
    # downstream has to care whether a product was seeded or created in the prototype.
    def next_product_id
      max = Vendor.all.flat_map(&:products).map { |p| p.id.to_i }.max || 16_000
      (max + 1).to_s
    end

    def render_not_found
      render file: Rails.root.join("public/404.html"), status: :not_found, layout: false
    end
  end
end
