import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["menu"]

  connect() {
    this.boundOutside = (e) => { if (!this.element.contains(e.target)) this.#close() }
    document.addEventListener("mousedown", this.boundOutside)
  }
  disconnect() { document.removeEventListener("mousedown", this.boundOutside) }

  toggle(event) {
    event.stopPropagation()
    const open = this.menuTarget.dataset.open === "true"
    this.menuTarget.dataset.open = open ? "false" : "true"
  }

  // Prevent clicks inside the menu from bubbling to a parent <tr onclick>
  stop(event) {
    if (event.target.closest("[data-po-dropdown-menu-target='menu']")) {
      event.stopPropagation()
    }
  }

  dispatch(event) {
    event.stopPropagation()
    const name = event.currentTarget.dataset.actionName
    if (!name) return
    let detail = {}
    try { detail = JSON.parse(event.currentTarget.dataset.actionDetail || "{}") } catch (_) {}
    document.dispatchEvent(new CustomEvent(name, { detail }))
    this.#close()
  }

  #close() { if (this.hasMenuTarget) this.menuTarget.dataset.open = "false" }
}
