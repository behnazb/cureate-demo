# Vendor invoicing (E5) — PRD story 7.
#
# "Cash flow visibility is a top vendor concern." That sentence is the whole brief, and it
# dictates the shape of the index: three numbers first (what's owed to me, what's late,
# what landed), then the list.
#
# RECONCILING THE PRD WITH THE FLOW WE BUILT:
#   An invoice is GENERATED FROM a purchase order once fulfillment is complete and the
#   buyer's 24h window has closed clean (PurchaseOrder#can_invoice?). Nothing is re-keyed:
#   the PO's line items, buyer, and delivery location ARE the invoice. So there's no
#   "create invoice" form here, unlike Mercury — the order already said everything.
#
#   The PRD's five invoice statuses live on the invoice, not the order. See
#   PurchaseOrder::INVOICE_STATUSES.
#
# NO STRIPE YET: the invoice carries the vendor's remit-to details (ACH/wire) instead of a
# pay button. That's the piece to swap when the integration lands.
module VendorPortal
  class InvoicesController < BaseController
    TABS = ["All", "Submitted", "Approved", "Payment Pending", "Overdue", "Paid"].freeze

    def index
      all = invoices

      @filter = TABS.include?(params[:filter]) ? params[:filter] : "All"
      @counts = TABS.to_h { |t|
        [t, t == "All" ? all.size : all.count { |po| po.invoice_display_status == t }]
      }

      @invoices = (@filter == "All" ? all : all.select { |po| po.invoice_display_status == @filter })
                    .sort_by { |po| po.invoice_due_date.to_s }

      # ── Cash flow, the three numbers a vendor actually opens this page for ──
      open_invs    = all.reject(&:invoice_paid?)
      overdue_invs = all.select(&:overdue?)
      paid_invs    = all.select(&:invoice_paid?)

      @open_total    = open_invs.sum    { |po| po.vendor_subtotal(@vendor.id) }
      @overdue_total = overdue_invs.sum { |po| po.vendor_subtotal(@vendor.id) }
      @paid_total    = paid_invs.sum    { |po| po.vendor_subtotal(@vendor.id) }
      @open_count    = open_invs.size
      @overdue_count = overdue_invs.size
      @paid_count    = paid_invs.size

      # Orders that are fulfilled and accepted but NOT yet invoiced — money the vendor
      # hasn't asked for. Cash-flow visibility means surfacing this, not just what's billed.
      @uninvoiced = PurchaseOrder.all.select { |po|
        po.includes_vendor?(@vendor.id) && po.can_invoice?(@vendor.id) && !po.invoice?
      }
      @uninvoiced_total = @uninvoiced.sum { |po| po.vendor_subtotal(@vendor.id) }
    end

    def show
      @po = PurchaseOrder.find(params[:id])
      return render_not_found unless @po && @po.includes_vendor?(@vendor.id) && @po.invoice?

      @items    = @po.line_items_for(@vendor.id)
      @subtotal = @po.vendor_subtotal(@vendor.id)
      @remit    = @vendor.remit_to || {}
    end

    # Emailing the invoice. No mail transport in the prototype — this records who it went
    # to and when, and the UI says so honestly rather than pretending a mail was sent.
    def send_email
      @po = PurchaseOrder.find(params[:id])
      return render_not_found unless @po && @po.includes_vendor?(@vendor.id) && @po.invoice?

      recipients = params[:recipients].to_s.split(/[,\s]+/).reject(&:blank?)
      if recipients.empty?
        redirect_to vendor_invoice_path(@po.id), alert: "Add at least one email address." and return
      end

      @po.mark_invoice_sent!(recipients, params[:memo])
      redirect_to vendor_invoice_path(@po.id),
        notice: "Invoice #{@po.invoice_number} sent to #{recipients.join(', ')}."
    end

    private

    def invoices
      PurchaseOrder.all.select { |po| po.includes_vendor?(@vendor.id) && po.invoice? }
    end

    def render_not_found
      render file: Rails.root.join("public/404.html"), status: :not_found, layout: false
    end
  end
end
