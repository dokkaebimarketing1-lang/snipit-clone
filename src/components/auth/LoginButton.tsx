"use client";

import { useState } from "react";
import {
  Button,
  Avatar,
  Menu,
  UnstyledButton,
  Modal,
  Stack,
  Text,
  TextInput,
  PasswordInput,
  Divider,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconLogout } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";

export function LoginButton() {
  const { user, loading, signInWithEmail, signOut } = useAuth();
  const [opened, { open, close }] = useDisclosure(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  if (loading) return null;

  if (!user) {
    const handleEmailLogin = async () => {
      if (!email || !password) {
        setError("이메일과 비밀번호를 입력해주세요");
        return;
      }
      setError("");
      setLoginLoading(true);
      try {
        const result = await signInWithEmail(email, password);
        if (result?.error) {
          setError(result.error.message || "로그인 실패");
        } else {
          close();
          setEmail("");
          setPassword("");
        }
      } catch {
        setError("로그인 중 오류가 발생했습니다");
      } finally {
        setLoginLoading(false);
      }
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
            <TextInput
              label="이메일"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <PasswordInput
              label="비밀번호"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleEmailLogin(); }}
            />
            {error && <Text size="xs" c="red">{error}</Text>}
            <Button
              fullWidth
              onClick={handleEmailLogin}
              loading={loginLoading}
            >
              로그인
            </Button>
            <Divider label="또는" labelPosition="center" />
            <Text size="xs" c="dimmed" ta="center">
              구글 로그인은 준비 중입니다
            </Text>
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
