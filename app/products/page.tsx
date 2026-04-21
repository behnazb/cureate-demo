"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { vendors } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import ViewToggle from "@/components/ViewToggle";
import ViewCartButton from "@/components/ViewCartButton";
import SearchBar from "@/components/SearchBar";
import FilterDropdown from "@/components/FilterDropdown";
import FilterPanel from "@/components/FilterPanel";
import AddToCartButton from "@/components/AddToCartButton";
import { filterConfig } from "@/lib/filterConfig";
import { t } from "@/lib/tokens";
import Sidebar from "@/components/Sidebar";

// ─── Color constants ───────────────────────────────────────────────────────────
const COLORS = {
  primaryTeal: "#28ba93",
  darkTeal: "#035257",
  medTeal: "#377b82",
  sidebarBg: "#1f1f1f",
  activeNavBg: "#363636",
  border: "#a1a4aa",
  beige: "#f7f5ef",
  greyText: "#777",
  darkGreyText: "#444955",
} as const;

// ─── Real data ─────────────────────────────────────────────────────────────────
const allProducts = vendors.flatMap((v) =>
  v.products
    .filter((p) => !(p as { isShippingFee?: boolean }).isShippingFee)
    .map((p) => ({ ...p, vendor: v }))
);

// Category pill id → product category string mapping
const categoryPillMap: Record<string, string> = {
  "beverages": "Beverages",
  "breads-bakery": "Breads & Bakery",
  "catering": "Catering",
  "dairy-eggs": "Dairy & Eggs",
  "desserts": "Desserts",
  "dry-goods": "Dry Goods",
  "prepared-foods": "Prepared Foods",
  "produce": "Produce",
  "protein": "Protein",
  "snacks": "Snacks",
  "wellness-gifts": "Wellness & Gifts",
};

