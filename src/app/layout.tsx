import type { Metadata } from "next";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { theme } from "@/theme";
import { AppShell } from "@/components/layout/AppShell";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/notifications/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "스니핏 - 레퍼런스 찾는 시간을 10배 줄여주는",
  description: "찾고 싶으면 찾아지는 콘텐츠 레퍼런스, 스니핏",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <ColorSchemeScript />
        <link
          href="https://cdn.jsdelivr.net/gh/sunn-us/SUIT/fonts/variable/woff2/SUIT-Variable.css"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <AppShell>{children}</AppShell>
        </MantineProvider>
      </body>
    </html>
  );
}
