import { Controller } from "@hotwired/stimulus"

// cart_controller — Singleton attached to <body>.
//
// Mental model (T01): the buyer is "ordering for a delivery week." Each delivery
// week owns exactly one draft Purchase Order, auto-created with a system-assigned
// PO# the first time that week is selected or has an item added. The buyer never
// creates or picks a PO number — it's internal metadata.
//
// State shape:
//   draftsByWeek: { [weekISO]: { poId, items: [{ vendorId, productId, quantity, unit }] } }
//   selectedDeliveryWeek: weekISO   ← the active draft is draftsByWeek[selectedDeliveryWeek]
//   poSeq:                Int       ← next sequence number for generated PO#s
//
// Persists to localStorage (key from data-cart-storage-key-value).
// Communicates via custom events on document:
//   cart:changed        — items / counts updated
//   cart:po-changed     — active draft / PO# / delivery week changed
//   cart:drawer-toggle  — drawer open state changed ({ open })
//   cart:item-added     — a product was just added (for bump animations)
//
// Cross-controller access via the findCartController() helper exported below.
export default class extends Controller {
  static values = {
    storageKey: { type: String, default: "cureate-cart-v1" },
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────
  connect() {
    this.state = this.#load() || this.#defaultState()
    this.#migrateLegacyState()
    // Selecting a delivery week auto-assigns its PO# (the buyer never creates one).
    this.#ensureDraft(this.state.selectedDeliveryWeek)
    this.#persist()
    this.#announce("cart:connected")
    this.#emit("cart:changed")
    this.#emit("cart:po-changed")
  }

  // ── Active draft (keyed by delivery week) ─────────────────────────────────
  #activeDraft() { return this.state.draftsByWeek[this.state.selectedDeliveryWeek] }

  #ensureDraft(week) {
    if (!this.state.draftsByWeek[week]) {
      this.state.draftsByWeek[week] = { poId: this.#generatePOId(), items: [] }
    }
    return this.state.draftsByWeek[week]
  }

  // System-generated, never buyer-chosen. Format: "007-MARKET-00001".
  #generatePOId() {
    const seq = this.state.poSeq || 1
    this.state.poSeq = seq + 1
    return `007-MARKET-${String(seq).padStart(5, "0")}`
  }

