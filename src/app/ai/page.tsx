"use client";

import { useMemo, useState } from "react";
import { Box, Group, Image, ScrollArea, Stack, Text, Title, UnstyledButton } from "@mantine/core";
import {
  IconCalendar,
  IconExternalLink,
  IconLayoutGrid,
  IconPhoto,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { aiCategories } from "@/data/mockAds";
import { AdCard as AdCardType, MediaType, Platform } from "@/types";

const platformBadgeLabel: Record<Platform, string> = {
  meta: "Meta 광고",
  instagram: "Instagram 광고",
  google: "Google 광고",
  tiktok: "TikTok 광고",
  youtube: "YouTube 광고",
};

const mediaTypeIcon: Record<MediaType, React.ComponentType<{ size?: number; color?: string }>> = {
  photo: IconPhoto,
  video: IconPlayerPlay,
  reels: IconPlayerPlay,
  carousel: IconLayoutGrid,
};

function formatDate(date: string): string {
  const [year, month, day] = date.split(".");
  return `${year}.${month}.${day}`;
}

export default function AIPage() {
  const [activeCategory, setActiveCategory] = useState(aiCategories[0]);

  const adsByCategory = useMemo(() => {
    return aiCategories.reduce<Record<string, AdCardType[]>>((acc, category) => {
      acc[category] = [];
      return acc;
    }, {});
  }, []);

  const activeAds = adsByCategory[activeCategory] ?? [];

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end" wrap="nowrap">
        <Stack gap={2}>
          <Title order={2}>오늘의 AI 추천 광고</Title>
          <Text size="sm" c="dimmed">
            03.11 16:26 업데이트
          </Text>
        </Stack>
      </Group>

      <ScrollArea type="never" scrollbarSize={6} offsetScrollbars>
        <Group gap="xs" wrap="nowrap" py={4}>
          {aiCategories.map((category) => {
            const active = category === activeCategory;
            return (
              <UnstyledButton
                key={category}
                onClick={() => setActiveCategory(category)}
                style={{
                  whiteSpace: "nowrap",
                  borderRadius: 999,
                  border: active ? "1px solid #111827" : "1px solid #e5e7eb",
                  background: active ? "#111827" : "#ffffff",
                  color: active ? "#ffffff" : "#374151",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "9px 14px",
                  lineHeight: 1,
                }}
              >
                {category}
              </UnstyledButton>
            );
          })}
        </Group>
      </ScrollArea>

      <Stack gap="xs">
        <Text fw={700} size="sm" c="gray.8">
          {activeCategory}
        </Text>

        {activeAds.length === 0 ? (
          <Box py={60} style={{ textAlign: "center" }}>
            <Text c="dimmed" size="sm">아직 수집된 광고 데이터가 없습니다.</Text>
            <Text c="dimmed" size="xs" mt="xs">광고가 수집되면 AI가 자동으로 분류하여 보여드립니다.</Text>
          </Box>
        ) : (
        <ScrollArea type="never" scrollbarSize={6} offsetScrollbars>
          <Group gap="md" wrap="nowrap" align="stretch" py={4}>
            {activeAds.map((ad) => {
              const MediaIcon = mediaTypeIcon[ad.mediaType];

              return (
                <Box
                  key={`${activeCategory}-${ad.id}`}
                  style={{
                    width: 236,
                    minWidth: 236,
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    background: "#fff",
                    overflow: "hidden",
                  }}
                >
                  <Box style={{ position: "relative" }}>
                    <Image src={ad.imageUrl} alt={ad.brandName} h={300} fit="cover" />
                    <Box
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        background: "rgba(17, 24, 39, 0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <MediaIcon size={14} color="#fff" />
                    </Box>
                  </Box>

                  <Stack gap={8} p="sm">
                    <Group gap={6} wrap="nowrap">
                      <Text
                        size="xs"
                        fw={600}
                        c="gray.7"
                        style={{
                          border: "1px solid #d1d5db",
                          borderRadius: 999,
                          padding: "3px 8px",
                          lineHeight: 1,
                        }}
                      >
                        {platformBadgeLabel[ad.platform]}
                      </Text>
                      <IconExternalLink size={13} color="#6b7280" />
                    </Group>

                    <Text fw={700} size="sm" lineClamp={1}>
                      {ad.brandName}
                    </Text>

                    <Text size="xs" c="dimmed">
                      {formatDate(ad.publishedAt)}
                    </Text>

                    <Group justify="space-between" align="center" wrap="nowrap">
                      <Group gap={5} wrap="nowrap">
                        <Box
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: ad.status === "active" ? "#22c55e" : "#9ca3af",
                          }}
                        />
                        <Text size="xs" c="dimmed">
                          {ad.status === "active" ? "게재 중" : "게재 종료"}
                        </Text>
                      </Group>

                      <Group gap={4} wrap="nowrap">
                        <IconCalendar size={12} color="#9ca3af" />
                        <Text size="xs" c="dimmed">
                          {ad.durationDays}일간 게재
                        </Text>
                      </Group>
                    </Group>
                  </Stack>
                </Box>
              );
            })}
          </Group>
        </ScrollArea>
        )}
      </Stack>
    </Stack>
  );
}
