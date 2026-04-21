"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { vendors } from "@/lib/data";
import { useCart } from "@/lib/cartContext";
import ViewCartButton from "@/components/ViewCartButton";
import { t } from "@/lib/tokens";
import Sidebar from "@/components/Sidebar";

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

const DIETARY_ABBR: Record<string, string> = {
  "Paleo": "P",
  "Low-Fat": "LF",
  "Low-Carb": "LC",
  "Low-Sugar": "LSU",
  "Low-Sodium": "LSO",
  "Vegan": "V",
  "Vegetarian": "VG",
  "Gluten-Free": "GF",
  "Dairy-Free": "DF",
  "Keto": "K",
  "High-Protein": "HP",
  "Organic / Naturally Grown": "ON",
  "Keto-Friendly": "KF",
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string; productId: string }>;
}) {
  const { id, productId } = use(params);
  const vendor = vendors.find((v) => v.id === id);
  if (!vendor) notFound();
  const product = vendor.products.find((p) => p.id === productId);
  if (!product) notFound();

  const orderRules = vendor.orderRules;
  const unitsPerCase = orderRules.unitsPerCase;
  const minUnits = orderRules.minUnits;

  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState<"Units" | "Cases">("Units");
  const [showToast, setShowToast] = useState(false);
  const [toastTimeout, setToastTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const totalUnits = unit === "Cases" ? qty * unitsPerCase : qty;
  const totalPrice = totalUnits * product.wholesaleUnitPrice;
  const progressPct = Math.min((totalUnits / minUnits) * 100, 100);
  const minMet = totalUnits >= minUnits;

  function decrement() {
    setQty((q) => Math.max(1, q - 1));
  }
  function increment() {
    setQty((q) => q + 1);
  }
  function handleAddToOrder() {
    if (!minMet) return;
    addItem(vendor!.id, product!.id, qty, unit === "Units" ? "units" : "cases");
    setShowToast(true);
    if (toastTimeout) clearTimeout(toastTimeout);
    const t = setTimeout(() => setShowToast(false), 2000);
    setToastTimeout(t);
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}>

      <Sidebar />

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto bg-white">

        {/* Breadcrumb + cart */}
        <div className="px-12 pt-6 pb-2 flex items-center justify-between">
          <span style={{ color: COLORS.greyText, fontSize: t.text11 }}>
            <a href="/products" className="hover:underline" style={{ color: COLORS.medTeal }}>All Products</a>
            <span className="mx-1">/</span>
            <a href="#" className="hover:underline" style={{ color: COLORS.medTeal }}>Snacks</a>
            <span className="mx-1">/</span>
            <a href="#" className="hover:underline" style={{ color: COLORS.medTeal }}>Nutrition &amp; Granola Bars</a>
          </span>
          <ViewCartButton />
        </div>

        {/* Main grid */}
        <div className="grid gap-16 px-12 py-8 max-w-6xl" style={{ gridTemplateColumns: "380px 1fr" }}>

          {/* ── Left Column ── */}
          <div>
            <div
              className="w-full rounded-xl flex items-center justify-center p-8"
              style={{ height: t.h320, backgroundColor: COLORS.beige }}
            >
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              )}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <img
                src={vendor.logo}
                alt={vendor.name}
                className="w-[48px] h-[48px] rounded-full object-contain border"
                style={{ borderColor: "#e8e8e8" }}
              />
              <div>
                <p className="font-bold text-sm" style={{ color: COLORS.darkGreyText }}>{vendor.name}</p>
                <p style={{ color: COLORS.greyText, fontSize: t.text11 }}>{vendor.location}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {vendor.certifications.map((cert) => (
                <span
                  key={cert}
                  className="inline-block border text-xs rounded-full px-3 py-1"
                  style={{ borderColor: COLORS.medTeal, color: COLORS.medTeal }}
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right Column ── */}
          <div>
            <h1 className="font-bold mb-2" style={{ color: "#1f1f1f", fontSize: t.text28 }}>{product.name}</h1>
            <p className="mb-4" style={{ color: COLORS.greyText, fontSize: t.text12 }}>
              ID: #{product.id}&nbsp;&nbsp;|&nbsp;&nbsp;UPC: {product.upc}
            </p>

            <div className="border-t border-dashed border-[#e8e8e8] my-4" />

            {/* Product Details */}
            <p className="font-bold uppercase tracking-widest mb-3" style={{ color: COLORS.greyText, fontSize: t.text10 }}>
              Product Details
            </p>
            <div className="grid grid-cols-3 gap-y-4 gap-x-6 mb-4">
              {[
                { label: "Size", value: product.size },
                { label: "Wholesale Unit Price", value: `$${product.wholesaleUnitPrice.toFixed(2)}` },
                { label: "MSRP", value: product.msrp != null ? `$${product.msrp.toFixed(2)}` : "—" },
                { label: "Case Pack", value: product.casePack != null ? String(product.casePack) : "—" },
                { label: "Wholesale Case Price", value: product.wholesaleCasePrice != null ? `$${product.wholesaleCasePrice.toFixed(2)}` : "—" },
                { label: "Case Minimum", value: product.caseMinimum != null ? String(product.caseMinimum) : "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="uppercase tracking-wide mb-1" style={{ color: COLORS.greyText, fontSize: t.text10 }}>{label}</p>
                  <p className="font-bold" style={{ color: COLORS.darkGreyText, fontSize: t.text13 }}>{value}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-[#e8e8e8] my-4" />

            {/* Storage */}
            <p className="font-bold uppercase tracking-widest mb-2" style={{ color: COLORS.greyText, fontSize: t.text10 }}>
              Storage &amp; Shelf Life
            </p>
            <div className="flex flex-col gap-0.5">
              {(product.storage ?? "").split(",").map((s) => s.trim()).filter(Boolean).map((line) => (
                <p key={line} style={{ color: COLORS.darkGreyText, fontSize: t.text13 }}>• {line}</p>
              ))}
            </div>

            <div className="border-t border-dashed border-[#e8e8e8] my-4" />

            {/* Allergens */}
            <p className="font-bold uppercase tracking-widest mb-2" style={{ color: COLORS.greyText, fontSize: t.text10 }}>
              Allergen-Friendly
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
              {product.allergens.map((allergen) => (
                <div key={allergen} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS.primaryTeal }} />
                  <span style={{ color: COLORS.darkGreyText, fontSize: t.text13 }}>{allergen}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-[#e8e8e8] my-4" />

            {/* Dietary */}
            <p className="font-bold uppercase tracking-widest mb-2" style={{ color: COLORS.greyText, fontSize: t.text10 }}>
              Dietary Preferences
            </p>
            <div className="flex gap-4 mt-2 flex-wrap">
              {product.dietary.map((pref) => (
                <div key={pref} className="flex flex-col items-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: COLORS.darkTeal }}
                  >
                    {DIETARY_ABBR[pref] ?? pref.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-center mt-1" style={{ color: COLORS.darkGreyText, fontSize: t.text11 }}>{pref}</span>
                </div>
              ))}
            </div>

            {/* ── Order Section ── */}
            <div className="mt-8">

              {/* Minimum order notice */}
              <div
                className="flex gap-3 rounded-xl p-4 mb-6 border"
                style={{ backgroundColor: COLORS.beige, borderColor: "#e8e8e8" }}
              >
                <span className="text-lg leading-none shrink-0" style={{ color: COLORS.primaryTeal }}>ⓘ</span>
                <div>
                  <p className="font-bold mb-0.5" style={{ color: COLORS.darkGreyText, fontSize: t.text13 }}>
                    Minimum order: {orderRules.minCases} cases ({orderRules.minUnits} units) across any 2Betties flavors
                  </p>
                  <p style={{ color: COLORS.greyText, fontSize: t.text11 }}>
                    {orderRules.mixAndMatchNote}
                  </p>
                </div>
              </div>

              {/* Quantity selector row */}
              <div className="flex items-center gap-4 mb-4">
                <span className="font-bold uppercase mr-2" style={{ color: COLORS.greyText, fontSize: t.text11 }}>QTY</span>

                {/* Stepper */}
                <div className="flex items-center border rounded-full overflow-hidden" style={{ borderColor: COLORS.border }}>
                  <button
                    onClick={decrement}
                    className="w-9 h-9 flex items-center justify-center text-lg font-bold transition-colors hover:bg-[#f7f5ef]"
                    style={{ color: COLORS.darkGreyText }}
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-bold" style={{ color: COLORS.darkGreyText, fontSize: t.text13 }}>
                    {qty}
                  </span>
                  <button
                    onClick={increment}
                    className="w-9 h-9 flex items-center justify-center text-lg font-bold transition-colors hover:bg-[#f7f5ef]"
                    style={{ color: COLORS.darkGreyText }}
                  >
                    +
                  </button>
                </div>

                {/* Unit toggle */}
                <div className="flex gap-2 ml-1">
                  {(["Units", "Cases"] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => { setUnit(u); setQty(1); }}
                      className="rounded-full px-4 py-2 cursor-pointer transition-colors"
                      style={{
                        fontSize: t.text11,
                        ...(unit === u
                          ? { backgroundColor: COLORS.darkTeal, color: "#fff" }
                          : { border: `1px solid ${COLORS.border}`, color: COLORS.darkGreyText, backgroundColor: "transparent" })
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>

                {/* Live price */}
                <div className="ml-auto text-right">
                  <p className="text-lg font-bold leading-tight" style={{ color: "#1f1f1f" }}>
                    ${totalPrice.toFixed(2)}
                  </p>
                  <p style={{ color: COLORS.greyText, fontSize: t.text11 }}>
                    {totalUnits} unit{totalUnits !== 1 ? "s" : ""} × ${product.wholesaleUnitPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: COLORS.greyText }}>Order progress</span>
                  <span style={{ color: minMet ? COLORS.primaryTeal : COLORS.greyText, fontWeight: minMet ? 700 : 400 }}>
                    {totalUnits} / {minUnits} units min
                    {minMet && " ✓"}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#e8e8e8" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: minMet ? COLORS.primaryTeal : COLORS.medTeal }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                {!minMet && (
                  <p className="mt-1.5" style={{ color: COLORS.greyText, fontSize: t.text11 }}>
                    Add {minUnits - totalUnits} more unit{minUnits - totalUnits !== 1 ? "s" : ""} to meet the minimum
                  </p>
                )}
              </div>

              {/* Add to Order button */}
              <motion.button
                onClick={handleAddToOrder}
                whileHover={minMet ? { scale: 1.02 } : {}}
                whileTap={minMet ? { scale: 0.98 } : {}}
                className="w-full text-white rounded-full py-4 font-bold flex items-center justify-center gap-2 transition-opacity"
              style={{
                fontSize: t.text13,
                backgroundColor: minMet ? COLORS.primaryTeal : "#c0c0c0",
                cursor: minMet ? "pointer" : "not-allowed",
              }}
              >
                ＋ Add to Order
              </motion.button>
              {!minMet && (
                <p className="text-center mt-2" style={{ color: COLORS.greyText, fontSize: t.text11 }}>
                  Meet the minimum order to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Toast ── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            key="toast"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 text-white text-sm px-6 py-3 rounded-full shadow-lg z-50 whitespace-nowrap"
            style={{ backgroundColor: COLORS.primaryTeal }}
          >
            Added to order ✓
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
