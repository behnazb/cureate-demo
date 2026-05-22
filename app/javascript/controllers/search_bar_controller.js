import { Controller } from "@hotwired/stimulus"

// search_bar_controller — typeahead search across vendors + products.
export default class extends Controller {
  static targets = ["input", "inputContainer", "searchIcon", "clearButton", "dropdown", "results", "empty", "emptyQuery"]
  static values = { index: Array }

  connect() {
    this.selected = -1
    this.boundOutside = (e) => {
      if (!this.element.contains(e.target)) this.#close()
    }
    document.addEventListener("mousedown", this.boundOutside)
  }
  disconnect() {
    document.removeEventListener("mousedown", this.boundOutside)
  }

  focus() {
    this.#focusedStyles(true)
  }
  blur() {
    // Defer so click on a dropdown row still fires.
    setTimeout(() => this.#focusedStyles(false), 120)
  }

  query() {
    const q = this.inputTarget.value.trim()
    this.clearButtonTarget.classList.toggle("hidden", q.length === 0)
    this.clearButtonTarget.classList.toggle("flex", q.length > 0)
    if (q.length < 2) {
      this.#close()
      return
    }
    this.#render(this.#filter(q), q)
    this.dropdownTarget.dataset.open = "true"
  }

  clear() {
    this.inputTarget.value = ""
    this.clearButtonTarget.classList.add("hidden")
    this.clearButtonTarget.classList.remove("flex")
    this.#close()
    this.inputTarget.focus()
  }

  keyDown(e) {
    const items = this.resultsTarget.querySelectorAll("[data-result]")
    if (e.key === "ArrowDown") {
      e.preventDefault()
      this.selected = Math.min(this.selected + 1, items.length - 1)
      this.#highlight(items)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      this.selected = Math.max(this.selected - 1, -1)
      this.#highlight(items)
    } else if (e.key === "Enter" && this.selected >= 0 && items[this.selected]) {
      window.location.href = items[this.selected].dataset.href
    } else if (e.key === "Escape") {
      this.clear()
    }
  }

  #filter(q) {
    const lo = q.toLowerCase()
    return this.indexValue.filter(item =>
      item.name.toLowerCase().includes(lo) ||
      (item.subtitle || "").toLowerCase().includes(lo) ||
      (item.category || "").toLowerCase().includes(lo)
    ).slice(0, 10)
  }

  #render(results, query) {
    if (results.length === 0) {
      this.resultsTarget.innerHTML = ""
      this.emptyQueryTarget.textContent = query
      this.emptyTarget.classList.remove("hidden")
      return
    }
    this.emptyTarget.classList.add("hidden")

    const vendors = results.filter(r => r.type === "vendor")
    const products = results.filter(r => r.type === "product")

    let html = ""
    if (vendors.length) {
      html += `<div><div class="px-4 pt-4 pb-2"><p class="font-bold uppercase tracking-widest text-[#a1a4aa] text-[10px]">Vendors</p></div>`
      vendors.forEach((item) => {
        const idx = results.indexOf(item)
        html += this.#vendorRow(item, idx, query)
      })
      html += `</div>`
    }
    if (vendors.length && products.length) {
      html += `<div class="mx-4 border-t border-[#f0f0f0]"></div>`
    }
    if (products.length) {
      html += `<div><div class="px-4 pt-4 pb-2"><p class="font-bold uppercase tracking-widest text-[#a1a4aa] text-[10px]">Products</p></div>`
      products.forEach((item) => {
        const idx = results.indexOf(item)
        html += this.#productRow(item, idx, query)
      })
      html += `</div>`
    }
    this.resultsTarget.innerHTML = html
    this.selected = -1
  }

  #vendorRow(item, idx, query) {
    const img = item.image ? `<img src="${item.image}" alt="" class="w-full h-full object-contain p-1">` : `<div class="w-6 h-6 rounded bg-[#e0e0e0]"></div>`
    return `<a href="${item.href}" data-result data-href="${item.href}" data-idx="${idx}"
              class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f7f5ef]">
      <div class="rounded-xl bg-[#f7f5ef] border border-[#e8e8e8] flex items-center justify-center shrink-0 overflow-hidden w-[44px] h-[44px]">${img}</div>
      <div class="flex-1 min-w-0">
        <p class="font-bold text-[#1f1f1f] text-[13px]">${this.#mark(item.name, query)}</p>
        <p class="text-[#777] text-[11px]">${item.subtitle}</p>
      </div>
      <div class="shrink-0">
        <span class="bg-[#f7f5ef] text-[#444955] rounded-full px-2 py-0.5 border border-[#e8e8e8] text-[10px]">${item.category || ""}</span>
      </div>
    </a>`
  }

  #productRow(item, idx, query) {
    const img = item.image ? `<img src="${item.image}" alt="" class="w-full h-full object-contain mix-blend-multiply p-1">` : `<div class="w-6 h-6 rounded bg-[#e0e0e0]"></div>`
    const price = item.price ? `<p class="font-bold text-[#1f1f1f] text-[13px]">$${Number(item.price).toFixed(2)}<span class="font-normal text-[#777] text-[10px]">/unit</span></p>` : ""
    return `<a href="${item.href}" data-result data-href="${item.href}" data-idx="${idx}"
              class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f7f5ef]">
      <div class="rounded-xl bg-[#f7f5ef] border border-[#e8e8e8] flex items-center justify-center shrink-0 overflow-hidden w-[44px] h-[44px]">${img}</div>
      <div class="flex-1 min-w-0">
        <p class="font-bold text-[#1f1f1f] truncate text-[13px]">${this.#mark(item.name, query)}</p>
        <p class="text-[#777] text-[11px]">${item.subtitle} · ${item.size || ""}</p>
      </div>
      <div class="shrink-0 text-right">${price}<span class="text-[#a1a4aa] text-[10px]">${item.category || ""}</span></div>
    </a>`
  }

  #mark(text, query) {
    if (!query.trim()) return text
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return text.replace(new RegExp(`(${escaped})`, "gi"),
      '<mark class="bg-[#28ba93]/20 text-[#035257] rounded-sm px-0.5 not-italic">$1</mark>')
  }

  #highlight(items) {
    items.forEach((el, i) => {
      if (i === this.selected) el.classList.add("bg-[#f7f5ef]")
      else el.classList.remove("bg-[#f7f5ef]")
    })
  }

  #focusedStyles(on) {
    if (on) {
      this.inputContainerTarget.classList.remove("border-[#a1a4aa]", "hover:border-[#777]")
      this.inputContainerTarget.classList.add("border-[#28ba93]", "shadow-[0_0_0_3px_rgba(40,186,147,0.15)]")
      this.searchIconTarget.classList.remove("opacity-60")
      this.searchIconTarget.classList.add("opacity-100")
    } else {
      this.inputContainerTarget.classList.add("border-[#a1a4aa]", "hover:border-[#777]")
      this.inputContainerTarget.classList.remove("border-[#28ba93]", "shadow-[0_0_0_3px_rgba(40,186,147,0.15)]")
      this.searchIconTarget.classList.add("opacity-60")
      this.searchIconTarget.classList.remove("opacity-100")
    }
  }

  #close() {
    if (this.hasDropdownTarget) this.dropdownTarget.dataset.open = "false"
    this.emptyTarget.classList.add("hidden")
    this.resultsTarget.innerHTML = ""
    this.selected = -1
  }
}
