"use client";

import { Container, Button, Badge, Grid, Text, Box, Group, Tabs, TextInput } from "@mantine/core";
import {
  IconSearch,
  IconCheck,
  IconQuote,
  IconBrandInstagram,
  IconBrandBlogger,
  IconBrandX,
} from "@tabler/icons-react";
import Link from "next/link";
import classes from "./landing.module.css";

export default function LandingPage() {
  return (
    <main>
      {/* Header */}
      <header className={classes.header}>
        <Container size="lg" className={classes.headerInner}>
          <Link href="/landing" className={classes.logo}>
            스니핏
          </Link>

          <Group gap={14} wrap="nowrap" className={classes.navLinks}>
            <Link href="#features" className={classes.navLink}>기능소개</Link>
            <Text c="snipitBlue.4" fw={700} size="sm">◆</Text>
            <Link href="#pricing" className={classes.navLink}>플랜 안내</Link>
            <Text c="snipitBlue.4" fw={700} size="sm">◆</Text>
            <Link href="#faq" className={classes.navLink}>FAQ</Link>
            <Text c="snipitBlue.4" fw={700} size="sm">◆</Text>
            <Link href="#blog" className={classes.navLink}>스니핏로그</Link>
          </Group>

          <Group gap="sm" wrap="nowrap">
            <Badge
              variant="light"
              radius="xl"
              styles={{
                root: {
                  background: "linear-gradient(135deg, #ffebe4 0%, #ffe6df 50%, #ffe6f2 100%)",
                  color: "#e8590c",
                  border: "1px solid #ffd2c4",
                  padding: "6px 12px",
                  height: "auto",
                },
                label: { fontWeight: 700, fontSize: 12 },
              }}
            >
              프리미엄 기능도 7일 무료로 체험해보세요
            </Badge>
            <Link href="/" className={classes.navLink}>로그인</Link>
            <Button component={Link} href="/" variant="outline" color="snipitBlue" radius="xl" fw={700}>
              무료로 시작하기
            </Button>
          </Group>
        </Container>
      </header>

      {/* Hero Section */}
      <section className={classes.hero}>
        <Container size="md">
          <Text
            fw={800}
            mb="sm"
            style={{
              fontSize: "28px",
              letterSpacing: "-0.04em",
              lineHeight: 1.35,
              background: "linear-gradient(90deg, #ff4d4f 0%, #ff922b 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            그 릴스 분명 봤는데... 도무지 찾을 수가 없어요
          </Text>

          <h1 className={classes.heroTitle} style={{ marginBottom: "18px" }}>
            찾고싶을 때 <span style={{
              background: "linear-gradient(90deg, #334fff 0%, #5f78ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>찾아지는</span> 콘텐츠 레퍼런스, <span style={{
              background: "linear-gradient(90deg, #334fff 0%, #5f78ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>스니핏</span>
          </h1>

          <p className={classes.heroSubtitle} style={{ marginBottom: "34px" }}>
            마케터가 보고 싶은 레퍼런스에 가장 빠르게 도달하는 방법
          </p>

          <Box
            style={{
              border: "1px solid #e9ecef",
              borderRadius: 18,
              background: "#fff",
              padding: "16px 16px 14px",
              boxShadow: "0 14px 34px rgba(12, 34, 88, 0.08)",
              maxWidth: 860,
              margin: "0 auto",
            }}
          >
            <Tabs defaultValue="search" keepMounted={false}>
              <Tabs.List grow>
                <Tabs.Tab value="search">머릿속 콘텐츠를 찾아내는 검색</Tabs.Tab>
                <Tabs.Tab value="monitoring">자동으로 쌓이는 경쟁사 모니터링</Tabs.Tab>
                <Tabs.Tab value="board">주목할 레퍼런스를 모아보는 광고 보드</Tabs.Tab>
              </Tabs.List>
            </Tabs>

            <TextInput
              mt="md"
              size="lg"
              radius="xl"
              placeholder="그때 봤던 뷰티 릴스, 맑은 피부톤 + 흰 배경 + 짧은 후킹 카피"
              leftSection={<IconSearch size={18} color="#868e96" />}
              rightSection={<IconSearch size={18} color="#adb5bd" />}
              styles={{
                input: {
                  border: "1px solid #dee2e6",
                  boxShadow: "0 6px 20px rgba(51, 79, 255, 0.05)",
                  height: 52,
                },
              }}
            />

            <Text size="sm" c="dimmed" mt="sm" ta="left">
              TIP : 테마와 분위기, 목적성이 드러나는 검색어를 입력해보세요. 릴스나 광고, 플랫폼 별 보기도 가능해요.
            </Text>
          </Box>
        </Container>
      </section>

      {/* Feature Section */}
      <section id="features" className={classes.section}>
        <Container size="lg">
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <div className={classes.featureCard}>
                <h3 className={classes.featureTitle}>찾는 방식을 바꿉니다</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--mantine-color-gray-6)", lineHeight: 1.75 }}>
                  <li>보고 있던 장면, 톤, 카피를 한 번에 검색합니다.</li>
                  <li>키워드와 분위기를 조합해 필요한 레퍼런스로 좁혀갑니다.</li>
                  <li>기억에 남은 릴스를 유사 탐색으로 빠르게 다시 찾습니다.</li>
                </ul>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <div className={classes.featureCard}>
                <h3 className={classes.featureTitle}>반복 탐색을 자동화합니다</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--mantine-color-gray-6)", lineHeight: 1.75 }}>
                  <li>관심 경쟁사를 등록하면 매일 신규 광고가 자동 수집됩니다.</li>
                  <li>성과 지표와 집행 기간 변화를 한 화면에서 확인합니다.</li>
                  <li>놓치기 쉬운 소재 변화를 지속적으로 추적합니다.</li>
                </ul>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <div className={classes.featureCard}>
                <h3 className={classes.featureTitle}>레퍼런스를 바로 저장합니다.</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: "var(--mantine-color-gray-6)", lineHeight: 1.75 }}>
                  <li>찾은 레퍼런스를 보드에 즉시 저장하고 분류합니다.</li>
                  <li>캠페인/브랜드 기준으로 팀 레퍼런스를 체계화합니다.</li>
                  <li>재탐색 없이 필요한 순간 빠르게 꺼내 씁니다.</li>
                </ul>
              </div>
            </Grid.Col>
          </Grid>
        </Container>
      </section>

      {/* Productivity Section */}
      <section className={classes.sectionGray}>
        <Container size="lg" style={{ textAlign: "center" }}>
          <Badge variant="light" color="snipitBlue" radius="xl" mb="md">마케터를 위한 생산성</Badge>
          <h2 className={classes.sectionTitle} style={{ marginBottom: "16px" }}>
            검색으로 도달하고, 모니터링으로 방향을 잡고, 보드로 쌓아가는
            <br />
            마케터를 위한 새로운 레퍼런스 탐색 방식
          </h2>
          <Text size="lg" c="dimmed" maw={820} mx="auto">
            찾고 싶은 순간에 곧바로 도달하고, 반복 리서치를 자동화하고, 팀의 인사이트를 자산으로 남기는 흐름을 스니핏에서 완성하세요.
          </Text>
        </Container>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={classes.sectionGray}>
        <Container size="xl">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 className={classes.sectionTitle} style={{ marginBottom: '16px' }}>스니핏 플랜 안내</h2>
            <Text size="lg" c="dimmed">내가 찾고 싶은 레퍼런스를 더 많이, 더 빠르게, 더 정확하게</Text>
          </div>
          
          <Grid gutter="md">
            {/* Free Plan */}
            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <div className={classes.pricingCard}>
                <div className={classes.pricingName}>Free</div>
                <div className={classes.pricingPrice}>무료</div>
                <ul className={classes.pricingFeatures}>
                  <li className={classes.pricingFeature}>
                    <IconCheck size={20} color="var(--mantine-color-snipitBlue-6)" />
                    <span>8시간마다 5회 검색</span>
                  </li>
                  <li className={classes.pricingFeature}>
                    <IconCheck size={20} color="var(--mantine-color-snipitBlue-6)" />
                    <span>최대 2개 경쟁사 모니터링</span>
                  </li>
                </ul>
                <Button variant="light" color="gray" radius="md" size="md" fullWidth>
                  시작하기
                </Button>
              </div>
            </Grid.Col>

            {/* Light Plan */}
            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <div className={classes.pricingCard}>
                <div className={classes.pricingName}>Light</div>
                <div className={classes.pricingPrice}>₩12,900<span>/월</span></div>
                <ul className={classes.pricingFeatures}>
                  <li className={classes.pricingFeature}>
                    <IconCheck size={20} color="var(--mantine-color-snipitBlue-6)" />
                    <span>매일 50회 검색</span>
                  </li>
                  <li className={classes.pricingFeature}>
                    <IconCheck size={20} color="var(--mantine-color-snipitBlue-6)" />
                    <span>최대 2개 경쟁사 모니터링</span>
                  </li>
                </ul>
                <Button variant="light" color="snipitBlue" radius="md" size="md" fullWidth>
                  7일 무료 시작
                </Button>
              </div>
            </Grid.Col>

            {/* Basic Plan */}
            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <div className={`${classes.pricingCard} ${classes.pricingCardRecommended}`}>
                <div className={classes.pricingBadge}>추천</div>
                <div className={classes.pricingName}>Basic</div>
                <div className={classes.pricingPrice}>₩32,900<span>/월</span></div>
                <ul className={classes.pricingFeatures}>
                  <li className={classes.pricingFeature}>
                    <IconCheck size={20} color="var(--mantine-color-snipitBlue-6)" />
                    <span>매일 100회 검색</span>
                  </li>
                  <li className={classes.pricingFeature}>
                    <IconCheck size={20} color="var(--mantine-color-snipitBlue-6)" />
                    <span>최대 20개 경쟁사 모니터링</span>
                  </li>
                </ul>
                <Button variant="filled" color="snipitBlue" radius="md" size="md" fullWidth>
                  7일 무료 시작
                </Button>
              </div>
            </Grid.Col>

            {/* Premium Plan */}
            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <div className={classes.pricingCard}>
                <div className={classes.pricingName}>Premium</div>
                <div className={classes.pricingPrice}>₩150,000<span>/월</span></div>
                <ul className={classes.pricingFeatures}>
                  <li className={classes.pricingFeature}>
                    <IconCheck size={20} color="var(--mantine-color-snipitBlue-6)" />
                    <span>매일 500회 검색</span>
                  </li>
                  <li className={classes.pricingFeature}>
                    <IconCheck size={20} color="var(--mantine-color-snipitBlue-6)" />
                    <span>최대 100개 경쟁사 모니터링</span>
                  </li>
                  <li className={classes.pricingFeature}>
                    <IconCheck size={20} color="var(--mantine-color-snipitBlue-6)" />
                    <span>글로벌 모니터링 지원</span>
                  </li>
                </ul>
                <Button variant="light" color="snipitBlue" radius="md" size="md" fullWidth>
                  7일 무료 시작
                </Button>
              </div>
            </Grid.Col>
          </Grid>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className={classes.section}>
        <Container size="lg">
          <h2 className={classes.sectionTitle}>유저들이 말하는 스니핏을 써야 하는 이유</h2>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <div className={classes.testimonialCard}>
                <IconQuote size={32} color="var(--mantine-color-gray-3)" style={{ marginBottom: '16px' }} />
                <p className={classes.testimonialQuote}>
                  "레퍼런스 기반 비교 분석이 매우 유의미했습니다."
                </p>
                <div className={classes.testimonialAuthor}>
                  <div className={classes.testimonialAvatar}>P</div>
                  <div className={classes.testimonialInfo}>
                    <span className={classes.testimonialName}>P님</span>
                    <span className={classes.testimonialRole}>8년차 그로스 마케터</span>
                  </div>
                </div>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <div className={classes.testimonialCard}>
                <IconQuote size={32} color="var(--mantine-color-gray-3)" style={{ marginBottom: '16px' }} />
                <p className={classes.testimonialQuote}>
                  "챗봇이 마케팅 전략을 바로 쓸 수 있을 정도로 상세하게 제안해줘요."
                </p>
                <div className={classes.testimonialAuthor}>
                  <div className={classes.testimonialAvatar}>H</div>
                  <div className={classes.testimonialInfo}>
                    <span className={classes.testimonialName}>H님</span>
                    <span className={classes.testimonialRole}>1년차 콘텐츠 마케터</span>
                  </div>
                </div>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <div className={classes.testimonialCard}>
                <IconQuote size={32} color="var(--mantine-color-gray-3)" style={{ marginBottom: '16px' }} />
                <p className={classes.testimonialQuote}>
                  "메타 라이브러리 확장 후 검색 퀄리티가 확연히 올라갔어요."
                </p>
                <div className={classes.testimonialAuthor}>
                  <div className={classes.testimonialAvatar}>S</div>
                  <div className={classes.testimonialInfo}>
                    <span className={classes.testimonialName}>S님</span>
                    <span className={classes.testimonialRole}>4년차 콘텐츠 마케터</span>
                  </div>
                </div>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <div className={classes.testimonialCard}>
                <IconQuote size={32} color="var(--mantine-color-gray-3)" style={{ marginBottom: '16px' }} />
                <p className={classes.testimonialQuote}>
                  "이런 레퍼런스 찾고 싶은데... 그 방향 그대로 결과가 나와서 놀랐어요."
                </p>
                <div className={classes.testimonialAuthor}>
                  <div className={classes.testimonialAvatar}>Y</div>
                  <div className={classes.testimonialInfo}>
                    <span className={classes.testimonialName}>Y님</span>
                    <span className={classes.testimonialRole}>3년차 퍼포먼스 마케터</span>
                  </div>
                </div>
              </div>
            </Grid.Col>
          </Grid>
        </Container>
      </section>

      {/* CTA Section */}
      <section className={classes.ctaSection}>
        <Container size="md">
          <h2 className={classes.ctaTitle}>지금 가장 찾고 싶은 레퍼런스는 무엇인가요?</h2>
          <p className={classes.ctaSubtitle}>무엇이든 스니핏에서 찾아보세요</p>
          <Button 
            component={Link} 
            href="/" 
            size="xl" 
            radius="xl" 
            color="white" 
            variant="white"
            c="snipitBlue.6"
            fw={700}
            style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)' }}
          >
            보고 싶은 레퍼런스 만나보기
          </Button>
        </Container>
      </section>

      {/* Footer */}
      <footer className={classes.footer}>
        <Container size="lg">
          <div className={classes.footerLogo}>스니핏</div>
          <p className={classes.footerText}>(주) 위시스트 | 대표: 안홍준 | 사업자등록번호: 296-88-02970</p>
          <p className={classes.footerText}>서울특별시 관악구 관악로12길 10, 3층</p>
          
          <div className={classes.footerLinks}>
            <Link href="/" className={classes.footerLink}>이용약관</Link>
            <Link href="/" className={classes.footerLink}>개인정보 처리방침</Link>
          </div>
          
          <div className={classes.footerBottom}>
            <Text size="sm" c="gray.5">© 2026 Wessist, Inc. All rights reserved.</Text>
            <div className={classes.socialLinks}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={classes.socialLink}><IconBrandInstagram size={24} stroke={1.5} /></a>
              <a href="https://blog.naver.com" target="_blank" rel="noopener noreferrer" className={classes.socialLink}><IconBrandBlogger size={24} stroke={1.5} /></a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className={classes.socialLink}><IconBrandX size={24} stroke={1.5} /></a>
            </div>
          </div>
        </Container>
      </footer>
    </main>
  );
}
