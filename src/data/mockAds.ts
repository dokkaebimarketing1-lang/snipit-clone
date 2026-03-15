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
  "야나두", "모두의연구소", "쏘카", "한끼통살", "풀라이트",
  "베리시", "무신사 스탠다드", "하림", "29CM", "아이샵케어",
  "메디테라피", "스위치온", "랭킹닭컴", "디에이이펙트", "올리브영",
  "토스", "당근마켓", "배달의민족", "마켓컬리", "브런치",
];

const copyTexts = [
  "지금 시작하면 50% 할인",
  "이 광고를 보고 있다면 당신도 이미 알고 있을 거예요",
  "절대 하지 마세요, 이걸 모르고 시작하면",
  "3일만에 완판된 비밀",
  "마케터가 숨기고 싶은 레퍼런스",
  "지금 바로 확인하세요",
  "이번 시즌 가장 핫한 트렌드",
  "당신의 피부가 달라집니다",
  "한 번 써보면 멈출 수 없는",
  "무료 체험 기회를 놓치지 마세요",
];

export const mockAds: AdCard[] = Array.from({ length: 40 }, (_, i) => ({
  id: `ad-${i + 1}`,
  imageUrl: mockImage(10 + i, 400, 300 + (i % 5) * 60),
  brandName: brands[i % brands.length],
  platform: (["meta", "instagram", "meta", "instagram", "google", "tiktok"] as const)[i % 6],
  mediaType: (["photo", "video", "reels", "carousel"] as const)[i % 4],
  status: i % 3 === 0 ? "inactive" : "active",
  publishedAt: `2026.${String(Math.floor(seeded(i * 11) * 3) + 1).padStart(2, "0")}.${String(Math.floor(seeded(i * 13) * 28) + 1).padStart(2, "0")}`,
  durationDays: Math.floor(seeded(i * 17) * 60) + 1,
  isSponsored: i % 5 === 0,
  sponsorName: i % 5 === 0 ? brands[(i + 3) % brands.length] : undefined,
  copyText: copyTexts[i % copyTexts.length],
  likes: Math.floor(seeded(i * 19) * 5000) + 100,
  comments: Math.floor(seeded(i * 23) * 500) + 10,
  views: Math.floor(seeded(i * 29) * 50000) + 1000,
}));

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
  { id: "b1", title: "광고 레퍼런스 검색 통합 업데이트: 이미지 검색과 카피 검색 통합·필터·UI/UX 개선", description: "광고 레퍼런스 검색을 통합해 이미지 검색·카피 검색을 한 번에 탐색할 수 있게 했습니다.", date: "2026.03.04", category: "제품스토리", imageUrl: "https://picsum.photos/id/1/400/250" },
  { id: "b2", title: "경쟁사 광고 분석: 메타 광고 라이브러리 랜딩페이지 통계 및 인스타그램 파트너십(PA) 광고 지표 업데이트", description: "메타 광고 라이브러리 경쟁사 모니터링에 랜딩페이지(URL) 통계와 인스타그램 파트너십 광고 분석 지표가 추가되었습니다.", date: "2026.02.23", category: "제품스토리", imageUrl: "https://picsum.photos/id/2/400/250" },
  { id: "b3", title: "지원 플랫폼 확장: TikTok 검색·모니터링 기능 업데이트", description: "이제 스니핏에서 TikTok 경쟁사 자동 모니터링과 콘텐츠 레퍼런스 탐색이 가능합니다.", date: "2026.02.12", category: "제품스토리", imageUrl: "https://picsum.photos/id/3/400/250" },
  { id: "b4", title: "인스타그램 계정 분석부터 경쟁사 모니터링 대시보드까지 – Instagram 분석 기능 업데이트", description: "계정의 인게이지먼트, 콘텐츠 유형, 성과 상위 게시물까지 구조화된 리포트로 확인할 수 있는 Instagram 계정 분석기가 추가되었습니다.", date: "2026.02.09", category: "제품스토리", imageUrl: "https://picsum.photos/id/4/400/250" },
  { id: "b5", title: "지원 플랫폼 확장: Google Ads 검색·모니터링 & 릴스 스크립트 자동 생성 기능 업데이트", description: "Google Ads 지원 시작! 이제 메타·인스타그램은 물론, 구글 디스플레이·유튜브 광고까지 한 번에 검색하고 모니터링하세요.", date: "2026.02.05", category: "제품스토리", imageUrl: "https://picsum.photos/id/5/400/250" },
  { id: "b6", title: "신규 프로모션: 스니핏 플랜 7일 무료 체험 시작 안내", description: "추천인 프로모션이 종료되고, 플랜을 결제하기 전 7일간 충분히 기능을 체험해볼 수 있는 무료 체험 프로모션이 시작됩니다.", date: "2026.02.04", category: "연결의 기록", imageUrl: "https://picsum.photos/id/6/400/250" },
];
