"use client";

import { createTheme, MantineColorsTuple } from "@mantine/core";

const snipitBlue: MantineColorsTuple = [
  "#eef0ff",
  "#dce0ff",
  "#b5bbff",
  "#8b93ff",
  "#6871ff",
  "#525cff",
  "#4550ff",
  "#3641e4",
  "#2d39cc",
  "#202fb4",
];

export const theme = createTheme({
  primaryColor: "snipitBlue",
  colors: {
    snipitBlue,
  },
  fontFamily: '"SUIT Variable", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
  headings: {
    fontFamily: '"SUIT Variable", "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  defaultRadius: "md",
  other: {
    // Semantic color tokens
    textPrimary: "#1a1a2e",
    textSecondary: "#6b7280",
    textTertiary: "#9ca3af",
    surfacePrimary: "#ffffff",
    surfaceSecondary: "#f8f9fc",
    surfaceTertiary: "#f1f3f9",
    borderDefault: "#e5e7eb",
    borderEmphasis: "#d1d5db",
    // Platform colors
    cardInstagramBorder: "rgba(162, 49, 193, 0.29)",
    cardMetaBorder: "rgba(0, 114, 235, 0.3)",
    cardYoutubeBorder: "rgba(255, 0, 0, 0.3)",
    cardGoogleBorder: "rgba(52, 168, 82, 0.3)",
    cardTiktokBorder: "rgba(0, 0, 0, 0.29)",
    // Chart colors
    chartImage: "#334FFF",
    chartCarousel: "#33C2FF",
    chartVideo: "#EB0065",
    chartDcoDpa: "#F5A623",
    // Status
    cardStatusActiveGlow: "rgba(52, 211, 153, 0.4)",
    cardStatusInactiveGlow: "rgba(156, 163, 175, 0.3)",
  },
});
