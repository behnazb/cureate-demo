import { Controller } from "@hotwired/stimulus"

// order_actions_controller — the vendor's lifecycle actions on a PO.
//
// Only ever ONE action is primary, because only one is legal in a given state:
//   Requested   → Confirm  (or Decline)
//   Confirmed   → Mark as fulfilled → Delivery | Shipping
//   Fulfillment → Issue invoice (locked until proven + buyer window closed)
//   Invoiced    → nothing. The record is frozen.
export default class extends Controller {
  static targets = ["declinePanel", "fulfillPanel", "shippingFields", "methodInput", "submitFulfill"]

  toggleDecline() {
    this.declinePanelTarget.classList.toggle("hidden")
    if (this.hasFulfillPanelTarget) this.fulfillPanelTarget.classList.add("hidden")
  }

  toggleFulfill() {
    this.fulfillPanelTarget.classList.toggle("hidden")
  }

  // Picking Shipping reveals carrier + tracking. Picking Delivery hides them: a truck
  // delivery has no carrier, and its proof comes from the driver's phone, not this form.
  chooseMethod(event) {
    const method = event.currentTarget.value
    this.shippingFieldsTarget.classList.toggle("hidden", method !== "Shipping")
    this.submitFulfillTarget.disabled = false
    this.submitFulfillTarget.classList.remove("opacity-40", "cursor-not-allowed")

    // Visually select the chosen card.
    this.element.querySelectorAll("[data-method-card]").forEach((card) => {
      const on = card.dataset.methodCard === method
      card.style.borderColor = on ? "#28ba93" : "#e8e8e8"
      card.style.backgroundColor = on ? "#f0fbf7" : "#ffffff"
    })
  }
}
