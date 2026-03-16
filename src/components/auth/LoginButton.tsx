"use client";

import {
  Button,
  Avatar,
  Menu,
  UnstyledButton,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconLogout } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";

export function LoginButton() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [opened, { open, close }] = useDisclosure(false);

  if (loading) return null;

  if (!user) {
    const handleGoogleLogin = async () => {
      close();
      await signInWithGoogle();
    };

    const handleNaverLogin = () => {
      window.alert("네이버 로그인은 준비 중입니다");
    };

    return (
      <>
        <Button
          variant="light"
          color="snipitBlue"
          size="xs"
          radius="xl"
          onClick={open}
          style={{ fontSize: 10, padding: "4px 10px", height: "auto" }}
        >
          로그인
        </Button>

        <Modal opened={opened} onClose={close} title="로그인" centered>
          <Stack gap="sm">
            <Button
              fullWidth
              variant="outline"
              color="gray"
              leftSection={
                <Text component="span" fw={700}>
                  G
                </Text>
              }
              onClick={handleGoogleLogin}
              styles={{
                root: {
                  backgroundColor: "#FFFFFF",
                  borderColor: "#D0D5DD",
                  color: "#344054",
                },
              }}
            >
              구글로 계속하기
            </Button>

            <Button
              fullWidth
              onClick={handleNaverLogin}
              styles={{
                root: {
                  backgroundColor: "#03C75A",
                  color: "#FFFFFF",
                  border: "none",
                },
              }}
            >
              <Text component="span" fw={700} c="white" mr={6}>
                N
              </Text>
              네이버로 계속하기
            </Button>
          </Stack>
        </Modal>
      </>
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
