"use client";

import { AppShell as MantineAppShell, Stack, Box, Text } from "@mantine/core";
import { IconLayoutBoard } from "@tabler/icons-react";
import { LoginButton } from "@/components/auth/LoginButton";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname === "/board" || pathname.startsWith("/board/");

  return (
    <MantineAppShell
      navbar={{ width: 68, breakpoint: "sm" }}
      padding="md"
    >
      <MantineAppShell.Navbar p="xs" style={{ borderRight: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
        <Stack align="center" gap="xl" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box mt="md" mb="xl" style={{ cursor: "pointer" }} onClick={() => router.push("/board")}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #334FFF 0%, #687DFF 100%)",
              }}
            />
          </Box>

          <Link href="/board" style={{ textDecoration: "none" }}>
            <Box
              style={{
                width: 52,
                height: 52,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isActive ? "#eef2ff" : "transparent",
              }}
            >
              <Box style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <IconLayoutBoard size={22} stroke={1.5} color={isActive ? "#334FFF" : "#9ca3af"} />
                <Text size="xs" style={{ fontSize: 10, color: isActive ? "#334FFF" : "#9ca3af", lineHeight: 1 }}>
                  보드
                </Text>
              </Box>
            </Box>
          </Link>

          <Box style={{ flex: 1 }} />

          <Box mb="md" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <LoginButton />
          </Box>
        </Stack>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
        {children}
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
