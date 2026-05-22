import { Controller } from "@hotwired/stimulus"
import { findCartController } from "./cart_controller"

// products_page_controller — orchestrates the filters + view toggle + product rendering
// on /products. Listens to filter:change, view:change, category-pill clicks; renders
// the grid/list view from the serialized payload.
export default class extends Controller {
  static targets = [
    "gridView", "listView", "emptyState", "categoryPill",
    "clearAllButton", "filterPanelTrigger", "advancedCount",
  ]
  static values = {
    products: Array,           // payload built in the ERB
    preselectedVendor: String, // ?vendor=foo URL parameter
  }

  connect() {
    this.view = "grid"
    this.quick = {}     // { filterId: [optionId...] }
    this.advanced = {}  // { filterId: [optionId...] }
    this.priceMin = 0
    this.priceMax = 50
    this.activeCategory = "all-products"

    // Pre-apply vendor filter from URL.
    if (this.preselectedVendorValue) {
      this.quick.vendor = [this.preselectedVendorValue]
      // Sync the matching FilterDropdown.
      const dd = this.#findDropdown("vendor")
      dd?.set(this.quick.vendor)
    }

    this.boundFilterChange = (e) => this.#onFilterChange(e.detail)
    this.boundViewChange   = (e) => this.#onViewChange(e.detail)
    this.boundFilterPanel  = (e) => this.#onPanelChange(e.detail)
    this.boundCartChange   = () => this.#syncAddToCarts()

    document.addEventListener("filter:change",        this.boundFilterChange)
    document.addEventListener("view:change",          this.boundViewChange)
    document.addEventListener("filter-panel:change",  this.boundFilterPanel)
    document.addEventListener("cart:changed",         this.boundCartChange)

    this.#render()
  }
  disconnect() {
    document.removeEventListener("filter:change",       this.boundFilterChange)
    document.removeEventListener("view:change",         this.boundViewChange)
    document.removeEventListener("filter-panel:change", this.boundFilterPanel)
    document.removeEventListener("cart:changed",        this.boundCartChange)
  }

  selectCategory(event) {
    const id = event.currentTarget.dataset.pillId
    if (id === this.activeCategory) return
    this.activeCategory = id
    this.categoryPillTargets.forEach(btn => {
      const on = btn.dataset.pillId === id
      btn.classList.toggle("bg-[#1f1f1f]", on)
      btn.classList.toggle("text-white",   on)
      btn.classList.toggle("border-[#1f1f1f]", on)
      btn.classList.toggle("bg-white",         !on)
      btn.classList.toggle("text-[#444955]",   !on)
      btn.classList.toggle("border-[#a1a4aa]", !on)
    })
    this.#render()
  }

  openFilterPanel() {
    document.dispatchEvent(new CustomEvent("filter-panel:open"))
  }

  clearAll() {
    this.quick = {}
    this.advanced = {}
    this.priceMin = 0
    this.priceMax = 50
    this.activeCategory = "all-products"
    // Reset every dropdown
    this.application.controllers
      .filter(c => c.identifier === "filter-dropdown")
      .forEach(c => c.set([]))
    // Reset category pills visual state
    this.categoryPillTargets.forEach(btn => {
      const on = btn.dataset.pillId === "all-products"
      btn.classList.toggle("bg-[#1f1f1f]", on)
      btn.classList.toggle("text-white",   on)
      btn.classList.toggle("border-[#1f1f1f]", on)
      btn.classList.toggle("bg-white",         !on)
      btn.classList.toggle("text-[#444955]",   !on)
      btn.classList.toggle("border-[#a1a4aa]", !on)
    })
    document.dispatchEvent(new CustomEvent("filter-panel:clear"))
    this.#render()
  }

