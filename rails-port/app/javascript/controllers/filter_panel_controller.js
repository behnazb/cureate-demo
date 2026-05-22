import { Controller } from "@hotwired/stimulus"

// filter_panel_controller — advanced filter slide-in panel.
// Dispatches "filter-panel:change" with { filters, priceMin, priceMax } on every change.
export default class extends Controller {
  static targets = [
    "panel", "backdrop", "activeCount", "clearButton",
    "priceMin", "priceMax", "priceTrack", "priceMinInput", "priceMaxInput",
    "groupCount", "applyCount",
  ]

  connect() {
    this.filters = {}
    this.minPrice = 0
    this.maxPrice = 50

    this.boundOpen  = () => this.open()
    this.boundClear = () => this.clearAll()
    document.addEventListener("filter-panel:open",  this.boundOpen)
    document.addEventListener("filter-panel:clear", this.boundClear)

    this.#updatePriceUI()
  }
  disconnect() {
    document.removeEventListener("filter-panel:open",  this.boundOpen)
    document.removeEventListener("filter-panel:clear", this.boundClear)
  }

  open() {
    this.panelTarget.classList.remove("hidden")
    this.panelTarget.classList.add("flex")
    this.backdropTarget.dataset.open = "true"
    document.body.style.overflow = "hidden"
  }
  close() {
    this.panelTarget.classList.add("hidden")
    this.panelTarget.classList.remove("flex")
    this.backdropTarget.dataset.open = "false"
    document.body.style.overflow = ""
  }

  toggleCheckbox(event) {
    const filterId = event.currentTarget.dataset.filterId
    const optionId = event.currentTarget.dataset.optionId
    const current = this.filters[filterId] || []
    const idx = current.indexOf(optionId)
    if (idx >= 0) current.splice(idx, 1)
    else current.push(optionId)
    if (current.length) this.filters[filterId] = current
    else delete this.filters[filterId]

    // Update visuals: box + check on this checkbox
    const label = event.currentTarget.closest("label")
    const box = label.querySelector("[data-checkbox-box]")
    const check = label.querySelector("[data-checkbox-check]")
    const isOn = current.includes(optionId)
    box.classList.toggle("bg-[#28ba93]", isOn)
    box.classList.toggle("border-[#28ba93]", isOn)
    box.classList.toggle("border-[#a1a4aa]", !isOn)
    check.classList.toggle("hidden", !isOn)

    this.#syncCounts()
    this.#emit()
  }

  priceChange(event) {
    const lo = parseFloat(this.priceMinInputTarget.value)
    const hi = parseFloat(this.priceMaxInputTarget.value)
    this.minPrice = Math.min(lo, hi)
    this.maxPrice = Math.max(lo, hi)
    this.#updatePriceUI()
    this.#emit()
  }

  clearAll() {
    this.filters = {}
    this.minPrice = 0
    this.maxPrice = 50
    this.priceMinInputTarget.value = 0
    this.priceMaxInputTarget.value = 50
    // Reset all checkbox visuals
    this.element.querySelectorAll(".filter-panel-checkbox").forEach(input => {
      input.checked = false
      const label = input.closest("label")
      const box = label.querySelector("[data-checkbox-box]")
      const check = label.querySelector("[data-checkbox-check]")
      box.classList.remove("bg-[#28ba93]", "border-[#28ba93]")
      box.classList.add("border-[#a1a4aa]")
      check.classList.add("hidden")
    })
    this.#updatePriceUI()
    this.#syncCounts()
    this.#emit()
  }

  #updatePriceUI() {
    this.priceMinTarget.textContent = this.minPrice.toFixed(2)
    this.priceMaxTarget.textContent = this.maxPrice.toFixed(2)
    this.priceTrackTarget.style.left  = `${(this.minPrice / 50) * 100}%`
    this.priceTrackTarget.style.right = `${100 - (this.maxPrice / 50) * 100}%`
  }

  #syncCounts() {
    const total = Object.values(this.filters).reduce((s, arr) => s + arr.length, 0)
    if (total > 0) {
      this.activeCountTarget.textContent = String(total)
      this.activeCountTarget.classList.remove("hidden")
      this.activeCountTarget.classList.add("flex")
      this.clearButtonTarget.classList.remove("hidden")
      this.applyCountTarget.textContent = ` (${total})`
    } else {
      this.activeCountTarget.classList.add("hidden")
      this.activeCountTarget.classList.remove("flex")
      this.clearButtonTarget.classList.add("hidden")
      this.applyCountTarget.textContent = ""
    }
    this.groupCountTargets.forEach(span => {
      const fid = span.dataset.filterId
      const count = (this.filters[fid] || []).length
      if (count > 0) {
        span.textContent = String(count)
        span.classList.remove("hidden")
        span.classList.add("inline-flex")
      } else {
        span.classList.add("hidden")
        span.classList.remove("inline-flex")
      }
    })
  }

  #emit() {
    document.dispatchEvent(new CustomEvent("filter-panel:change", {
      detail: { filters: { ...this.filters }, priceMin: this.minPrice, priceMax: this.maxPrice },
    }))
  }
}
