import { Controller } from "@hotwired/stimulus"

// view_toggle_controller — dispatches view:change with { view: "grid" | "list" }.
export default class extends Controller {
  static targets = ["listIcon", "listLabel", "gridIcon", "gridLabel"]

  connect() { this.view = "grid" }

  setList() { this.#set("list") }
  setGrid() { this.#set("grid") }

  #set(view) {
    if (view === this.view) return
    this.view = view
    const onList = view === "list"
    this.listIconTarget.classList.toggle("opacity-100", onList)
    this.listIconTarget.classList.toggle("opacity-30", !onList)
    this.listLabelTarget.classList.toggle("text-[#1f1f1f]", onList)
    this.listLabelTarget.classList.toggle("text-[#aaa]", !onList)
    this.gridIconTarget.classList.toggle("opacity-100", !onList)
    this.gridIconTarget.classList.toggle("opacity-30", onList)
    this.gridLabelTarget.classList.toggle("text-[#1f1f1f]", !onList)
    this.gridLabelTarget.classList.toggle("text-[#aaa]", onList)
    document.dispatchEvent(new CustomEvent("view:change", { detail: { view } }))
  }
}
