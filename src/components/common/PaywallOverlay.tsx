"use client";

import { Box, Text, Button, Stack } from "@mantine/core";

export function PaywallOverlay() {
  return (
    <Box
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        height: 240,
        background:
          "linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 40%, rgba(255,255,255,0.7) 70%, transparent 100%)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: 32,
        zIndex: 10,
        marginTop: -120,
        pointerEvents: "none",
      }}
    >
      <Stack
        align="center"
        gap="xs"
        style={{ pointerEvents: "auto" }}
      >
        <Text fw={600} size="md" ta="center">
          모든 검색 결과를 7일간 무료로 확인해보세요
        </Text>
        <Text size="sm" c="dimmed" ta="center" maw={400}>
          회원가입 후 무료 체험으로 모든 검색 결과를 제한 없이 확인할 수 있습니다
        </Text>
        <Button
          variant="outline"
          color="snipitBlue"
          radius="xl"
          size="md"
          mt={4}
        >
          무료 체험 시작하기
        </Button>
      </Stack>
    </Box>
  );
}
