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
import { useAuth } from "@/hooks/useAuth";
import { Competitor, MonitoringStats, Platform } from "@/types";

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

function MonitoringMarketingIntro() {
  const showcaseItems = [
    {
      title: "채널 믹스 비교",
      description: "Meta/Google/TikTok 예산 흐름 요약",
      gradient: "linear-gradient(135deg, #ffe6ea 0%, #ffd6dd 45%, #ffeef1 100%)",
    },
    {
      title: "메시지 포지셔닝",
      description: "카피 톤과 오퍼 강조 포인트 분석",
      gradient: "linear-gradient(135deg, #fdf2e9 0%, #ffe6cc 50%, #fff5e8 100%)",
    },
    {
      title: "성과 패턴 추적",
      description: "소재별 반응 추이와 반복 패턴 확인",
      gradient: "linear-gradient(135deg, #e7f5ff 0%, #d9ecff 50%, #f1f8ff 100%)",
    },
  ];

  return (
    <Stack gap="xl">
      <Stack gap="sm" align="center">
        <Badge color="red" variant="light" size="lg">
          OPEN BETA
        </Badge>
        <Title order={2} ta="center">
          경쟁사 광고 전략 보기
        </Title>
        <Text ta="center" fw={600} c="red.6" maw={760}>
          경쟁사의 광고 전략을 한눈에 파악하고, 더 잘되는 캠페인을 빠르게
          설계하세요.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        {showcaseItems.map((item) => (
          <Paper
            key={item.title}
            withBorder
            radius="lg"
            p="lg"
            style={{
              minHeight: 190,
              background: item.gradient,
              borderColor: "rgba(0, 0, 0, 0.08)",
            }}
          >
            <Stack justify="space-between" h="100%">
              <Box
                style={{
                  height: 78,
                  borderRadius: 10,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.72))",
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                }}
              />
              <Stack gap={4}>
                <Text fw={600}>{item.title}</Text>
                <Text size="sm" c="dimmed">
                  {item.description}
                </Text>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </SimpleGrid>

      <Paper withBorder p="xl" radius="lg">
        <Stack gap="sm">
          <Title order={3}>광고 전략 분석 대시보드</Title>
          <Text c="dimmed" size="sm" maw={700}>
            경쟁사의 주요 광고 채널과 메시지 흐름을 모니터링하고 성과 패턴을
            빠르게 비교해보세요.
          </Text>
          <Group mt="sm">
            <Button component="a" href="/login" size="md" color="red">
              회원가입하고 경쟁사 탐색하기
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}

const emptyStats: MonitoringStats = {
  totalAds: 0,
  activeAds: 0,
  inactiveAds: 0,
  avgDuration: 0,
  mediaDistribution: { photo: 0, video: 0, carousel: 0 },
  dailyAdCounts: [],
};

export default function MonitoringPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>("meta");
  const [competitors] = useState<Competitor[]>([]);
  const [stats] = useState<MonitoringStats>(emptyStats);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  const filteredCompetitors = competitors.filter(
    (c) => activeTab === "all" || c.platform === activeTab
  );

  const selectedCompData = competitors.find(
    (c) => c.id === selectedCompetitor
  );

  const donutData = [
    {
      name: "이미지",
      value: stats.mediaDistribution.photo,
      color: "blue.6",
    },
    {
      name: "영상",
      value: stats.mediaDistribution.video,
      color: "teal.6",
    },
    {
      name: "캐러셀",
      value: stats.mediaDistribution.carousel,
      color: "yellow.6",
    },
  ];

  if (!user && !loading) {
    return <MonitoringMarketingIntro />;
  }

  if (loading) {
    return null;
  }

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
                    {stats.totalAds}
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
                    {stats.activeAds}
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
                    {stats.inactiveAds}
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
                    {stats.avgDuration}일
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
                    data={stats.dailyAdCounts}
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
