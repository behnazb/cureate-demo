import { Controller } from "@hotwired/stimulus"

// purchase_orders_page_controller — handles the mobile "More" bottom sheet for tab overflow.
// Tab switching and search are server-driven (form submits / link navigation).
export default class extends Controller {
  static targets = ["moreSheet", "moreBackdrop"]
  static values  = { activeTab: String }

  openMoreSheet() {
    this.moreSheetTarget.dataset.open = "true"
    this.moreBackdropTarget.dataset.open = "true"
    document.body.style.overflow = "hidden"
  }
  closeMoreSheet() {
    this.moreSheetTarget.dataset.open = "false"
    this.moreBackdropTarget.dataset.open = "false"
    document.body.style.overflow = ""
  }
}
