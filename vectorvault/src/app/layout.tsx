import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PWARegister from "@/components/PWARegister";
import ScenicBackdrop from "@/components/ScenicBackdrop";
import "./globals.css";
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = {
  title: { default: "VectorVault — Minimalist code hosting for Nigerian devs", template: "%s | VectorVault" },
  description: "A simpler place to host repositories, manage code, collaborate, and showcase your developer work. Built for African developers by Vector Codes.",
  applicationName: "VectorVault",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "VectorVault" },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }], shortcut: "/icon.svg", apple: "/icon-192.png" },
  openGraph: {
    title: "VectorVault — Your code deserves a better home",
    description: "Host your projects, build your developer profile, and connect with the developer community.",
    siteName: "VectorVault", type: "website",
  },
};
export const viewport: Viewport = { themeColor: "#090909", colorScheme: "dark", viewportFit: "cover" };
export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" className={geistSans.variable + " " + geistMono.variable + " h-full antialiased"}>
    <body className="relative min-h-full bg-[#050505] text-white">{<ScenicBackdrop />}<div className="relative z-10 flex min-h-screen flex-col">{children}</div><PWARegister /></body>
  </html>;
}
