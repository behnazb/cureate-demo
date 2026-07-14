import { Controller } from "@hotwired/stimulus"

// filter_drawer_controller — the vendor Orders filter drawer.
//
// Same slide-in-from-left drawer as the buyer's product FilterPanel, but server-backed:
// the buyer's panel filters a static list in JS, while vendor orders are filtered by
// query params on the server. So this controller only owns open/close + the live
// selection count; "Apply" submits the form and Rails does the filtering.
export default class extends Controller {
  static targets = ["panel", "backdrop", "count", "applyCount", "clearButton", "form"]

  connect() {
    this.boundEscape = (e) => { if (e.key === "Escape") this.close() }
    document.addEventListener("keydown", this.boundEscape)
    this.syncCounts()
  }

  disconnect() { document.removeEventListener("keydown", this.boundEscape) }

  open() {
    this.panelTarget.classList.remove("hidden")
    this.panelTarget.classList.add("flex")
    this.backdropTarget.classList.remove("hidden")
    document.body.style.overflow = "hidden"
  }

  close() {
    this.panelTarget.classList.add("hidden")
    this.panelTarget.classList.remove("flex")
    this.backdropTarget.classList.add("hidden")
    document.body.style.overflow = ""
  }

  apply() { this.formTarget.requestSubmit() }

  // Checkbox visuals mirror the buyer's FilterPanel exactly (same box, same checkmark
  // asset) so the two drawers read as one component.
  toggleCheckbox(event) {
    const input = event.currentTarget
    const label = input.closest("label")
    const box   = label.querySelector("[data-checkbox-box]")
    const check = label.querySelector("[data-checkbox-check]")
    box.classList.toggle("bg-[#28ba93]", input.checked)
    box.classList.toggle("border-[#28ba93]", input.checked)
    box.classList.toggle("border-[#a1a4aa]", !input.checked)
    check.classList.toggle("hidden", !input.checked)
    this.syncCounts()
  }

  syncCounts() {
    const boxes = this.element.querySelectorAll(".drawer-checkbox:checked").length
    const dates = Array.from(this.element.querySelectorAll("input[type=date]"))
                       .filter(i => i.value).length
    const total = boxes + dates

    if (this.hasCountTarget) {
      this.countTarget.textContent = String(total)
      this.countTarget.classList.toggle("hidden", total === 0)
      this.countTarget.classList.toggle("inline-flex", total > 0)
    }
    if (this.hasApplyCountTarget) {
      this.applyCountTarget.textContent = total > 0 ? ` (${total})` : ""
    }
    if (this.hasClearButtonTarget) {
      this.clearButtonTarget.classList.toggle("hidden", total === 0)
    }
  }
}
