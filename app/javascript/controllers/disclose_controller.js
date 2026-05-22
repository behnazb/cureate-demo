import { Controller } from "@hotwired/stimulus"

// disclose_controller — generic show/hide widget.
// Usage:
//   data-controller="disclose"
//   data-disclose-open-value="true"     ← initial open state
// Targets: body (the panel), caret (optional rotation indicator)
export default class extends Controller {
  static targets = ["body", "caret"]
  static values  = { open: Boolean }

  connect() {
    this.#apply(this.openValue)
  }
  toggle() {
    this.openValue = !this.openValue
    this.#apply(this.openValue)
  }
  #apply(open) {
    if (this.hasBodyTarget) this.bodyTarget.classList.toggle("hidden", !open)
    if (this.hasCaretTarget) this.caretTarget.classList.toggle("rotate-180", open)
  }
}
