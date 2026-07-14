import { Controller } from "@hotwired/stimulus"

// invoice_controller — the two controls on an invoice: Download and Email.
//
// DOWNLOAD is window.print(). The print stylesheet hides the sidebar, the header and the
// drawer, leaving only the invoice document — so the browser's own "Save as PDF" produces
// a clean, real PDF. No server-side PDF library, no fake "generating…" spinner, and the
// output is genuinely the thing on screen.
export default class extends Controller {
  static targets = ["emailPanel", "backdrop"]

  connect() {
    this.boundEscape = (e) => { if (e.key === "Escape") this.closeEmail() }
    document.addEventListener("keydown", this.boundEscape)
  }

  disconnect() { document.removeEventListener("keydown", this.boundEscape) }

  download() {
    // Close the drawer first, or it prints over the document.
    this.closeEmail()
    window.print()
  }

  openEmail() {
    this.emailPanelTarget.dataset.open = "true"
    this.backdropTarget.classList.remove("hidden")
    document.body.style.overflow = "hidden"
  }

  closeEmail() {
    this.emailPanelTarget.dataset.open = "false"
    this.backdropTarget.classList.add("hidden")
    document.body.style.overflow = ""
  }
}
