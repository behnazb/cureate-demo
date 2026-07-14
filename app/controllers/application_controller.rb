class ApplicationController < ActionController::Base
  # Add layout setup, current_user accessors, etc. as your production app requires.
  # This skeleton intentionally stays minimal so it can drop in without conflict.

  helper_method :current_persona, :current_persona_key,
                :buyer_persona?, :vendor_persona?, :current_vendor

  # Prototype stand-in for authentication — see app/models/persona.rb.
  def current_persona_key
    Persona.normalize(session[:persona])
  end

  def current_persona
    Persona.find(current_persona_key)
  end

  def buyer_persona?
    current_persona_key == Persona::BUYER
  end

  def vendor_persona?
    current_persona_key == Persona::VENDOR
  end

  # The Vendor the vendor persona is acting as (2Betties). nil when browsing as a buyer.
  def current_vendor
    return nil unless vendor_persona?
    @current_vendor ||= Vendor.find(current_persona[:vendor_id])
  end
end
