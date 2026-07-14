import { Controller } from "@hotwired/stimulus"
import { findCartController } from "./cart_controller"

// po_detail_controller — the draft PO detail page's bottom CTAs. Non-draft POs
// are read-only (no page CTAs).
//
//   • "Add More to Order"    — loads this PO's lines into the cart UNDER ITS OWN
//     PO# / delivery week, then opens the product gallery with the drawer open.
//   • "Submit PO for Review" — same load, then opens the drawer straight on the
//     review/confirmation view. Submitting replaces this PO server-side as
//     In Review; when the success modal closes (or times out) the buyer lands
//     back on this page, whose status pill now reads In-Review.
export default class extends Controller {
  static values = {
    lineItems: Array,
    poId: { type: String, default: "" },
    deliveryWeek: { type: String, default: "" },
  }

  // Draft: keep shopping for this same draft PO in the gallery.
  addMoreToOrder() {
    const cart = this.#loadThisPO()
    if (!cart) return
    cart.setDrawerOpen(true)
    window.location.href = "/products"
  }

  // Draft: jump straight to the drawer's review/confirmation view.
  submitForReview() {
    const cart = this.#loadThisPO()
    if (!cart) return
    cart.setDrawerOpen(true)
    document.dispatchEvent(new CustomEvent("cart:open-confirmation", {
      detail: { returnTo: window.location.pathname },
    }))
  }

  #loadThisPO() {
    const cart = findCartController(this.application)
    if (!cart) return null
    cart.loadDraftForPO(this.poIdValue, this.deliveryWeekValue || null, this.lineItemsValue)
    return cart
  }
}
