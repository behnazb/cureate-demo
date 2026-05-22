import { Controller } from "@hotwired/stimulus"
import { findCartController } from "./cart_controller"

// add_to_cart_controller — mirrors AddToCartButton.tsx behavior.
// Three visual states: add (qty=0), counter (qty>0).
// When qty=1, the left button becomes a trash icon (removes item).
export default class extends Controller {
  static targets = ["addButton", "stepper", "quantity", "leftIcon"]
  static values  = { vendorId: String, productId: String }

  connect() {
    this.boundSync = () => this.#render()
    document.addEventListener("cart:changed", this.boundSync)
    this.#render()
  }
  disconnect() { document.removeEventListener("cart:changed", this.boundSync) }

  add(e) {
    this.#stop(e)
    findCartController(this.application)?.addItem(this.vendorIdValue, this.productIdValue, 1, "units")
  }

  increment(e) {
    this.#stop(e)
    findCartController(this.application)?.addItem(this.vendorIdValue, this.productIdValue, 1, "units")
  }

  decrement(e) {
    this.#stop(e)
    const cart = findCartController(this.application); if (!cart) return
    const qty = cart.quantityFor(this.vendorIdValue, this.productIdValue)
    if (qty <= 1) cart.removeItem(this.vendorIdValue, this.productIdValue)
    else cart.addItem(this.vendorIdValue, this.productIdValue, -1, "units")
  }

  #render() {
    const cart = findCartController(this.application); if (!cart) return
    const qty = cart.quantityFor(this.vendorIdValue, this.productIdValue)
    if (qty === 0) {
      this.addButtonTarget.classList.remove("hidden")
      this.addButtonTarget.classList.add("flex")
      this.stepperTarget.classList.add("hidden")
      this.stepperTarget.classList.remove("flex")
    } else {
      this.addButtonTarget.classList.add("hidden")
      this.addButtonTarget.classList.remove("flex")
      this.stepperTarget.classList.remove("hidden")
      this.stepperTarget.classList.add("flex")
      this.quantityTarget.textContent = String(qty)
      // Left icon: trash when qty=1, minus when qty>1
      this.leftIconTarget.innerHTML = qty === 1
        ? `<img src="/icons/icon_trash.svg" alt="" class="w-full h-full" style="filter: invert(18%) sepia(82%) saturate(456%) hue-rotate(155deg) brightness(85%) contrast(95%)">`
        : `<svg viewBox="0 0 11 11" fill="none" class="w-full h-full"><path d="M1 5.5h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`
    }
  }

  #stop(e) { e.preventDefault(); e.stopPropagation() }
}
