"use client";

import { Button, Avatar, Menu, UnstyledButton } from "@mantine/core";
import { IconBrandGoogle, IconLogout } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";

export function LoginButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <Button
        leftSection={<IconBrandGoogle size={18} />}
        variant="light"
        color="snipitBlue"
        size="xs"
        radius="xl"
        onClick={signInWithGoogle}
        style={{ fontSize: 10, padding: "4px 10px", height: "auto" }}
      >
        로그인
      </Button>
    );
  }

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <UnstyledButton>
          <Avatar
            src={user.user_metadata?.avatar_url}
            alt={user.user_metadata?.full_name || "User"}
            radius="xl"
            size={32}
            style={{ cursor: "pointer" }}
          />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{user.user_metadata?.full_name || user.email}</Menu.Label>
        <Menu.Item
          leftSection={<IconLogout size={14} />}
          onClick={signOut}
          color="red"
        >
          로그아웃
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