  // ── Event handlers ────────────────────────────────────────────────────────
  #onFilterChange({ filterId, selected }) {
    if (selected.length === 0) delete this.quick[filterId]
    else this.quick[filterId] = selected
    this.#render()
  }

  #onPanelChange({ filters, priceMin, priceMax }) {
    this.advanced = filters || {}
    if (typeof priceMin === "number") this.priceMin = priceMin
    if (typeof priceMax === "number") this.priceMax = priceMax
    this.#render()
  }

  #onViewChange({ view }) {
    this.view = view
    this.#render()
  }

  // ── Filtering ─────────────────────────────────────────────────────────────
  #filter() {
    const CATEGORY_PILL_MAP = {
      "beverages":"Beverages", "breads-bakery":"Breads & Bakery", "catering":"Catering",
      "dairy-eggs":"Dairy & Eggs", "desserts":"Desserts", "dry-goods":"Dry Goods",
      "prepared-foods":"Prepared Foods", "produce":"Produce", "protein":"Protein",
      "snacks":"Snacks", "wellness-gifts":"Wellness & Gifts",
    }
    const DIETARY_MAP = {
      "gluten-free":"Gluten-Free", "dairy-free":"Dairy-Free",
      "vegan":"Vegan", "vegetarian":"Vegetarian", "nut-free":"Nut-Free",
    }
    const ATTR_MAP = {
      "woman-owned":"Woman-owned Business", "minority-owned":"Minority-owned Business",
    }

    return this.productsValue.filter(p => {
      // Category pill
      if (this.activeCategory !== "all-products") {
        const target = CATEGORY_PILL_MAP[this.activeCategory]
        if (target && p.category !== target) return false
      }
      // Vendor
      const vf = this.quick.vendor
      if (vf?.length && !vf.includes("all-vendors") && !vf.includes(p.vendor_id)) return false
      // Dietary (quick)
      const df = this.quick.dietary
      if (df?.length) {
        const required = df.map(d => DIETARY_MAP[d]).filter(Boolean)
        if (!required.every(r => p.dietary.includes(r) || p.allergens.includes(r))) return false
      }
      // Vendor attributes (quick)
      const af = this.quick.vendorAttributes
      if (af?.length) {
        const required = af.map(a => ATTR_MAP[a]).filter(Boolean)
        if (!required.every(r => p.vendor_certifications.includes(r))) return false
      }
      // Price range
      if (p.wholesale_unit_price < this.priceMin || p.wholesale_unit_price > this.priceMax) return false
      // Advanced filters omitted in this client cut for brevity — extend here as needed.
      return true
    })
  }

  // ── Rendering ─────────────────────────────────────────────────────────────
  #render() {
    const filtered = this.#filter()
    const hasAny = Object.values(this.quick).some(arr => arr.length > 0) ||
                   this.activeCategory !== "all-products" ||
                   Object.values(this.advanced).some(arr => arr.length > 0)

    this.clearAllButtonTarget.classList.toggle("hidden", !hasAny)
    this.clearAllButtonTarget.classList.toggle("flex", hasAny)

    if (filtered.length === 0) {
      this.gridViewTarget.classList.add("hidden")
      this.listViewTarget.classList.add("hidden")
      this.emptyStateTarget.classList.remove("hidden")
      this.emptyStateTarget.classList.add("flex")
      return
    }
    this.emptyStateTarget.classList.add("hidden")
    this.emptyStateTarget.classList.remove("flex")

    if (this.view === "grid") {
      this.gridViewTarget.classList.remove("hidden")
      this.listViewTarget.classList.add("hidden")
      this.listViewTarget.classList.remove("flex")
      this.#renderGrid(filtered)
    } else {
      this.gridViewTarget.classList.add("hidden")
      this.listViewTarget.classList.remove("hidden")
      this.listViewTarget.classList.add("flex")
      this.#renderList(filtered)
    }
    this.#syncAddToCarts()
  }

  #renderGrid(items) {
    // Group by category
    const groups = {}
    items.forEach(p => {
      const cat = p.category || "Other"
      ;(groups[cat] ||= []).push(p)
    })
    let html = ""
    Object.entries(groups).forEach(([cat, products]) => {
      html += `<section>
        <div class="flex items-center justify-between px-4 md:px-9 pt-6 pb-1">
          <h2 class="text-[20px] font-black text-[#1f1f1f] uppercase tracking-tight">${cat}</h2>
          <a class="text-[15px] font-bold text-[#28ba93] whitespace-nowrap no-min-h">View all ›</a>
        </div>
        <div class="md:hidden flex gap-3 overflow-x-auto scrollbar-none px-4 pb-4 pt-2" style="scroll-snap-type:x mandatory; scroll-padding-left:1rem">
          ${products.map(p => `<div style="scroll-snap-align:start;flex-shrink:0;width:160px">${this.#productCardHTML(p)}</div>`).join("")}
        </div>
        <div class="hidden md:flex overflow-x-auto gap-3 px-9 pb-4 pt-2 scrollbar-hide">
          ${products.map(p => this.#productCardHTML(p)).join("")}
        </div>
      </section>`
    })
    this.gridViewTarget.innerHTML = html
  }

  #renderList(items) {
    const html = items.map(p => `
      <a href="${p.href}" class="no-min-h block">
        <div class="flex items-center gap-4 p-3 rounded-xl border border-[#e8e8e8] bg-white hover:shadow-md hover:translate-x-1 transition-all cursor-pointer">
          <div class="w-[64px] h-[64px] bg-[#f7f5ef] rounded-lg flex items-center justify-center shrink-0">
            ${p.image ? `<img src="${p.image}" alt="${p.name}" class="w-full h-full object-contain mix-blend-multiply p-1">` : ""}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[11px] font-bold text-[#377b82]">${p.vendor_name}</p>
            <p class="text-sm font-bold leading-tight truncate text-[#444955]">${p.name}</p>
            <p class="text-xs mt-0.5 text-[#777]">${[p.size, p.case_pack != null ? `Case of ${p.case_pack}` : null].filter(Boolean).join(" · ")}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-sm font-bold text-[#1f1f1f]">$${p.wholesale_unit_price.toFixed(2)}</p>
            <p class="text-[10px] text-[#777]">per unit</p>
            ${p.wholesale_case_price != null ? `<p class="text-[10px] text-[#777]">$${p.wholesale_case_price.toFixed(2)} / case</p>` : ""}
          </div>
          ${this.#addToCartHTML(p)}
          <div class="text-lg shrink-0 text-[#a1a4aa]">›</div>
        </div>
      </a>`).join("")
    this.listViewTarget.innerHTML = html
  }

  #productCardHTML(p) {
    return `<a href="${p.href}" class="product-card no-min-h block">
      <div class="flex flex-col rounded-lg bg-white shadow-sm cursor-pointer w-full md:w-[200px] md:shrink-0 border border-[#e8e8e8] hover:scale-[1.03] transition-transform">
        <div class="relative shrink-0 bg-[#f7f5ef] flex items-center justify-center p-2 overflow-hidden rounded-t-lg aspect-square md:aspect-auto md:h-[135px]">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" class="h-full w-full object-contain mix-blend-multiply">` : ""}
          <div class="absolute bottom-2 right-2">${this.#addToCartHTML(p)}</div>
        </div>
        <div class="flex-1 flex flex-col overflow-hidden p-[10px] gap-[8px]">
          <p class="font-bold text-[#377b82] text-[14px]">${p.vendor_name}</p>
          <p class="font-bold leading-tight text-[#444955] text-[12px] line-clamp-2 min-h-[1.5rem]">${p.name}</p>
          <p class="text-[#777] text-[13px]">$${p.wholesale_unit_price.toFixed(2)} / unit</p>
        </div>
      </div>
    </a>`
  }

  #addToCartHTML(p) {
    return `<span class="inline-flex" onclick="event.preventDefault();event.stopPropagation();"
              data-controller="add-to-cart"
              data-add-to-cart-vendor-id-value="${p.vendor_id}"
              data-add-to-cart-product-id-value="${p.id}">
      <button data-add-to-cart-target="addButton" data-action="click->add-to-cart#add"
              class="w-[31px] h-[31px] rounded-full bg-[#beead8] flex items-center justify-center text-[#035257] no-min-h hover:bg-[#28ba93] hover:text-white active:scale-95 transition-all">
        <svg width="13" height="13" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
      <div data-add-to-cart-target="stepper"
           class="hidden items-center gap-[10px] h-[31px] px-[10px] py-[2px] rounded-full bg-[#beead8]">
        <button data-action="click->add-to-cart#decrement" class="w-[13px] h-[13px] flex items-center justify-center shrink-0 text-[#035257] no-min-h">
          <span data-add-to-cart-target="leftIcon"><svg viewBox="0 0 11 11" fill="none" class="w-full h-full"><path d="M1 5.5h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>
        </button>
        <span data-add-to-cart-target="quantity" class="text-[#035257] text-[14px] font-bold leading-none min-w-[12px] text-center">0</span>
        <button data-action="click->add-to-cart#increment" class="w-[13px] h-[13px] flex items-center justify-center shrink-0 text-[#035257] no-min-h">
          <svg viewBox="0 0 11 11" fill="none" class="w-full h-full"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
    </span>`
  }

  #syncAddToCarts() {
    // Each individual add_to_cart controller listens to cart:changed itself,
    // so we just dispatch (no-op if nobody is listening yet, since they hook on connect).
    document.dispatchEvent(new CustomEvent("cart:changed"))
  }

  #findDropdown(filterId) {
    return this.application.controllers
      .find(c => c.identifier === "filter-dropdown" && c.filterIdValue === filterId)
  }
}
