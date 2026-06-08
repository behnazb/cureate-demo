// Registers every Stimulus controller in this folder with the application.
// When using importmap-rails with `pin_all_from "app/javascript/controllers", under: "controllers"`,
// this single file is enough; controllers auto-register via filename → identifier.
//
// If using jsbundling-rails, the eagerLoadControllersFrom pattern below works too.

import { application } from "./application"

import CartController             from "./cart_controller"
import CartDrawerController       from "./cart_drawer_controller"
import MobileNavController        from "./mobile_nav_controller"
import SidebarController          from "./sidebar_controller"
import SearchBarController        from "./search_bar_controller"
import FilterDropdownController   from "./filter_dropdown_controller"
import FilterPanelController      from "./filter_panel_controller"
import ViewToggleController       from "./view_toggle_controller"
import AddToCartController        from "./add_to_cart_controller"
import ViewCartButtonController   from "./view_cart_button_controller"
import PoDropdownMenuController   from "./po_dropdown_menu_controller"
import ProductsPageController     from "./products_page_controller"
import PurchaseOrdersPageController from "./purchase_orders_page_controller"
import VendorDetailController     from "./vendor_detail_controller"
import ProductDetailController    from "./product_detail_controller"
import PoDetailController         from "./po_detail_controller"
import DiscloseController         from "./disclose_controller"
import ProductCardController      from "./product_card_controller"
import RowLinkController          from "./row_link_controller"

application.register("cart",                  CartController)
application.register("cart-drawer",           CartDrawerController)
application.register("mobile-nav",            MobileNavController)
application.register("sidebar",               SidebarController)
application.register("search-bar",            SearchBarController)
application.register("filter-dropdown",       FilterDropdownController)
application.register("filter-panel",          FilterPanelController)
application.register("view-toggle",           ViewToggleController)
application.register("add-to-cart",           AddToCartController)
application.register("view-cart-button",      ViewCartButtonController)
application.register("po-dropdown-menu",      PoDropdownMenuController)
application.register("products-page",         ProductsPageController)
application.register("purchase-orders-page",  PurchaseOrdersPageController)
application.register("vendor-detail",         VendorDetailController)
application.register("product-detail",        ProductDetailController)
application.register("po-detail",              PoDetailController)
application.register("disclose",              DiscloseController)
application.register("product-card",          ProductCardController)
application.register("row-link",              RowLinkController)
