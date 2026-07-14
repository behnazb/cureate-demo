# Switches the prototype's active persona (Buyer ⇄ Vendor) and lands the user on
# that persona's home. No auth — see app/models/persona.rb.
class PersonasController < ApplicationController
  def update
    key = Persona.normalize(params[:persona])
    session[:persona] = key
    redirect_to Persona.find(key)[:home]
  end
end
