import { Controller } from "@hotwired/stimulus"

// Proof-of-delivery lightbox (E3). The photo is captured by the driver in the mobile
// ingestion app; here the vendor only views it. New pattern — the design system has
// no image viewer yet.
export default class extends Controller {
  static targets = ["lightbox"]

  connect() {
    this.boundEscape = (e) => { if (e.key === "Escape") this.close() }
    document.addEventListener("keydown", this.boundEscape)
  }

  disconnect() { document.removeEventListener("keydown", this.boundEscape) }

  open() {
    if (!this.hasLightboxTarget) return
    this.lightboxTarget.classList.remove("hidden")
    this.lightboxTarget.classList.add("flex")
    document.body.style.overflow = "hidden"
  }

  // Click anywhere on the backdrop (or the Close button) dismisses. Clicks on the
  // image itself shouldn't close it.
  close(event) {
    if (event && event.target.tagName === "IMG") return
    if (!this.hasLightboxTarget) return
    this.lightboxTarget.classList.add("hidden")
    this.lightboxTarget.classList.remove("flex")
    document.body.style.overflow = ""
  }
}
