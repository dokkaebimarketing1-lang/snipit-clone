"use client";

import { useState } from "react";
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
  TextInput,
  List,
  Divider,
} from "@mantine/core";
import {
  IconFlask,
  IconUpload,
  IconSearch,
  IconBrandInstagram,
  IconDownload,
  IconCheck,
  IconPhoto,
  IconHeart,
  IconMessageCircle,
} from "@tabler/icons-react";
import { mockAds } from "@/data/mockAds";

export default function ExperimentPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [accountName, setAccountName] = useState("");

  const handleAnalyze = () => {
    if (!accountName) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResult(true);
    }, 1500);
  };

  const similarAds = mockAds.slice(10, 14);

  return (
    <Stack gap="xl">
      <Group gap="sm" align="center">
        <ThemeIcon size="lg" radius="md" variant="light" color="teal">
          <IconFlask size={20} />
        </ThemeIcon>
        <div>
          <Title order={2}>실험실</Title>
          <Text c="dimmed" size="sm">
            스니핏에 추가될 기능을 가장 먼저 사용해보세요.
          </Text>
        </div>
      </Group>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
        {/* Feature 1: Image Search */}
        <Card withBorder padding="xl" radius="md">
          <Stack gap="lg">
            <Group justify="space-between">
              <Group gap="sm">
                <ThemeIcon size="md" variant="light" color="blue">
                  <IconPhoto size={16} />
                </ThemeIcon>
                <Title order={4}>이미지로 비슷한 레퍼런스 찾기</Title>
              </Group>
            </Group>

            <Text c="dimmed" size="sm">
              가지고 있는 이미지나 캡처 화면을 업로드하면, 시각적으로 유사한
              광고 레퍼런스를 찾아줍니다.
            </Text>

            <Paper
              withBorder
              p="xl"
              radius="md"
              style={{
                borderStyle: "dashed",
                backgroundColor: "var(--mantine-color-gray-0)",
                cursor: "pointer",
              }}
            >
              <Stack align="center" gap="sm">
                <ThemeIcon size="xl" radius="xl" variant="light" color="gray">
                  <IconUpload size={24} />
                </ThemeIcon>
                <Text fw={500}>클릭하거나 이미지를 드래그 앤 드롭하세요</Text>
                <Text size="xs" c="dimmed">
                  PNG, JPG, GIF (최대 5MB)
                </Text>
              </Stack>
            </Paper>

            <Button fullWidth leftSection={<IconSearch size={16} />}>
              시작하기
            </Button>

            <Divider my="sm" label="샘플 결과" labelPosition="center" />

            <SimpleGrid cols={2} spacing="sm">
              {similarAds.map((ad) => (
                <Card key={ad.id} withBorder padding="xs" radius="sm">
                  <Card.Section>
                    <Image src={ad.imageUrl} height={120} alt={ad.brandName} />
                  </Card.Section>
                  <Text size="xs" fw={500} mt="xs" truncate>
                    {ad.brandName}
                  </Text>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Card>

        {/* Feature 2: Instagram Analyzer */}
        <Card withBorder padding="xl" radius="md">
          <Stack gap="lg">
            <Group justify="space-between">
              <Group gap="sm">
                <ThemeIcon size="md" variant="light" color="pink">
                  <IconBrandInstagram size={16} />
                </ThemeIcon>
                <Title order={4}>인스타그램 계정 분석기</Title>
              </Group>
              <Badge color="pink" variant="light">
                NEW
              </Badge>
            </Group>

            <Text c="dimmed" size="sm">
              경쟁사나 벤치마킹하고 싶은 인스타그램 계정의 성과를 분석하고
              인사이트를 도출합니다.
            </Text>

            <Group align="flex-end">
              <TextInput
                label="계정 이름"
                placeholder="@계정이름을 입력하세요"
                value={accountName}
                onChange={(e) => setAccountName(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Button
                onClick={handleAnalyze}
                loading={isAnalyzing}
                color="pink"
              >
                분석하기
              </Button>
            </Group>

            {showResult && (
              <Stack gap="md" mt="md">
                <Paper withBorder p="md" radius="md" bg="gray.0">
                  <SimpleGrid cols={3}>
                    <Stack gap={0} align="center">
                      <Text size="xs" c="dimmed">
                        팔로워
                      </Text>
                      <Text fw={700} size="lg">
                        12.5K
                      </Text>
                    </Stack>
                    <Stack gap={0} align="center">
                      <Text size="xs" c="dimmed">
                        게시물
                      </Text>
                      <Text fw={700} size="lg">
                        342
                      </Text>
                    </Stack>
                    <Stack gap={0} align="center">
                      <Text size="xs" c="dimmed">
                        참여율
                      </Text>
                      <Text fw={700} size="lg" c="pink">
                        4.2%
                      </Text>
                    </Stack>
                  </SimpleGrid>
                </Paper>

                <Text size="sm" fw={500}>
                  성과 요약
                </Text>
                <Text size="sm" c="dimmed" lh={1.5}>
                  해당 계정은 동종 업계 평균(2.1%) 대비 높은 참여율을 보이고
                  있습니다. 특히 릴스 콘텐츠의 도달률이 일반 게시물보다 3배 이상
                  높으며, 사용자 참여를 유도하는 질문형 캡션이 효과적으로
                  작동하고 있습니다.
                </Text>

                <Text size="sm" fw={500} mt="sm">
                  주요 강점
                </Text>
                <List
                  spacing="xs"
                  size="sm"
                  center
                  icon={
                    <ThemeIcon color="teal" size={16} radius="xl">
                      <IconCheck size={10} />
                    </ThemeIcon>
                  }
                >
                  <List.Item>일관된 브랜드 컬러와 톤앤매너 유지</List.Item>
                  <List.Item>주 3회 이상의 규칙적인 업로드 주기</List.Item>
                  <List.Item>댓글 소통이 매우 활발함</List.Item>
                </List>

                <Text size="sm" fw={500} mt="sm">
                  인기 게시물 Top 3
                </Text>
                <SimpleGrid cols={3} spacing="xs">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} withBorder padding={0} radius="sm">
                      <Image
                        src={`https://picsum.photos/id/${100 + i}/200/200`}
                        height={100}
                        alt={`Top post ${i}`}
                      />
                      <Group justify="center" gap="xs" p="xs">
                        <Group gap={4}>
                          <IconHeart size={12} color="gray" />
                          <Text size="xs" c="dimmed">
                            1.2K
                          </Text>
                        </Group>
                        <Group gap={4}>
                          <IconMessageCircle size={12} color="gray" />
                          <Text size="xs" c="dimmed">
                            45
                          </Text>
                        </Group>
                      </Group>
                    </Card>
                  ))}
                </SimpleGrid>

                <Button
                  variant="light"
                  color="gray"
                  fullWidth
                  leftSection={<IconDownload size={16} />}
                  disabled
                  mt="md"
                >
                  PDF 리포트 다운로드 (준비 중)
                </Button>
              </Stack>
            )}
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
