"use client";

import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconCheck,
  IconChevronRight,
  IconDownload,
  IconPuzzle,
  IconRocket,
  IconStar,
} from "@tabler/icons-react";

const installSteps = [
  {
    title: "ZIP 다운로드 버튼 클릭",
    description: "아래 다운로드 버튼을 눌러 `snipit-extension.zip` 파일을 받으세요.",
  },
  {
    title: "chrome://extensions 에서 개발자 모드 ON",
    description: "크롬 우측 상단의 개발자 모드를 켜주세요.",
  },
  {
    title: "압축해제된 확장 프로그램을 로드합니다",
    description: "ZIP 압축 해제 후 생성된 폴더를 선택하면 설치가 완료됩니다.",
  },
];

const features = [
  "Meta Ad Library 자동 수집 (동의 시)",
  "원클릭 광고 저장",
  "기여 보상: 프리미엄 무료",
];

export default function ExtensionPage() {
  return (
    <Box
      px={{ base: "md", md: "xl" }}
      py={{ base: "lg", md: "xl" }}
      style={{
        background:
          "radial-gradient(circle at 8% 0%, rgba(104, 125, 255, 0.12) 0%, rgba(104, 125, 255, 0) 40%), radial-gradient(circle at 90% 20%, rgba(51, 79, 255, 0.1) 0%, rgba(51, 79, 255, 0) 36%), #f8f9fc",
      }}
    >
      <Container size="lg">
        <Stack gap="xl">
          <Paper
            radius="xl"
            p={{ base: "xl", md: 40 }}
            withBorder
            style={{
              borderColor: "#dce2ff",
              background: "linear-gradient(140deg, #ffffff 0%, #f3f6ff 100%)",
              boxShadow: "0 28px 64px rgba(35, 60, 180, 0.12)",
            }}
          >
            <Stack gap="lg" align="center">
              <Badge
                size="lg"
                radius="xl"
                color="snipitBlue"
                variant="light"
                leftSection={<IconPuzzle size={14} />}
              >
                CHROME EXTENSION
              </Badge>

              <Title order={1} ta="center" style={{ letterSpacing: "-0.03em", lineHeight: 1.2 }}>
                스니핏 Chrome 확장 프로그램
              </Title>

              <Text c="dimmed" ta="center" maw={680}>
                메타 광고를 탐색하다가 좋은 광고를 발견하면 바로 저장하고, 동의한 사용자에게는
                광고 데이터 수집 기여를 통해 프리미엄 혜택을 제공합니다.
              </Text>

              <Button
                component="a"
                href="/extension/snipit-extension.zip"
                size="xl"
                radius="xl"
                color="snipitBlue"
                leftSection={<IconDownload size={20} />}
                style={{
                  minWidth: 240,
                  boxShadow: "0 14px 30px rgba(51, 79, 255, 0.34)",
                }}
              >
                ZIP 다운로드
              </Button>

              <Text size="sm" c="dimmed" ta="center">
                다운로드 후 설치가 막히면 아래 3단계 가이드를 그대로 따라 진행하세요.
              </Text>
            </Stack>
          </Paper>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {installSteps.map((step, index) => (
              <Card
                key={step.title}
                radius="xl"
                p="lg"
                withBorder
                style={{
                  borderColor: "#e5e9ff",
                  background: "#ffffff",
                  boxShadow: "0 14px 32px rgba(17, 24, 39, 0.06)",
                  minHeight: 170,
                }}
              >
                <Stack gap="sm">
                  <ThemeIcon
                    size={38}
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: "snipitBlue.5", to: "snipitBlue.7", deg: 120 }}
                  >
                    <Text fw={800}>{index + 1}</Text>
                  </ThemeIcon>
                  <Text fw={700}>{step.title}</Text>
                  <Text size="sm" c="dimmed" style={{ lineHeight: 1.55 }}>
                    {step.description}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Paper
              p="xl"
              radius="xl"
              withBorder
              style={{
                borderColor: "#e5e9ff",
                background: "#ffffff",
                boxShadow: "0 16px 34px rgba(17, 24, 39, 0.06)",
              }}
            >
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon color="snipitBlue" variant="light" radius="xl">
                    <IconRocket size={16} />
                  </ThemeIcon>
                  <Title order={3}>확장 프로그램 주요 기능</Title>
                </Group>

                <List
                  spacing="md"
                  icon={
                    <ThemeIcon color="green" variant="light" radius="xl" size={24}>
                      <IconCheck size={16} />
                    </ThemeIcon>
                  }
                >
                  {features.map((feature) => (
                    <List.Item key={feature}>
                      <Text>{feature}</Text>
                    </List.Item>
                  ))}
                </List>

                <Anchor href="chrome://extensions" c="snipitBlue.6" fw={700} underline="always">
                  chrome://extensions 열기
                </Anchor>
              </Stack>
            </Paper>

            <Paper
              p="xl"
              radius="xl"
              withBorder
              style={{
                borderColor: "#d9e0ff",
                background: "linear-gradient(170deg, #eef2ff 0%, #ffffff 100%)",
                boxShadow: "0 18px 34px rgba(35, 60, 180, 0.12)",
              }}
            >
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <ThemeIcon color="snipitBlue" radius="xl" variant="filled" size={28}>
                      <IconStar size={14} />
                    </ThemeIcon>
                    <Text fw={700}>Popup 미리보기</Text>
                  </Group>
                  <Badge variant="light" color="snipitBlue">
                    MOCKUP
                  </Badge>
                </Group>

                <Paper
                  p="md"
                  radius="lg"
                  withBorder
                  style={{
                    maxWidth: 320,
                    margin: "0 auto",
                    backgroundColor: "#fff",
                    borderColor: "#ccd6ff",
                  }}
                >
                  <Stack gap="sm">
                    <Text fw={700} size="sm">
                      스니핏 확장 프로그램
                    </Text>
                    <Paper p="sm" radius="md" bg="gray.0" withBorder>
                      <Stack gap={6}>
                        <Text size="xs" c="dimmed">
                          현재 페이지
                        </Text>
                        <Text size="sm" fw={600} lineClamp={1}>
                          Meta Ad Library - 광고 상세 보기
                        </Text>
                      </Stack>
                    </Paper>
                    <Button fullWidth color="snipitBlue" leftSection={<IconCheck size={16} />}>
                      광고 저장
                    </Button>
                    <Button
                      fullWidth
                      variant="subtle"
                      color="gray"
                      rightSection={<IconChevronRight size={14} />}
                    >
                      수집 설정 확인
                    </Button>
                  </Stack>
                </Paper>
              </Stack>
            </Paper>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
