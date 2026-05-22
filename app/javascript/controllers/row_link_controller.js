import { Controller } from "@hotwired/stimulus"

// row_link_controller — makes a <tr> behave like a link. Skips navigation when the
// click originated from an interactive child (button, a, dropdown menu).
export default class extends Controller {
  static values = { url: String }

  go(event) {
    const ignore = event.target.closest("button, a, [data-controller~='po-dropdown-menu']")
    if (ignore) return
    window.location.href = this.urlValue
  }
}
