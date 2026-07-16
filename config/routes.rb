Rails.application.routes.draw do
  root to: redirect("/products")

  resources :vendors, only: [:index, :show] do
    resources :products, only: [:show], controller: "products"
  end

  resources :products, only: [:index]

  resources :purchase_orders

  # Prototype persona switch (stand-in for auth) — see app/models/persona.rb.
  get "/persona/:persona", to: "personas#update", as: :persona

  # Vendor experience. URLs are /vendor/*, but the controllers live under the
  # VendorPortal module: `Vendor` is already taken by the model, and a `Vendor::`
  # controller namespace would nest controllers inside the model class.
  # Path helpers are still vendor_orders_path etc.
  scope :vendor, as: :vendor, module: :vendor_portal do
    # Shop home (E5) — greeting, top tasks, stats.
    get "dashboard", to: "dashboard#index", as: :dashboard

    # Delivery schedule (E2, PRD story 3) — calendar + list.
    resources :deliveries, only: [:index]

    # Product & inventory management (E4). Every product here belongs to current_vendor.
    #
    # `as: :listings` is NOT cosmetic. The buyer already has a nested
    # `resources :vendors do resources :products end`, which owns the helper name
    # `vendor_product_path(vendor_id, id)`. Without the rename this block would generate
    # the same helper, Rails would keep the buyer's, and every call here would blow up
    # asking for a vendor_id. The URL stays /vendor/products; only the helper differs:
    #   vendor_listings_path        → /vendor/products
    #   vendor_listing_path(id)     → /vendor/products/:id
    resources :products, only: [:index, :create, :update], as: :listings

    resources :orders, only: [:index, :show] do
      member do
        # The vendor lifecycle: confirm → fulfil → prove → invoice.
        patch :confirm    # Requested   → Confirmed
        patch :decline    # Requested   → Cancelled (with a reason)
        patch :fulfill    # Confirmed   → Fulfillment (Delivery | Shipping)
        patch :tracking   # resolves the ingestion app's deferred "Add Later"
        patch :invoice    # Fulfillment → Invoiced (manual, irreversible)
      end
    end
  end
end
