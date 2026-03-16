import { AdCard, Competitor, Board, Folder, MonitoringStats } from "@/types";

const CDN = "https://picsum.photos";

function mockImage(id: number, w = 400, h = 500): string {
  return `${CDN}/id/${id}/${w}/${h}`;
}

// Seeded pseudo-random for deterministic hydration
const seeded = (seed: number) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

const brands = [
  "올리브영",
  "무신사",
  "마켓컬리",
  "배달의민족",
  "토스",
  "당근마켓",
  "야놀자",
  "카카오",
  "네이버",
  "쿠팡",
  "Atchacha",
  "Snipit",
  "뷔 fwee",
  "고이장례연구소",
  "Kamill Korea",
  "Meditherapy",
  "로더랫 L'odeurlette",
  "Meal It",
  "CNP Cosmetics",
  "닥터지",
  "이니스프리",
  "라네즈",
  "설화수",
  "에뛰드",
  "미샤",
  "스킨푸드",
  "아모레퍼시픽",
  "LG생활건강",
  "클리오",
  "롬앤",
];

const copyTexts = [
  "매일 1만개 이상 판매! 단독 기획",
  "설 한정 대용량 1+1",
  "연말 감사제 1+1 EVENT",
  "신규 가입자 특별 혜택",
  "오늘만 1+1+1",
  "첫 구매 30% 할인",
  "베스트셀러 재입고 기념 특가",
  "지금 담으면 무료배송 쿠폰 즉시 지급",
  "리뷰 5천건 돌파, 고객 만족템",
  "주말 한정 브랜드데이 최대 60%",
  "앱 전용 쿠폰팩 증정",
  "단 48시간, 품절 전 마지막 찬스",
  "신제품 런칭 기념 사은품 증정",
  "카카오톡 친구 추가 시 추가 할인",
  "타임딜 종료 임박, 지금 확인하세요",
];

const imageIds = [
  3, 7, 9, 12, 15, 18, 21, 24, 27, 30,
  33, 36, 39, 42, 45, 48, 51, 54, 57, 60,
  63, 66, 69, 72, 75, 78, 81, 84, 87, 90,
  93, 96, 99, 5, 11, 17, 23, 29, 35, 41,
];

const imageSizes: Array<[number, number]> = [
  [400, 500],
  [600, 400],
  [420, 560],
  [480, 640],
  [560, 420],
  [450, 600],
  [520, 680],
  [640, 430],
];

export const mockAds: AdCard[] = Array.from({ length: 40 }, (_, i) => {
  const [w, h] = imageSizes[i % imageSizes.length];
  const brandName = brands[i % brands.length];

  return {
    id: `ad-${i + 1}`,
    imageUrl: mockImage(imageIds[i], w, h),
    brandName,
    platform: (["meta", "instagram", "google", "tiktok", "meta", "instagram"] as const)[i % 6],
    mediaType: (["photo", "video", "carousel", "reels"] as const)[i % 4],
    status: i % 4 === 0 ? "inactive" : "active",
    publishedAt: `2025.${String(Math.floor(seeded(i * 11) * 12) + 1).padStart(2, "0")}.${String(Math.floor(seeded(i * 13) * 28) + 1).padStart(2, "0")}`,
    durationDays: Math.floor(seeded(i * 17) * 45) + 7,
    isSponsored: i % 5 === 0,
    sponsorName: i % 5 === 0 ? brands[(i + 4) % brands.length] : undefined,
    externalUrl: `https://ads.example.com/${encodeURIComponent(brandName)}/${i + 1}`,
    copyText: copyTexts[i % copyTexts.length],
    likes: Math.floor(seeded(i * 19) * 5000) + 500,
    comments: Math.floor(seeded(i * 23) * 900) + 30,
    views: Math.floor(seeded(i * 29) * 120000) + 3000,
  };
});

export const mockCompetitors: Competitor[] = [
  { id: "c1", name: "올리브영", platform: "meta", avatarUrl: mockImage(50, 80, 80), adsCount: 342, activeAds: 28, lastUpdated: "2026.03.15", country: "KR" },
  { id: "c2", name: "무신사", platform: "meta", avatarUrl: mockImage(51, 80, 80), adsCount: 567, activeAds: 45, lastUpdated: "2026.03.15", country: "KR" },
  { id: "c3", name: "29CM", platform: "instagram", avatarUrl: mockImage(52, 80, 80), adsCount: 189, activeAds: 12, lastUpdated: "2026.03.14", country: "KR" },
  { id: "c4", name: "마켓컬리", platform: "meta", avatarUrl: mockImage(53, 80, 80), adsCount: 423, activeAds: 31, lastUpdated: "2026.03.15", country: "KR" },
  { id: "c5", name: "토스", platform: "google", avatarUrl: mockImage(54, 80, 80), adsCount: 256, activeAds: 19, lastUpdated: "2026.03.13", country: "KR" },
  { id: "c6", name: "당근마켓", platform: "instagram", avatarUrl: mockImage(55, 80, 80), adsCount: 145, activeAds: 8, lastUpdated: "2026.03.14", country: "KR" },
];

