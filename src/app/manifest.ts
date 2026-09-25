import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NMIET One",
    short_name: "NMIET One",
    description: "One profile. Every event. One campus.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#f3f2ee",
    theme_color: "#121316",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
