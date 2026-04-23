"use client";

import React from "react";
import Link from "next/link";
import { vendors } from "@/lib/data";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";

function shortenCert(cert: string) {
  return cert.replace(/\s*Business\s*$/i, "");
}

export default function VendorsPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--font-lato), Arial, sans-serif" }}>

      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header — desktop only (MobileNav handles mobile) */}
        <header className="hidden md:flex items-center justify-between bg-white px-9 py-4 border-b border-[#e8e8e8] shrink-0 sticky top-0 z-10">
          <h1 className="text-[20px] font-bold text-[#1f1f1f] whitespace-nowrap shrink-0">Vendors</h1>
          <div className="h-[38px] flex items-center min-w-[280px] max-w-[340px] ml-6">
            <SearchBar placeholder="Search vendors, locations, or categories" />
          </div>
        </header>

        {/* Vendor list */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="flex flex-col gap-4 px-4 md:px-9 py-5">
            {vendors.map((vendor) => (
              <Link key={vendor.id} href={`/vendors/${vendor.id}`} className="block">
                <article
                  className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden transition-shadow"
                  style={{
                    boxShadow: "2px 2px 10px 0 rgba(156,153,153,0.12)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "2px 2px 16px 0 rgba(156,153,153,0.18)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "2px 2px 10px 0 rgba(156,153,153,0.12)")}
                >
                  {/* ── IDENTITY ZONE ── */}
                  <div className="flex gap-4 p-5 pb-4">

                    {/* Logo */}
                    <div className="w-[72px] h-[72px] rounded-xl bg-white border border-[#f0f0f0] shrink-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={vendor.logo}
                        alt={vendor.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Location eyebrow */}
                      <p className="text-[11px] font-bold text-[#28ba93] uppercase tracking-[0.08em] mb-1">
                        {vendor.location}
                      </p>

                      {/* Vendor name */}
                      <h3 className="text-[20px] font-black text-[#1f1f1f] leading-tight tracking-tight mb-2">
                        {vendor.name}
                      </h3>

                      {/* Metadata — dot-separated, no pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {vendor.categories?.[0] && (
                          <span className="text-[13px] font-medium text-[#666]">
                            {vendor.categories[0]}
                          </span>
                        )}
                        {vendor.certifications?.map((cert) => (
                          <React.Fragment key={cert}>
                            <span className="text-[13px] text-[#ccc]">·</span>
                            <span className="text-[13px] font-medium text-[#666]">
                              {shortenCert(cert)}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── ACTION STRIP ── */}
                  <div className="border-t border-[#f0f0f0] bg-[#fbfaf6] flex items-center justify-between px-5 py-2.5">
                    <span className="text-[12px] text-[#999]">
                      {vendor.products?.length ?? 0} products available
                    </span>
                    <span className="text-[13px] font-bold text-[#035257] inline-flex items-center gap-1">
                      View Profile
                      <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                        <path d="M3 2l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