export const mockBoards: Board[] = [
  { id: "b1", name: "2026 봄 캠페인 레퍼런스", folderId: "f1", itemCount: 24, thumbnails: [mockImage(20, 200, 200), mockImage(21, 200, 200), mockImage(22, 200, 200), mockImage(23, 200, 200)], createdAt: "2026.02.10", updatedAt: "2026.03.14" },
  { id: "b2", name: "경쟁사 위닝소재", folderId: "f1", itemCount: 18, thumbnails: [mockImage(30, 200, 200), mockImage(31, 200, 200), mockImage(32, 200, 200), mockImage(33, 200, 200)], createdAt: "2026.01.15", updatedAt: "2026.03.12" },
  { id: "b3", name: "릴스 후킹 모음", folderId: "f2", itemCount: 35, thumbnails: [mockImage(40, 200, 200), mockImage(41, 200, 200), mockImage(42, 200, 200), mockImage(43, 200, 200)], createdAt: "2026.02.20", updatedAt: "2026.03.15" },
  { id: "b4", name: "미니멀 디자인", itemCount: 12, thumbnails: [mockImage(60, 200, 200), mockImage(61, 200, 200), mockImage(62, 200, 200), mockImage(63, 200, 200)], createdAt: "2026.03.01", updatedAt: "2026.03.10" },
  { id: "b5", name: "카피라이팅 인사이트", folderId: "f2", itemCount: 29, thumbnails: [mockImage(70, 200, 200), mockImage(71, 200, 200), mockImage(72, 200, 200), mockImage(73, 200, 200)], createdAt: "2026.01.28", updatedAt: "2026.03.13" },
];

export const mockFolders: Folder[] = [
  { id: "f1", name: "캠페인 리서치", boards: mockBoards.filter((b) => b.folderId === "f1") },
  { id: "f2", name: "콘텐츠 아이디어", boards: mockBoards.filter((b) => b.folderId === "f2") },
];

export const mockMonitoringStats: MonitoringStats = {
  totalAds: 342,
  activeAds: 28,
  inactiveAds: 314,
  avgDuration: 14.2,
  mediaDistribution: { photo: 45, video: 30, carousel: 25 },
  dailyAdCounts: Array.from({ length: 30 }, (_, i) => ({
    date: `03.${String(i + 1).padStart(2, "0")}`,
    count: Math.floor(seeded(i * 31) * 8) + 1,
  })),
};

export const searchTags = [
  "캐릭터 콜라보 화장품",
  "3D 일러스트",
  "인물 중심 라이프스타일",
  "AI 생성 비주얼",
  "타이포그래피 강조",
  "미니멀 화이트톤",
  "감성 카페 인테리어",
  "푸드 클로즈업",
];

export const aiCategories = [
  "1+1 프로모션",
  "행동 유도 CTA",
  "타겟 페르소나",
  "고객 후기",
  "첫 구매 혜택",
  "올영세일",
  "캐릭터 콜라보",
  "신제품",
  "제품력 강조",
  "톤",
  "1위 강조",
  "공식 스토어",
  "시즌 한정",
  "비포/애프터",
  "감성 무드",
];

export const categories = [
  "뷰티/화장품", "패션/의류", "F&B/식음료", "테크/IT",
  "금융/핀테크", "여행/레저", "교육/자기계발", "리빙/인테리어",
  "헬스/피트니스", "엔터테인먼트",
];

export interface BlogPost {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  imageUrl: string;
}

export const mockBlogPosts: BlogPost[] = [
  {
    id: "1",
    category: "제품스토리",
    title: "광고 레퍼런스 검색 통합 업데이트: 이미지 검색과 카피 검색 통합·필터·UI/UX 개선",
    date: "2026.03.04",
    description: "광고 레퍼런스 검색을 통합해 이미지 검색과 카피 검색을 한 번에 탐색하고, 필터와 탐색 UI를 더 빠르게 개선했습니다.",
    imageUrl: "https://picsum.photos/id/14/400/250",
  },
  {
    id: "2",
    category: "제품스토리",
    title: "경쟁사 광고 분석: 메타 광고 라이브러리 랜딩페이지 통계 및 인스타그램 파트너십(PA) 광고 지표 업데이트",
    date: "2026.02.23",
    description: "메타 광고 라이브러리 경쟁사 모니터링에 랜딩페이지 URL 통계와 인스타그램 파트너십 광고 지표를 추가해 인사이트 파악 속도를 높였습니다.",
    imageUrl: "https://picsum.photos/id/16/400/250",
  },
  {
    id: "3",
    category: "제품스토리",
    title: "지원 플랫폼 확장: TikTok 검색·모니터링 기능 업데이트",
    date: "2026.02.12",
    description: "이제 스니핏에서 TikTok 광고도 검색하고 경쟁사 신규 소재를 자동 모니터링하며 트렌드를 빠르게 확인할 수 있습니다.",
    imageUrl: "https://picsum.photos/id/22/400/250",
  },
  {
    id: "4",
    category: "제품스토리",
    title: "인스타그램 계정 분석부터 경쟁사 모니터링 대시보드까지 – Instagram 분석 기능 업데이트",
    date: "2026.02.09",
    description: "계정 인게이지먼트, 콘텐츠 유형, 성과 상위 게시물을 구조화된 리포트로 확인할 수 있는 Instagram 분석 기능을 제공합니다.",
    imageUrl: "https://picsum.photos/id/28/400/250",
  },
  {
    id: "5",
    category: "제품스토리",
    title: "지원 플랫폼 확장: Google Ads 검색·모니터링 & 릴스 스크립트 자동 생성 기능 업데이트",
    date: "2026.02.05",
    description: "Google Ads 지원이 추가되어 메타·인스타그램·구글 광고를 한 번에 탐색하고, 릴스 스크립트를 자동 생성할 수 있습니다.",
    imageUrl: "https://picsum.photos/id/34/400/250",
  },
  {
    id: "6",
    category: "연결의 기록",
    title: "신규 프로모션 : 스니핏 플랜 7일 무료 체험 시작 안내",
    date: "2026.02.04",
    description: "신규 플랜 도입 기념으로 결제 전 7일 무료 체험을 제공하며, 팀 온보딩 가이드와 추천 레퍼런스 큐레이션을 함께 지원합니다.",
    imageUrl: "https://picsum.photos/id/38/400/250",
  },
];
