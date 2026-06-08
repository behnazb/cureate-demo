import { Controller } from "@hotwired/stimulus"
import { findCartController } from "./cart_controller"

// cart_drawer_controller — three-view drawer (cart, confirmation, success).
//
// T01: the cart leads with the delivery week (the buyer's mental model). The PO#
// is auto-assigned by the system and shown only as secondary metadata — there is
// no "create / assign / merge PO" UI. Switching weeks via the picker surfaces (or
// auto-creates) that week's draft.
export default class extends Controller {
  static targets = [
    "panel", "backdrop",
    "cartView", "confirmationView", "successView",
    "deliveryBanner", "weekLabel", "poMeta", "repeatLabel",
    "deliveryEditor", "weekSelect", "repeatSelect",
    "emptyState", "vendorGroups", "subtotalBlock", "subtotal", "progressBar", "minStatus",
    "savedIndicator", "saveButton", "continueButton",
    "confirmationPOId", "confirmationBody",
    "successPOId", "successProgress", "countdown", "autoCloseUi",
  ]
  static values = { vendors: Array }

  connect() {
    this.view = "cart"
    this.deliveryEditorOpen = false

    this.boundChanged   = () => this.#render()
    this.boundToggle    = (e) => this.#syncOpen(e.detail.open)
    this.boundPoChanged = () => this.#render()

    document.addEventListener("cart:changed",       this.boundChanged)
    document.addEventListener("cart:drawer-toggle", this.boundToggle)
    document.addEventListener("cart:po-changed",    this.boundPoChanged)

    // Initial render — wait one tick for the cart controller to be connected.
    requestAnimationFrame(() => this.#render())
  }
  disconnect() {
    document.removeEventListener("cart:changed",       this.boundChanged)
    document.removeEventListener("cart:drawer-toggle", this.boundToggle)
    document.removeEventListener("cart:po-changed",    this.boundPoChanged)
  }

  // ─── Open / Close ──────────────────────────────────────────────────────────
  close() {
    findCartController(this.application)?.setDrawerOpen(false)
    this.view = "cart"
    this.#switchView()
  }

  #syncOpen(open) {
    this.panelTarget.dataset.open = open
    this.backdropTarget.dataset.open = open
    document.body.style.overflow = open ? "hidden" : ""
  }

  // ─── Delivery week (primary anchor) ──────────────────────────────────────────
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

  // ─── Bottom CTAs ─────────────────────────────────────────────────────────────
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

  async submitPO() {
    // Capture the PO# now — the active draft is retired when the modal is dismissed.
    const cart = findCartController(this.application)
    this.submittedPOId = cart?.selectedPOId || ""
    // Register the order so "View Purchase Order" + the PO list can show it.
    await this.#persistSubmission(cart)
    this.view = "success"
    this.#renderSuccess()
    this.#switchView()
    this.#startCountdown()
  }

