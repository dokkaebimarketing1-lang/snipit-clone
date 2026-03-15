"use client";

import {
  Title,
  Text,
  Group,
  Button,
  SimpleGrid,
  Card,
  Image,
  Badge,
  Stack,
  ThemeIcon,
  Paper,
} from "@mantine/core";
import {
  IconSparkles,
  IconRefresh,
  IconBrandMeta,
  IconBrandInstagram,
  IconBrandGoogle,
  IconBrandTiktok,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { mockAds } from "@/data/mockAds";
import { Platform } from "@/types";
import dayjs from "dayjs";

const platformIcons: Record<Platform, React.ReactNode> = {
  meta: <IconBrandMeta size={14} />,
  instagram: <IconBrandInstagram size={14} />,
  google: <IconBrandGoogle size={14} />,
  tiktok: <IconBrandTiktok size={14} />,
  youtube: <IconPlayerPlay size={14} />,
};

const platformColors: Record<Platform, string> = {
  meta: "blue",
  instagram: "pink",
  google: "red",
  tiktok: "dark",
  youtube: "red",
};

const aiReasons = [
  "최근 3일간 전환율이 급상승한 소재입니다.",
  "유사한 타겟층에서 높은 클릭률을 보이고 있습니다.",
  "새로운 카피라이팅 패턴이 적용되어 반응이 좋습니다.",
  "시각적 대비가 뚜렷하여 주목도가 높습니다.",
  "최근 트렌드인 숏폼 포맷을 잘 활용했습니다.",
  "사용자 리뷰를 효과적으로 활용한 사례입니다.",
  "명확한 CTA로 행동을 유도하고 있습니다.",
  "계절성을 잘 반영한 시즈널 캠페인입니다.",
];

export default function AIPage() {
  const today = dayjs().format("YYYY년 MM월 DD일");
  const recommendedAds = mockAds.slice(0, 8);

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="light" color="violet">
            <IconSparkles size={20} />
          </ThemeIcon>
          <Title order={2}>AI 추천</Title>
        </Group>
        <Button
          variant="light"
          color="violet"
          leftSection={<IconRefresh size={16} />}
        >
          다른 추천 보기
        </Button>
      </Group>

      <Stack gap="xs">
        <Text fw={600} size="lg">
          오늘의 AI 추천 광고
        </Text>
        <Text c="dimmed" size="sm">
          {today} 기준, 마케터님의 관심사를 분석하여 선별한 레퍼런스입니다.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
        {recommendedAds.map((ad, index) => (
          <Card key={ad.id} withBorder padding="md" radius="md">
            <Card.Section>
              <Image src={ad.imageUrl} height={200} alt={ad.brandName} />
            </Card.Section>

            <Stack gap="sm" mt="md">
              <Group justify="space-between" wrap="nowrap">
                <Text fw={600} truncate>
                  {ad.brandName}
                </Text>
                <Badge
                  size="sm"
                  variant="light"
                  color={platformColors[ad.platform]}
                  leftSection={platformIcons[ad.platform]}
                >
                  {ad.platform}
                </Badge>
              </Group>

              <Paper withBorder p="sm" radius="sm" bg="violet.0">
                <Group gap="xs" wrap="nowrap" align="flex-start">
                  <ThemeIcon size="sm" variant="transparent" color="violet">
                    <IconSparkles size={14} />
                  </ThemeIcon>
                  <Text size="xs" c="violet.9" lh={1.4}>
                    {aiReasons[index % aiReasons.length]}
                  </Text>
                </Group>
              </Paper>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      <Paper withBorder p="xl" radius="md" bg="gray.0" mt="xl">
        <Stack align="center" ta="center" gap="sm">
          <ThemeIcon size="xl" radius="xl" variant="light" color="violet">
            <IconSparkles size={24} />
          </ThemeIcon>
          <Title order={4}>AI 큐레이션이란?</Title>
          <Text c="dimmed" size="sm" maw={600}>
            스니핏의 AI가 수백만 개의 광고 데이터를 분석하여, 현재 가장 성과가
            좋은 패턴과 트렌드를 찾아냅니다. 마케터님의 이전 검색 기록과 저장한
            보드를 바탕으로 가장 연관성 높은 레퍼런스를 매일 새롭게 추천해
            드립니다.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
