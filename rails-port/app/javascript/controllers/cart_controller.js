import { Controller } from "@hotwired/stimulus"

// cart_controller — Singleton attached to <body>.
//
// Owns: cart items, selected PO, draft POs, drawer open state, delivery week, repeat mode.
// Persists to localStorage (key from data-cart-storage-key-value).
// Communicates via custom events on document:
//   cart:changed        — items / counts updated
//   cart:po-changed     — selected PO changed (selectedPOId)
//   cart:drawer-toggle  — drawer open state changed ({open})
//   cart:item-added     — a specific product was just added (for bump animations)
//
// Cross-controller access: other controllers call
//   this.application.getControllerForElementAndIdentifier(document.body, "cart")
// (or use a `static targets = ["cart"]` if you nest under body).
export default class extends Controller {
  static values = {
    storageKey: { type: String, default: "cureate-cart-v1" },
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────
  connect() {
    this.state = this.#load() || this.#defaultState()
    this.#announce("cart:connected")
    this.#emit("cart:changed")
  }

  // ── Public API ───────────────────────────────────────────────────────────

  // items: Array<{ vendorId, productId, quantity, unit }>
  get items() { return this.state.items }

  addItem(vendorId, productId, delta, unit = "units") {
    const items = [...this.state.items]
    const idx = items.findIndex(i => i.vendorId === vendorId && i.productId === productId)
    if (idx >= 0) {
      const newQty = items[idx].quantity + delta
      if (newQty <= 0) {
        items.splice(idx, 1)
      } else {
        items[idx] = { ...items[idx], quantity: newQty, unit }
      }
    } else if (delta > 0) {
      items.push({ vendorId, productId, quantity: delta, unit })
    }
    this.state.items = items
    this.#persist()
    this.#emit("cart:changed")
    if (delta > 0) this.#emit("cart:item-added", { vendorId, productId })
  }

  removeItem(vendorId, productId) {
    this.state.items = this.state.items.filter(i => !(i.vendorId === vendorId && i.productId === productId))
    this.#persist()
    this.#emit("cart:changed")
  }

  clearItems() {
    this.state.items = []
    this.#persist()
    this.#emit("cart:changed")
  }

  clearStagedItems() {
    this.state.items = []
    this.state.selectedPOId = ""
    this.#persist()
    this.#emit("cart:changed")
    this.#emit("cart:po-changed")
  }

  // ── PO selection / drafts ────────────────────────────────────────────────
  get selectedPOId()  { return this.state.selectedPOId }
  get hasActivePO()   { return this.state.selectedPOId !== "" }
  get isActivePODraft() {
    if (!this.hasActivePO) return true
    const po = this.state.purchaseOrders.find(p => p.id === this.state.selectedPOId)
    return !po || po.status === "Draft"
  }

  setSelectedPOId(id) {
    this.state.selectedPOId = id || ""
    this.#persist()
    this.#emit("cart:po-changed")
    this.#emit("cart:changed")
  }

  // Public, client-known PO list (Draft POs created via the drawer).
  get purchaseOrders() { return this.state.purchaseOrders }

  addPurchaseOrder(id) {
    const trimmed = (id || "").trim()
    if (!trimmed) return
    this.state.purchaseOrders = [...this.state.purchaseOrders, { id: trimmed, label: trimmed }]
    this.state.selectedPOId = trimmed
    this.#persist()
    this.#emit("cart:po-changed")
    this.#emit("cart:changed")
  }

  addNewDraftPO(id, deliveryDate) {
    if (!this.state.purchaseOrders.find(p => p.id === id)) {
      this.state.purchaseOrders = [...this.state.purchaseOrders, { id, label: id }]
    }
    // Track this PO's delivery date in case the user opens it later.
    this.state.deliveryByPO = { ...(this.state.deliveryByPO || {}), [id]: deliveryDate }
    this.#persist()
    this.#emit("cart:po-changed")
  }

  generateNewPOId() {
    const existing = this.state.purchaseOrders.length
    const num = String(existing + 1).padStart(3, "0")
    return `${num}-MARKET-${String(Date.now()).slice(-5)}`
  }

  mergeStagedItemsIntoPO(poId) {
    this.state.selectedPOId = poId
    this.#persist()
    this.#emit("cart:po-changed")
    this.#emit("cart:changed")
  }

  syncItemsFromPO(poId, lineItems = []) {
    this.state.selectedPOId = poId
    this.state.items = lineItems.map(li => ({
      vendorId:  li.vendorId,
      productId: li.productId,
      quantity:  li.quantity,
      unit:      li.unit,
    }))
    this.#persist()
    this.#emit("cart:changed")
    this.#emit("cart:po-changed")
  }

  // ── Drawer ───────────────────────────────────────────────────────────────
  get isDrawerOpen() { return this.state.drawerOpen }

  setDrawerOpen(open) {
    this.state.drawerOpen = !!open
    this.#persist()
    this.#emit("cart:drawer-toggle", { open: this.state.drawerOpen })
  }

  toggleDrawer() {
    this.setDrawerOpen(!this.state.drawerOpen)
  }

  // ── Delivery / repeat ────────────────────────────────────────────────────
  get selectedDeliveryWeek() { return this.state.selectedDeliveryWeek }
  setSelectedDeliveryWeek(iso) {
    this.state.selectedDeliveryWeek = iso
    this.#persist()
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
    return this.state.items.reduce((s, i) => s + i.quantity, 0)
  }

  getTotalUnits(vendorId, unitsPerCaseByVendor = {}) {
    return this.state.items
      .filter(i => i.vendorId === vendorId)
      .reduce((sum, i) => {
        const perCase = unitsPerCaseByVendor[vendorId] || 1
        return sum + (i.unit === "cases" ? i.quantity * perCase : i.quantity)
      }, 0)
  }

  quantityFor(vendorId, productId) {
    const item = this.state.items.find(i => i.vendorId === vendorId && i.productId === productId)
    return item ? item.quantity : 0
  }

  // ── Internals ────────────────────────────────────────────────────────────

  #defaultState() {
    return {
      items: [],
      selectedPOId: "",
      drawerOpen: false,
      selectedDeliveryWeek: this.#nextWednesday(),
      repeatMode: "none",
      customEndType: "never",
      purchaseOrders: [
        { id: "004-CHARLES-00017", label: "004-CHARLES-00017" },
        { id: "005-BRENDA-00098",  label: "005-BRENDA-00098"  },
        { id: "006-STEPH-00001",   label: "006-STEPH-00001"   },
        { id: "007-MARKET-00001",  label: "007-MARKET-00001"  },
      ],
      deliveryByPO: {},
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