  // POST the submitted cart to the server, which creates an in-memory PO record
  // (status "In Review"). Best-effort — the success screen shows regardless.
  async #persistSubmission(cart) {
    if (!cart || !this.submittedPOId) return
    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.content
      await fetch("/purchase_orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "X-CSRF-Token": token } : {}),
        },
        body: JSON.stringify({
          id: this.submittedPOId,
          delivery_week: cart.selectedDeliveryWeek,
          items: cart.items.map(i => ({
            vendor_id: i.vendorId, product_id: i.productId, quantity: i.quantity, unit: i.unit,
          })),
        }),
      })
    } catch (e) {
      /* demo: ignore network errors — still show the confirmation */
    }
  }

  // ─── Post-submit success actions ─────────────────────────────────────────────
  // Cancel the auto-close countdown when the buyer hovers / touches the modal.
  cancelAutoClose() {
    clearInterval(this.countdownTimer)
    this.autoCloseUiTarget.classList.add("hidden")
  }

  // Primary CTA — open the just-submitted PO's detail page.
  viewPurchaseOrder() {
    clearInterval(this.countdownTimer)
    const cart = findCartController(this.application)
    cart?.clearActiveDraft()
    cart?.setDrawerOpen(false)
    window.location.href = `/purchase_orders/${encodeURIComponent(this.submittedPOId)}`
  }

  // X button / "Close and continue shopping" / auto-close timeout — back to the gallery.
  finishToProducts() {
    clearInterval(this.countdownTimer)
    const cart = findCartController(this.application)
    cart?.clearActiveDraft()
    cart?.setDrawerOpen(false)
    window.location.href = "/products"
  }

  // ─── Rendering ───────────────────────────────────────────────────────────────
  #render() {
    const cart = findCartController(this.application); if (!cart) return
    const items = cart.items

    // Lead: delivery week (primary) + auto-assigned PO# (secondary metadata).
    this.weekLabelTarget.textContent = this.#formatWeekOf(cart.selectedDeliveryWeek)
    const poId = cart.selectedPOId
    if (poId) {
      this.poMetaTarget.textContent = `Draft PO: ${poId}`
      this.poMetaTarget.classList.remove("hidden")
    } else {
      this.poMetaTarget.classList.add("hidden")
    }
    if (cart.repeatMode !== "none") {
      this.repeatLabelTarget.textContent = "· " + this.#labelForRepeat(cart.repeatMode)
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
    if (items.length > 0) {
      this.savedIndicatorTarget.dataset.visible = "true"
      if (this.savedTimer) clearTimeout(this.savedTimer)
      this.savedTimer = setTimeout(() => { this.savedIndicatorTarget.dataset.visible = "false" }, 2000)
    } else {
      this.savedIndicatorTarget.dataset.visible = "false"
    }
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

    const rows = g.products.map(i => {
      // Per-line MOQ signal (T09) — text only, additive to the vendor-level bar.
      // Per-product minimum = case_minimum × units_per_case (seed-data scaffold until
      // Michael's MOQ service provides per-product MOQ data).
      const upc = i.product.units_per_case || 1
      const lineUnits = i.unit === "cases" ? i.quantity * upc : i.quantity
      const lineRemaining = Math.max(0, (i.product.case_minimum || 1) * upc - lineUnits)
      const moqTag = lineRemaining === 0
        ? `<span class="text-[11px] font-bold text-[#28ba93]">Min met</span>`
        : `<span class="text-[11px] text-[#888780]">Add ${lineRemaining} more</span>`
      return `
      <div class="flex items-center justify-between px-4 py-3 bg-[#fbf9f6]" style="margin-bottom: 1px">
        <div class="flex items-center gap-2" style="width: 65%">
          <div class="w-[65px] h-[60px] shrink-0 flex items-center justify-center">
            ${i.product.image ? `<img src="${i.product.image}" alt="${i.product.name}" class="w-full h-full object-contain mix-blend-multiply">` : ""}
          </div>
          <div class="flex flex-col gap-1 min-w-0">
            <span class="font-bold text-[#035257] text-[11px]">${g.vendor.name}</span>
            <span class="font-bold leading-tight text-[#444955] text-[11px]">${i.product.name}</span>
            <span class="text-[#1f1f1f] text-[11px]">$${(i.product.wholesale_unit_price * i.quantity).toFixed(2)}</span>
            ${moqTag}
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
      </div>`
    }).join("")

    return `<div class="bg-white flex flex-col" style="border-radius: 20px; box-shadow: 2px 2px 10px 0px rgba(156,153,153,0.25);">
      <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3">
        <span class="font-bold text-[#777] text-[14px]">${g.vendor.name}</span>
        <a href="/vendors/${g.vendor.id}" class="text-[11px] font-bold text-[#28ba93] hover:underline whitespace-nowrap no-min-h">Add more from ${g.vendor.name}</a>
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
      </div>`
  }

  #renderSuccess() {
    this.successPOIdTarget.textContent = this.submittedPOId
    // Reset + restart the auto-close progress bar (handles re-submits in one session).
    this.autoCloseUiTarget.classList.remove("hidden")
    this.successProgressTarget.style.transition = "none"
    this.successProgressTarget.style.width = "100%"
    requestAnimationFrame(() => {
      this.successProgressTarget.style.transition = "width 8000ms linear"
      this.successProgressTarget.style.width = "0%"
    })
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
        this.finishToProducts()
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
}
