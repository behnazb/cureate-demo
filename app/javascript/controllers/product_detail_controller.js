import { Controller } from "@hotwired/stimulus"
import { findCartController } from "./cart_controller"

// product_detail_controller — quantity stepper + unit toggle + add to order on /vendors/:vendor_id/products/:id.
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
    this.qty = 1
    this.unit = "Units"
    this.#render()
  }

  decrement() { this.qty = Math.max(1, this.qty - 1); this.#render() }
  increment() { this.qty += 1; this.#render() }
  setUnits() { this.unit = "Units"; this.qty = 1; this.#render() }
  setCases() { this.unit = "Cases"; this.qty = 1; this.#render() }

  add() {
    const totalUnits = this.unit === "Cases" ? this.qty * this.unitsPerCaseValue : this.qty
    if (totalUnits < this.minUnitsValue) return
    findCartController(this.application)?.addItem(
      this.vendorIdValue, this.productIdValue, this.qty, this.unit.toLowerCase()
    )
    this.#showToast()
  }

  #render() {
    const totalUnits = this.unit === "Cases" ? this.qty * this.unitsPerCaseValue : this.qty
    const totalPrice = totalUnits * this.wholesaleUnitPriceValue
    const pct = Math.min((totalUnits / this.minUnitsValue) * 100, 100)
    const minMet = totalUnits >= this.minUnitsValue

    this.qtyTarget.textContent = this.qty
    this.totalUnitsTarget.textContent = `${totalUnits} unit${totalUnits === 1 ? "" : "s"} × $${this.wholesaleUnitPriceValue.toFixed(2)}`
    this.totalPriceTarget.textContent = `$${totalPrice.toFixed(2)}`
    this.progressBarTarget.style.width = `${pct}%`
    this.progressBarTarget.style.backgroundColor = minMet ? "#28ba93" : "#377b82"
    this.progressLabelTarget.textContent = `${totalUnits} / ${this.minUnitsValue} units min${minMet ? " ✓" : ""}`
    this.progressLeftTarget.textContent = minMet
      ? ""
      : `Add ${this.minUnitsValue - totalUnits} more unit${this.minUnitsValue - totalUnits === 1 ? "" : "s"} to meet the minimum`

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

    this.addButtonTarget.style.backgroundColor = minMet ? "#28ba93" : "#c0c0c0"
    this.addButtonTarget.style.cursor = minMet ? "pointer" : "not-allowed"
    this.addButtonHintTarget.classList.toggle("hidden", minMet)
  }

  #showToast() {
    this.toastTarget.dataset.open = "true"
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => { this.toastTarget.dataset.open = "false" }, 2000)
  }
}
