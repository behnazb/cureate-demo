"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { vendors } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import { t } from "@/lib/tokens";
import Sidebar from "@/components/Sidebar";

const COLORS = {
  primaryTeal: "#28ba93",
  darkTeal: "#035257",
  medTeal: "#377b82",
  border: "#a1a4aa",
  beige: "#f7f5ef",
  greyText: "#777",
  darkGreyText: "#444955",
} as const;

function LocationIcon({ color = COLORS.greyText }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1C4.79 1 3 2.79 3 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.21-1.79-4-4-4z" stroke={color} strokeWidth="1.3"/>
      <circle cx="7" cy="5" r="1.5" stroke={color} strokeWidth="1.3"/>
    </svg>
  );
}

function GlobeIcon({ color = COLORS.greyText }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1.3"/>
      <path d="M7 1.5C7 1.5 5 4 5 7s2 5.5 2 5.5M7 1.5C7 1.5 9 4 9 7s-2 5.5-2 5.5M1.5 7h11" stroke={color} strokeWidth="1.3"/>
    </svg>
  );
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="11.2" cy="4.8" r="0.6" fill="currentColor"/>
    </svg>
  );
}

function TwitterIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 12.5c1.5 0 4-1 5-3 1.5 3 5-1 3.5-3.5C11.5 4 10 3.5 9 4l1-2.5C5 2 3 6 3 6S2.5 4 1 4c1.5 2 1 3.5 0 4.5 1.5 0 2.5-.5 3 0C3 10.5 2 12 2 12.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  );
}

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M9 2.5H10.5V1H9C7.34 1 6 2.34 6 4v1.5H4.5V7H6v7h1.5V7H9l.5-1.5H7.5V4c0-.83.67-1.5 1.5-1.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke={COLORS.medTeal} strokeWidth="1.3"/>
      <path d="M7 3.5v7M5.5 9.5c0 .83.67 1 1.5 1s1.5-.17 1.5-1-1.5-1-1.5-1-1.5-.17-1.5-1 .67-1 1.5-1 1.5.17 1.5 1" stroke={COLORS.medTeal} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