// ─── Filter icon ──────────────────────────────────────────────────────────────
function FilterIcon() {
  return (
    <svg width="12" height="11" viewBox="0 0 12 11" fill="none">
      <path d="M1 1.5h10M3 5.5h6M5 9.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [quickFilters, setQuickFilters] = useState<Record<string, string[]>>({});
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string[]>>({});
  const [activeCategory, setActiveCategory] = useState("all-products");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50 });

  // Build vendor options dynamically
  const vendorOptions = [
    { id: "all-vendors", label: "All Vendors" },
    ...vendors.map((v) => ({ id: v.id, label: v.name })),
  ];

  // Count active advanced filters
  const advancedActiveCount = Object.values(advancedFilters).flat().length;

  // Count active quick filters (excluding "all-" sentinel values)
  const quickActiveCount = Object.values(quickFilters)
    .flat()
    .filter((v) => v !== "all-vendors" && v !== "all-locations").length;

  const hasAnyFilter = advancedActiveCount > 0 || quickActiveCount > 0 || activeCategory !== "all-products";

  // ─── Filter logic ───────────────────────────────────────────────────────────
  const filteredProducts = allProducts.filter((item) => {
    const vendor = item.vendor;
    const product = item as typeof item & { dietary?: string[]; allergens?: string[] };

    // Category pill filter
    if (activeCategory !== "all-products") {
      const targetCategory = categoryPillMap[activeCategory];
      if (targetCategory && item.category !== targetCategory) return false;
    }

    // Vendor quick filter
    const vendorFilter = quickFilters["vendor"];
    if (vendorFilter?.length && !vendorFilter.includes("all-vendors") && !vendorFilter.includes(vendor.id)) {
      return false;
    }

    // Dietary quick filter
    const dietaryFilter = quickFilters["dietary"];
    if (dietaryFilter?.length) {
      const dietaryMap: Record<string, string> = {
        "gluten-free": "Gluten-Free",
        "dairy-free": "Dairy-Free",
        "vegan": "Vegan",
        "vegetarian": "Vegetarian",
        "nut-free": "Nut-Free",
      };
      const required = dietaryFilter.map((d) => dietaryMap[d]).filter(Boolean);
      if (required.length && !required.every((r) =>
        product.dietary?.includes(r) || product.allergens?.includes(r)
      )) return false;
    }

    // Vendor attributes quick filter
    const attrFilter = quickFilters["vendorAttributes"];
    if (attrFilter?.length) {
      const attrMap: Record<string, string> = {
        "woman-owned": "Woman-owned Business",
        "minority-owned": "Minority-owned Business",
      };
      const required = attrFilter.map((a) => attrMap[a]).filter(Boolean);
      if (required.length && !required.every((r) => (vendor.certifications as string[])?.includes(r))) {
        return false;
      }
    }

    // Advanced: allergens
    const allergenFilter = advancedFilters["allergens"];
    if (allergenFilter?.length) {
      const allergenOptions = filterConfig.advanced.find((f) => f.id === "allergens")?.options ?? [];
      const required = allergenFilter
        .map((a) => allergenOptions.find((o) => o.id === a)?.label)
        .filter(Boolean) as string[];
      if (!required.every((r) => product.allergens?.includes(r))) return false;
    }

    // Advanced: dietary preferences
    const dietPrefFilter = advancedFilters["dietaryPreferences"];
    if (dietPrefFilter?.length) {
      const dietOptions = filterConfig.advanced.find((f) => f.id === "dietaryPreferences")?.options ?? [];
      const required = dietPrefFilter
        .map((d) => dietOptions.find((o) => o.id === d)?.label)
        .filter(Boolean) as string[];
      if (!required.every((r) => product.dietary?.includes(r))) return false;
    }

    // Price range filter
    if (item.wholesaleUnitPrice < priceRange.min || item.wholesaleUnitPrice > priceRange.max) {
      return false;
    }

    return true;
  });

  // Group by category for grid view
  const groupedProducts = filteredProducts.reduce((acc, item) => {
    const cat = item.category ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof filteredProducts>);

  const clearAll = () => {
    setQuickFilters({});
    setAdvancedFilters({});
    setActiveCategory("all-products");
    setPriceRange({ min: 0, max: 50 });
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden" style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}>

      <Sidebar />

      {/* ── Main Content — full width on mobile ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header — hidden on mobile (MobileNav replaces it) */}
        <header className="hidden md:flex items-center justify-between bg-white px-9 py-4 border-b border-[#e8e8e8] shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-[20px] font-bold text-[#1f1f1f] whitespace-nowrap shrink-0">All Products</h1>
            <div className="h-[38px] flex items-center min-w-[280px] max-w-[340px]">
              <SearchBar />
            </div>
          </div>
          <ViewCartButton />
        </header>

        {/* Filter row */}
        <div className="bg-white px-4 md:px-9 py-2 flex items-center justify-between gap-3 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[13px] font-bold text-[#1f1f1f] shrink-0">
              Filter by
            </span>
            {filterConfig.quick.map((filter) => (
              <FilterDropdown
                key={filter.id}
                label={filter.label}
                defaultLabel={filter.defaultLabel}
                options={filter.id === "vendor" ? vendorOptions : filter.options}
                selection={filter.selection as "single" | "multiple"}
                selected={quickFilters[filter.id] ?? []}
                onChange={(val) => setQuickFilters((prev) => ({ ...prev, [filter.id]: val }))}
              />
            ))}
            {hasAnyFilter && (
              <button
                onClick={clearAll}
                className="no-min-h text-[11px] font-bold transition-colors shrink-0 flex items-center gap-1"
                style={{ color: COLORS.border }}
                onMouseEnter={e => (e.currentTarget.style.color = COLORS.darkGreyText)}
                onMouseLeave={e => (e.currentTarget.style.color = COLORS.border)}
              >
                ✕ Clear all
              </button>
            )}
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>

        {/* Category pills row */}
        <div className="bg-white px-4 md:px-9 py-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {/* Filters panel trigger */}
          <button
            onClick={() => setFilterPanelOpen(true)}
            className={`
              no-min-h flex items-center gap-1.5 rounded-full px-3 border text-[12px] font-bold shrink-0 transition-colors
              ${advancedActiveCount > 0
                ? "bg-[#035257] text-white border-[#035257]"
                : "border-[#a1a4aa] text-[#444955] hover:border-[#777]"
              }
            `}
            style={{ height: '26px' }}
          >
            <FilterIcon />
            Filters
            {advancedActiveCount > 0 && (
              <span className="bg-white/30 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {advancedActiveCount}
              </span>
            )}
          </button>

          {/* Category pills */}
          {filterConfig.categoryPills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveCategory(pill.id)}
              className={`
                no-min-h rounded-full px-3 border text-[12px] font-bold shrink-0 transition-all
                ${activeCategory === pill.id
                  ? "bg-[#1f1f1f] text-white border-[#1f1f1f]"
                  : "bg-white text-[#444955] border-[#a1a4aa] hover:border-[#777]"
                }
              `}
              style={{ height: '26px' }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Scrollable product area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <AnimatePresence mode="wait">
            {view === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col pb-8"
              >
                {Object.keys(groupedProducts).length > 0 ? (
                  Object.entries(groupedProducts).map(([category, items]) => (
                    <section key={category}>
                      {/* Section header */}
                      <div className="flex items-center justify-between px-4 md:px-9 pt-6 pb-1">
                        <h2 className="text-[16px] font-black text-[#1f1f1f] uppercase tracking-tight">
                          {category}
                        </h2>
                        <a className="text-[12px] font-bold text-[#28ba93] whitespace-nowrap no-min-h">
                          View all ›
                        </a>
                      </div>

                      {/* Mobile: horizontal carousel */}
                      <div
                        className="md:hidden flex gap-3 overflow-x-auto scrollbar-none px-4 pb-4 pt-2"
                        style={{ scrollSnapType: 'x mandatory', scrollPaddingLeft: '1rem' }}
                      >
                        {items.map((item) => (
                          <div
                            key={item.id}
                            style={{ scrollSnapAlign: 'start', flexShrink: 0, width: '160px' }}
                          >
                            <ProductCard product={item} vendor={item.vendor} />
                          </div>
                        ))}
                      </div>

                      {/* Desktop: horizontal scroll */}
                      <div className="hidden md:flex overflow-x-auto gap-3 px-9 pb-4 pt-2 scrollbar-hide">
                        {items.map((item) => (
                          <ProductCard key={item.id} product={item} vendor={item.vendor} />
                        ))}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-[#f7f5ef] flex items-center justify-center mb-4">
                      <img src="/icons/icon_search.svg" className="w-8 h-8 opacity-30" alt="" />
                    </div>
                    <p className="font-bold text-[#444955]" style={{ fontSize: t.text16 }}>
                      No products match your filters
                    </p>
                    <p className="mt-1" style={{ color: COLORS.greyText, fontSize: t.text13 }}>
                      Try adjusting or clearing your filters
                    </p>
                    <button
                      onClick={clearAll}
                      className="mt-4 bg-[#28ba93] text-white font-bold rounded-full px-6 py-2.5"
                      style={{ fontSize: t.text13 }}
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3 px-4 md:px-9 py-4 md:py-8"
              >
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((item) => (
                    <Link key={item.id} href={`/vendors/${item.vendor.id}/products/${item.id}`}>
                      <motion.div
                        className="flex items-center gap-4 p-3 rounded-xl border border-[#e8e8e8] bg-white hover:shadow-md transition-shadow cursor-pointer"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="w-[64px] h-[64px] bg-[#f7f5ef] rounded-lg flex items-center justify-center shrink-0">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-contain mix-blend-multiply p-1"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold" style={{ color: COLORS.medTeal }}>{item.vendor.name}</p>
                          <p className="text-sm font-bold leading-tight truncate" style={{ color: COLORS.darkGreyText }}>{item.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: COLORS.greyText }}>
                            {[item.size, item.casePack != null ? `Case of ${item.casePack}` : null].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold" style={{ color: "#1f1f1f" }}>${item.wholesaleUnitPrice.toFixed(2)}</p>
                          <p className="text-[10px]" style={{ color: COLORS.greyText }}>per unit</p>
                          {item.wholesaleCasePrice != null && (
                            <p className="text-[10px]" style={{ color: COLORS.greyText }}>${item.wholesaleCasePrice.toFixed(2)} / case</p>
                          )}
                        </div>
                        <div className="shrink-0" onClick={e => e.preventDefault()}>
                          <AddToCartButton vendorId={item.vendor.id} productId={item.id} />
                        </div>
                        <div className="text-lg shrink-0" style={{ color: COLORS.border }}>›</div>
                      </motion.div>
                    </Link>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#f7f5ef] flex items-center justify-center mb-4">
                      <img src="/icons/icon_search.svg" className="w-8 h-8 opacity-30" alt="" />
                    </div>
                    <p className="font-bold text-[#444955]" style={{ fontSize: t.text16 }}>
                      No products match your filters
                    </p>
                    <p className="mt-1" style={{ color: COLORS.greyText, fontSize: t.text13 }}>
                      Try adjusting or clearing your filters
                    </p>
                    <button
                      onClick={clearAll}
                      className="mt-4 bg-[#28ba93] text-white font-bold rounded-full px-6 py-2.5"
                      style={{ fontSize: t.text13 }}
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* ── Filter Panel ── */}
      <FilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        activeFilters={advancedFilters}
        priceRange={priceRange}
        onChange={setAdvancedFilters}
        onPriceChange={setPriceRange}
        onClearAll={() => { setAdvancedFilters({}); setPriceRange({ min: 0, max: 50 }); }}
        activeCount={advancedActiveCount}
      />

    </div>
  );
}
