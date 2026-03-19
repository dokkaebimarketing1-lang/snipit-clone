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
  Table,
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
export default function ExperimentPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [myAccountName, setMyAccountName] = useState("");
  const [competitorAccountName, setCompetitorAccountName] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [showComparisonResult, setShowComparisonResult] = useState(false);

  const handleAnalyze = () => {
    if (!accountName) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResult(true);
    }, 1500);
  };

  const handleCompareAnalyze = () => {
    if (!myAccountName || !competitorAccountName) return;
    setIsComparing(true);
    setTimeout(() => {
      setIsComparing(false);
      setShowComparisonResult(true);
    }, 1200);
  };

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

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
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

        {/* Feature 3: My Account vs Competitor Analyzer */}
        <Card
          withBorder
          padding="xl"
          radius="md"
          style={{ gridColumn: "1 / -1" }}
        >
          <Stack gap="lg">
            <Group justify="space-between">
              <Group gap="sm">
                <ThemeIcon size="md" variant="light" color="violet">
                  <IconBrandInstagram size={16} />
                </ThemeIcon>
                <Title order={4}>내 계정 vs 경쟁 계정 분석기</Title>
              </Group>
              <Badge color="violet" variant="light">
                BETA
              </Badge>
            </Group>

            <Text c="dimmed" size="sm">
              내 Instagram 계정과 경쟁 계정을 비교 분석하여 포지셔닝과 개선
              방향을 제안해줘요.
            </Text>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <TextInput
                label="내 계정 @"
                placeholder="@my_brand"
                value={myAccountName}
                onChange={(e) => setMyAccountName(e.currentTarget.value)}
              />
              <TextInput
                label="경쟁 계정 @"
                placeholder="@competitor_brand"
                value={competitorAccountName}
                onChange={(e) => setCompetitorAccountName(e.currentTarget.value)}
              />
            </SimpleGrid>

            <Button
              onClick={handleCompareAnalyze}
              loading={isComparing}
              color="violet"
            >
              비교 분석하기
            </Button>

            {showComparisonResult && (
              <Stack gap="md" mt="xs">
                <Text size="sm" fw={500}>
                  계정 비교 지표
                </Text>
                <Table withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>지표</Table.Th>
                      <Table.Th>내 계정</Table.Th>
                      <Table.Th>경쟁 계정</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>팔로워</Table.Td>
                      <Table.Td>8.9K</Table.Td>
                      <Table.Td>12.5K</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>게시물</Table.Td>
                      <Table.Td>214</Table.Td>
                      <Table.Td>342</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td>참여율</Table.Td>
                      <Table.Td>3.6%</Table.Td>
                      <Table.Td>4.2%</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                  <Paper withBorder p="md" radius="md" bg="green.0">
                    <Text size="sm" fw={600} mb="xs">
                      강점 비교
                    </Text>
                    <List size="sm" spacing="xs">
                      <List.Item>
                        내 계정: 제품 후기형 콘텐츠 저장률이 높고 전환 유도가 명확함
                      </List.Item>
                      <List.Item>
                        경쟁 계정: 릴스 중심 확산력이 높고 신규 유입이 빠름
                      </List.Item>
                    </List>
                  </Paper>
                  <Paper withBorder p="md" radius="md" bg="red.0">
                    <Text size="sm" fw={600} mb="xs">
                      약점 비교
                    </Text>
                    <List size="sm" spacing="xs">
                      <List.Item>
                        내 계정: 업로드 주기가 불규칙해 도달량 변동 폭이 큼
                      </List.Item>
                      <List.Item>
                        경쟁 계정: 댓글 응대 비율이 낮아 커뮤니티 결속이 약함
                      </List.Item>
                    </List>
                  </Paper>
                </SimpleGrid>

                <Paper withBorder p="md" radius="md" bg="violet.0">
                  <Text size="sm" fw={600} mb={4}>
                    개선 제안
                  </Text>
                  <Text size="sm" c="dimmed" lh={1.6}>
                    내 계정은 후기/신뢰형 콘텐츠 강점을 유지하면서 경쟁 계정의 릴스
                    템플릿 전략을 일부 도입해 확산력을 높이는 것이 좋습니다. 주 3회
                    고정 업로드와 질문형 캡션 실험을 4주간 운영하면 참여율 4% 이상
                    도달 가능성이 높습니다.
                  </Text>
                </Paper>
              </Stack>
            )}
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
