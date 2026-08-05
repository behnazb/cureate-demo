import { Controller } from "@hotwired/stimulus"

// Sales Channels — channel cards + edit drawer (My Profile).
//
// Each channel renders as a card with an Active / Not participating badge and
// an Edit details button that opens a slide-out drawer holding that channel's
// parameter form (the drawer lives inside the profile <form>, so Save Profile
// submits everything). Participation is derived, not declared: a channel with
// any filled detail is Active; "Remove from my channels" clears the drawer's
// fields, which drops the vendor out of the channel. Badges, card highlight,
// and the details count refresh live as the vendor types.
export default class extends Controller {
  static targets = ["card", "badge", "drawer", "backdrop", "otherField"]

  connect() {
    this.refresh()
    this.element.addEventListener("input", () => this.refresh())
  }

  disconnect() {
    document.body.style.overflow = ""
  }

  // Open/close ride the shared drawer-transition CSS (data-transition +
  // data-open) — the exact mechanism the buyer cart drawer uses, so both
  // sides animate identically.
  open(event) {
    const drawer = this.#drawerFor(event.currentTarget.dataset.channel)
    if (!drawer) return
    drawer.dataset.open = "true"
    if (this.hasBackdropTarget) this.backdropTarget.dataset.open = "true"
    document.body.style.overflow = "hidden"
  }

  close() {
    this.drawerTargets.forEach(d => d.removeAttribute("data-open"))
    if (this.hasBackdropTarget) this.backdropTarget.removeAttribute("data-open")
    document.body.style.overflow = ""
    this.refresh()
  }

  removeChannel(event) {
    const drawer = this.#drawerFor(event.currentTarget.dataset.channel)
    if (!drawer) return
    drawer.querySelectorAll("input, select, textarea").forEach(el => {
      if (el.type === "checkbox" || el.type === "radio") el.checked = false
      else if (el.tagName === "SELECT") el.selectedIndex = 0
      else el.value = ""
    })
    this.close()
  }

  refresh() {
    // "Other" certification reveals its details field; hiding clears it so a
    // stale value can't keep the channel marked active.
    this.otherFieldTargets.forEach(fieldEl => {
      const drawer = this.#drawerFor(fieldEl.dataset.channel)
      if (!drawer) return
      const other = drawer.querySelector('input[type="checkbox"][value="Other"]')
      const show = !!(other && other.checked)
      fieldEl.classList.toggle("hidden", !show)
      if (!show) {
        const input = fieldEl.querySelector("input")
        if (input && input.value !== "") input.value = ""
      }
    })

    this.cardTargets.forEach(cardEl => {
      const key = cardEl.dataset.channel
      const drawer = this.#drawerFor(key)
      if (!drawer) return
      const filled = [...drawer.querySelectorAll("input, select, textarea")].filter(el =>
        (el.type === "checkbox" || el.type === "radio") ? el.checked : el.value && el.value.trim() !== ""
      )
      const on = filled.length > 0
      cardEl.classList.toggle("border-[#28ba93]", on)
      cardEl.classList.toggle("bg-[#f6fcfa]", on)
      cardEl.classList.toggle("border-[#e8e8e8]", !on)
      cardEl.classList.toggle("bg-white", !on)
      const badge = this.badgeTargets.find(b => b.dataset.channel === key)
      if (badge) {
        badge.textContent = on ? "Active" : "Not participating"
        badge.style.backgroundColor = on ? "#eaf7f3" : "#f4f4f4"
        badge.style.color = on ? "#0f7a63" : "#a1a4aa"
      }
    })
  }

  // ── private ──

  #drawerFor(key) {
    return this.drawerTargets.find(d => d.dataset.channel === key)
  }
}
