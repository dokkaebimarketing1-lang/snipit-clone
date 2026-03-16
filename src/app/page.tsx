"use client";

import { Container, Title, Text, TextInput, Badge, Group, Card, SimpleGrid, Box, Button, ActionIcon, Grid, Image, Anchor, Loader } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { mockBlogPosts } from "@/data/mockAds";

export default function HomePage() {
  const router = useRouter();

  return (
    <Box
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f1f3f9 100%)",
        minHeight: "100vh",
        paddingBottom: "80px",
      }}
    >
      <Container size="lg" pt={80}>
        {/* Section 1: Hero */}
        <Box style={{ textAlign: "center", marginBottom: 60 }}>
          <Badge
            variant="outline"
            color="snipitBlue"
            size="lg"
            radius="xl"
            mb="xl"
            style={{ borderWidth: 1.5 }}
          >
            OPEN BETA
          </Badge>

          <Text
            fw={700}
            size="xl"
            mb="sm"
            style={{
              background: "linear-gradient(90deg, #FF3366 0%, #FF6B33 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            레퍼런스 찾는 시간을 10배 줄여주는
          </Text>

          <Title
            order={1}
            size="h1"
            fw={900}
            mb={40}
            style={{ fontSize: "3rem", letterSpacing: "-0.02em" }}
          >
            찾고 싶으면 찾아지는 콘텐츠 레퍼런스, 스니핏
          </Title>

          <Box style={{ maxWidth: 720, margin: "0 auto" }}>
            <TextInput
              size="xl"
              radius="xl"
              placeholder="미니멀한 화이트 톤 화장품 광고, 감성적인 카페 인테리어"
              leftSection={<Loader size="xs" color="snipitBlue" />}
              rightSection={
                <ActionIcon variant="transparent" onClick={() => router.push("/search")}>
                  <IconSearch size={20} color="#9ca3af" />
                </ActionIcon>
              }
              styles={{
                input: {
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
                  border: "1px solid #e5e7eb",
                  height: "56px",
                  "&:focus": {
                    borderColor: "#334FFF",
                  },
                },
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  router.push("/search");
                }
              }}
            />
            <Text size="sm" c="dimmed" mt="md">
              TIP : 테마와 분위기, 목적성이 드러나는 검색어를 입력해보세요. 릴스나 광고, 플랫폼 별 보기도 가능! * <Anchor href="/search" underline="always">필터, 유사 이미지 탐색</Anchor>을 활용해봐도 좋아요!
            </Text>
          </Box>
        </Box>

        {/* Section 2: 오늘의 스니핏 */}
        <Box mb={80}>
          <Grid>
            <Grid.Col span={9}>
              {/* 큰 뉴스 카드 — 파란 그라데이션 배경 + 목업 이미지 */}
              <Card
                style={{
                  background: "linear-gradient(135deg, #334FFF 0%, #687DFF 100%)",
                  color: "white",
                  height: 220,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box
                  style={{
                    position: "absolute",
                    right: 16,
                    bottom: 16,
                    width: "52%",
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 12px 24px rgba(0,0,0,0.2)",
                    border: "1px solid rgba(255,255,255,0.35)",
                  }}
                >
                  <Image src="https://picsum.photos/id/0/800/400" height={130} fit="cover" />
                </Box>
                <Badge color="white" variant="light" mb="sm">오늘의 스니핏</Badge>
                <Badge color="rgba(255,255,255,0.2)" variant="filled" mb="sm">2026. 03. 04</Badge>
                <Title order={3} c="white" style={{ maxWidth: "52%" }}>
                  광고 레퍼런스 검색 통합 업데이트: 이미지 검색과 카피 검색 통합·필터·UI/UX 개선
                </Title>
              </Card>
            </Grid.Col>
            <Grid.Col span={3}>
              {/* 우측 사용자 후기 카드 */}
              <Card withBorder style={{ height: 220, backgroundColor: "#f8f9fc" }}>
                <Text size="xs" c="dimmed" mb="xs">스니핏과 함께 성장하는 마케터</Text>
                <Group gap="xs" mb="sm" wrap="nowrap">
                  <Image src="https://picsum.photos/id/64/56/56" width={28} height={28} radius="xl" />
                  <Text size="xs" fw={600}>@hee_may_</Text>
                </Group>
                <Text size="xs" c="dimmed" lineClamp={5}>
                  "메타 라이브러리 검색이든, 인스타 내 콘텐츠 검색이든 불편하다는 생각은 모든 마케터들이 하고 있을 거에요. 스니핏이 그 과정을 정말로 많이 개선해줬어요."
                </Text>
              </Card>
            </Grid.Col>
          </Grid>
        </Box>

        {/* Section 3: 다른 마케터들은 어떻게 활용하나요? */}
        <Box mb={80}>
          <Text c="snipitBlue" fw={700} mb="xs">
            다른 마케터들은 어떻게 활용하나요?
          </Text>
          <Title order={1} mb="xl">
            내게 가장 필요한 기능을 통해 시작해보세요
          </Title>

          <Grid>
            <Grid.Col span={6}>
              <Card shadow="sm" padding="xl" radius="md" withBorder style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Title order={3} mb="sm">
                  레퍼런스 검색
                </Title>
                <Text size="sm" c="dimmed" mb="lg" style={{ flex: 1 }}>
                  원하는 느낌의 이미지를 텍스트로 묘사하면, AI가 가장 유사한 레퍼런스를 찾아줍니다.
                </Text>
                <Group justify="space-between" align="flex-end">
                  <Anchor href="/search" fw={700} c="snipitBlue">시작하기 &gt;</Anchor>
                  <Image src="https://picsum.photos/id/10/120/120" width={120} height={120} radius="md" />
                </Group>
              </Card>
            </Grid.Col>

            <Grid.Col span={6}>
              <Card shadow="sm" padding="xl" radius="md" withBorder style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Title order={3} mb="sm">
                  경쟁사 모니터링 & 대시보드
                </Title>
                <Text size="sm" c="dimmed" mb="lg" style={{ flex: 1 }}>
                  경쟁사의 광고 집행 현황과 성과를 한눈에 파악하고 인사이트를 얻으세요.
                </Text>
                <Group justify="space-between" align="flex-end">
                  <Anchor href="/monitoring" fw={700} c="snipitBlue">시작하기 &gt;</Anchor>
                  <Image src="https://picsum.photos/id/11/120/120" width={120} height={120} radius="md" />
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Box>

        {/* Section 4: NEW 이 기능, 써보셨나요? + 실험실 */}
        <Box mb={80}>
          <Group gap="xs" mb="sm">
            <Text fw={700} c="red" size="lg">NEW</Text>
            <Title order={2}>이 기능, 써보셨나요?</Title>
            <Text c="dimmed">스니핏에 새롭게 업데이트된 기능을 확인해보세요.</Text>
          </Group>
          
          {/* 2개 기능 카드 (Grid 2열) */}
          <Grid mb="xl">
            <Grid.Col span={6}>
              <Card withBorder style={{display:"flex", flexDirection: "row", gap:16}}>
                <Image src="https://picsum.photos/id/20/200/150" width={160} height={120} radius="md" />
                <Box style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Title order={4} mb="xs">레퍼런스 검색</Title>
                  <Text size="sm" c="dimmed" mb="sm">더욱 강력해진 레퍼런스 검색 기능을 만나보세요.</Text>
                  <Anchor href="/search" size="sm" fw={700}>시작하기 &gt;</Anchor>
                </Box>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card withBorder style={{display:"flex", flexDirection: "row", gap:16}}>
                <Image src="https://picsum.photos/id/21/200/150" width={160} height={120} radius="md" />
                <Box style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Badge color="grape" variant="filled" size="sm" mb="xs" style={{ alignSelf: "flex-start" }}>PREMIUM</Badge>
                  <Title order={4} mb="xs">TikTok 경쟁사 대시보드</Title>
                  <Text size="sm" c="dimmed" mb="sm">경쟁사의 TikTok 소재와 성과를 분석해줘요.</Text>
                  <Anchor href="/monitoring" size="sm" fw={700}>시작하기 &gt;</Anchor>
                </Box>
              </Card>
            </Grid.Col>
          </Grid>
          
          {/* 실험실 미니섹션 */}
          <Group gap="xs" mb="sm">
            <Title order={2}>실험실</Title>
            <Text c="dimmed">스니핏에 추가될 기능을 가장 먼저 사용해보세요</Text>
          </Group>
          <Grid>
            <Grid.Col span={6}>
              <Card withBorder padding="md">
                <Group justify="space-between">
                  <Box>
                    <Title order={5} mb={4}>이미지로 비슷한 레퍼런스 찾기</Title>
                    <Text size="xs" c="dimmed">이미지를 업로드하면 비슷한 콘텐츠 레퍼런스를 추천해줘요.</Text>
                  </Box>
                  <Anchor href="/experiment" size="sm" fw={700}>시작하기 &gt;</Anchor>
                </Group>
              </Card>
            </Grid.Col>
            <Grid.Col span={6}>
              <Card withBorder padding="md">
                <Group justify="space-between">
                  <Box>
                    <Group gap="xs" mb={4}>
                      <Title order={5}>인스타그램 계정 분석</Title>
                      <Badge color="red" variant="filled" size="xs">NEW</Badge>
                    </Group>
                    <Text size="xs" c="dimmed">매일 3회 분석 가능. 계정의 컨셉과 인게이지를 분석하고 개선 방향을 제안해줘요.</Text>
                  </Box>
                  <Anchor href="/experiment" size="sm" fw={700}>시작하기 &gt;</Anchor>
                </Group>
              </Card>
            </Grid.Col>
          </Grid>
        </Box>

        {/* Section 5: 온보딩 가이드 카드 3개 */}
        <Box mb={80}>
          <SimpleGrid cols={3} spacing="md">
            {[
              { num: "#1", text: "레퍼런스 찾는 방식이 달라졌어요" },
              { num: "#2", text: "기준에 맞는 레퍼런스, 필터와 정렬로 확인해요" },
              { num: "#3", text: "경쟁사 콘텐츠를 자동 모니터링할 수 있어요" },
            ].map((item) => (
              <Card key={item.num} style={{
                background: "linear-gradient(135deg, #334FFF 0%, #687DFF 100%)",
                height: 200, borderRadius: 16, position: "relative", overflow: "hidden", cursor: "pointer"
              }}>
                <Badge color="rgba(255,255,255,0.2)" variant="filled" size="sm" mb="auto" style={{ alignSelf: "flex-start" }}>스니핏 시작하기</Badge>
                <Box style={{position: "absolute", bottom: 16, left: 16, right: 16}}>
                  <Text fw={700} c="white" size="lg">{item.num} {item.text}</Text>
                </Box>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        {/* Section 6: SNIPIT LOG */}
        <Box mb={80}>
          <Title order={1} fw={900} mb="xs">SNIPIT LOG</Title>
          <Text c="dimmed" mb="xl">베타테스트를 거치며 스니핏팀이 고군분투해온 이야기, 유저 분들을 위한 스니핏팀의 편지 등 다양한 이야기를 들려드려요.</Text>
          <SimpleGrid cols={3} spacing="lg">
            {mockBlogPosts.map((post) => (
              <Card key={post.id} withBorder padding={0} radius="md" style={{cursor:"pointer"}}>
                <Image src={post.imageUrl} height={160} fit="cover" />
                <Box p="md">
                  <Group gap="xs" mb="xs">
                    <Badge variant="outline" size="xs">{post.category}</Badge>
                    <Text size="xs" c="dimmed">{post.date}</Text>
                  </Group>
                  <Text fw={700} size="sm" lineClamp={2} mb="xs">{post.title}</Text>
                  <Text size="xs" c="dimmed" lineClamp={2} mb="sm">{post.description}</Text>
                  <Anchor size="xs" c="snipitBlue" fw={700}>ReadMore &gt;</Anchor>
                </Box>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
      </Container>

      {/* Section 7: 사용자 후기 */}
      <Box style={{background: "linear-gradient(180deg, #f8f9fc 0%, #eef0ff 100%)", padding: "60px 0", margin: "0 -24px"}}>
        <Container size="lg">
          <Title order={1} ta="center" mb="sm">100명의 베타테스터와 함께 만들어온 스니핏, 앞으로의 변화를 함께해주세요</Title>
          <Text ta="center" c="dimmed" mb="xl">스니핏 팀은 앞으로도, 마케터분들의 목소리에 귀 기울이며, 누구보다 빠르게 나아갈거예요.</Text>
          <SimpleGrid cols={4} spacing="md">
            {[
              { text: "한 곳에서 편하게 검색 가능하다는 점이 생산성을 정말 많이 올려줘요. 챗봇이 기대 이상으로 놀라웠는데요. 레퍼런스를 분석하고 마케팅 전략을 바로 쓸 수 있을 정도로 상세하게 제안해줘서 도움을 많이 받고 있습니다.", author: "1년차 콘텐츠 마케터 H님, 스타트업 근무" },
              { text: "콘텐츠 예시안 서칭에 도움을 많이 받고 있습니다. 인스타그램 피드로 시작한 검색 공간이 다양한 플랫폼으로 확장 개선되는 경험을 하게 되었는데, 원래도 좋았지만 검색 퀄리티가 확연히 올라가더라고요.", author: "4년차 콘텐츠 마케터 S님, 에이전시 근무" },
              { text: "이런 레퍼런스를 찾고 싶은데…라고 생각하면 정말 그 방향 그대로 결과가 나와서 놀랐어요. 검색하다가 엉뚱한 광고에 시간 쏟는 일이 확실히 적어졌어요.", author: "3년차 퍼포먼스 마케터 Y님, 인하우스 근무" },
              { text: "레퍼런스를 찾는 과정도 정말 편해졌는데, 레퍼런스 기반으로 직접 운영하는 채널과의 비교 분석이 매우 유의미 했습니다.", author: "8년차 그로스 마케터 P님, 에이전시 근무" },
            ].map((item, i) => (
              <Card key={item.author} withBorder padding="lg" radius="md" style={{ display: "flex", flexDirection: "column" }}>
                <Text size="xl" c="dimmed" mb="sm" fw={900}>"</Text>
                <Text size="sm" mb="lg" lineClamp={5} style={{ flex: 1 }}>{item.text}</Text>
                <Text size="xs" c="dimmed" ta="right">{item.author}</Text>
              </Card>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Section 8: CTA 버튼 */}
      <Box ta="center" py={60}>
        <Button
          size="xl"
          radius="xl"
          style={{background: "linear-gradient(135deg, #334FFF 0%, #687DFF 100%)"}}
          onClick={() => router.push("/search")}
        >
          로그인하고 무료로 시작하기
        </Button>
      </Box>

      {/* Section 9: 푸터 */}
      <Box style={{borderTop: "1px solid #e5e7eb", paddingTop: 40, paddingBottom: 40, textAlign: "center"}}>
        <Text fw={700} size="lg" mb="sm">스니핏</Text>
        <Text size="xs" c="dimmed" mb="xs">© 2026 Wessist Inc. All rights reserved.</Text>
        <Text size="xs" c="dimmed" mb="xs">(주) 위시스트 (대표자: 안홍준) | 사업자등록번호: 296-88-02970 | 통신판매업신고번호: 2026-서울관악-0064</Text>
        <Text size="xs" c="dimmed" mb="md">주소: 서울특별시 관악구 관악로 12길 10, 3층 (봉천동) | 이메일: support@snipit.im | 전화: 070-4134-9992</Text>
        <Group justify="center" gap="lg">
          <Anchor size="xs" c="dimmed">이용약관</Anchor>
          <Anchor size="xs" c="dimmed">개인정보처리방침</Anchor>
          <Anchor size="xs" c="dimmed">사업자 정보 확인</Anchor>
        </Group>
      </Box>
    </Box>
  );
}
