Rails.application.routes.draw do
  root to: redirect("/products")

  resources :vendors, only: [:index, :show] do
    resources :products, only: [:show], controller: "products"
  end

  resources :products, only: [:index]

  resources :purchase_orders
end
