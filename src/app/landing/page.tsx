"use client";

import { Container, Button, Badge, Grid, Text, Box, Group, Stack, ThemeIcon } from "@mantine/core";
import { 
  IconSearch, 
  IconTypography, 
  IconPhoto, 
  IconRobot, 
  IconChartBar, 
  IconWorld, 
  IconFolder, 
  IconFilter, 
  IconBrowserCheck, 
  IconCheck,
  IconQuote,
  IconBrandInstagram,
  IconBrandBlogger,
  IconBrandX
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
          <div className={classes.navLinks}>
            <Link href="#features" className={classes.navLink}>기능소개</Link>
            <Link href="#pricing" className={classes.navLink}>플랜 안내</Link>
            <Link href="#faq" className={classes.navLink}>FAQ</Link>
            <Link href="#blog" className={classes.navLink}>스니핏로그</Link>
          </div>
          <Button component={Link} href="/" color="snipitBlue" radius="xl" fw={600}>
            시작하기
          </Button>
        </Container>
      </header>

      {/* Hero Section */}
      <section className={classes.hero}>
        <Container size="md">
          <Badge 
            variant="light" 
            color="snipitBlue" 
            size="lg" 
            radius="xl" 
            mb="xl"
            styles={{ root: { padding: '8px 16px', height: 'auto' }, label: { fontSize: '14px', fontWeight: 700 } }}
          >
            OPEN BETA
          </Badge>
          <h1 className={classes.heroTitle}>
            찾고 싶을 때 찾아지는<br />콘텐츠 레퍼런스
          </h1>
          <p className={classes.heroSubtitle}>
            레퍼런스 찾는 시간을 10배 줄여주는<br />AI 기반 광고 레퍼런스 검색 & 모니터링 플랫폼
          </p>
          <Button 
            component={Link} 
            href="/" 
            size="xl" 
            radius="xl" 
            variant="gradient" 
            gradient={{ from: '#334FFF', to: '#687DFF', deg: 135 }}
            style={{ boxShadow: '0 8px 24px rgba(51, 79, 255, 0.25)' }}
          >
            무료로 시작하기
          </Button>
        </Container>
      </section>

      {/* Feature Section 1: 검색 */}
      <section id="features" className={classes.section}>
        <Container size="lg">
          <h2 className={classes.sectionTitle}>머릿속 콘텐츠를 바로 찾아내는 검색</h2>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <div className={classes.featureCard}>
                <div className={classes.featureIcon}>
                  <IconPhoto size={28} stroke={1.5} />
                </div>
                <h3 className={classes.featureTitle}>이미지 기반 검색</h3>
                <p className={classes.featureDesc}>
                  무드, 카피, 색상 등 이미지 요소로 검색하여 원하는 느낌의 레퍼런스를 정확하게 찾아냅니다.
                </p>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <div className={classes.featureCard}>
                <div className={classes.featureIcon}>
                  <IconTypography size={28} stroke={1.5} />
                </div>
                <h3 className={classes.featureTitle}>카피라이트 검색</h3>
                <p className={classes.featureDesc}>
                  광고 카피 텍스트 기반 검색으로 특정 키워드나 메시지를 담은 광고를 쉽게 찾을 수 있습니다.
                </p>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <div className={classes.featureCard}>
                <div className={classes.featureIcon}>
                  <IconSearch size={28} stroke={1.5} />
                </div>
                <h3 className={classes.featureTitle}>유사 이미지 탐색</h3>
                <p className={classes.featureDesc}>
                  선택한 이미지와 비슷한 레퍼런스를 추천받아 아이디어를 무한히 확장할 수 있습니다.
                </p>
              </div>
            </Grid.Col>
          </Grid>
        </Container>
      </section>

      {/* Feature Section 2: 모니터링 */}
      <section className={classes.sectionGray}>
        <Container size="lg">
          <h2 className={classes.sectionTitle}>자동으로 쌓이는 경쟁사 모니터링</h2>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <div className={classes.featureCard}>
                <div className={classes.featureIcon}>
                  <IconRobot size={28} stroke={1.5} />
                </div>
                <h3 className={classes.featureTitle}>매일 자동 수집</h3>
                <p className={classes.featureDesc}>
                  한 번 설정하면 경쟁사 광고를 매일 자동으로 모니터링하여 최신 동향을 놓치지 않습니다.
                </p>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <div className={classes.featureCard}>
                <div className={classes.featureIcon}>
                  <IconChartBar size={28} stroke={1.5} />
                </div>
                <h3 className={classes.featureTitle}>분석 대시보드</h3>
                <p className={classes.featureDesc}>
                  게재 추이, 미디어 분포, 게재 기간 차트를 통해 경쟁사의 마케팅 전략을 한눈에 파악합니다.
                </p>
              </div>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <div className={classes.featureCard}>
                <div className={classes.featureIcon}>
                  <IconWorld size={28} stroke={1.5} />
                </div>
                <h3 className={classes.featureTitle}>글로벌 246개국</h3>
                <p className={classes.featureDesc}>
                  국내뿐만 아니라 해외 경쟁사도 모니터링 가능하여 글로벌 트렌드를 파악할 수 있습니다.
                </p>
              </div>
            </Grid.Col>
          </Grid>
        </Container>
      </section>

      {/* Feature Section 3: 보드 & 저장 */}
      <section className={classes.section}>
        <Container size="lg">
          <Grid gutter={60} align="center">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <h2 className={classes.sectionTitle} style={{ textAlign: 'left', marginBottom: '32px' }}>
                주목할 레퍼런스를<br />모아보는 보드
              </h2>
              <Stack gap="lg">
                <Group wrap="nowrap" align="flex-start">
                  <ThemeIcon size={48} radius="md" variant="light" color="snipitBlue">
                    <IconFolder size={24} stroke={1.5} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} size="lg" mb={4}>무제한 보드 생성</Text>
                    <Text c="dimmed">프로젝트별, 캠페인별로 무제한으로 보드를 생성하여 관리하세요.</Text>
                  </div>
                </Group>
                <Group wrap="nowrap" align="flex-start">
                  <ThemeIcon size={48} radius="md" variant="light" color="snipitBlue">
                    <IconFilter size={24} stroke={1.5} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} size="lg" mb={4}>폴더 분류 + 필터</Text>
                    <Text c="dimmed">체계적인 폴더 분류와 강력한 필터 기능으로 원하는 자료를 빠르게 찾습니다.</Text>
                  </div>
                </Group>
                <Group wrap="nowrap" align="flex-start">
                  <ThemeIcon size={48} radius="md" variant="light" color="snipitBlue">
                    <IconBrowserCheck size={24} stroke={1.5} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} size="lg" mb={4}>크롬 확장 프로그램으로 즉시 저장</Text>
                    <Text c="dimmed">웹 서핑 중 발견한 좋은 레퍼런스를 클릭 한 번으로 내 보드에 저장하세요.</Text>
                  </div>
                </Group>
                <Group wrap="nowrap" align="flex-start">
                  <ThemeIcon size={48} radius="md" variant="light" color="snipitBlue">
                    <IconChartBar size={24} stroke={1.5} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} size="lg" mb={4}>콘텐츠 정보 및 성과 자동 첨부</Text>
                    <Text c="dimmed">저장된 레퍼런스의 상세 정보와 성과 데이터가 자동으로 함께 저장됩니다.</Text>
                  </div>
                </Group>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Box 
                style={{ 
                  background: 'linear-gradient(135deg, #f0f4ff 0%, #e5eaff 100%)', 
                  borderRadius: '24px', 
                  height: '500px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--mantine-color-gray-2)'
                }}
              >
                <Text c="dimmed" fw={500}>보드 UI 이미지 영역</Text>
              </Box>
            </Grid.Col>
          </Grid>
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
