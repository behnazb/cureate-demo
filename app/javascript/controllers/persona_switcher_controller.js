import { Controller } from "@hotwired/stimulus"

// Persona switcher (E0) — the prototype's stand-in for an auth menu.
// Click the identity block, pick a persona, navigate. Same open/close/outside-click
// behavior as po_dropdown_menu so it feels like the rest of the system.
export default class extends Controller {
  static targets = ["menu"]

  connect() {
    this.boundOutside = (e) => { if (!this.element.contains(e.target)) this.#close() }
    this.boundEscape  = (e) => { if (e.key === "Escape") this.#close() }
    document.addEventListener("mousedown", this.boundOutside)
    document.addEventListener("keydown", this.boundEscape)
  }

  disconnect() {
    document.removeEventListener("mousedown", this.boundOutside)
    document.removeEventListener("keydown", this.boundEscape)
  }

  toggle(event) {
    event.stopPropagation()
    const open = this.menuTarget.dataset.open === "true"
    this.menuTarget.dataset.open = open ? "false" : "true"
  }

  #close() { if (this.hasMenuTarget) this.menuTarget.dataset.open = "false" }
}
