import { Controller } from "@hotwired/stimulus"

// Yes/No reveal (My Profile — Health Clearance PDF upload, Marketing
// Opportunities details). Selecting Yes shows the trailing panel; No hides it.
//
// This replaces a CSS sibling-combinator approach whose absolutely-positioned
// sr-only radios (direct flex children) confused Chrome's scroll anchoring
// when the panel collapsed, freezing page scroll. Nested label inputs + a
// class toggle sidestep that entirely.
export default class extends Controller {
  static targets = ["yes", "panel"]

  connect() {
    this.update()
  }

  update() {
    this.panelTarget.classList.toggle("hidden", !this.yesTarget.checked)
  }
}
