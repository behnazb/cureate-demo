import { Controller } from "@hotwired/stimulus"
import { findCartController } from "./cart_controller"

// cart_drawer_controller — three-view drawer (cart, confirmation, success).
// Reflects cart_controller state via the cart:* event bus.
export default class extends Controller {
  static targets = [
    "panel", "backdrop",
    "cartView", "confirmationView", "successView",
    "stagingPanel", "draftPoList",
    "poSelector", "poId", "poDelivery", "poCaret", "poDropdown",
    "newPOInputWrapper", "newPOInput", "newPOError", "poList",
    "deliveryBanner", "deliveryEditor", "weekLabel", "repeatLabel", "weekSelect", "repeatSelect",
    "emptyState", "vendorGroups", "subtotalBlock", "subtotal", "progressBar", "minStatus",
    "savedIndicator", "saveButton", "continueButton",
    "discardPrompt", "discardCount",
    "confirmationPOId", "confirmationBody",
    "successPOId", "successVendors", "successProgress", "countdown",
  ]
  static values = { vendors: Array, draftPos: Array }

  connect() {
    this.view = "cart"
    this.poDropdownOpen = false
    this.deliveryEditorOpen = false

    this.boundChanged    = () => this.#render()
    this.boundToggle     = (e) => this.#syncOpen(e.detail.open)
    this.boundPoChanged  = () => this.#render()

    document.addEventListener("cart:changed",       this.boundChanged)
    document.addEventListener("cart:drawer-toggle", this.boundToggle)
    document.addEventListener("cart:po-changed",    this.boundPoChanged)

    // Initial render — wait one tick for cart controller to be connected.
    requestAnimationFrame(() => this.#render())
  }
  disconnect() {
    document.removeEventListener("cart:changed",       this.boundChanged)
    document.removeEventListener("cart:drawer-toggle", this.boundToggle)
    document.removeEventListener("cart:po-changed",    this.boundPoChanged)
  }

  // ─── Open / Close ────────────────────────────────────────────────────────
  close() {
    const cart = findCartController(this.application)
    if (!cart) return
    if (!cart.hasActivePO && cart.items.length > 0) {
      this.discardCountTarget.textContent = cart.items.length
      this.discardPromptTarget.dataset.open = "true"
      return
    }
    cart.setDrawerOpen(false)
    this.view = "cart"
    this.#switchView()
  }

  #syncOpen(open) {
    this.panelTarget.dataset.open = open
    this.backdropTarget.dataset.open = open
    document.body.style.overflow = open ? "hidden" : ""
  }

  hideDiscardPrompt() { this.discardPromptTarget.dataset.open = "false" }
  confirmDiscard() {
    findCartController(this.application)?.clearStagedItems()
    this.discardPromptTarget.dataset.open = "false"
    findCartController(this.application)?.setDrawerOpen(false)
  }

  // ─── PO dropdown ─────────────────────────────────────────────────────────
  togglePOSelector() {
    this.poDropdownOpen = !this.poDropdownOpen
    this.poDropdownTarget.classList.toggle("hidden", !this.poDropdownOpen)
    this.poCaretTarget.classList.toggle("rotate-180", this.poDropdownOpen)
  }

