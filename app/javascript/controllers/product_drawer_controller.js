import { Controller } from "@hotwired/stimulus"

// product_drawer_controller — the vendor's add/edit product flyout (E4).
//
// Same right-hand drawer as the buyer's cart: fixed, 640px, warm canvas. Three exits —
// Preview, Save as Draft, Publish.
//
// UPLOADS: there is no storage layer in this harness, so files are read in the BROWSER
// (FileReader → data URL) and submitted as ordinary text fields. The image shows instantly
// and survives the session; it resets when the server restarts. Real enough to test with.
export default class extends Controller {
  static targets = [
    "panel", "backdrop", "form",
    "imageInput", "imageData", "imagePreview", "imageEmpty",
    "docsInput", "docsData", "docsList",
    "commit", "preview", "previewImage", "previewName", "previewPrice",
  ]

  connect() {
    this.docs = this.#readDocs()
    this.boundEscape = (e) => { if (e.key === "Escape") this.close() }
    document.addEventListener("keydown", this.boundEscape)

    // Deep link: /vendor/products?edit=16820 opens straight into that product.
    if (this.element.dataset.autoOpen === "true") this.open()
  }

  disconnect() { document.removeEventListener("keydown", this.boundEscape) }

  open() {
    this.panelTarget.dataset.open = "true"
    this.backdropTarget.classList.remove("hidden")
    document.body.style.overflow = "hidden"
  }

  close() {
    this.panelTarget.dataset.open = "false"
    this.backdropTarget.classList.add("hidden")
    document.body.style.overflow = ""
    if (this.hasPreviewTarget) this.previewTarget.classList.add("hidden")
  }

  // ── Image ────────────────────────────────────────────────────────────────
  chooseImage() { this.imageInputTarget.click() }

  imageSelected(event) {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      this.imageDataTarget.value = e.target.result       // data URL, posted as text
      this.imagePreviewTarget.src = e.target.result
      this.imagePreviewTarget.classList.remove("hidden")
      this.imageEmptyTarget.classList.add("hidden")
    }
    reader.readAsDataURL(file)
  }

  // ── Downloadables (spec sheets, sell sheets, COAs) ───────────────────────
  chooseDocs() { this.docsInputTarget.click() }

  docsSelected(event) {
    const files = Array.from(event.target.files)
    let pending = files.length
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.docs.push({ name: file.name, data: e.target.result })
        if (--pending === 0) this.#renderDocs()
      }
      reader.readAsDataURL(file)
    })
  }

  removeDoc(event) {
    this.docs.splice(Number(event.currentTarget.dataset.index), 1)
    this.#renderDocs()
  }

  // ── Tag pills (allergens, dietary) ───────────────────────────────────────
  toggleTag(event) {
    const input = event.currentTarget
    const pill = input.closest("label").querySelector("[data-pill]")
    pill.style.backgroundColor = input.checked ? "#f0fbf7" : "#ffffff"
    pill.style.borderColor     = input.checked ? "#28ba93" : "#a1a4aa"
    pill.style.color           = input.checked ? "#065f46" : "#444955"
  }

  // ── Exits ────────────────────────────────────────────────────────────────
  // Preview shows the listing as a BUYER would see it, from the values currently in the
  // form — not from what's saved. That's the point: you preview before you commit.
  togglePreview() {
    const p = this.previewTarget
    if (p.classList.contains("hidden")) {
      const f = this.formTarget
      this.previewNameTarget.textContent = f.querySelector("[name=name]").value || "Untitled product"
      const unit = parseFloat(f.querySelector("[name=wholesale_unit_price]").value || 0)
      this.previewPriceTarget.textContent = `$${unit.toFixed(2)} / unit`
      const src = this.imageDataTarget.value || this.imagePreviewTarget.src
      if (src) this.previewImageTarget.src = src
      p.classList.remove("hidden")
    } else {
      p.classList.add("hidden")
    }
  }

  submitWith(event) {
    this.commitTarget.value = event.currentTarget.dataset.commit   // "draft" | "publish"
    this.docsDataTarget.value = JSON.stringify(this.docs)
    this.formTarget.requestSubmit()
  }

  // ── internals ────────────────────────────────────────────────────────────
  #readDocs() {
    try { return JSON.parse(this.docsDataTarget.value || "[]") } catch (_) { return [] }
  }

  #renderDocs() {
    this.docsDataTarget.value = JSON.stringify(this.docs)
    this.docsListTarget.innerHTML = this.docs.map((d, i) => `
      <div style="display:flex; align-items:center; gap:8px; padding:8px 10px; background:#fff; border:1px solid #e8e8e8; border-radius:8px; margin-bottom:6px;">
        <span style="font-size:12px; color:#444955; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${d.name}</span>
        <button type="button" data-action="product-drawer#removeDoc" data-index="${i}"
                class="no-min-h" style="font-size:11px; font-weight:700; color:#991b1b;">Remove</button>
      </div>`).join("")
  }
}
