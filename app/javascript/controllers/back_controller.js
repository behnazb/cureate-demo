import { Controller } from "@hotwired/stimulus"

// back_controller — a back link that actually goes back.
//
// The chevron used to be a plain link to a hardcoded URL, so it always dumped you on
// the same screen no matter where you'd come from. Now it walks the browser's history,
// and only falls back to its href when there's nowhere sensible to go back TO.
//
// The fallback is not a guess: the server sets it to the Orders tab that actually
// contains this order (see vendor_tab_value_for), so a cold load — a pasted link, a
// bookmark, a page opened in a new tab — still lands somewhere true.
export default class extends Controller {
  go(event) {
    const ref = document.referrer

    // Only trust same-origin history, and never "go back" to the page we're already on
    // (which is what a form POST → redirect leaves in the referrer).
    const sameOrigin = ref && ref.startsWith(window.location.origin)
    const notSelf    = ref !== window.location.href

    if (sameOrigin && notSelf && window.history.length > 1) {
      event.preventDefault()
      window.history.back()
    }
    // else: let the link follow its href (the status-aware fallback).
  }
}
