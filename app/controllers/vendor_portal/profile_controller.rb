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
         production seasonal_offerings growth_goals].each do |k|
        v.public_send("#{k}=", params[k].to_s.strip) if params.key?(k)
      end

      # Radio groups — only assign when the param arrives.
      %i[business_type revenue employees health_clearance].each do |k|
        v.public_send("#{k}=", params[k]) if params[k].present?
      end

      # Checkbox groups arrive as arrays (absent = cleared).
      # Business Certifications IS the certifications array — it's what the buyer
      # side renders as attribute badges and filters on (Woman-owned, …).
      v.certifications = Array(params[:business_certifications])
      v.insurance      = Array(params[:insurance])
      v.goals          = Array(params[:goals])

      # Social handles (not URLs) — production stores the account name.
      v.social_links = {
        facebook:  params[:facebook].to_s.strip.delete_prefix("@").presence,
        twitter:   params[:twitter].to_s.strip.delete_prefix("@").presence,
        instagram: params[:instagram].to_s.strip.delete_prefix("@").presence,
      }.compact

      # Keep the buyer-facing derived strings in sync with their sources.
      v.location = [v.city, v.state].reject(&:blank?).join(", ") if v.city.present?
      v.owned    = v.owner_names.present? ? "Owned by: #{v.owner_names}" : nil
      street     = [v.street_address, v.address_line2].reject(&:blank?).join(" ")
      if street.present?
        v.address = [street, v.city, [v.state, v.zip].reject(&:blank?).join(" ")]
                      .reject(&:blank?).join(", ")
      end

      redirect_to vendor_profile_path, notice: "Profile saved — your public page is up to date."
    end
  end
end
