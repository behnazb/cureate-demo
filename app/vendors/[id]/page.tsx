"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { vendors } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
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

// ─── Icons ────────────────────────────────────────────────────────────────────
function LocationIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 1C4.79 1 3 2.79 3 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.21-1.79-4-4-4z" stroke={COLORS.greyText} strokeWidth="1.3"/>
      <circle cx="7" cy="5" r="1.5" stroke={COLORS.greyText} strokeWidth="1.3"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="5.5" stroke={COLORS.greyText} strokeWidth="1.3"/>
      <path d="M7 1.5C7 1.5 5 4 5 7s2 5.5 2 5.5M7 1.5C7 1.5 9 4 9 7s-2 5.5-2 5.5M1.5 7h11" stroke={COLORS.greyText} strokeWidth="1.3"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="12" height="12" rx="3" stroke={COLORS.greyText} strokeWidth="1.3"/>
      <circle cx="8" cy="8" r="2.5" stroke={COLORS.greyText} strokeWidth="1.3"/>
      <circle cx="11.2" cy="4.8" r="0.6" fill={COLORS.greyText}/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 12.5c1.5 0 4-1 5-3 1.5 3 5-1 3.5-3.5C11.5 4 10 3.5 9 4l1-2.5C5 2 3 6 3 6S2.5 4 1 4c1.5 2 1 3.5 0 4.5 1.5 0 2.5-.5 3 0C3 10.5 2 12 2 12.5z" stroke={COLORS.greyText} strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 2.5H10.5V1H9C7.34 1 6 2.34 6 4v1.5H4.5V7H6v7h1.5V7H9l.5-1.5H7.5V4c0-.83.67-1.5 1.5-1.5z" stroke={COLORS.greyText} strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="7" r="5.5" stroke={COLORS.medTeal} strokeWidth="1.3"/>
      <path d="M7 3.5v7M5.5 9.5c0 .83.67 1 1.5 1s1.5-.17 1.5-1-1.5-1-1.5-1-1.5-.17-1.5-1 .67-1 1.5-1 1.5.17 1.5 1" stroke={COLORS.medTeal} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const vendor = vendors.find((v) => v.id === id);
  if (!vendor) notFound();

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}>

      <Sidebar />

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-4xl mx-auto px-12 py-8">

          {/* ── Top Section ── */}
          <div className="flex items-start gap-8">
            {/* Logo */}
            <div
              className="w-[160px] h-[160px] rounded-lg border flex items-center justify-center shrink-0 overflow-hidden"
              style={{ borderColor: COLORS.border }}
            >
              <img
                src={vendor.logo}
                alt={vendor.name}
                className="w-full h-full object-contain p-3"
              />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1 pt-2">
              <span
                className="font-bold uppercase tracking-widest"
                style={{ color: COLORS.medTeal, fontSize: t.text11 }}
              >
                {vendor.location}
              </span>
              <h1 className="font-black uppercase leading-tight" style={{ color: COLORS.darkGreyText, fontSize: t.text36 }}>
                {vendor.name}
              </h1>
              <p className="italic" style={{ color: COLORS.greyText, fontSize: t.text11 }}>
                Owned by: Nancy Becker and Bridget Greaney
              </p>
              <div className="flex items-center gap-3 mt-2">
                <a href="#" aria-label="Instagram" className="opacity-60 hover:opacity-100 transition-opacity">
                  <InstagramIcon />
                </a>
                <a href="#" aria-label="Twitter" className="opacity-60 hover:opacity-100 transition-opacity">
                  <TwitterIcon />
                </a>
                <a href="#" aria-label="Facebook" className="opacity-60 hover:opacity-100 transition-opacity">
                  <FacebookIcon />
                </a>
              </div>
            </div>
          </div>

          {/* ── Two Column Section ── */}
          <div className="mt-8 grid gap-8" style={{ gridTemplateColumns: "280px 1fr" }}>

            {/* ── Left Column ── */}
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
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                    style={{ color: COLORS.medTeal }}
                  >
                    {vendor.website.replace("https://", "")}
                  </a>
                </div>
              </div>

              {/* Business Details */}
              <div className="border rounded-lg p-4 mb-4" style={{ borderColor: "#e8e8e8" }}>
                <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.darkGreyText }}>
                  Business Details
                </h3>
                {[
                  { label: "Business Type", value: vendor.businessType },
                  { label: "Revenue", value: vendor.revenue },
                  { label: "Employees", value: vendor.employees },
                  { label: "Insurance", value: "General Liability Insurance, Workers' Compensation" },
                  { label: "Health Dept. Clearance", value: "Yes" },
                  { label: "Certifications", value: vendor.certifications.join(", ") },
                ].map(({ label, value }) => (
                  <div key={label} className="mb-2">
                    <div className="font-bold uppercase tracking-wide" style={{ color: COLORS.greyText, fontSize: t.text10 }}>
                      {label}
                    </div>
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
                    <span
                      key={cat}
                      className="bg-gray-100 text-xs rounded-full px-3 py-1"
                      style={{ color: COLORS.darkGreyText }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right Column ── */}
            <div>
              {/* About */}
              <h2 className="font-bold mb-2" style={{ color: COLORS.darkGreyText, fontSize: t.text16 }}>The Business</h2>
              <p className="mb-5" style={{ color: COLORS.darkGreyText, fontSize: t.text14 }}>{vendor.about}</p>

              {vendor.story && (
                <>
                  <h2 className="font-bold mb-2" style={{ color: COLORS.darkGreyText, fontSize: t.text16 }}>Our Story</h2>
                  <p className="mb-5" style={{ color: COLORS.darkGreyText, fontSize: t.text14 }}>{vendor.story}</p>
                </>
              )}

              {/* Goals */}
              {vendor.goals && vendor.goals.length > 0 && (
                <>
                  <h2 className="font-bold mb-2" style={{ color: COLORS.darkGreyText, fontSize: t.text16 }}>Goals</h2>
                  <div className="flex gap-4 mb-5">
                    {vendor.goals.map((goal) => (
                      <div key={goal} className="flex flex-col items-center gap-1">
                        <div
                          className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: COLORS.darkGreyText }}
                        >
                          <DollarIcon />
                        </div>
                        <p className="text-xs text-center" style={{ color: COLORS.darkGreyText }}>{goal}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Marketing */}
              <h2 className="font-bold mb-2" style={{ color: COLORS.darkGreyText, fontSize: t.text16 }}>Marketing</h2>
              <div className="mb-2">
                <span className="text-sm font-bold" style={{ color: COLORS.medTeal }}>🏷️ Vendor Spotlights</span>
              </div>
              <p className="text-sm mb-2" style={{ color: COLORS.darkGreyText }}>
                Download promotional materials to feature this vendor in your marketplace or dining communications.
              </p>
              <ul className="flex flex-col gap-1 mb-5">
                {["Small (5x3)", "Medium (4x6)", "Large (8.5x11)", "Digital Flyer", "Monitor Graphic"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm hover:underline" style={{ color: COLORS.medTeal }}>
                      • {item}
                    </a>
                  </li>
                ))}
              </ul>

              {/* Logistics */}
              <h2 className="text-lg font-bold mb-3" style={{ color: COLORS.darkGreyText }}>Logistics & Fulfillment</h2>
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { label: "Delivery & Shipping", value: "Shipping available nationwide" },
                    { label: "Delivery Schedule", value: vendor.deliverySchedule },
                    { label: "Minimum Order Quantity", value: vendor.minOrderQuantity },
                    { label: "Production", value: "Baltimore, MD" },
                    { label: "Seasonal Offerings", value: "Seasonal offerings available" },
                    { label: "Growth Goals", value: "Certified" },
                  ].map(({ label, value }) => (
                    <tr key={label} className="border-b" style={{ borderColor: "#e8e8e8" }}>
                      <td className="py-2 pr-4 font-bold text-xs uppercase tracking-wide w-[180px]" style={{ color: COLORS.greyText }}>
                        {label}
                      </td>
                      <td className="py-2" style={{ color: COLORS.darkGreyText }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Products Section ── */}
          <div className="border-t border-[#e8e8e8] mt-12 mb-8" />

          {/* Section header with flanking lines */}
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-[#e8e8e8]" />
            <span className="font-black tracking-widest text-center px-6" style={{ color: COLORS.darkGreyText, fontSize: t.text20 }}>
              PRODUCTS
            </span>
            <div className="flex-1 border-t border-[#e8e8e8]" />
          </div>

          {/* Product row */}
          <div className="flex overflow-x-auto gap-4 pb-4 mt-6 scrollbar-hide">
            {vendor.products.filter((p) => !(p as { isShippingFee?: boolean }).isShippingFee).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                vendor={{ id: vendor.id, name: vendor.name }}
              />
            ))}
          </div>

          {/* View all link */}
          <div className="text-center mt-4">
            <a
              href={`/products?vendor=${vendor.id}`}
              className="font-bold hover:underline"
              style={{ color: COLORS.darkTeal, fontSize: t.text13 }}
            >
              View all products →
            </a>
          </div>

        </div>
      </main>
    </div>
  );
}
