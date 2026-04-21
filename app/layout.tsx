import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { CartProvider } from "@/lib/cartContext";
import CartDrawer from "@/components/CartDrawer";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

const lato = Lato({
  weight: ["300", "400", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "Cureate Connect",
  description: "B2B Food Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${lato.variable} h-full overflow-x-hidden`}>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <head>
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
      </head>
      <body className="h-full font-[var(--font-lato)] overflow-x-hidden flex flex-col">
        <CartProvider>
          <MobileNav />
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {children}
          </div>
          <CartDrawer />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
