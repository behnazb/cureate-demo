import { Controller } from "@hotwired/stimulus"
import { findCartController } from "./cart_controller"

// product_detail_controller — quantity stepper + unit toggle + add to order on the PDP.
//
// T08: qty is cart-backed so it's a single source of truth across the gallery, the
// PDP, and the cart drawer.
//   • On connect the stepper shows this product's quantity in the active draft.
//   • Editing the stepper while the product is in the cart live-updates the cart
//     (so the change is reflected on the gallery card and in the cart drawer).
//   • Before a product is in the cart, the stepper holds a local "to add" qty;
//     "Add to Order" commits it.
//   • The MOQ progress bar is computed from the cart's actual vendor total — the
//     same number the cart drawer shows — not from this single product's qty.
export default class extends Controller {
  static targets = [
    "qty", "totalUnits", "totalPrice", "progressBar", "progressLabel",
    "progressLeft", "minMetCheck", "addButton", "addButtonHint",
    "unitsButton", "casesButton", "toast",
  ]
  static values = {
    vendorId:           String,
    productId:          String,
    unitsPerCase:       Number,
    minUnits:           Number,
    wholesaleUnitPrice: Number,
  }

  connect() {
    this.localQty = 1
    const item = this.#cartItem()
    this.unit = item && item.unit === "cases" ? "Cases" : "Units"
    this.boundRender = () => this.#render()
    document.addEventListener("cart:changed", this.boundRender)
    this.#render()
  }
  disconnect() { document.removeEventListener("cart:changed", this.boundRender) }

  increment() {
    if (this.#inCart()) this.#setCart(this.#cartQty() + 1)
    else { this.localQty += 1; this.#render() }
  }
  decrement() {
    if (this.#inCart()) this.#setCart(this.#cartQty() - 1) // 0 removes it
    else { this.localQty = Math.max(1, this.localQty - 1); this.#render() }
  }

  setUnits() { this.#setUnit("Units") }
  setCases() { this.#setUnit("Cases") }
  #setUnit(unit) {
    this.unit = unit
    if (this.#inCart()) this.#setCart(this.#cartQty()) // re-commit with the new unit
    else this.#render()
  }

  add() {
    this.#setCart(this.#inCart() ? this.#cartQty() : this.localQty)
    this.#showToast()
  }

  // ── Cart helpers ───────────────────────────────────────────────────────────
  #cart()     { return findCartController(this.application) }
  #cartItem() {
    const c = this.#cart()
    return c && c.items.find(i => i.vendorId === this.vendorIdValue && i.productId === this.productIdValue)
  }
  #cartQty()  { const c = this.#cart(); return c ? c.quantityFor(this.vendorIdValue, this.productIdValue) : 0 }
  #inCart()   { return this.#cartQty() > 0 }
  #setCart(q) {
    // Triggers cart:changed → #render keeps every surface in sync.
    this.#cart()?.setQuantity(this.vendorIdValue, this.productIdValue, q, this.unit.toLowerCase())
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  #render() {
    const qty = this.#inCart() ? this.#cartQty() : this.localQty
    const totalUnits = this.unit === "Cases" ? qty * this.unitsPerCaseValue : qty
    const totalPrice = totalUnits * this.wholesaleUnitPriceValue

    // MOQ progress = the vendor's actual total in the cart (matches the cart drawer).
    const cart = this.#cart()
    const vendorUnits = cart
      ? cart.getTotalUnits(this.vendorIdValue, { [this.vendorIdValue]: this.unitsPerCaseValue })
      : 0
    const pct = Math.min((vendorUnits / this.minUnitsValue) * 100, 100)
    const minMet = vendorUnits >= this.minUnitsValue
    const remaining = Math.max(0, this.minUnitsValue - vendorUnits)

    this.qtyTarget.textContent = qty
    this.totalUnitsTarget.textContent = `${totalUnits} unit${totalUnits === 1 ? "" : "s"} × $${this.wholesaleUnitPriceValue.toFixed(2)}`
    this.totalPriceTarget.textContent = `$${totalPrice.toFixed(2)}`

    this.progressBarTarget.style.width = `${pct}%`
    this.progressBarTarget.style.backgroundColor = minMet ? "#28ba93" : "#377b82"
    this.progressLabelTarget.textContent = `${vendorUnits} / ${this.minUnitsValue} units min${minMet ? " ✓" : ""}`
    this.progressLeftTarget.textContent = minMet
      ? "Minimum order quantity met ✓"
      : `Add ${remaining} more unit${remaining === 1 ? "" : "s"} to meet the minimum`

    // Unit toggle styling
    this.unitsButtonTarget.classList.toggle("bg-[#035257]", this.unit === "Units")
    this.unitsButtonTarget.classList.toggle("text-white",   this.unit === "Units")
    this.unitsButtonTarget.classList.toggle("border",       this.unit !== "Units")
    this.unitsButtonTarget.classList.toggle("border-[#a1a4aa]", this.unit !== "Units")
    this.unitsButtonTarget.classList.toggle("text-[#444955]",   this.unit !== "Units")

    this.casesButtonTarget.classList.toggle("bg-[#035257]", this.unit === "Cases")
    this.casesButtonTarget.classList.toggle("text-white",   this.unit === "Cases")
    this.casesButtonTarget.classList.toggle("border",       this.unit !== "Cases")
    this.casesButtonTarget.classList.toggle("border-[#a1a4aa]", this.unit !== "Cases")
    this.casesButtonTarget.classList.toggle("text-[#444955]",   this.unit !== "Cases")

    // Mix-and-match: adding always allowed — the vendor minimum accrues across
    // flavors, so never gate the button on a single product reaching it.
    this.addButtonTarget.style.backgroundColor = "#28ba93"
    this.addButtonTarget.style.cursor = "pointer"
    this.addButtonTarget.textContent = this.#inCart() ? "✓ In your order — update" : "＋ Add to Order"
    this.addButtonHintTarget.classList.add("hidden")
  }

  #showToast() {
    this.toastTarget.dataset.open = "true"
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => { this.toastTarget.dataset.open = "false" }, 2000)
  }
}
