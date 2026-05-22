import { Controller } from "@hotwired/stimulus"
import { findCartController } from "./cart_controller"

// mobile_nav_controller — drawer open/close + cart badge updates.
// Drawer transitions use [data-transition="..."] CSS in application.tailwind.css.
export default class extends Controller {
  static targets = ["drawer", "backdrop", "badge", "cartButton"]
  static values = { onPoRoute: Boolean }

  connect() {
    this.#syncBadge()
    this.boundSync = () => this.#syncBadge()
    document.addEventListener("cart:changed", this.boundSync)
  }

  disconnect() {
    document.removeEventListener("cart:changed", this.boundSync)
  }

  openDrawer()  { this.#setDrawer(true) }
  closeDrawer() { this.#setDrawer(false) }

  openCart() {
    findCartController(this.application)?.setDrawerOpen(true)
  }

  #setDrawer(open) {
    if (!this.hasDrawerTarget) return
    this.drawerTarget.dataset.open = open
    this.backdropTarget.dataset.open = open
    document.body.style.overflow = open ? "hidden" : ""
  }

  #syncBadge() {
    if (!this.hasBadgeTarget) return
    const cart = findCartController(this.application)
    if (!cart) return
    const count = cart.getTotalItems()
    if (count > 0) {
      this.badgeTarget.textContent = String(count)
      this.badgeTarget.classList.remove("hidden")
      this.badgeTarget.classList.add("flex")
    } else {
      this.badgeTarget.classList.add("hidden")
      this.badgeTarget.classList.remove("flex")
    }
  }
}
