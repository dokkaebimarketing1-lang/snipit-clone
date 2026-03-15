"use client";

import { useState } from "react";
import {
  Title,
  Button,
  Tabs,
  Group,
  Card,
  Text,
  Avatar,
  Badge,
  SimpleGrid,
  Stack,
  Paper,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { AreaChart, DonutChart } from "@mantine/charts";
import {
  IconPlus,
  IconBrandMeta,
  IconBrandInstagram,
  IconBrandGoogle,
  IconBrandTiktok,
  IconChartBar,
  IconAd,
  IconPlayerPlay,
  IconPlayerPause,
  IconClock,
} from "@tabler/icons-react";
import { mockCompetitors, mockMonitoringStats } from "@/data/mockAds";
import { Platform } from "@/types";

const platformIcons: Record<Platform, React.ReactNode> = {
  meta: <IconBrandMeta size={16} />,
  instagram: <IconBrandInstagram size={16} />,
  google: <IconBrandGoogle size={16} />,
  tiktok: <IconBrandTiktok size={16} />,
  youtube: <IconPlayerPlay size={16} />,
};

const platformColors: Record<Platform, string> = {
  meta: "blue",
  instagram: "pink",
  google: "red",
  tiktok: "dark",
  youtube: "red",
};

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState<string | null>("meta");
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(
    mockCompetitors[0].id
  );

  const filteredCompetitors = mockCompetitors.filter(
    (c) => activeTab === "all" || c.platform === activeTab
  );

  const selectedCompData = mockCompetitors.find(
    (c) => c.id === selectedCompetitor
  );

  const donutData = [
    { name: "이미지", value: mockMonitoringStats.mediaDistribution.photo, color: "blue.6" },
    { name: "영상", value: mockMonitoringStats.mediaDistribution.video, color: "teal.6" },
    { name: "캐러셀", value: mockMonitoringStats.mediaDistribution.carousel, color: "yellow.6" },
  ];

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Stack gap="xs">
          <Title order={2}>경쟁사 모니터링</Title>
          <Text c="dimmed" size="sm">
            경쟁사의 광고 집행 현황과 성과를 분석해보세요.
          </Text>
        </Stack>
        <Button leftSection={<IconPlus size={16} />}>경쟁사 추가</Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="all">전체</Tabs.Tab>
          <Tabs.Tab value="meta" leftSection={<IconBrandMeta size={16} />}>
            Meta 광고
          </Tabs.Tab>
          <Tabs.Tab
            value="instagram"
            leftSection={<IconBrandInstagram size={16} />}
          >
            Instagram
          </Tabs.Tab>
          <Tabs.Tab value="google" leftSection={<IconBrandGoogle size={16} />}>
            Google Ads
          </Tabs.Tab>
          <Tabs.Tab value="tiktok" leftSection={<IconBrandTiktok size={16} />}>
            TikTok
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Stack gap="md">
          <Text fw={600} size="lg">
            모니터링 중인 경쟁사
          </Text>
          <Stack gap="sm">
            {filteredCompetitors.map((competitor) => (
              <Card
                key={competitor.id}
                withBorder
                padding="md"
                radius="md"
                style={{
                  cursor: "pointer",
                  borderColor:
                    selectedCompetitor === competitor.id
                      ? "var(--mantine-color-blue-filled)"
                      : undefined,
                }}
                onClick={() => setSelectedCompetitor(competitor.id)}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Group wrap="nowrap">
                    <Avatar src={competitor.avatarUrl} radius="xl" size="md" />
                    <div>
                      <Group gap="xs">
                        <Text fw={500}>{competitor.name}</Text>
                        <Badge
                          size="sm"
                          variant="light"
                          color={platformColors[competitor.platform]}
                          leftSection={platformIcons[competitor.platform]}
                        >
                          {competitor.platform}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed" mt={2}>
                        업데이트: {competitor.lastUpdated}
                      </Text>
                    </div>
                  </Group>
                  <Stack gap={0} align="flex-end">
                    <Text size="sm" fw={500}>
                      {competitor.activeAds} / {competitor.adsCount}
                    </Text>
                    <Text size="xs" c="dimmed">
                      게재 중 / 전체
                    </Text>
                  </Stack>
                </Group>
              </Card>
            ))}
          </Stack>
        </Stack>

        <Box style={{ gridColumn: "span 2" }}>
          {selectedCompData ? (
            <Stack gap="lg">
              <Group justify="space-between">
                <Group>
                  <Avatar src={selectedCompData.avatarUrl} size="lg" />
                  <div>
                    <Title order={3}>{selectedCompData.name}</Title>
                    <Text c="dimmed" size="sm">
                      대시보드 요약
                    </Text>
                  </div>
                </Group>
                <Button variant="light" rightSection={<IconChartBar size={16} />}>
                  상세 리포트 보기
                </Button>
              </Group>

              <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Paper withBorder p="md" radius="md">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" c="dimmed" fw={500}>
                      총 광고 수
                    </Text>
                    <ThemeIcon color="gray" variant="light" size="sm">
                      <IconAd size={14} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" fw={700}>
                    {mockMonitoringStats.totalAds}
                  </Text>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" c="dimmed" fw={500}>
                      게재 중
                    </Text>
                    <ThemeIcon color="blue" variant="light" size="sm">
                      <IconPlayerPlay size={14} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" fw={700} c="blue">
                    {mockMonitoringStats.activeAds}
                  </Text>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" c="dimmed" fw={500}>
                      게재 종료
                    </Text>
                    <ThemeIcon color="red" variant="light" size="sm">
                      <IconPlayerPause size={14} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" fw={700}>
                    {mockMonitoringStats.inactiveAds}
                  </Text>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" c="dimmed" fw={500}>
                      평균 게재일
                    </Text>
                    <ThemeIcon color="teal" variant="light" size="sm">
                      <IconClock size={14} />
                    </ThemeIcon>
                  </Group>
                  <Text size="xl" fw={700}>
                    {mockMonitoringStats.avgDuration}일
                  </Text>
                </Paper>
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                <Paper withBorder p="md" radius="md">
                  <Text fw={600} mb="md">
                    일별 광고 게재 추이
                  </Text>
                  <AreaChart
                    h={250}
                    data={mockMonitoringStats.dailyAdCounts}
                    dataKey="date"
                    series={[{ name: "count", color: "blue.6" }]}
                    curveType="monotone"
                    withDots={false}
                  />
                </Paper>

                <Paper withBorder p="md" radius="md">
                  <Text fw={600} mb="md">
                    소재 유형 분포
                  </Text>
                  <Group justify="center" h={250}>
                    <DonutChart
                      data={donutData}
                      withLabels
                      size={160}
                      thickness={20}
                    />
                  </Group>
                </Paper>
              </SimpleGrid>

              <Paper withBorder p="md" radius="md">
                <Text fw={600} mb="md">
                  최근 활동 캘린더
                </Text>
                <Group gap="xs" wrap="wrap">
                  {Array(30).fill(0).map((_, index) => {
                    // Use deterministic pseudo-random values based on index
                    const pseudoRandom = (Math.sin(index * 12.9898) * 43758.5453) % 1;
                    const isActive = Math.abs(pseudoRandom) > 0.5;
                    return (
                      <Box
                        key={`day-${index}`}
                        w={30}
                        h={30}
                        style={{
                          backgroundColor: isActive
                            ? "var(--mantine-color-blue-filled)"
                            : "var(--mantine-color-gray-1)",
                          borderRadius: "4px",
                          opacity: isActive ? Math.abs(pseudoRandom) * 0.5 + 0.5 : 1,
                        }}
                        title={`Day ${index + 1}`}
                      />
                    );
                  })}
                </Group>
                <Text size="xs" c="dimmed" mt="sm">
                  * 색상이 진할수록 해당 일자에 게재된 광고가 많습니다.
                </Text>
              </Paper>
            </Stack>
          ) : (
            <Paper withBorder p="xl" radius="md" ta="center">
              <Text c="dimmed">경쟁사를 선택해주세요.</Text>
            </Paper>
          )}
        </Box>
      </SimpleGrid>
    </Stack>
  );
}
