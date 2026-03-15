"use client";

import { Box, Text, Button, Stack, Title } from "@mantine/core";
import { IconBrandGoogle } from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) return null;

  if (!user) {
    if (fallback) return <>{fallback}</>;

    return (
      <Box
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <Stack align="center" gap="md" maw={400}>
          <Title order={2} ta="center">
            로그인이 필요합니다
          </Title>
          <Text size="sm" c="dimmed" ta="center">
            이 기능을 사용하려면 로그인해주세요. Google 계정으로 간편하게 시작할 수 있습니다.
          </Text>
          <Button
            leftSection={<IconBrandGoogle size={18} />}
            size="lg"
            radius="xl"
            color="snipitBlue"
            onClick={signInWithGoogle}
          >
            Google로 로그인하기
          </Button>
        </Stack>
      </Box>
    );
  }

  return <>{children}</>;
}
