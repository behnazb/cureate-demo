# My Profile — the vendor-managed shop details that feed the buyer-facing vendor
# page (app/views/vendors/show). Mirrors the production Connect edit view 1:1:
# left rail (image, contact & location, business type, revenue, certifications,
# employees, insurance, health clearance) + main column (name, socials, About,
# Business Goals, Logistics & Fulfillment). One form, one save.
#
# Like everything in the prototype this writes to the in-memory Vendor PORO, so a
# save is visible on the buyer side immediately — edit your story here, flip the
# persona, and the public page has it. That round trip is the demo moment.
module VendorPortal
  class ProfileController < BaseController
    def show
      # Older seeds carry only the combined strings ("Baltimore, MD" /
      # "1215 E. Fort Drive #004, Baltimore, MD 21230"); split them so the
      # Contact & Location controls prefill even before the first save.
      if @vendor.city.blank? && @vendor.location.present?
        parts = @vendor.location.split(",").map(&:strip)
        @vendor.city  = parts[0]
        @vendor.state = parts[1] if @vendor.state.blank? && parts[1]
      end
      if @vendor.street_address.blank? && @vendor.address.present?
        @vendor.street_address = @vendor.address.split(",").first.to_s.strip
        @vendor.zip ||= @vendor.address[/\b(\d{5})(?:-\d{4})?\s*\z/, 1]
      end
    end

    def update
      v = @vendor

      # Business name is required — never blank it out.
      v.name = params[:name].to_s.strip if params[:name].to_s.strip.present?

      # Plain text fields (main column + contact rail).
      %i[owner_names street_address address_line2 city state zip phone
         website email about story
         delivery_shipping delivery_schedule moq_details
         production seasonal_offerings growth_goals
         marketing_opportunities_details].each do |k|
        v.public_send("#{k}=", params[k].to_s.strip) if params.key?(k)
      end

      # Shop banner — committed by the picker's hidden fields. Empty string means
      # "Remove banner": the public page falls back to a neutral surface.
      if params.key?(:banner_image)
        v.banner_image    = params[:banner_image].to_s.strip.presence
        v.banner_category = params[:banner_category].to_s.strip.presence
      end

      # Radio groups — only assign when the param arrives.
      %i[business_type revenue employees health_clearance marketing_opportunities].each do |k|
        v.public_send("#{k}=", params[k]) if params[k].present?
      end

      # Business Certifications — single-select dropdown (Woman-/Minority-owned)
      # + PDF proof (upload stubbed). Still stored as the certifications array,
      # which the buyer side renders as attribute badges and filters on.
      v.certifications = [params[:business_certification].to_s.strip].reject(&:blank?) if params.key?(:business_certification)

      # Insurance — single-select dropdown + PDF proof (upload stubbed).
      v.insurance = [params[:insurance_selection].to_s.strip].reject(&:blank?) if params.key?(:insurance_selection)

      # Checkbox groups arrive as arrays (absent = cleared).
      v.business_identity = Array(params[:business_identity])
      v.personal_identity = Array(params[:personal_identity])

      # Sales Channels (tabbed) — participation is derived: a channel with any
      # saved data is one the vendor operates in; zero input = not participating.
      if params[:channels].respond_to?(:each)
        raw = params[:channels].respond_to?(:to_unsafe_h) ? params[:channels].to_unsafe_h : params[:channels].to_h
        cleaned = {}
        raw.each do |key, fields|
          next unless fields.is_a?(Hash)
          data = {}
          fields.each do |f, val|
            if val.is_a?(Array)
              vals = val.map { |x| x.to_s.strip }.reject(&:empty?)
              data[f] = vals if vals.any?
            else
              s = val.to_s.strip
              data[f] = s unless s.empty?
            end
          end
          cleaned[key] = data if data.any?
        end
        v.channel_data = cleaned
        channel_names = { "cpg" => "Consumer Packaged Goods", "grab_go" => "Grab-and-Go Fresh Retail",
                          "boh" => "Back-of-House Products", "catering" => "Catering & Pop-Up Events",
                          "gifting" => "Customization & Gifting", "food_truck" => "Food Truck or Cart" }
        v.sales_channels = cleaned.keys.map { |k| channel_names[k] }.compact
      end

      # Delivery/shipping day chips — keep the buyer-facing schedule string and
      # cart defaults in sync with the selected delivery days.
      if params.key?(:delivery_days)
        v.delivery_days = Array(params[:delivery_days])
        v.delivery_schedule = v.delivery_days.join(", ") if v.delivery_days.any?
        v.preferred_delivery_day = v.delivery_days.first if v.delivery_days.any?
      end
      v.shipping_days = Array(params[:shipping_days]) if params.key?(:shipping_days)

      # Social media addresses — full URLs; LinkedIn replaced X (Jul 31 review).
      v.social_links = {
        instagram: params[:instagram].to_s.strip.presence,
        tiktok:    params[:tiktok].to_s.strip.presence,
        facebook:  params[:facebook].to_s.strip.presence,
        linkedin:  params[:linkedin].to_s.strip.presence,
      }.compact

      # Keep the buyer-facing derived strings in sync with their sources.
      v.location = [v.city, v.state].reject(&:blank?).join(", ") if v.city.present?
      v.owned    = v.owner_names.present? ? "Owned by: #{v.owner_names}" : nil
      street     = [v.street_address, v.address_line2].reject(&:blank?).join(" ")
      if street.present?
        v.address = [street, v.city, [v.state, v.zip].reject(&:blank?).join(" ")]
                      .reject(&:blank?).join(", ")
      end

      # Preview saves first, then lands on the public page — otherwise a plain
      # link would discard whatever the vendor just typed.
      if params[:preview].present?
        redirect_to vendor_path(v.id)
      else
        redirect_to vendor_profile_path, notice: "Profile saved — your public page is up to date."
      end
    end
  end
end
