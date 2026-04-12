export type Platform = "meta" | "instagram" | "google" | "tiktok" | "youtube";

export type MediaType = "photo" | "video" | "reels" | "carousel";

export type AdStatus = "active" | "inactive";

export type SearchMode = "similarity" | "copywrite";

export type MediaTag = '메타' | '네이버GFA' | '구글' | '크리테오' | '데이블' | '타불라' | '틱톡' | '당근' | '릴스' | '쇼츠' | '기타';

export const MEDIA_TAGS: MediaTag[] = ['메타','네이버GFA','구글','크리테오','데이블','타불라','틱톡','당근','릴스','쇼츠','기타'];

export interface AdCard {
  id: string;
  imageUrl: string;
  imageUrls?: string[];
  brandName: string;
  platform: Platform;
  mediaType: MediaType;
  status: AdStatus;
  publishedAt: string;
  durationDays: number;
  isSponsored: boolean;
  sponsorName?: string;
  externalUrl?: string;
  copyText?: string;
  fullCopyText?: string | null;
  landingUrl?: string | null;
  ctaText?: string | null;
  likes?: number;
  comments?: number;
  views?: number;
  saves?: number;
  mediaTag?: MediaTag;
  hashtags?: string[];
  memo?: string;
  isUploaded?: boolean;
  savedBy?: string;
  savedByAvatar?: string;
  category?: string;
  landingUrl?: string;
  ctaText?: string;
}

export interface Competitor {
  id: string;
  name: string;
  platform: Platform;
  avatarUrl: string;
  adsCount: number;
  activeAds: number;
  lastUpdated: string;
  country: string;
}

export interface Board {
  id: string;
  name: string;
  folderId?: string;
  itemCount: number;
  thumbnails: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  boards: Board[];
}

export interface MonitoringStats {
  totalAds: number;
  activeAds: number;
  inactiveAds: number;
  avgDuration: number;
  mediaDistribution: {
    photo: number;
    video: number;
    carousel: number;
  };
  dailyAdCounts: {
    date: string;
    count: number;
  }[];
}

export interface InstagramAnalysis {
  accountName: string;
  followers: number;
  following: number;
  posts: number;
  avgLikes: number;
  avgComments: number;
  avgViews: number;
  engagementRate: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  topPosts: {
    imageUrl: string;
    likes: number;
    comments: number;
    reason: string;
  }[];
}

export interface SearchFilter {
  platform?: Platform | "all";
  mediaType?: MediaType | "all";
  dateRange?: { start: string; end: string };
  minLikes?: number;
  minComments?: number;
  minViews?: number;
  minDuration?: number;
  category?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}
