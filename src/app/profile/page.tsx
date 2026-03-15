"use client";

import {
  Title,
  Text,
  Group,
  Button,
  Card,
  Avatar,
  Badge,
  Stack,
  ThemeIcon,
  Paper,
  Table,
  Divider,
  Anchor,
} from "@mantine/core";
import {
  IconUser,
  IconCrown,
  IconCheck,
  IconLogout,
  IconSettings,
} from "@tabler/icons-react";

export default function ProfilePage() {
  const plans = [
    {
      name: "Free",
      price: "무료",
      features: ["월 10회 검색", "경쟁사 모니터링 1개", "최근 1개월 데이터"],
    },
    {
      name: "Light",
      price: "₩12,900/월",
      features: ["월 100회 검색", "경쟁사 모니터링 5개", "최근 6개월 데이터"],
    },
    {
      name: "Basic",
      price: "₩32,900/월",
      features: ["무제한 검색", "경쟁사 모니터링 20개", "전체 데이터 탐색"],
    },
    {
      name: "Premium",
      price: "₩150,000/월",
      features: ["무제한 검색", "무제한 모니터링", "팀 워크스페이스 제공"],
    },
  ];

  return (
    <Stack gap="xl" maw={800} mx="auto">
      <Group gap="sm" align="center">
        <ThemeIcon size="lg" radius="md" variant="light" color="gray">
          <IconUser size={20} />
        </ThemeIcon>
        <Title order={2}>프로필</Title>
      </Group>

      <Card withBorder padding="xl" radius="md">
        <Group justify="space-between" align="flex-start">
          <Group gap="lg">
            <Avatar size="xl" radius="xl" color="blue">
              M
            </Avatar>
            <Stack gap="xs">
              <Group gap="sm">
                <Title order={3}>마케터님</Title>
                <Badge variant="outline" color="gray">
                  Free
                </Badge>
              </Group>
              <Text c="dimmed">marketer@example.com</Text>
            </Stack>
          </Group>
          <Button variant="light" leftSection={<IconSettings size={16} />}>
            프로필 수정
          </Button>
        </Group>
      </Card>

      <Stack gap="md">
        <Title order={4}>구독 관리</Title>
        <Paper withBorder p="xl" radius="md" bg="blue.0">
          <Group justify="space-between" align="center">
            <Stack gap="sm">
              <Group gap="xs">
                <ThemeIcon size="md" variant="filled" color="blue" radius="xl">
                  <IconCrown size={16} />
                </ThemeIcon>
                <Text fw={600} size="lg">
                  현재 Free 플랜을 이용 중입니다
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                더 많은 레퍼런스와 모니터링 기능을 원하신다면 플랜을
                업그레이드해보세요.
              </Text>
            </Stack>
            <Button color="blue" size="md">
              플랜 업그레이드
            </Button>
          </Group>
        </Paper>

        <Card withBorder padding="xl" radius="md">
          <Text fw={600} mb="lg">
            플랜 비교
          </Text>
          <Table verticalSpacing="md" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>기능</Table.Th>
                {plans.map((plan) => (
                  <Table.Th key={plan.name} ta="center">
                    <Stack gap={4} align="center">
                      <Text fw={600}>{plan.name}</Text>
                      <Text size="xs" c="dimmed">
                        {plan.price}
                      </Text>
                    </Stack>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={500}>검색 횟수</Table.Td>
                <Table.Td ta="center">월 10회</Table.Td>
                <Table.Td ta="center">월 100회</Table.Td>
                <Table.Td ta="center">무제한</Table.Td>
                <Table.Td ta="center">무제한</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>경쟁사 모니터링</Table.Td>
                <Table.Td ta="center">1개</Table.Td>
                <Table.Td ta="center">5개</Table.Td>
                <Table.Td ta="center">20개</Table.Td>
                <Table.Td ta="center">무제한</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>데이터 탐색 범위</Table.Td>
                <Table.Td ta="center">최근 1개월</Table.Td>
                <Table.Td ta="center">최근 6개월</Table.Td>
                <Table.Td ta="center">전체</Table.Td>
                <Table.Td ta="center">전체</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>팀 워크스페이스</Table.Td>
                <Table.Td ta="center">-</Table.Td>
                <Table.Td ta="center">-</Table.Td>
                <Table.Td ta="center">-</Table.Td>
                <Table.Td ta="center">
                  <ThemeIcon color="teal" size="sm" radius="xl" variant="light">
                    <IconCheck size={12} />
                  </ThemeIcon>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>

      <Stack gap="md" mt="xl">
        <Title order={4}>계정 관리</Title>
        <Card withBorder padding="xl" radius="md">
          <Group justify="space-between">
            <Stack gap="xs">
              <Text fw={500}>로그아웃</Text>
              <Text size="sm" c="dimmed">
                현재 기기에서 로그아웃합니다.
              </Text>
            </Stack>
            <Button variant="light" color="gray" leftSection={<IconLogout size={16} />}>
              로그아웃
            </Button>
          </Group>
          <Divider my="lg" />
          <Group justify="space-between">
            <Stack gap="xs">
              <Text fw={500} c="red">
                계정 삭제
              </Text>
              <Text size="sm" c="dimmed">
                모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
              </Text>
            </Stack>
            <Anchor c="red" size="sm" href="#" underline="hover">
              계정 삭제하기
            </Anchor>
          </Group>
        </Card>
      </Stack>
    </Stack>
  );
}