export default function VendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const vendor = vendors.find((v) => v.id === id);
  if (!vendor) notFound();

  const products = vendor.products.filter((p) => !(p as { isShippingFee?: boolean }).isShippingFee);

  const businessDetailsRows = [
    { label: "Business Type", value: vendor.businessType },
    { label: "Revenue", value: vendor.revenue },
    { label: "Employees", value: vendor.employees },
    { label: "Insurance", value: "General Liability, Workers' Comp" },
    { label: "Health Dept. Clearance", value: "Yes" },
    { label: "Certifications", value: vendor.certifications.join(", ") || "—" },
    ...(vendor.categories?.length ? [{ label: "Categories", value: vendor.categories.join(", ") }] : []),
    ...(vendor.goals?.length ? [{ label: "Goal", value: vendor.goals[0] }] : []),
  ];

  const logisticsRows = [
    { label: "Delivery & Shipping", value: "Shipping available nationwide" },
    { label: "Delivery Schedule", value: vendor.deliverySchedule },
    { label: "Min. Order Qty", value: vendor.minOrderQuantity },
    { label: "Production", value: "Baltimore, MD" },
    { label: "Seasonal Offerings", value: "Seasonal offerings available" },
    { label: "Growth Goals", value: "Certified" },
  ];

  const marketingAssets = [
    { name: "Small (5x3)",      url: "#" },
    { name: "Medium (4x6)",     url: "#" },
    { name: "Large (8.5x11)",   url: "#" },
    { name: "Digital Flyer",    url: "#" },
    { name: "Monitor Graphic",  url: "#" },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}>

      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-white">

        {/* ══════════════════ MOBILE HERO (md:hidden) ══════════════════ */}
        <div className="md:hidden px-4 pt-6 pb-5 border-b border-[#e8e8e8]">
          {/* Logo centered */}
          <div className="flex justify-center mb-4">
            <div className="w-[100px] h-[100px] rounded-xl border border-[#e8e8e8] overflow-hidden bg-white flex items-center justify-center">
              <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-contain p-2"/>
            </div>
          </div>
          {/* Location */}
          <p className="text-[12px] font-bold text-[#28ba93] uppercase tracking-wide text-center mb-1">
            {vendor.location}
          </p>
          {/* Name */}
          <h1 className="text-[28px] font-black text-[#1f1f1f] text-center uppercase tracking-tight leading-tight mb-2">
            {vendor.name}
          </h1>
          {/* Owned by */}
          <p className="text-[13px] text-[#666] italic text-center mb-4">
            Owned by: Nancy Becker and Bridget Greaney
          </p>
          {/* Social icons */}
          <div className="flex justify-center gap-3">
            {[
              { label: "Instagram", icon: <InstagramIcon size={18} /> },
              { label: "Twitter",   icon: <TwitterIcon size={18} /> },
              { label: "Facebook",  icon: <FacebookIcon size={18} /> },
            ].map(({ label, icon }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="w-10 h-10 rounded-full bg-[#f7f5ef] flex items-center justify-center text-[#777] hover:bg-[#e8e8e8] transition-colors"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* ══════════════════ DESKTOP HERO (hidden md:flex) ══════════════════ */}
        <div className="hidden md:block max-w-4xl mx-auto px-12 pt-8">
          <div className="flex items-start gap-8">
            <div
              className="w-[160px] h-[160px] rounded-lg border flex items-center justify-center shrink-0 overflow-hidden"
              style={{ borderColor: COLORS.border }}
            >
              <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-contain p-3"/>
            </div>
            <div className="flex flex-col gap-1 pt-2">
              <span className="font-bold uppercase tracking-widest" style={{ color: COLORS.medTeal, fontSize: t.text11 }}>
                {vendor.location}
              </span>
              <h1 className="font-black uppercase leading-tight" style={{ color: COLORS.darkGreyText, fontSize: t.text36 }}>
                {vendor.name}
              </h1>
              <p className="italic" style={{ color: COLORS.greyText, fontSize: t.text11 }}>
                Owned by: Nancy Becker and Bridget Greaney
              </p>
              <div className="flex items-center gap-3 mt-2">
                {[
                  { label: "Instagram", icon: <InstagramIcon /> },
                  { label: "Twitter",   icon: <TwitterIcon /> },
                  { label: "Facebook",  icon: <FacebookIcon /> },
                ].map(({ label, icon }) => (
                  <a key={label} href="#" aria-label={label} className="opacity-60 hover:opacity-100 transition-opacity text-[#777]">
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════ DESKTOP CONTENT (hidden md:block) ══════════════════ */}
        <div className="hidden md:block max-w-4xl mx-auto px-12 py-8">
          <div className="mt-8 grid gap-8" style={{ gridTemplateColumns: "280px 1fr" }}>

            {/* Left Column */}
            <div>
              {/* Contact & Location */}
              <div className="border rounded-lg p-4 mb-4" style={{ borderColor: "#e8e8e8" }}>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.darkGreyText }}>
                  Contact & Location
                </h3>
                <div className="flex items-start gap-2 mb-2">
                  <span className="mt-0.5 shrink-0"><LocationIcon /></span>
                  <span className="text-sm" style={{ color: COLORS.darkGreyText }}>{vendor.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GlobeIcon />
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer"
                    className="text-sm hover:underline" style={{ color: COLORS.medTeal }}>
                    {vendor.website.replace("https://", "")}
                  </a>
                </div>
              </div>

              {/* Business Details */}
              <div className="border rounded-lg p-4 mb-4" style={{ borderColor: "#e8e8e8" }}>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.darkGreyText }}>
                  Business Details
                </h3>
                {businessDetailsRows.map(({ label, value }) => (
                  <div key={label} className="mb-2">
                    <div className="font-bold uppercase tracking-wide" style={{ color: COLORS.greyText, fontSize: t.text10 }}>{label}</div>
                    <div style={{ color: COLORS.darkGreyText, fontSize: t.text13 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Categories */}
              <div className="border rounded-lg p-4" style={{ borderColor: "#e8e8e8" }}>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.darkGreyText }}>
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {vendor.categories.map((cat) => (
                    <span key={cat} className="bg-gray-100 text-xs rounded-full px-3 py-1" style={{ color: COLORS.darkGreyText }}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <h2 className="font-bold mb-2" style={{ color: COLORS.darkGreyText, fontSize: t.text16 }}>The Business</h2>
              <p className="mb-5" style={{ color: COLORS.darkGreyText, fontSize: t.text14 }}>{vendor.about}</p>

              {vendor.story && (
                <>
                  <h2 className="font-bold mb-2" style={{ color: COLORS.darkGreyText, fontSize: t.text16 }}>Our Story</h2>
                  <p className="mb-5" style={{ color: COLORS.darkGreyText, fontSize: t.text14 }}>{vendor.story}</p>
                </>
              )}

              {vendor.goals && vendor.goals.length > 0 && (
                <>
                  <h2 className="font-bold mb-2" style={{ color: COLORS.darkGreyText, fontSize: t.text16 }}>Goals</h2>
                  <div className="flex gap-4 mb-5">
                    {vendor.goals.map((goal) => (
                      <div key={goal} className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ borderColor: COLORS.darkGreyText }}>
                          <DollarIcon />
                        </div>
                        <p className="text-xs text-center" style={{ color: COLORS.darkGreyText }}>{goal}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h2 className="font-bold mb-2" style={{ color: COLORS.darkGreyText, fontSize: t.text16 }}>Vendor Resources</h2>
              <p className="text-sm mb-3" style={{ color: COLORS.darkGreyText }}>
                Download promotional materials to feature this vendor in your marketplace or dining communications.
              </p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {marketingAssets.map((asset) => (
                  <a
                    key={asset.name}
                    href={asset.url}
                    className="flex items-center gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:bg-[#f7f5ef] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[#28ba93]">
                      <path d="M8 2v9m0 0l-3-3m3 3l3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[12px] font-bold text-[#1f1f1f] truncate">{asset.name}</span>
                  </a>
                ))}
              </div>

              <h2 className="text-lg font-bold mb-3" style={{ color: COLORS.darkGreyText }}>Logistics & Fulfillment</h2>
              <table className="w-full text-sm">
                <tbody>
                  {logisticsRows.map(({ label, value }) => (
                    <tr key={label} className="border-b" style={{ borderColor: "#e8e8e8" }}>
                      <td className="py-2 pr-4 font-bold text-xs uppercase tracking-wide w-[180px]" style={{ color: COLORS.greyText }}>{label}</td>
                      <td className="py-2" style={{ color: COLORS.darkGreyText }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ══════════════════ MOBILE CONTENT (md:hidden) ══════════════════ */}
        <div className="md:hidden">

          {/* 1. The Business */}
          <section className="px-4 py-5 border-b border-[#e8e8e8]">
            <h2 className="text-[18px] font-bold text-[#1f1f1f] mb-3">The Business</h2>
            <p className="text-[15px] leading-[1.6]" style={{ color: COLORS.darkGreyText }}>{vendor.about}</p>
          </section>

          {/* 2. Contact & Location */}
          <section className="px-4 py-5 border-b border-[#e8e8e8]">
            <h3 className="text-[13px] font-bold text-[#666] uppercase tracking-wide mb-3">Contact & Location</h3>
            <div className="flex items-start gap-3 mb-2">
              <span className="mt-1 shrink-0 text-[#999]"><LocationIcon color="#999" /></span>
              <p className="text-[14px] text-[#1f1f1f] leading-snug">{vendor.address}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-[#999]"><GlobeIcon color="#999" /></span>
              <a href={vendor.website} target="_blank" rel="noopener noreferrer"
                className="text-[14px] font-bold text-[#28ba93]">
                {vendor.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </section>

          {/* 3. Our Story */}
          {vendor.story && (
            <section className="px-4 py-5 border-b border-[#e8e8e8]">
              <h2 className="text-[18px] font-bold text-[#1f1f1f] mb-3">Our Story</h2>
              <p className="text-[15px] leading-[1.6]" style={{ color: COLORS.darkGreyText }}>{vendor.story}</p>
            </section>
          )}

          {/* 4. Business Details */}
          <div className="mx-4 my-5">
            <div className="p-4 bg-[#f7f5ef] rounded-xl space-y-3">
              <h3 className="text-[11px] font-bold text-[#999] uppercase tracking-wide">Business Details</h3>
              {businessDetailsRows.map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[11px] font-bold text-[#999] uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-[14px] text-[#1f1f1f]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 5+6. Categories & Goals folded into Business Details above */}

          {/* 7. Vendor Resources */}
          <section className="px-4 py-5 border-b border-[#e8e8e8]">
            <h2 className="text-[18px] font-bold text-[#1f1f1f] mb-2">Vendor Resources</h2>
            <p className="text-[14px] text-[#666] leading-relaxed mb-4">
              Download promotional materials to feature this vendor in your marketplace or dining communications.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {marketingAssets.map((asset) => (
                <a
                  key={asset.name}
                  href={asset.url}
                  className="flex items-center gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:bg-[#f7f5ef] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[#28ba93]">
                    <path d="M8 2v9m0 0l-3-3m3 3l3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[13px] font-bold text-[#1f1f1f] truncate">{asset.name}</span>
                </a>
              ))}
            </div>
          </section>

          {/* 8. Logistics & Fulfillment */}
          <div className="mx-4 my-5">
            <div className="p-4 bg-white border border-[#e8e8e8] rounded-xl">
              <h3 className="text-[18px] font-bold text-[#1f1f1f] mb-4">Logistics & Fulfillment</h3>
              {logisticsRows.map(({ label, value }, i) => (
                <div
                  key={label}
                  className={`flex justify-between items-start gap-4 py-3 ${i < logisticsRows.length - 1 ? "border-b border-[#f0f0f0]" : ""}`}
                >
                  <p className="text-[12px] font-bold uppercase tracking-wide shrink-0 w-[38%]" style={{ color: COLORS.greyText }}>{label}</p>
                  <p className="text-[14px] text-[#1f1f1f] text-right flex-1">{value}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ══════════════════ PRODUCTS (shared, responsive) ══════════════════ */}
        <section className="border-t border-[#e8e8e8] mt-4 md:mt-0 pb-8">
          <div className="flex items-center justify-between px-4 md:px-12 pt-6 pb-3 md:max-w-4xl md:mx-auto">
            <h2 className="text-[18px] md:text-[20px] font-black text-[#1f1f1f] uppercase tracking-tight">Products</h2>
            <Link href={`/vendors/${vendor.id}/products`} className="text-[12px] font-bold text-[#28ba93] no-min-h">
              View all →
            </Link>
          </div>

          {/* Mobile: horizontal scroll carousel */}
          <div className="md:hidden flex gap-3 overflow-x-auto scrollbar-none px-4 pb-2 snap-x snap-mandatory">
            {products.map((product) => (
              <div key={product.id} className="shrink-0 w-[160px] snap-start">
                <ProductCard product={product} vendor={{ id: vendor.id, name: vendor.name }} />
              </div>
            ))}
          </div>

          {/* Desktop: horizontal flex scroll */}
          <div className="hidden md:flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-12 max-w-4xl mx-auto">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} vendor={{ id: vendor.id, name: vendor.name }} />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
