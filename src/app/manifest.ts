import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rift Forge",
    short_name: "Rift Forge",
    description: "Deck builder for the Riftbound trading card game",
    start_url: "/",
    display: "standalone",
    background_color: "#12151d",
    theme_color: "#2f5bd8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
