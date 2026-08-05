import { Controller } from "@hotwired/stimulus"

// Shop-banner picker (My Profile) — Facebook-Pages pattern.
//
// The persistent "Edit banner" pill toggles a popover holding a shop-category
// select and a grid of suggested images (library ships from the view as JSON;
// categories without photography yet fall back to the "_default" placeholder
// tiles). Picking a tile previews it in the banner frame immediately
// (optimistic); "Use this image" commits it into the form's hidden fields so
// Save Profile persists it; Cancel/✕ reverts the preview; "Remove banner"
// clears it and the public page falls back to a neutral surface (#e9e2d4).
export default class extends Controller {
  static targets = ["img", "popover", "subtitle", "grid", "select", "hiddenUrl", "hiddenCategory"]
  static values  = { committed: String, category: String, library: Object }

  connect() {
    this.staged = null
    this.#renderGrid()
  }

  disconnect() {
    this.#lockScroll(false)
  }

  toggle() {
    const opening = this.popoverTarget.classList.contains("hidden")
    if (opening) { this.staged = null; this.#renderGrid() }
    this.popoverTarget.classList.toggle("hidden")
    this.#lockScroll(opening)
  }

  cancel() {
    this.staged = null
    this.#preview(this.committedValue)
    this.#close()
  }

  categoryChange() {
    this.categoryValue = this.selectTarget.value
    this.staged = null
    this.#renderGrid()
  }

  pick(event) {
    this.staged = event.currentTarget.dataset.url
    this.#preview(this.staged)   // optimistic preview in the frame above
    this.#renderGrid()           // move the ring + check badge
  }

  commit() {
    if (this.staged) {
      this.committedValue = this.staged
      this.hiddenUrlTarget.value = this.staged
      this.hiddenCategoryTarget.value = this.categoryValue
    }
    this.staged = null
    this.#close()
  }

  remove() {
    this.committedValue = ""
    this.staged = null
    this.hiddenUrlTarget.value = ""
    this.hiddenCategoryTarget.value = ""
    this.#preview("")
    this.#close()
  }

  // ── private ──

  #close() {
    this.popoverTarget.classList.add("hidden")
    this.#lockScroll(false)
  }

  // Below md the picker is a fixed full-page takeover, so freeze the page
  // behind it. On desktop the popover is anchored inline — never touch scroll.
  #lockScroll(on) {
    const mobile = !window.matchMedia("(min-width: 768px)").matches
    document.body.style.overflow = (on && mobile) ? "hidden" : ""
  }

  #entries() {
    return this.libraryValue[this.categoryValue] || []
  }

  #preview(url) {
    if (url) {
      this.imgTarget.src = url
      this.imgTarget.classList.remove("hidden")
    } else {
      this.imgTarget.classList.add("hidden")   // frame shows the neutral fallback
    }
  }

  #renderGrid() {
    if (this.hasSubtitleTarget) this.subtitleTarget.textContent = `Suggested for ${this.categoryValue}`
    if (this.hasSelectTarget && this.selectTarget.value !== this.categoryValue) this.selectTarget.value = this.categoryValue
    const current = this.staged || this.committedValue
    const entries = this.#entries()
    if (entries.length === 0) {
      this.gridTarget.innerHTML = `<p class="col-span-full text-[12px] text-[#999] py-4">Images for this category are coming soon.</p>`
      return
    }
    this.gridTarget.innerHTML = entries.map(tile => {
      const on = tile.url === current
      return `
        <button type="button" data-action="click->banner-picker#pick" data-url="${tile.url}" class="no-min-h text-left">
          <span class="relative block h-[96px] md:h-[76px] rounded-lg border ${on ? "border-[#28ba93]" : "border-[#e4e4e4]"} overflow-hidden">
            <img src="${tile.url}" alt="" class="w-full h-full object-cover"
                 onerror="this.onerror=null;this.src='/banners/library/generic-2.png'">
            ${on ? `
              <span class="absolute inset-0 rounded-lg pointer-events-none" style="box-shadow: inset 0 0 0 2.5px #28ba93;"></span>
              <span class="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style="background-color:#28ba93;">
                <img src="/icon_checkmark.svg" alt="" class="w-[9px] h-[9px]">
              </span>` : ""}
          </span>
          <span class="block text-[11px] font-bold text-[#444] mt-1.5">${tile.label}</span>
        </button>`
    }).join("")
  }
}
