import { Controller } from "@hotwired/stimulus"

// Image upload preview (My Profile — founder image + business logo).
//
// The hover overlay is a <label> wrapping a hidden file input; choosing a file
// previews it in place via an object URL. Prototype-only: the file never
// uploads (the input carries form="" so it stays out of the PATCH), matching
// how the rest of the demo fakes persistence-adjacent flows.
export default class extends Controller {
  static targets = ["img", "placeholder"]

  preview(event) {
    const file = event.target.files[0]
    if (!file) return
    if (this.previousUrl) URL.revokeObjectURL(this.previousUrl)
    this.previousUrl = URL.createObjectURL(file)
    this.imgTarget.src = this.previousUrl
    this.imgTarget.classList.remove("hidden")
    if (this.hasPlaceholderTarget) this.placeholderTarget.classList.add("hidden")
  }

  disconnect() {
    if (this.previousUrl) URL.revokeObjectURL(this.previousUrl)
  }
}
