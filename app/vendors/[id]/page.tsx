"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { vendors } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
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

function getFullUrl(website: string): string {
  const clean = website.replace(/^https?:\/\//, "").replace(/^www\./, "");
  return `https://${clean}`;
}
function getDisplayUrl(website: string): string {
  return website.replace(/^https?:\/\//, "").replace(/^www\./, "");
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
      <path d="M2 2.5h4l2.5 3.5L11 2.5h1.5L9 7l4.5 6.5H9.5L7 10 4.5 13.5H3L6.5 8.5 2 2.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round"/>
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

export default function VendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const vendor = vendors.find((v) => v.id === id);
  if (!vendor) notFound();

  const products = vendor.products.filter((p) => !(p as { isShippingFee?: boolean }).isShippingFee);

  const businessDetailsRows = [
    { label: "Business Type",          value: vendor.businessType },
    { label: "Revenue",                value: vendor.revenue },
    { label: "Employees",              value: vendor.employees },
    { label: "Insurance",              value: "General Liability, Workers' Comp" },
    { label: "Health Dept. Clearance", value: "Yes" },
    { label: "Certifications",         value: vendor.certifications.join(", ") || "—" },
    ...(vendor.categories?.length ? [{ label: "Categories", value: vendor.categories.join(", ") }] : []),
    ...(vendor.goals?.length      ? [{ label: "Goal",       value: vendor.goals[0] }]              : []),
  ];

  const logisticsRows = [
    { label: "Delivery & Shipping", value: "Shipping available nationwide" },
    { label: "Delivery Schedule",   value: vendor.deliverySchedule },
    { label: "Min. Order Qty",      value: vendor.minOrderQuantity },
    { label: "Production",          value: "Baltimore, MD" },
    { label: "Seasonal Offerings",  value: "Seasonal offerings available" },
    { label: "Growth Goals",        value: "Certified" },
  ];

  const marketingAssets = [
    { name: "Small (5x3)",     url: "#" },
    { name: "Medium (4x6)",    url: "#" },
    { name: "Large (8.5x11)",  url: "#" },
    { name: "Digital Flyer",   url: "#" },
    { name: "Monitor Graphic", url: "#" },
  ];

  const socials = [
    { label: "Instagram", icon: <InstagramIcon size={16} /> },
    { label: "Twitter",   icon: <TwitterIcon   size={16} /> },
    { label: "Facebook",  icon: <FacebookIcon  size={16} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}>

      <Sidebar />

      {/* ── Single scroll container ── */}
      <div className="flex-1 overflow-y-auto bg-white">

        {/* Breadcrumb — full-width bar, content inside shared container */}
        <div className="border-b border-[#e8e8e8]">
          <nav aria-label="Breadcrumb" className="max-w-4xl mx-auto px-4 md:px-9 py-3">
            <ol className="flex items-center gap-2 text-[13px]">
              <li>
                <Link href="/vendors" className="text-[#28ba93] font-bold hover:underline flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Vendors
                </Link>
              </li>
              <li className="text-[#ccc]">/</li>
              <li className="text-[#1f1f1f] font-bold truncate">{vendor.name}</li>
            </ol>
          </nav>
        </div>

        {/* ── All content in one shared max-width container ── */}
        <main className="max-w-4xl mx-auto px-4 md:px-9">

          {/* Hero */}
          <div className="pt-6 pb-6 border-b border-[#e8e8e8]">
            <div className="flex items-start gap-4 md:gap-8">
              <div className="w-[80px] h-[80px] md:w-[120px] md:h-[120px] rounded-xl border border-[#e8e8e8] overflow-hidden bg-white flex items-center justify-center shrink-0">
                <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-contain p-2"/>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="text-[11px] md:text-[12px] font-bold text-[#28ba93] uppercase tracking-[0.08em] mb-1">
                  {vendor.location}
                </p>
                <h1 className="text-[26px] md:text-[34px] font-black text-[#1f1f1f] uppercase tracking-tight leading-tight mb-1">
                  {vendor.name}
                </h1>
                {vendor.owned && (
                  <p className="text-[13px] md:text-[14px] text-[#666] italic mb-3">
                    {vendor.owned}
                  </p>
                )}
                <div className="flex gap-2">
                  {socials.map(({ label, icon }) => (
                    <a key={label} href="#" aria-label={label}
                      className="w-9 h-9 rounded-full bg-[#f7f5ef] flex items-center justify-center text-[#777] hover:bg-[#e8e8e8] transition-colors">
                      {icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* The Business */}
          <section className="py-5 border-b border-[#e8e8e8]">
            <h2 className="text-[18px] font-bold text-[#1f1f1f] mb-3">The Business</h2>
            <p className="text-[15px] leading-[1.6]" style={{ color: COLORS.darkGreyText }}>{vendor.about}</p>
          </section>

          {/* Contact & Location */}
          <section className="py-5 border-b border-[#e8e8e8]">
            <h3 className="text-[13px] font-bold text-[#666] uppercase tracking-wide mb-4">Contact & Location</h3>
            {/* Address */}
            <div className="flex items-start gap-3 mb-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#999] shrink-0" style={{ display: "block", marginTop: "2px" }}>
                <path d="M8 1.5a5 5 0 00-5 5c0 3.5 5 8 5 8s5-4.5 5-8a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.25"/>
                <circle cx="8" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.25"/>
              </svg>
              <p className="text-[14px] text-[#1f1f1f] leading-snug">{vendor.address}</p>
            </div>
            {/* Website — flex with matching line-height fixes vertical alignment */}
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#999] shrink-0" style={{ display: "block" }}>
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.25"/>
                <path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" stroke="currentColor" strokeWidth="1.25"/>
              </svg>
              <a href={getFullUrl(vendor.website)} target="_blank" rel="noopener noreferrer"
                className="text-[14px] text-[#28ba93] font-bold" style={{ lineHeight: "16px" }}>
                {getDisplayUrl(vendor.website)}
              </a>
            </div>
          </section>

          {/* Our Story */}
          {vendor.story && (
            <section className="py-5 border-b border-[#e8e8e8]">
              <h2 className="text-[18px] font-bold text-[#1f1f1f] mb-3">Our Story</h2>
              <p className="text-[15px] leading-[1.6]" style={{ color: COLORS.darkGreyText }}>{vendor.story}</p>
            </section>
          )}

          {/* Business Details — 1-col mobile, 2-col desktop */}
          <section className="py-5 border-b border-[#e8e8e8]">
            <h3 className="text-[13px] font-bold text-[#666] uppercase tracking-wide mb-4">Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {businessDetailsRows.filter(r => r.value).map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[11px] font-bold text-[#999] uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-[14px] text-[#1f1f1f]">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Vendor Resources */}
          <section className="py-5 border-b border-[#e8e8e8]">
            <h2 className="text-[18px] font-bold text-[#1f1f1f] mb-2">Vendor Resources</h2>
            <p className="text-[14px] text-[#666] leading-relaxed mb-4">
              Download promotional materials to feature this vendor in your marketplace or dining communications.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {marketingAssets.map((asset) => (
                <a key={asset.name} href={asset.url}
                  className="flex items-center gap-2 p-3 bg-white border border-[#e8e8e8] rounded-lg hover:bg-[#f7f5ef] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[#28ba93]">
                    <path d="M8 2v9m0 0l-3-3m3 3l3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[13px] font-bold text-[#1f1f1f] truncate">{asset.name}</span>
                </a>
              ))}
            </div>
          </section>

          {/* Logistics & Fulfillment */}
          <section className="py-5 border-b border-[#e8e8e8]">
            <h2 className="text-[18px] font-bold text-[#1f1f1f] mb-4">Logistics & Fulfillment</h2>
            {logisticsRows.map(({ label, value }, i) => (
              <div key={label}
                className={`flex justify-between items-start gap-4 py-3 ${i < logisticsRows.length - 1 ? "border-b border-[#f0f0f0]" : ""}`}>
                <p className="text-[12px] font-bold uppercase tracking-wide shrink-0 w-[38%]" style={{ color: COLORS.greyText }}>{label}</p>
                <p className="text-[14px] text-[#1f1f1f] text-right flex-1">{value}</p>
              </div>
            ))}
          </section>

          {/* Products */}
          <section className="pt-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] md:text-[20px] font-black text-[#1f1f1f] uppercase tracking-tight">Products</h2>
              <Link href={`/products?vendor=${vendor.id}`} className="text-[14px] font-bold text-[#28ba93] no-min-h hover:underline">
                View all →
              </Link>
            </div>
            {/* Carousel — bleeds right on mobile (-mr-4 pr-4), contained on desktop */}
            <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-none pb-2 snap-x snap-mandatory -mr-4 md:mr-0 pr-4 md:pr-0">
              {products.map((product) => (
                <div key={product.id} className="shrink-0 w-[160px] md:w-[200px] snap-start">
                  <ProductCard product={product} vendor={{ id: vendor.id, name: vendor.name }} />
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
