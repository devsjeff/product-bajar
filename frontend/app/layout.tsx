import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { BottomNav } from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: { default: "ProductBajar", template: "%s | ProductBajar" },
  description: "Discover offline stores near you — search products, find deals, navigate to stores.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b82f6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <main className="min-h-screen pb-20 bg-background">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
