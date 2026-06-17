import { Controller } from "@hotwired/stimulus"
import { findCartController } from "./cart_controller"

// product_detail_controller — quantity stepper + add to order on the PDP.
//
// Mirrors the cart drawer's per-item model: the buyer adds whole orderable ITEMS
// (a 2-pack, a case, a unit), never individual sub-units. Pricing and the MOQ
// progress are computed exactly as the cart drawer computes them, so the PDP, the
// gallery card, and the cart drawer always agree.
//   • qty is cart-backed (single source of truth across surfaces).
//   • Each item = units_per_item individual units; a full case == the case price.
//   • MOQ is gated on the vendor's running cart total — dollars for a $-minimum
//     vendor, otherwise individual units toward the case minimum.
export default class extends Controller {
  static targets = [
    "qty", "totalUnits", "totalPrice", "progressBar", "progressLabel",
    "progressLeft", "addButton", "addButtonHint", "toast",
  ]
  static values = {
    vendorId:           String,
    productId:          String,
    unitsPerCase:       Number,
    unitsPerItem:       Number,
    minUnits:           Number,
    minAmount:          Number,
    wholesaleUnitPrice: Number,
    wholesaleCasePrice: Number,
    itemLabel:          String,
  }

  connect() {
    this.localQty = 1
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

  add() {
    this.#setCart(this.#inCart() ? this.#cartQty() : this.localQty)
    this.#showToast()
  }

  // ── Cart helpers ───────────────────────────────────────────────────────────
  #cart()    { return findCartController(this.application) }
  #cartQty() { const c = this.#cart(); return c ? c.quantityFor(this.vendorIdValue, this.productIdValue) : 0 }
  #inCart()  { return this.#cartQty() > 0 }
  // Always stored as whole items (unit "units"); the cart converts via units_per_item.
  #setCart(q) { this.#cart()?.setQuantity(this.vendorIdValue, this.productIdValue, q, "units") }

  // Price of one orderable item, prorated from the case price so a full case == case price.
  #itemPrice() {
    const upc = this.unitsPerCaseValue || 1
    const itemUnits = this.unitsPerItemValue || 1
    return this.wholesaleCasePriceValue
      ? (itemUnits / upc) * this.wholesaleCasePriceValue
      : this.wholesaleUnitPriceValue * itemUnits
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  #render() {
    const qty = this.#inCart() ? this.#cartQty() : this.localQty
    const upc = this.unitsPerCaseValue || 1
    const itemUnits = this.unitsPerItemValue || 1
    const label = this.itemLabelValue || "unit"
    const itemPrice = this.#itemPrice()

    this.qtyTarget.textContent = qty
    this.totalUnitsTarget.textContent = `${qty} ${label}${qty === 1 ? "" : "s"} × $${itemPrice.toFixed(2)}`
    this.totalPriceTarget.textContent = `$${(itemPrice * qty).toFixed(2)}`

    // Vendor totals across the cart, computed exactly like the cart drawer. Item metadata
    // is uniform per vendor, so this product's values represent the whole vendor.
    const cart = this.#cart()
    const vItems = cart ? cart.items.filter(i => i.vendorId === this.vendorIdValue) : []
    const lineUnits = (i) => i.unit === "cases" ? i.quantity * upc : i.quantity * itemUnits
    const vendorUnits = vItems.reduce((s, i) => s + lineUnits(i), 0)
    const vendorTotal = vItems.reduce((s, i) => {
      const lu = lineUnits(i)
      return s + (this.wholesaleCasePriceValue ? (lu / upc) * this.wholesaleCasePriceValue : this.wholesaleUnitPriceValue * lu)
    }, 0)

    let pct, minMet, labelHtml, leftHtml
    if (this.minAmountValue && this.minAmountValue > 0) {
      // Dollar-gated MOQ (mirrors the cart).
      minMet = vendorTotal >= this.minAmountValue
      pct = Math.min((vendorTotal / this.minAmountValue) * 100, 100)
      const remaining = Math.max(0, this.minAmountValue - vendorTotal)
      labelHtml = `$${vendorTotal.toFixed(2)} / $${this.minAmountValue} min`
      leftHtml = minMet
        ? `Minimum order met <span class="icon-check w-[11px] h-[11px] align-middle"></span>`
        : `Add $${remaining.toFixed(2)} more to meet $${this.minAmountValue} MOQ`
    } else {
      // Item/case-gated MOQ (mirrors the cart): count whole items toward the case minimum.
      minMet = vendorUnits >= this.minUnitsValue
      pct = this.minUnitsValue > 0 ? Math.min((vendorUnits / this.minUnitsValue) * 100, 100) : 100
      const minItems = Math.max(1, Math.round(this.minUnitsValue / itemUnits))
      const remItems = Math.max(0, Math.ceil(minItems - vendorUnits / itemUnits))
      const minCases = Math.max(1, Math.round(this.minUnitsValue / upc))
      labelHtml = `${vendorUnits} / ${this.minUnitsValue} units min`
      leftHtml = minMet
        ? `Minimum order quantity met <span class="icon-check w-[11px] h-[11px] align-middle"></span>`
        : `Add ${remItems} more ${label}${remItems === 1 ? "" : "s"} to meet ${minCases} Case${minCases === 1 ? "" : "s"} MOQ`
    }

    this.progressBarTarget.style.width = `${pct}%`
    this.progressBarTarget.style.backgroundColor = minMet ? "#28ba93" : "#377b82"
    this.progressLabelTarget.innerHTML = labelHtml + (minMet ? ` <span class="icon-check w-[11px] h-[11px] align-middle"></span>` : "")
    this.progressLeftTarget.innerHTML = leftHtml

    // Mix-and-match / vendor-level minimum: adding is always allowed.
    this.addButtonTarget.style.backgroundColor = "#28ba93"
    this.addButtonTarget.style.cursor = "pointer"
    this.addButtonTarget.innerHTML = this.#inCart()
      ? `<span class="icon-check w-[15px] h-[15px]"></span>In your order — update`
      : "＋ Add to Order"
    this.addButtonHintTarget.classList.add("hidden")
  }

  #showToast() {
    this.toastTarget.dataset.open = "true"
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => { this.toastTarget.dataset.open = "false" }, 2000)
  }
}
