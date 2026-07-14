# Every controller in the vendor experience inherits from this. It guarantees two
# things: you are acting as a vendor, and `@vendor` is who you are. No controller
# below this point should reach for a Vendor by id.
#
# URLs here are /vendor/*; the module is VendorPortal because `Vendor` is the model.
module VendorPortal
  class BaseController < ApplicationController
    before_action :require_vendor_persona

    private

    # No auth in the prototype — landing on a vendor URL while browsing as a buyer
    # just flips you rather than 403ing. Keeps demo and user-testing frictionless.
    def require_vendor_persona
      session[:persona] = Persona::VENDOR unless vendor_persona?
      @vendor = current_vendor
      redirect_to root_path unless @vendor
    end
  end
end
