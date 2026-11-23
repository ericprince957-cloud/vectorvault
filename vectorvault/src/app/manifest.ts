import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "VectorVault — Code hosting for African developers",
    short_name: "VectorVault",
    description: "Host your code, organise projects, and build your developer presence with VectorVault.",
    start_url: "/", scope: "/", display: "standalone", orientation: "any",
    background_color: "#090909", theme_color: "#090909",
    categories: ["developer", "productivity", "education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}