  // ── Items (always scoped to the active week's draft) ──────────────────────
  get items() { return this.#activeDraft()?.items ?? [] }

  addItem(vendorId, productId, delta, unit = "units") {
    // First item for a week implicitly creates that week's draft + PO#.
    const draft = this.#ensureDraft(this.state.selectedDeliveryWeek)
    const items = [...draft.items]
    const idx = items.findIndex(i => i.vendorId === vendorId && i.productId === productId)
    if (idx >= 0) {
      const newQty = items[idx].quantity + delta
      if (newQty <= 0) items.splice(idx, 1)
      else items[idx] = { ...items[idx], quantity: newQty, unit }
    } else if (delta > 0) {
      items.push({ vendorId, productId, quantity: delta, unit })
    }
    draft.items = items
    this.#persist()
    this.#emit("cart:changed")
    this.#emit("cart:po-changed")
    if (delta > 0) this.#emit("cart:item-added", { vendorId, productId })
  }

  removeItem(vendorId, productId) {
    const draft = this.#activeDraft(); if (!draft) return
    draft.items = draft.items.filter(i => !(i.vendorId === vendorId && i.productId === productId))
    this.#persist()
    this.#emit("cart:changed")
  }

  clearItems() {
    const draft = this.#activeDraft(); if (!draft) return
    draft.items = []
    this.#persist()
    this.#emit("cart:changed")
  }

  // Used after a PO is submitted: retire the week's draft so the next order for
  // that week is auto-assigned a fresh PO# (created on reconnect / next add).
  clearActiveDraft() {
    delete this.state.draftsByWeek[this.state.selectedDeliveryWeek]
    this.#persist()
    this.#emit("cart:changed")
    this.#emit("cart:po-changed")
  }

  // ── Active draft / PO# (read-only — auto-assigned, not buyer-chosen) ───────
  get selectedPOId()    { return this.#activeDraft()?.poId ?? "" }
  get hasActivePO()     { return this.items.length > 0 }
  get isActivePODraft() { return true }

  // ── Drawer ───────────────────────────────────────────────────────────────
  get isDrawerOpen() { return this.state.drawerOpen }

  setDrawerOpen(open) {
    this.state.drawerOpen = !!open
    this.#persist()
    this.#emit("cart:drawer-toggle", { open: this.state.drawerOpen })
  }

  toggleDrawer() { this.setDrawerOpen(!this.state.drawerOpen) }

  // ── Delivery week (the primary anchor) ────────────────────────────────────
  get selectedDeliveryWeek() { return this.state.selectedDeliveryWeek }

  // Switching weeks surfaces that week's existing draft, or auto-creates one.
  setSelectedDeliveryWeek(iso) {
    if (!iso) return
    this.state.selectedDeliveryWeek = iso
    this.#ensureDraft(iso)
    this.#persist()
    this.#emit("cart:po-changed")
    this.#emit("cart:changed")
  }

  get repeatMode() { return this.state.repeatMode }
  setRepeatMode(mode) {
    this.state.repeatMode = mode
    this.#persist()
    this.#emit("cart:changed")
  }
  get customEndType() { return this.state.customEndType }
  setCustomEndType(type) {
    this.state.customEndType = type
    this.#persist()
    this.#emit("cart:changed")
  }

  // ── Aggregations ─────────────────────────────────────────────────────────
  getTotalItems() {
    return this.items.reduce((s, i) => s + i.quantity, 0)
  }

  getTotalUnits(vendorId, unitsPerCaseByVendor = {}) {
    return this.items
      .filter(i => i.vendorId === vendorId)
      .reduce((sum, i) => {
        const perCase = unitsPerCaseByVendor[vendorId] || 1
        return sum + (i.unit === "cases" ? i.quantity * perCase : i.quantity)
      }, 0)
  }

  quantityFor(vendorId, productId) {
    const item = this.items.find(i => i.vendorId === vendorId && i.productId === productId)
    return item ? item.quantity : 0
  }

  // ── Internals ────────────────────────────────────────────────────────────
  #defaultState() {
    return {
      selectedDeliveryWeek: this.#nextWednesday(),
      repeatMode: "none",
      customEndType: "never",
      drawerOpen: false,
      poSeq: 1,
      draftsByWeek: {},
    }
  }

  // Upgrade a pre-T01 persisted cart (flat `items` + `selectedPOId`) into the
  // delivery-week-keyed shape, so returning buyers don't lose their draft.
  #migrateLegacyState() {
    if (this.state.draftsByWeek) return
    const week  = this.state.selectedDeliveryWeek || this.#nextWednesday()
    const items = Array.isArray(this.state.items) ? this.state.items : []
    const draftsByWeek = {}
    let poSeq = 1
    if (items.length) {
      draftsByWeek[week] = { poId: `007-MARKET-${String(poSeq).padStart(5, "0")}`, items }
      poSeq += 1
    }
    this.state = {
      selectedDeliveryWeek: week,
      repeatMode:    this.state.repeatMode || "none",
      customEndType: this.state.customEndType || "never",
      drawerOpen:    !!this.state.drawerOpen,
      poSeq,
      draftsByWeek,
    }
  }

  #load() {
    try {
      const raw = localStorage.getItem(this.storageKeyValue)
      return raw ? JSON.parse(raw) : null
    } catch (e) { return null }
  }

  #persist() {
    try { localStorage.setItem(this.storageKeyValue, JSON.stringify(this.state)) }
    catch (e) { /* localStorage unavailable — silently degrade */ }
  }

  #emit(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(name, { detail }))
  }

  #announce(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(name, { detail }))
  }

  #nextWednesday() {
    const today = new Date()
    const day = today.getDay()
    const daysUntilNextWed = ((3 - day + 7) % 7) + 7
    const result = new Date(today)
    result.setDate(today.getDate() + daysUntilNextWed)
    const y = result.getFullYear()
    const m = String(result.getMonth() + 1).padStart(2, "0")
    const d = String(result.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }
}

// Helper for other controllers to grab the singleton.
// Usage: import { findCartController } from "./cart_controller"
//        findCartController(this.application)?.addItem(...)
export function findCartController(app) {
  return app.getControllerForElementAndIdentifier(document.body, "cart")
}
