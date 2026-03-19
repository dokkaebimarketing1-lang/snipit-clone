"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Title,
  TextInput,
  SegmentedControl,
  Group,
  Badge,
  Box,
  Select,
  ActionIcon,
  Text,
  ScrollArea,
  Loader,
  Button,
  Anchor,
} from "@mantine/core";
import { IconSearch, IconSortDescending } from "@tabler/icons-react";
import { AdCard } from "@/components/cards/AdCard";
import { MasonryGrid } from "@/components/common/MasonryGrid";
import { PaywallOverlay } from "@/components/common/PaywallOverlay";
import { DiscoveryData } from "@/app/actions/search";
import { SearchMode, AdCard as AdCardType } from "@/types";

const CATEGORIES = ["전체", "뷰티", "건강식품", "패션", "헬스/운동", "식품/배달", "테크/앱", "리빙", "건강기기", "기타"];
const TOP_BRANDS = ["올리브영", "무신사", "토스", "마켓컬리", "정관장"];

export default function SearchPage() {
  const router = useRouter();
  const [searchMode, setSearchMode] = useState<SearchMode>("similarity");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<AdCardType[]>([]);
  const [popularResults, setPopularResults] = useState<AdCardType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  
  // New state for filtering, sorting, pagination
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("scraped_at");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Discovery state
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDiscoveryData = async () => {
      setIsLoadingFeatured(true);
      try {
        const res = await fetch("/api/search/discover");
        const data = await res.json();
        if (!isMounted) return;
        setDiscoveryData(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setIsLoadingFeatured(false);
      }
    };

    loadDiscoveryData();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchResults = async (
    query: string,
    currentCategory: string,
    currentSort: string,
    currentPage: number,
    isLoadMore = false
  ) => {
    const searchText = query;
    
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsSearching(true);
      setHasSearched(true);
    }

    try {
      const params = new URLSearchParams({
        q: searchText,
        mode: searchMode,
        category: currentCategory,
        sort: currentSort,
        page: currentPage.toString(),
        limit: "24",
      });

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        const mapped: AdCardType[] = data.results.map(
          (r: Record<string, unknown>) => ({
            id: r.id as string,
            imageUrl: r.imageUrl as string,
            imageUrls: (r.imageUrls as string[]) ?? [],
            brandName: r.brandName as string,
            platform: r.platform as string,
            mediaType: r.mediaType as string,
            status: r.status as string,
            publishedAt: r.publishedAt as string,
            durationDays: r.durationDays as number,
            isSponsored: r.isSponsored as boolean,
            copyText: r.copyText as string,
            fullCopyText: (r.fullCopyText as string) ?? "",
            landingUrl: (r.landingUrl as string) ?? null,
            ctaText: (r.ctaText as string) ?? null,
          })
        );
        
        if (isLoadMore) {
          setResults((prev) => [...prev, ...mapped]);
        } else {
          setPopularResults(mapped.slice(0, 6));
          setResults(mapped.slice(6));
        }
        setTotalCount(data.totalCount || 0);
      } else if (!isLoadMore) {
        setPopularResults([]);
        setResults([]);
        setTotalCount(0);
      }
    } catch {
      if (!isLoadMore) {
        setPopularResults([]);
        setResults([]);
        setTotalCount(0);
      }
    }
    
    setIsSearching(false);
    setIsLoadingMore(false);
  };

  const handleSearch = (query?: string) => {
    const text = query !== undefined ? query : searchQuery;
    if (text.trim() === "" && category === "전체") {
      setIsSearchActive(false);
      setHasSearched(false);
      return;
    }
    setIsSearchActive(true);
    setPage(1);
    fetchResults(text, category, sort, 1, false);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    if (searchQuery.trim() === "" && newCategory === "전체") {
      setIsSearchActive(false);
      setHasSearched(false);
      return;
    }
    setIsSearchActive(true);
    setPage(1);
    fetchResults(searchQuery, newCategory, sort, 1, false);
  };

  const handleSortChange = (newSort: string | null) => {
    if (!newSort) return;
    setSort(newSort);
    setPage(1);
    if (isSearchActive) {
      fetchResults(searchQuery, category, newSort, 1, false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchResults(searchQuery, category, sort, nextPage, true);
  };

  const handleBrandClick = (brand: string) => {
    router.push(`/brand/${encodeURIComponent(brand)}`);
  };

  return (
    <Container size="xl" py="xl">
      <Box mb={40}>
        <Group justify="center" mb="xl">
          <SegmentedControl
            value={searchMode}
            onChange={(value) => setSearchMode(value as SearchMode)}
            data={[
              { label: "이미지 설명으로 검색", value: "similarity" },
              { label: "카피라이트로 검색", value: "copywrite" },
            ]}
            radius="xl"
            size="md"
            color="snipitBlue"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
          />
        </Group>

        <Box style={{ maxWidth: 800, margin: "0 auto" }}>
          <TextInput
            size="xl"
            radius="xl"
            placeholder={
              searchMode === "similarity"
                ? "미니멀한 화이트 톤 화장품 광고, 감성적인 카페 인테리어"
                : "할인, 프로모션, 신제품 출시 등"
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            leftSection={
              isSearching ? (
                <Loader size="xs" color="snipitBlue" />
              ) : (
                <IconSearch size={18} color="#9ca3af" />
              )
            }
            rightSection={
              <ActionIcon variant="transparent" onClick={() => handleSearch()}>
                <IconSearch size={20} color="#9ca3af" />
              </ActionIcon>
            }
            styles={{
              input: {
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                border: "1px solid #e5e7eb",
                "&:focus": {
                  borderColor: "#334FFF",
                },
              },
            }}
          />

          <Group gap="xs" mt="md" justify="center">
            <Text size="sm" c="dimmed" mr="xs">인기 브랜드:</Text>
            {TOP_BRANDS.map((brand) => (
              <Badge
                key={brand}
                variant="light"
                color="snipitBlue"
                size="lg"
                radius="xl"
                style={{ cursor: "pointer", textTransform: "none" }}
                onClick={() => handleBrandClick(brand)}
              >
                {brand}
              </Badge>
            ))}
          </Group>
        </Box>
      </Box>

      <Box mb="xl">
        <ScrollArea scrollbars="x" type="never">
          <Group gap="xs" wrap="nowrap" style={{ minWidth: "max-content" }}>
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant={category === cat ? "filled" : "outline"}
                color={category === cat ? "snipitBlue" : "gray"}
                size="xl"
                radius="xl"
                style={{ cursor: "pointer", textTransform: "none" }}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </Badge>
            ))}
          </Group>
        </ScrollArea>
      </Box>

      <Group justify="space-between" mb="xl" align="center">
        <Group gap="sm">
          <Text fw={600} size="lg">
            {isSearchActive ? `검색 결과 ${totalCount}개` : "발견하기"}
          </Text>
        </Group>

        {isSearchActive && (
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              정렬:
            </Text>
            <Select
              data={[
                { label: "최신순", value: "scraped_at" },
                { label: "게재기간순", value: "duration_days" },
                { label: "브랜드명순", value: "brand_name" },
              ]}
              value={sort}
              onChange={handleSortChange}
              variant="unstyled"
              size="sm"
              rightSection={<IconSortDescending size={16} />}
              styles={{
                input: { width: 100, fontWeight: 500 },
              }}
            />
          </Group>
        )}
      </Group>

      {isSearching || isLoadingFeatured ? (
        <Box ta="center" py="xl">
          <Loader size="lg" color="snipitBlue" />
          <Text size="sm" c="dimmed" mt="sm">
            {isSearching ? "검색 중..." : "광고 레퍼런스를 불러오는 중..."}
          </Text>
        </Box>
      ) : !isSearchActive && discoveryData ? (
        <Box>
          {/* Trending Section */}
          {discoveryData.trending.length > 0 && (
            <Box mb={60}>
              <Group justify="space-between" mb="lg">
                <Title order={3}>🔥 오래 게재된 = 성과 좋은 광고</Title>
              </Group>
              <ScrollArea scrollbars="x" type="never">
                <Group gap="lg" wrap="nowrap" style={{ minWidth: "max-content", paddingBottom: 16 }}>
                  {discoveryData.trending.map((ad) => (
                    <Box key={ad.id} style={{ width: 280, flexShrink: 0 }}>
                      <AdCard ad={ad} />
                    </Box>
                  ))}
                </Group>
              </ScrollArea>
            </Box>
          )}

          {/* Category Sections */}
          {discoveryData.sections.map((section) => (
            section.ads.length > 0 && (
              <Box key={section.category} mb={60}>
                <Group justify="space-between" mb="lg">
                  <Title order={3}>{section.emoji} {section.title}</Title>
                  <Anchor 
                    component="button" 
                    onClick={() => handleCategoryChange(section.category)}
                    size="sm" 
                    c="snipitBlue"
                    fw={500}
                  >
                    더보기 →
                  </Anchor>
                </Group>
                <ScrollArea scrollbars="x" type="never">
                  <Group gap="lg" wrap="nowrap" style={{ minWidth: "max-content", paddingBottom: 16 }}>
                    {section.ads.map((ad) => (
                      <Box key={ad.id} style={{ width: 240, flexShrink: 0 }}>
                        <AdCard ad={ad} />
                      </Box>
                    ))}
                  </Group>
                </ScrollArea>
              </Box>
            )
          ))}

          {/* Recent Section */}
          {discoveryData.recent.length > 0 && (
            <Box mb={60}>
              <Title order={3} mb="lg">✨ 최근 수집</Title>
              <MasonryGrid>
                {discoveryData.recent.map((ad) => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
              </MasonryGrid>
            </Box>
          )}
        </Box>
      ) : (
        <>
          {hasSearched && popularResults.length > 0 && (
            <Box mb={60}>
              <Group justify="space-between" mb="lg">
                <Group gap="sm">
                  <Title order={3}>인기 결과</Title>
                  <Text size="sm" c="dimmed">
                    다른 사용자가 자주 저장한 레퍼런스를 모아봤어요
                  </Text>
                </Group>
              </Group>
              <ScrollArea scrollbars="x" type="never">
                <Group gap="lg" wrap="nowrap" style={{ minWidth: "max-content", paddingBottom: 16 }}>
                  {popularResults.map((ad) => (
                    <Box key={ad.id} style={{ width: 240, flexShrink: 0 }}>
                      <AdCard ad={ad} />
                    </Box>
                  ))}
                </Group>
              </ScrollArea>
            </Box>
          )}

          <Box>
            <Title order={3} mb="lg">
              {hasSearched ? "더 많은 결과" : "더 다양한 레퍼런스"}
            </Title>
            <MasonryGrid>
              {results.map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </MasonryGrid>
            
            {results.length > 0 && results.length < totalCount && (
              <Box ta="center" mt={40} mb={20}>
                <Button 
                  variant="light" 
                  color="snipitBlue" 
                  size="md" 
                  radius="xl"
                  onClick={handleLoadMore}
                  loading={isLoadingMore}
                >
                  더 보기
                </Button>
              </Box>
            )}
            
            <PaywallOverlay />
          </Box>
        </>
      )}
    </Container>
  );
}
