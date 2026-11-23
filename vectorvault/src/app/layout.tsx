import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PWARegister from "@/components/PWARegister";
import "./globals.css";
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = {
  title: { default: "VectorVault — Minimalist code hosting for Nigerian devs", template: "%s | VectorVault" },
  description: "A simpler place to host repositories, manage code, collaborate, and showcase your developer work. Built for African developers by Vector Codes.",
  applicationName: "VectorVault",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "VectorVault" },
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    title: "VectorVault — Your code deserves a better home",
    description: "Host your projects, build your developer profile, and connect with the developer community.",
    siteName: "VectorVault",
    type: "website",
  },
};
export const viewport: Viewport = { themeColor: "#090909", colorScheme: "dark", viewportFit: "cover" };
export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" className={geistSans.variable + " " + geistMono.variable + " h-full antialiased"}>
    <body className="min-h-full flex flex-col bg-[#090909] text-white">{children}<PWARegister /></body>
  </html>;
}
