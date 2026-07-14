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
    "deliveryBanner", "weekLabel", "poMeta",
    "deliveryEditor", "weekSelect",
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
    // Jump straight to the review/confirmation view (draft PO detail page's
    // "Submit PO for Review"). detail.returnTo is where post-submit close should
    // land — the PO page itself, so its status pill reloads as In-Review.
    this.boundOpenConfirmation = (e) => {
      this.returnTo = (e.detail && e.detail.returnTo) || null
      this.view = "confirmation"
      this.#renderConfirmation()
      this.#switchView()
    }

    document.addEventListener("cart:changed",           this.boundChanged)
    document.addEventListener("cart:drawer-toggle",     this.boundToggle)
    document.addEventListener("cart:po-changed",        this.boundPoChanged)
    document.addEventListener("cart:open-confirmation", this.boundOpenConfirmation)

    // Initial render — wait one tick for the cart controller to be connected.
    requestAnimationFrame(() => this.#render())
  }
  disconnect() {
    document.removeEventListener("cart:changed",           this.boundChanged)
    document.removeEventListener("cart:drawer-toggle",     this.boundToggle)
    document.removeEventListener("cart:po-changed",        this.boundPoChanged)
    document.removeEventListener("cart:open-confirmation", this.boundOpenConfirmation)
  }

  // ─── Open / Close ──────────────────────────────────────────────────────────
  close() {
    findCartController(this.application)?.setDrawerOpen(false)
    this.view = "cart"
    this.returnTo = null
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

  // ─── Per-line delivery (draft cart + review screen) ─────────────────────────
  // The buyer sets frequency per product in the Draft PO (screen 1) before
  // submitting; the review screen shows the same controls for a final check.
  // Changing frequency resets the schedule to the vendor's preferred default for the
  // new frequency type (a date for "single", a weekday for weekly/biweekly).
  setLineFrequency(event) {
    const { vendorId, productId } = event.target.dataset
    const freq = event.target.value
    const cart = findCartController(this.application); if (!cart) return
    const vendor = this.vendorsValue.find(v => v.id === vendorId) || {}
    const pref = vendor.preferred_delivery_day || "Mon"
    // single → one date; recurring → multi-select day array (starts at the pref day)
    const spec = freq === "single" ? this.#weekDates(cart)[pref] : [pref]
    cart.setItemDelivery(vendorId, productId, freq, spec)
    // The cart view re-renders via the cart:changed event; the confirmation
    // body is not event-driven, so refresh it explicitly when it's on screen.
    if (this.view === "confirmation") this.#renderConfirmation()
  }
  setLineSchedule(event) {
    const { vendorId, productId, freq } = event.target.dataset
    findCartController(this.application)?.setItemDelivery(vendorId, productId, freq, event.target.value)
    if (this.view === "confirmation") this.#renderConfirmation()
  }
  // Toggle one weekday on a recurring line (multi-select). The last selected day
  // can't be removed — a recurring order always has at least one delivery day.
  toggleLineDay(event) {
    const { vendorId, productId, day } = event.currentTarget.dataset
    const cart = findCartController(this.application); if (!cart) return
    const item = cart.items.find(i => i.vendorId === vendorId && i.productId === productId)
    if (!item || (item.frequency || "single") === "single") return
    let spec = Array.isArray(item.deliverySpec) ? [...item.deliverySpec] : (item.deliverySpec ? [item.deliverySpec] : [])
    if (spec.includes(day)) {
      if (spec.length > 1) spec = spec.filter(d => d !== day)
    } else {
      spec.push(day)
    }
    // Keep the vendor's weekday order regardless of click order.
    const vendor = this.vendorsValue.find(v => v.id === vendorId) || {}
    const days = (vendor.delivery_days && vendor.delivery_days.length) ? vendor.delivery_days : ["Mon", "Tue", "Wed", "Thu", "Fri"]
    spec.sort((a, b) => days.indexOf(a) - days.indexOf(b))
    cart.setItemDelivery(vendorId, productId, item.frequency, spec)
    if (this.view === "confirmation") this.#renderConfirmation()
  }
  setLineRepeatUntil(event) {
    const { vendorId, productId } = event.currentTarget.dataset
    findCartController(this.application)?.setItemRepeatUntil(vendorId, productId, event.currentTarget.value)
    if (this.view === "confirmation") this.#renderConfirmation()
  }
  // Fires on change (blur / Enter), not on every keystroke — the re-render that
  // follows would otherwise steal focus mid-typing.
  setLineNote(event) {
    const { vendorId, productId } = event.target.dataset
    findCartController(this.application)?.setItemNote(vendorId, productId, event.target.value.trim())
    if (this.view === "confirmation") this.#renderConfirmation()
  }

  // Resolved frequency + schedule for a cart line, falling back to the vendor's
  // preferred delivery day. Single source of the defaulting rule — used by the
  // draft cart, the review screen, and the submit payload, so all three agree.
  //
  // spec shape: ISO date string for "single"; ARRAY of weekday abbrevs for
  // weekly/biweekly (multi-select — e.g. ["Mon", "Wed"]). Legacy single-string
  // recurring specs are normalized to a one-element array.
  #lineDelivery(vendor, i, dates) {
    const days = (vendor.delivery_days && vendor.delivery_days.length) ? vendor.delivery_days : ["Mon", "Tue", "Wed", "Thu", "Fri"]
    const pref = vendor.preferred_delivery_day || days[0]
    const freq = i.frequency || "single"
    let spec = i.deliverySpec
    if (freq === "single") {
      spec = (typeof spec === "string" && spec) ? spec : dates[pref]
    } else {
      spec = Array.isArray(spec) ? spec : (spec ? [spec] : [pref])
    }
    return { days, freq, spec }
  }

  // The per-line delivery controls (frequency + schedule + order note), shared
  // by the draft cart and the review screen.
  //   One-time  → a date select (days within the PO week)
  //   Recurring → multi-select day pills (e.g. Mondays AND Wednesdays) plus a
  //               "Repeat until" end-date picker (blank = no end date)
  #lineDeliveryControlsHTML(vendor, i, dates) {
    const { days, freq, spec } = this.#lineDelivery(vendor, i, dates)
    const ids = `data-vendor-id="${vendor.id}" data-product-id="${i.product.id}"`
    const freqOpts = [["single", "One-time"], ["weekly", "Weekly"], ["biweekly", "Bi-weekly"]]
      .map(([v, l]) => `<option value="${v}" ${v === freq ? "selected" : ""}>${l}</option>`).join("")
    const selCls = "text-[11px] border border-[#e8e8e8] rounded-md px-2 h-[26px] bg-white text-[#444955] outline-none cursor-pointer hover:border-[#28ba93] transition-colors no-min-h"

    let schedule
    if (freq === "single") {
      const schedOpts = days.map(d => dates[d] ? `<option value="${dates[d]}" ${dates[d] === spec ? "selected" : ""}>${this.#shortDate(dates[d])}</option>` : "").join("")
      schedule = `<select data-action="change->cart-drawer#setLineSchedule" ${ids} data-freq="${freq}" class="${selCls}">${schedOpts}</select>`
    } else {
      // Multi-select day pills — toggling keeps at least one day selected.
      schedule = `<span class="inline-flex items-center gap-1">` + days.map(d => {
        const on = spec.includes(d)
        return `<button type="button" data-action="click->cart-drawer#toggleLineDay" ${ids} data-day="${d}"
                        class="no-min-h text-[11px] h-[26px] px-2.5 rounded-full border transition-colors ${on
                          ? "bg-[#035257] text-white border-[#035257] font-bold"
                          : "bg-white text-[#444955] border-[#e8e8e8] hover:border-[#28ba93]"}">${d}</button>`
      }).join("") + `</span>`
    }

    const repeatUntil = freq !== "single"
      ? `<span class="text-[11px] text-[#777]">Repeat until</span>
         <input type="date" value="${this.#escAttr(i.repeatUntil || "")}"
                data-action="change->cart-drawer#setLineRepeatUntil" ${ids}
                class="text-[11px] border border-[#e8e8e8] rounded-md px-2 h-[26px] bg-white text-[#444955] outline-none cursor-pointer hover:border-[#28ba93] focus:border-[#28ba93] transition-colors no-min-h">`
      : ""
    return `
      <span class="text-[11px] text-[#777]">Deliver</span>
      <select data-action="change->cart-drawer#setLineFrequency" ${ids} class="${selCls}">${freqOpts}</select>
      ${schedule}
      ${repeatUntil}
      <input type="text" value="${this.#escAttr(i.orderNote || "")}" maxlength="140"
             placeholder="Add an order note here"
             title="This note will appear on Purchase Orders and all Buyer &amp; Vendor order emails."
             data-action="change->cart-drawer#setLineNote"
             ${ids}
             class="w-full text-[11px] border border-[#e8e8e8] rounded-md px-2 h-[26px] bg-white text-[#444955] placeholder-[#a1a4aa] outline-none focus:border-[#28ba93] transition-colors no-min-h">`
  }

  // Escape a string for safe interpolation into an HTML attribute.
  #escAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
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
          // Per-line frequency ships with the PO. Defaults are resolved here with
          // the same rule the UI used, so the server stores what the buyer saw.
          items: cart.items.map(i => {
            const vendor = this.vendorsValue.find(v => v.id === i.vendorId) || {}
            const { freq, spec } = this.#lineDelivery(vendor, { ...i, product: { id: i.productId } }, this.#weekDates(cart))
            return {
              vendor_id: i.vendorId, product_id: i.productId, quantity: i.quantity, unit: i.unit,
              frequency: freq, delivery_spec: spec,
              repeat_until: freq === "single" ? null : (i.repeatUntil || null),
              order_note: i.orderNote || null,
            }
          }),
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

  // X button / "Close and continue shopping" / auto-close timeout — back to the
  // gallery, or back to the originating page (e.g. the draft PO detail page, which
  // reloads showing its new In-Review status) when the flow started there.
  finishToProducts() {
    clearInterval(this.countdownTimer)
    const cart = findCartController(this.application)
    cart?.clearActiveDraft()
    cart?.setDrawerOpen(false)
    window.location.href = this.returnTo || "/products"
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
    // Delivery frequency now lives per-product on the review screen (screen 2).

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
      const dates = this.#weekDates(cart)
      this.vendorGroupsTarget.innerHTML = grouped.map(g => this.#vendorCardHTML(g, dates)).join("")
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
      grouped.reduce((s, g) => s + g.progressPct, 0) / grouped.length
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
      // Each cart item represents one orderable "item" (a 2-pack, a case, or a unit). Convert
      // to individual units via units_per_item, and price by prorating the case price so a full
      // case lands exactly on the case price (e.g. 3 two-packs = $68.20, not 3 × $22.68).
      const lineUnitsOf = (i) => {
        const upc = i.product.units_per_case || v.order_rules.units_per_case || 1
        const perItem = i.product.units_per_item || 1
        return i.unit === "cases" ? i.quantity * upc : i.quantity * perItem
      }
      const lineTotalOf = (i) => {
        const upc = i.product.units_per_case || v.order_rules.units_per_case || 1
        const lu = lineUnitsOf(i)
        return (i.product.wholesale_case_price != null && upc)
          ? (lu / upc) * i.product.wholesale_case_price
          : i.product.wholesale_unit_price * lu
      }
      const vendorTotal = products.reduce((s, i) => s + lineTotalOf(i), 0)
      const totalUnits  = products.reduce((s, i) => s + lineUnitsOf(i), 0)
      const minRequired = v.order_rules.min_units
      const minAmount = v.order_rules.min_amount

      // A vendor with a dollar minimum is gated on the running subtotal; otherwise on units.
      let minType, minMet, progressPct
      if (minAmount != null && minAmount > 0) {
        minType = "amount"
        minMet = vendorTotal >= minAmount
        progressPct = Math.min((vendorTotal / minAmount) * 100, 100)
      } else {
        minType = "units"
        minMet = totalUnits >= minRequired
        progressPct = minRequired > 0 ? Math.min((totalUnits / minRequired) * 100, 100) : 100
      }

      out.push({ vendor: v, products, vendorTotal, totalUnits, minRequired, minAmount, minType, minMet, progressPct })
    })
    return out
  }

  // Price of one orderable item (2-pack, case, unit), derived from the case price prorated by
  // units so a full case == the case price. A sub-unit breakdown (e.g. $/pack) is shown only
  // when the sub-unit is meaningful — not for raw individual units.
  #linePrice(p) {
    const itemLabel = p.item_label || "unit"
    const upc = p.units_per_case || 0
    if (p.wholesale_case_price != null && upc) {
      const perItem = p.units_per_item || 1
      const itemPrice = (perItem / upc) * p.wholesale_case_price
      const label = p.unit_label || "unit"
      const breakdown = label !== "unit"
        ? ` <span class="text-[#888780]">($${p.wholesale_unit_price.toFixed(2)}/${label})</span>`
        : ""
      return `<span class="font-bold">$${itemPrice.toFixed(2)} / ${itemLabel}</span>${breakdown}`
    }
    return `$${p.wholesale_unit_price.toFixed(2)} / ${p.unit_label || "unit"}`
  }

  #vendorCardHTML(g, dates = {}) {
    const progress = g.progressPct
    const itemLabel = (g.products[0] && g.products[0].product.item_label) || "unit"
    const itemUnits = (g.products[0] && g.products[0].product.units_per_item) || 1

    let unmetLabel, remainingItems = 0
    if (g.minType === "amount") {
      // Dollar-based MOQ: remaining and target are both expressed in dollars.
      const remaining = Math.max(0, g.minAmount - g.vendorTotal)
      const minLabel = g.minAmount % 1 === 0 ? `$${g.minAmount}` : `$${g.minAmount.toFixed(2)}`
      unmetLabel = `Add $${remaining.toFixed(2)} more to meet ${minLabel} MOQ`
    } else {
      // Item-based MOQ: count orderable items (2-packs, cases) toward a 1-Case minimum.
      const minItems = Math.max(1, Math.round(g.minRequired / itemUnits))
      const currentItems = g.totalUnits / itemUnits
      remainingItems = Math.max(0, Math.ceil(minItems - currentItems))
      const upcVendor = (g.vendor.order_rules && g.vendor.order_rules.units_per_case) || 1
      const minCases = Math.max(1, Math.round(g.minRequired / upcVendor))
      unmetLabel = `Add ${remainingItems} more ${itemLabel}${remainingItems === 1 ? "" : "s"} to meet ${minCases} Case${minCases === 1 ? "" : "s"} MOQ`
    }
    const status = g.minMet
      ? `<div class="flex items-center gap-1.5 shrink-0">
           <svg viewBox="0 0 11 9" fill="none" class="w-[11px] h-[9px]"><path d="M1 4.5L4 7.5L10 1" stroke="#035257" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
           <span class="font-bold text-[#035257] text-[11px]">Minimum order quantity has been met</span>
         </div>`
      : `<span class="font-bold shrink-0 text-[#035257] text-[11px]">${unmetLabel}</span>`

    const rows = g.products.map(i => {
      // Per-line signal mirrors the vendor MOQ — 2Betties/Ethiopian flavors are interchangeable
      // toward the 1-case minimum, so each line shows the same remaining-to-meet count.
      let moqTag = ""
      if (g.minType === "units") {
        moqTag = g.minMet
          ? `<span class="text-[11px] font-bold text-[#28ba93]">Min met</span>`
          : `<span class="text-[11px] text-[#888780]">Add ${remainingItems} more</span>`
      }
      return `
      <div class="bg-[#fbf9f6]" style="margin-bottom: 1px">
      <div class="flex items-center justify-between px-4 pt-3 pb-1">
        <div class="flex items-center gap-2" style="width: 65%">
          <div class="w-[65px] h-[60px] shrink-0 flex items-center justify-center">
            ${i.product.image ? `<img src="${i.product.image}" alt="${i.product.name}" class="w-full h-full object-contain mix-blend-multiply">` : ""}
          </div>
          <div class="flex flex-col gap-1 min-w-0">
            <span class="font-bold text-[#035257] text-[11px]">${g.vendor.name}</span>
            <span class="font-bold leading-tight text-[#444955] text-[11px]">${i.product.name}</span>
            <span class="text-[#1f1f1f] text-[11px]">${this.#linePrice(i.product)}</span>
          </div>
        </div>
        <div class="flex flex-col items-end gap-1.5 shrink-0">
        ${moqTag}
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
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 px-4 pb-3 md:pl-[89px]">
        ${this.#lineDeliveryControlsHTML(g.vendor, i, dates)}
      </div>
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
    const dates = this.#weekDates(cart)

    const cards = grouped.map(g => `
      <div class="mx-4 bg-white rounded-[20px] overflow-hidden border border-[#e8e8e8]" style="box-shadow: 2px 2px 10px 0px rgba(156,153,153,0.25);">
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-2">
            <div class="w-5 h-5 rounded-full bg-[#28ba93] flex items-center justify-center shrink-0">
              <span class="icon-check w-[11px] h-[11px] text-white"></span>
            </div>
            <span class="text-[14px] font-bold text-[#777]">${g.vendor.name}</span>
          </div>
        </div>
        ${g.products.map(i => {
          return `
          <div class="p-4 bg-[#fbf9f6]" style="margin-bottom: 1px">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <div class="w-[65px] h-[60px] shrink-0 flex items-center justify-center bg-[#f7f5ef] rounded-md overflow-hidden">
                  <img src="${i.product.image}" alt="${i.product.name}" class="w-full h-full object-contain mix-blend-multiply p-1">
                </div>
                <div class="flex flex-col gap-1 min-w-0 flex-1">
                  <span class="text-[11px] font-bold text-[#035257] truncate">${g.vendor.name}</span>
                  <span class="text-[11px] font-bold text-[#444955] leading-tight truncate">${i.product.name}</span>
                  <span class="text-[11px] text-[#363636]">${this.#linePrice(i.product)}</span>
                </div>
              </div>
              <div class="shrink-0 ml-3 bg-[#f0f0f0] rounded-full h-[26px] px-4 flex items-center justify-center">
                <span class="text-[11px] font-bold text-[#444955]">× ${i.quantity}</span>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2 mt-3 md:pl-[73px]">
              ${this.#lineDeliveryControlsHTML(g.vendor, i, dates)}
            </div>
          </div>`
        }).join("")}
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
  // Map each weekday in the active PO week (Mon-Sun) to its ISO date.
  #weekDates(cart) {
    const wed = this.#parseISO(cart.selectedDeliveryWeek)
    const mon = new Date(wed); mon.setDate(wed.getDate() - 2)
    const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const map = {}
    order.forEach((d, idx) => {
      const dt = new Date(mon); dt.setDate(mon.getDate() + idx)
      const y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, "0"), dd = String(dt.getDate()).padStart(2, "0")
      map[d] = `${y}-${m}-${dd}`
    })
    return map
  }
  #shortDate(iso) {
    return this.#parseISO(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }
  #dayName(abbr) {
    return ({ Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" })[abbr] || abbr
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
