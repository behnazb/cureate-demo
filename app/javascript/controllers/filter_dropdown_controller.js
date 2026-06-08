import { Controller } from "@hotwired/stimulus"

// filter_dropdown_controller — single/multi-select dropdown.
// Dispatches "filter:change" with { filterId, selected } when selection changes.
export default class extends Controller {
  static targets = ["trigger", "menu", "label", "count", "caret", "option", "clearRow"]
  static values = {
    filterId:     String,
    selection:    String,  // "single" | "multiple"
    defaultLabel: String,
  }

  connect() {
    this.selected = []
    this.boundOutside = (e) => { if (!this.element.contains(e.target)) this.#close() }
    document.addEventListener("mousedown", this.boundOutside)
    this.#render()
  }
  disconnect() { document.removeEventListener("mousedown", this.boundOutside) }

  toggle() {
    const open = this.menuTarget.dataset.open === "true"
    if (open) this.#close(); else this.#open()
  }

  select(event) {
    const id = event.currentTarget.dataset.optionId
    if (this.selectionValue === "single") {
      this.selected = [id]
      this.#close()
    } else {
      const idx = this.selected.indexOf(id)
      if (idx >= 0) this.selected.splice(idx, 1)
      else this.selected.push(id)
    }
    this.#render()
    this.#emit()
  }

  clear() {
    this.selected = []
    this.#render()
    this.#emit()
    this.#close()
  }

  // External (e.g. URL preselect)
  set(values) {
    this.selected = Array.isArray(values) ? values : []
    this.#render()
  }

  #open()  {
    this.#position()
    this.menuTarget.style.pointerEvents = "auto"
    this.menuTarget.dataset.open = "true"
    this.caretTarget.classList.add("rotate-180")
  }
  #close() {
    this.menuTarget.dataset.open = "false"
    this.menuTarget.style.pointerEvents = "none"
    this.caretTarget.classList.remove("rotate-180")
  }

  // The menu is position:fixed so it escapes the horizontally-scrolling filter
  // row (which would otherwise clip it and add a stray vertical scroll). Anchor
  // it under the trigger, clamped to the viewport.
  #position() {
    const r = this.triggerTarget.getBoundingClientRect()
    const menuW = this.menuTarget.offsetWidth || 180
    const left = Math.max(8, Math.min(r.left, window.innerWidth - menuW - 8))
    this.menuTarget.style.top = `${Math.round(r.bottom + 6)}px`
    this.menuTarget.style.left = `${Math.round(left)}px`
  }

  #hasSelection() {
    return this.selected.length > 0 &&
      !this.selected.includes("all-vendors") &&
      !this.selected.includes("all-locations")
  }

  #render() {
    // Trigger label + chip styling
    if (this.#hasSelection()) {
      this.triggerTarget.classList.add("bg-[#035257]", "text-white")
      this.triggerTarget.classList.remove("bg-white", "text-[#377b82]", "hover:bg-[#f0fafa]")
      if (this.selectionValue === "single") {
        const opt = this.optionTargets.find(o => o.dataset.optionId === this.selected[0])
        this.labelTarget.textContent = opt?.querySelector("span:first-child")?.textContent || this.defaultLabelValue
      } else if (this.selected.length === 1) {
        const opt = this.optionTargets.find(o => o.dataset.optionId === this.selected[0])
        this.labelTarget.textContent = opt?.querySelector("span:first-child")?.textContent || this.defaultLabelValue
        this.countTarget.classList.add("hidden")
        this.countTarget.classList.remove("flex")
      } else {
        this.labelTarget.textContent = `${this.selected.length} selected`
        this.countTarget.textContent = String(this.selected.length)
        this.countTarget.classList.remove("hidden")
        this.countTarget.classList.add("flex")
      }
      this.clearRowTarget.classList.remove("hidden")
    } else {
      this.triggerTarget.classList.remove("bg-[#035257]", "text-white")
      this.triggerTarget.classList.add("bg-white", "text-[#377b82]", "hover:bg-[#f0fafa]")
      this.labelTarget.textContent = this.defaultLabelValue
      this.countTarget.classList.add("hidden")
      this.countTarget.classList.remove("flex")
      this.clearRowTarget.classList.add("hidden")
    }

    // Per-option visual state
    this.optionTargets.forEach(opt => {
      const id = opt.dataset.optionId
      const isOn = this.selected.includes(id)
      opt.classList.toggle("text-[#035257]", isOn)
      opt.classList.toggle("font-bold", isOn)
      const check = opt.querySelector(".check")
      const box   = opt.querySelector(".checkbox")
      if (check) check.classList.toggle("hidden", !isOn)
      if (box) {
        box.classList.toggle("bg-[#28ba93]", isOn)
        box.classList.toggle("border-[#28ba93]", isOn)
        box.classList.toggle("border-[#a1a4aa]", !isOn)
      }
    })
  }

  #emit() {
    document.dispatchEvent(new CustomEvent("filter:change", {
      detail: { filterId: this.filterIdValue, selected: [...this.selected] },
    }))
  }
}