  showNewPOInput() {
    this.newPOInputWrapperTarget.classList.remove("hidden")
    setTimeout(() => this.newPOInputTarget.focus(), 50)
  }
  cancelNewPO() {
    this.newPOInputWrapperTarget.classList.add("hidden")
    this.newPOInputTarget.value = ""
    this.newPOErrorTarget.classList.add("hidden")
  }
  newPOKeyDown(event) {
    if (event.key === "Enter") this.saveNewPO()
    if (event.key === "Escape") this.cancelNewPO()
  }
  saveNewPO() {
    const cart = findCartController(this.application); if (!cart) return
    const trimmed = (this.newPOInputTarget.value || "").trim().toUpperCase()
    if (!trimmed) return this.#newPOError("Please enter a PO name")
    if (trimmed.length > 30) return this.#newPOError("Maximum 30 characters")
    if (cart.purchaseOrders.find(po => po.id === trimmed)) return this.#newPOError("This PO already exists")
    cart.addPurchaseOrder(trimmed)
    this.cancelNewPO()
  }
  #newPOError(msg) {
    this.newPOErrorTarget.textContent = msg
    this.newPOErrorTarget.classList.remove("hidden")
  }

  // ─── Staging mode actions ────────────────────────────────────────────────
  createNewDraftPO() {
    const cart = findCartController(this.application); if (!cart) return
    const newId = cart.generateNewPOId()
    cart.addNewDraftPO(newId, cart.selectedDeliveryWeek)
    cart.mergeStagedItemsIntoPO(newId)
  }

  // ─── Delivery editor ─────────────────────────────────────────────────────
  showDeliveryEditor() {
    this.deliveryBannerTarget.classList.add("hidden")
    this.deliveryEditorTarget.classList.remove("hidden")
    this.#renderWeekOptions()
  }
  hideDeliveryEditor() {
    this.deliveryEditorTarget.classList.add("hidden")
    this.deliveryBannerTarget.classList.remove("hidden")
  }
  setWeek(event) {
    findCartController(this.application)?.setSelectedDeliveryWeek(event.target.value)
  }
  setRepeat(event) {
    findCartController(this.application)?.setRepeatMode(event.target.value)
  }

  // ─── Bottom CTAs ─────────────────────────────────────────────────────────
  saveDraft() {
    const cart = findCartController(this.application); if (!cart || cart.items.length === 0) return
    const btn = this.saveButtonTarget
    btn.disabled = true
    btn.style.backgroundColor = "#28ba93"
    btn.style.color = "white"
    btn.textContent = "Saving..."
    setTimeout(() => {
      btn.textContent = "Saved"
      setTimeout(() => {
        btn.disabled = false
        btn.style.backgroundColor = "white"
        btn.style.color = "#28ba93"
        btn.textContent = "Save Draft"
      }, 1500)
    }, 600)
  }

  continueToPO() {
    if (this.continueButtonTarget.disabled) return
    this.view = "confirmation"
    this.#renderConfirmation()
    this.#switchView()
  }

  backToCart() {
    this.view = "cart"
    this.#switchView()
  }

  submitPO() {
    this.view = "success"
    this.#renderSuccess()
    this.#switchView()
    this.#startCountdown()
  }

  // ─── Rendering ───────────────────────────────────────────────────────────
  #render() {
    const cart = findCartController(this.application); if (!cart) return
    const items = cart.items

    // Staging vs normal panel
    if (!cart.hasActivePO && items.length > 0) {
      this.stagingPanelTarget.classList.remove("hidden")
      this.poSelectorTarget.classList.add("hidden")
      this.#renderDraftPOList()
    } else {
      this.stagingPanelTarget.classList.add("hidden")
      this.poSelectorTarget.classList.remove("hidden")
    }

    // PO selector display
    this.poIdTarget.textContent = cart.selectedPOId
    this.poDeliveryTarget.textContent = this.#deliveryForPO(cart.selectedPOId)
    this.#renderPOList(cart)

    // Delivery banner
    this.weekLabelTarget.textContent = "Week of " + this.#formatWeekOf(cart.selectedDeliveryWeek)
    if (cart.repeatMode !== "none") {
      this.repeatLabelTarget.textContent = " · " + this.#labelForRepeat(cart.repeatMode)
      this.repeatLabelTarget.classList.remove("hidden")
    } else {
      this.repeatLabelTarget.classList.add("hidden")
    }

    // Vendor groups
    const grouped = this.#groupItemsByVendor(items)
    if (grouped.length === 0) {
      this.emptyStateTarget.classList.remove("hidden")
      this.vendorGroupsTarget.classList.add("hidden")
      this.vendorGroupsTarget.classList.remove("flex")
      this.subtotalBlockTarget.classList.add("hidden")
    } else {
      this.emptyStateTarget.classList.add("hidden")
      this.vendorGroupsTarget.classList.remove("hidden")
      this.vendorGroupsTarget.classList.add("flex")
      this.subtotalBlockTarget.classList.remove("hidden")
      this.vendorGroupsTarget.innerHTML = grouped.map(g => this.#vendorCardHTML(g)).join("")
      const total = grouped.reduce((sum, g) => sum + g.vendorTotal, 0)
      this.subtotalTarget.textContent = `$${total.toFixed(2)}`
    }

    // Bottom CTA: min met state + overall progress
    const allMinsMet = grouped.length > 0 && grouped.every(g => g.minMet)
    this.continueButtonTarget.disabled = !allMinsMet
    if (allMinsMet) {
      this.continueButtonTarget.style.backgroundColor = "#28ba93"
      this.continueButtonTarget.style.color = "white"
    } else {
      this.continueButtonTarget.style.backgroundColor = "#e6e6e6"
      this.continueButtonTarget.style.color = "#a1a4aa"
    }
    const overall = grouped.length === 0 ? 0 :
      grouped.reduce((s, g) => s + (g.minRequired > 0 ? Math.min((g.totalUnits / g.minRequired) * 100, 100) : 100), 0) / grouped.length
    this.progressBarTarget.style.width = `${overall}%`

    this.minStatusTarget.innerHTML = allMinsMet
      ? `<svg viewBox="0 0 11 9" fill="none" class="w-[11px] h-[9px]"><path d="M1 4.5L4 7.5L10 1" stroke="#035257" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
         <span class="text-[#1f1f1f] text-[14px]">Order minimums met</span>`
      : `<span class="text-[#1f1f1f] text-[14px]">Add more items to meet min order quantity</span>`

    // Saved indicator
    if (cart.hasActivePO && items.length > 0) {
      this.savedIndicatorTarget.dataset.visible = "true"
      if (this.savedTimer) clearTimeout(this.savedTimer)
      this.savedTimer = setTimeout(() => { this.savedIndicatorTarget.dataset.visible = "false" }, 2000)
    } else {
      this.savedIndicatorTarget.dataset.visible = "false"
    }
  }

  #renderDraftPOList() {
    const html = this.draftPosValue.map(po => `
      <button data-action="click->cart-drawer#mergeIntoDraft"
              data-po-id="${po.id}"
              class="w-full flex items-center justify-between px-3 py-2.5 mb-1.5 bg-white border border-[#e8e8e8] rounded-xl hover:border-[#28ba93] hover:bg-[#f0fdf8] transition-colors text-left no-min-h">
        <div>
          <p class="text-[13px] font-bold text-[#28ba93]">${po.id}</p>
          <p class="text-[11px] text-[#777]">Delivery: ${po.delivery_date_short || "No date set"}</p>
        </div>
        <span class="text-[11px] font-bold text-[#28ba93]">Merge items →</span>
      </button>`).join("")
    this.draftPoListTarget.innerHTML = html
  }

  mergeIntoDraft(event) {
    const id = event.currentTarget.dataset.poId
    findCartController(this.application)?.mergeStagedItemsIntoPO(id)
  }

  #renderPOList(cart) {
    const html = cart.purchaseOrders.map(po => {
      const selected = po.id === cart.selectedPOId
      const delivery = this.#deliveryForPO(po.id)
      const isFromBaseSet = ["004-CHARLES-00017", "005-BRENDA-00098", "006-STEPH-00001"].includes(po.id)
      return `<button data-action="click->cart-drawer#selectPO" data-po-id="${po.id}"
                class="flex items-center gap-3 w-full text-left px-2 py-2 rounded-lg hover:bg-[#f7f5ef] transition-colors hover:translate-x-[2px] no-min-h">
        <div class="w-4 h-4 rounded-[2px] flex items-center justify-center shrink-0 border transition-all ${selected ? "bg-[#28ba93] border-[#28ba93]" : "bg-white border-[#a1a4aa]"}">
          ${selected ? '<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ""}
        </div>
        <span class="flex-1 text-[13px] font-bold transition-colors ${selected ? "text-[#28ba93]" : "text-[#377b82] opacity-60"}">${po.label}</span>
        ${delivery ? `<span class="text-[12px] text-[#777] shrink-0">Delivery: ${delivery}</span>` : ""}
        ${isFromBaseSet ? "" : '<span class="text-[10px] bg-[#beead8] text-[#035257] font-bold px-2 py-0.5 rounded-full shrink-0">New</span>'}
      </button>`
    }).join("")
    this.poListTarget.innerHTML = html
  }

  selectPO(event) {
    const id = event.currentTarget.dataset.poId
    findCartController(this.application)?.setSelectedPOId(id)
    this.togglePOSelector()
  }

  #renderWeekOptions() {
    const cart = findCartController(this.application); if (!cart) return
    const opts = this.#nextWednesdays(cart.selectedDeliveryWeek)
    this.weekSelectTarget.innerHTML = opts.map(iso => {
      const label = this.#formatWeekOption(iso)
      return `<option value="${iso}" ${iso === cart.selectedDeliveryWeek ? "selected" : ""}>${label}</option>`
    }).join("")
    this.repeatSelectTarget.value = cart.repeatMode
  }

  #groupItemsByVendor(items) {
    const out = []
    this.vendorsValue.forEach(v => {
      const vendorItems = items.filter(i => i.vendorId === v.id)
      if (vendorItems.length === 0) return
      const products = vendorItems.map(i => {
        const p = v.products.find(p => p.id === i.productId)
        return p ? { ...i, product: p } : null
      }).filter(Boolean)
      const vendorTotal = products.reduce((s, i) => s + i.product.wholesale_unit_price * i.quantity, 0)
      const totalUnits = products.reduce((s, i) =>
        s + (i.unit === "cases" ? i.quantity * v.order_rules.units_per_case : i.quantity), 0)
      const minRequired = v.order_rules.min_units
      const minMet = totalUnits >= minRequired
      out.push({ vendor: v, products, vendorTotal, totalUnits, minRequired, minMet })
    })
    return out
  }

  #vendorCardHTML(g) {
    const remaining = Math.max(0, g.minRequired - g.totalUnits)
    const progress = g.minRequired > 0 ? Math.min((g.totalUnits / g.minRequired) * 100, 100) : 100
    const status = g.minMet
      ? `<div class="flex items-center gap-1.5 shrink-0">
           <svg viewBox="0 0 11 9" fill="none" class="w-[11px] h-[9px]"><path d="M1 4.5L4 7.5L10 1" stroke="#035257" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
           <span class="font-bold text-[#035257] text-[11px]">Minimum order quantity has been met</span>
         </div>`
      : `<span class="font-bold shrink-0 text-[#035257] text-[11px]">Add ${remaining} more item${remaining === 1 ? "" : "s"} to meet min</span>`

    const rows = g.products.map(i => `
      <div class="flex items-center justify-between px-4 py-3 bg-[#fbf9f6]" style="margin-bottom: 1px">
        <div class="flex items-center gap-2" style="width: 65%">
          <div class="w-[65px] h-[60px] shrink-0 flex items-center justify-center">
            ${i.product.image ? `<img src="${i.product.image}" alt="${i.product.name}" class="w-full h-full object-contain mix-blend-multiply">` : ""}
          </div>
          <div class="flex flex-col gap-1 min-w-0">
            <span class="font-bold text-[#035257] text-[11px]">${g.vendor.name}</span>
            <span class="font-bold leading-tight text-[#444955] text-[11px]">${i.product.name}</span>
            <span class="text-[#1f1f1f] text-[11px]">$${(i.product.wholesale_unit_price * i.quantity).toFixed(2)}</span>
          </div>
        </div>
        <span class="inline-flex" data-controller="add-to-cart"
              data-add-to-cart-vendor-id-value="${g.vendor.id}"
              data-add-to-cart-product-id-value="${i.product.id}">
          <button data-add-to-cart-target="addButton" data-action="click->add-to-cart#add" class="w-[31px] h-[31px] rounded-full bg-[#beead8] flex items-center justify-center text-[#035257] no-min-h hidden">
            <svg width="13" height="13" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
          <div data-add-to-cart-target="stepper" class="flex items-center gap-[10px] h-[31px] px-[10px] py-[2px] rounded-full bg-[#beead8]">
            <button data-action="click->add-to-cart#decrement" class="w-[13px] h-[13px] flex items-center justify-center shrink-0 text-[#035257] no-min-h">
              <span data-add-to-cart-target="leftIcon"></span>
            </button>
            <span data-add-to-cart-target="quantity" class="text-[#035257] text-[14px] font-bold leading-none min-w-[12px] text-center">0</span>
            <button data-action="click->add-to-cart#increment" class="w-[13px] h-[13px] flex items-center justify-center shrink-0 text-[#035257] no-min-h">
              <svg viewBox="0 0 11 11" fill="none" class="w-full h-full"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>
        </span>
      </div>`).join("")

    return `<div class="bg-white flex flex-col" style="border-radius: 20px; box-shadow: 2px 2px 10px 0px rgba(156,153,153,0.25);">
      <div class="flex items-center justify-between px-4 py-3">
        <span class="font-bold text-[#777] text-[14px]">${g.vendor.name}</span>
        <a href="/vendors/${g.vendor.id}" class="text-[12px] font-bold text-[#28ba93] hover:underline whitespace-nowrap no-min-h">Add more</a>
      </div>
      <div class="flex items-center gap-3 px-4 pb-4">
        ${status}
        <div class="flex-1 rounded-full overflow-hidden bg-[#e6e6e6]" style="height: 3px">
          <div class="h-full rounded-full bg-[#035257] transition-all duration-400 ease-out" style="width: ${progress}%"></div>
        </div>
      </div>
      <div class="flex flex-col">${rows}</div>
      <div class="flex items-center justify-between px-4 py-3">
        <span class="font-bold text-[#777] text-[14px]">Vendor Subtotal</span>
        <span class="font-bold text-[#777] text-[14px]">$${g.vendorTotal.toFixed(2)}</span>
      </div>
    </div>`
  }

  #renderConfirmation() {
    const cart = findCartController(this.application); if (!cart) return
    const grouped = this.#groupItemsByVendor(cart.items)
    const total = grouped.reduce((s, g) => s + g.vendorTotal, 0)
    this.confirmationPOIdTarget.textContent = cart.selectedPOId

    const cards = grouped.map(g => `
      <div class="mx-4 bg-white rounded-[20px] overflow-hidden border border-[#e8e8e8]" style="box-shadow: 2px 2px 10px 0px rgba(156,153,153,0.25);">
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 rounded-full bg-[#28ba93] flex items-center justify-center shrink-0">
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <span class="text-[14px] font-bold text-[#777]">${g.vendor.name}</span>
          </div>
          <span class="text-[10px] font-bold text-[#28ba93] uppercase tracking-wide">Order sent</span>
        </div>
        ${g.products.map(i => `
          <div class="flex items-center justify-between p-4 bg-[#fbf9f6]" style="margin-bottom: 1px">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <div class="w-[65px] h-[60px] shrink-0 flex items-center justify-center bg-[#f7f5ef] rounded-md overflow-hidden">
                <img src="${i.product.image}" alt="${i.product.name}" class="w-full h-full object-contain mix-blend-multiply p-1">
              </div>
              <div class="flex flex-col gap-1 min-w-0 flex-1">
                <span class="text-[11px] font-bold text-[#035257] truncate">${g.vendor.name}</span>
                <span class="text-[11px] font-bold text-[#444955] leading-tight truncate">${i.product.name}</span>
                <span class="text-[11px] text-[#363636]">$${(i.product.wholesale_unit_price * i.quantity).toFixed(2)}</span>
              </div>
            </div>
            <div class="shrink-0 ml-3 bg-[#f0f0f0] rounded-full h-[26px] px-4 flex items-center justify-center">
              <span class="text-[11px] font-bold text-[#444955]">× ${i.quantity}</span>
            </div>
          </div>`).join("")}
        <div class="flex items-center justify-between px-4 py-3">
          <span class="text-[14px] font-bold text-[#777]">Vendor Subtotal</span>
          <span class="text-[14px] font-bold text-[#777]">$${g.vendorTotal.toFixed(2)}</span>
        </div>
      </div>`).join("")

    this.confirmationBodyTarget.innerHTML = `${cards}
      <div class="w-full h-[2px] bg-[#e6e6e6] shrink-0"></div>
      <div class="flex items-center justify-between px-4 py-3">
        <span class="text-[14px] font-bold text-[#1f1f1f]">Purchase Order Total</span>
        <span class="text-[14px] font-bold text-[#1f1f1f]">$${total.toFixed(2)}</span>
      </div>
      <div class="h-[100px]"></div>`
  }

  #renderSuccess() {
    const cart = findCartController(this.application); if (!cart) return
    this.successPOIdTarget.textContent = cart.selectedPOId
    const grouped = this.#groupItemsByVendor(cart.items)
    this.successVendorsTarget.innerHTML = grouped.map(g => `
      <div class="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-[#e6e6e6]">
        <div class="w-5 h-5 rounded-full bg-[#28ba93] flex items-center justify-center shrink-0">
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <span class="text-[13px] font-bold text-[#444955] flex-1 text-left">${g.vendor.name}</span>
        <span class="text-[11px] text-[#28ba93] font-bold">Notified</span>
      </div>`).join("")
    // Start progress bar animation
    requestAnimationFrame(() => { this.successProgressTarget.style.width = "0%" })
  }

  #startCountdown() {
    let n = 8
    this.countdownTarget.textContent = n
    clearInterval(this.countdownTimer)
    this.countdownTimer = setInterval(() => {
      n -= 1
      this.countdownTarget.textContent = n
      if (n <= 0) {
        clearInterval(this.countdownTimer)
        const cart = findCartController(this.application)
        cart?.clearItems()
        cart?.setDrawerOpen(false)
        this.view = "cart"
        this.#switchView()
        window.location.href = "/purchase-orders?tab=draft"
      }
    }, 1000)
  }

  #switchView() {
    this.cartViewTarget.classList.toggle("hidden", this.view !== "cart")
    this.confirmationViewTarget.classList.toggle("hidden", this.view !== "confirmation")
    this.confirmationViewTarget.classList.toggle("flex", this.view === "confirmation")
    this.successViewTarget.classList.toggle("hidden", this.view !== "success")
    this.successViewTarget.classList.toggle("flex", this.view === "success")
  }

  // ─── Date helpers ────────────────────────────────────────────────────────
  #parseISO(iso) {
    const [y, m, d] = iso.split("-").map(Number)
    return new Date(y, m - 1, d)
  }
  #formatWeekOf(iso) {
    const wed = this.#parseISO(iso)
    const mon = new Date(wed); mon.setDate(wed.getDate() - 2)
    return mon.toLocaleDateString("en-US", { month: "long", day: "numeric" })
  }
  #formatDeliveryShort(iso) {
    return this.#parseISO(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
  #formatWeekOption(iso) {
    const wed = this.#parseISO(iso)
    const mon = new Date(wed); mon.setDate(wed.getDate() - 2)
    const monLabel = mon.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const wedLabel = wed.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    return `Week of ${monLabel} — ${wedLabel}`
  }
  #nextWednesdays(fromISO) {
    return Array.from({ length: 8 }, (_, i) => {
      const d = this.#parseISO(fromISO); d.setDate(d.getDate() + i * 7)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${y}-${m}-${day}`
    })
  }
  #labelForRepeat(mode) {
    const map = { weekly: "Weekly", biweekly: "Bi-weekly", monthly: "Monthly", custom: "Custom" }
    return map[mode] || ""
  }
  #deliveryForPO(poId) {
    if (!poId) return ""
    const staticPO = this.draftPosValue.find(p => p.id === poId)
    if (staticPO?.delivery_date_short) return staticPO.delivery_date_short
    const cart = findCartController(this.application)
    return cart ? this.#formatDeliveryShort(cart.selectedDeliveryWeek) : ""
  }
}
