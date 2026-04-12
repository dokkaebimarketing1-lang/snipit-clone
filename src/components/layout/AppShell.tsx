"use client";

import { AppShell as MantineAppShell, Stack, UnstyledButton, Box, Text, Badge, ActionIcon, Affix, Divider } from "@mantine/core";
import {
  IconSearch,
  IconLayoutBoard,
  IconPuzzle,
  IconShare,
} from "@tabler/icons-react";
import { LoginButton } from "@/components/auth/LoginButton";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface NavItemProps {
  icon: React.FC<any>;
  label: string;
  href: string;
  badge?: string;
}

const navItems: NavItemProps[] = [
  { icon: IconSearch, label: "검색", href: "/search", badge: "NEW" },
  { icon: IconLayoutBoard, label: "보드", href: "/board" },
  { icon: IconPuzzle, label: "확장", href: "/extension" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const NavLink = ({ item }: { item: NavItemProps }) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <UnstyledButton
        component={Link}
        href={item.href}
        style={{
          width: 52,
          height: 52,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
          position: "relative",
          transition: "background-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = "#f3f4f6";
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <Box style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <item.icon size={22} stroke={1.5} color={isActive ? "#334FFF" : "#9ca3af"} />
          <Text size="xs" style={{ fontSize: 10, color: isActive ? "#334FFF" : "#9ca3af", lineHeight: 1 }}>
            {item.label}
          </Text>
          {item.badge && (
            <Badge
              size="xs"
              variant="filled"
              color="red"
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                padding: "0 4px",
                height: 16,
                pointerEvents: "none",
              }}
            >
              {item.badge}
            </Badge>
          )}
        </Box>
      </UnstyledButton>
    );
  };

  return (
    <MantineAppShell
      navbar={{
        width: 68,
        breakpoint: "sm",
      }}
      padding="md"
    >
      <MantineAppShell.Navbar p="xs" style={{ borderRight: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
        <Stack align="center" gap="xl" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box mt="md" mb="xl" style={{ cursor: "pointer" }} onClick={() => router.push("/")}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #334FFF 0%, #687DFF 100%)",
              }}
            />
          </Box>

          <Stack gap="sm" style={{ flex: 0 }}>
            {navItems.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
          </Stack>

          <Box style={{ flex: 1 }} />

          <Box mb="md" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <LoginButton />
          </Box>
        </Stack>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
        {children}
      </MantineAppShell.Main>

      <Affix position={{ bottom: 20, right: 20 }}>
        <ActionIcon
          size="xl"
          radius="xl"
          variant="filled"
          color="snipitBlue"
          style={{ boxShadow: "0 4px 12px rgba(51, 79, 255, 0.3)" }}
        >
          <IconShare size={20} />
        </ActionIcon>
      </Affix>

      <Affix position={{ top: 20, right: 20 }}>
        <ActionIcon
          size="xl"
          radius="xl"
          variant="filled"
          style={{
            background: "linear-gradient(135deg, #334FFF 0%, #687DFF 100%)",
            boxShadow: "0 4px 12px rgba(51, 79, 255, 0.3)",
          }}
          onClick={() => router.push("/")}
        >
          <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: "white" }} />
        </ActionIcon>
      </Affix>
    </MantineAppShell>
  );
}
