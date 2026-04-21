"use client";

import { vendors } from "@/lib/data";
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

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="5.5" cy="5.5" r="4" stroke="#a1a4aa" strokeWidth="1.5" />
      <path d="M9 9l2.5 2.5" stroke="#a1a4aa" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function VendorsPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}>

      <Sidebar />

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-white px-9 py-3 flex items-center justify-between border-b border-gray-200 shrink-0">
          <h1 className="text-xl font-bold" style={{ color: COLORS.darkGreyText }}>Vendors</h1>
          <div className="relative flex items-center">
            <span className="absolute left-3 pointer-events-none"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search vendors"
              className="rounded-full border text-xs w-56 pl-8 pr-3 py-1 outline-none focus:border-[#28ba93]"
              style={{ borderColor: COLORS.border, color: COLORS.darkGreyText }}
            />
          </div>
        </header>

        {/* Vendor grid */}
        <div className="flex-1 overflow-y-auto bg-white px-9 py-8">
          <div className="grid grid-cols-1 gap-4 max-w-3xl" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {vendors.map((vendor) => (
              <a
                key={vendor.id}
                href={`/vendors/${vendor.id}`}
                className="flex gap-4 p-4 rounded-xl border hover:shadow-md transition-shadow"
                style={{ borderColor: "#e8e8e8" }}
              >
                {/* Logo */}
                <div
                  className="w-16 h-16 rounded-full border shrink-0 overflow-hidden flex items-center justify-center"
                  style={{ borderColor: "#e8e8e8", backgroundColor: COLORS.beige }}
                >
                  <img
                    src={vendor.logo}
                    alt={vendor.name}
                    className="w-full h-full object-cover mix-blend-multiply"
                  />
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <p className="font-bold" style={{ color: COLORS.darkGreyText, fontSize: t.text16 }}>{vendor.name}</p>
                  <p style={{ color: COLORS.greyText, fontSize: t.text13 }}>{vendor.location}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {vendor.categories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full px-3 py-1.5 bg-gray-100"
                        style={{ color: COLORS.darkGreyText, fontSize: t.text11 }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                  {vendor.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {vendor.certifications.map((cert) => (
                        <span
                          key={cert}
                          className="text-[10px] border rounded-full px-2 py-0.5"
                          style={{ borderColor: COLORS.medTeal, color: COLORS.medTeal }}
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="font-bold mt-1" style={{ color: COLORS.darkTeal, fontSize: t.text13 }}>
                    View Profile →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
