import { Controller } from "@hotwired/stimulus"
import { findCartController } from "./cart_controller"

// po_detail_controller — the PO detail page's primary green CTA (T11).
//   • Draft PO:     "Add to Order"  — loads this PO's items into the cart, opens it.
//   • Non-draft PO: "Duplicate PO"  — same, which lands them in a fresh draft for an
//     open delivery week, so the buyer can immediately edit/submit the reorder.
export default class extends Controller {
  static values = { lineItems: Array }

  loadToCart() {
    const cart = findCartController(this.application)
    if (!cart) return
    cart.loadDraftItems(this.lineItemsValue)
    cart.setDrawerOpen(true)
  }
}
