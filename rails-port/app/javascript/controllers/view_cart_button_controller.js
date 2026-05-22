import { Controller } from "@hotwired/stimulus"
import { findCartController } from "./cart_controller"

export default class extends Controller {
  static targets = ["label", "count"]

  connect() {
    this.boundSync = () => this.#sync()
    document.addEventListener("cart:changed",     this.boundSync)
    document.addEventListener("cart:po-changed",  this.boundSync)
    document.addEventListener("cart:item-added",  () => this.#bump())
    this.#sync()
  }
  disconnect() {
    document.removeEventListener("cart:changed",    this.boundSync)
    document.removeEventListener("cart:po-changed", this.boundSync)
  }

  open() { findCartController(this.application)?.setDrawerOpen(true) }

  #sync() {
    const cart = findCartController(this.application); if (!cart) return
    this.labelTarget.textContent = cart.hasActivePO ? "View Draft PO" : "Add to Draft PO"
    this.countTarget.textContent = String(cart.getTotalItems())
  }

  #bump() {
    this.element.dataset.cartBumping = "true"
    setTimeout(() => { delete this.element.dataset.cartBumping }, 240)
  }
}
