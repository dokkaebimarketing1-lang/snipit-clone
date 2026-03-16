"use client";

import { useState } from "react";
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
} from "@mantine/core";
import { IconSearch, IconFilter, IconSortDescending } from "@tabler/icons-react";
import { mockAds, searchTags } from "@/data/mockAds";
import { AdCard } from "@/components/cards/AdCard";
import { MasonryGrid } from "@/components/common/MasonryGrid";
import { PaywallOverlay } from "@/components/common/PaywallOverlay";
import { SearchMode, AdCard as AdCardType } from "@/types";

export default function SearchPage() {
  const [searchMode, setSearchMode] = useState<SearchMode>("similarity");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<AdCardType[]>(mockAds.slice(6));
  const [popularResults, setPopularResults] = useState<AdCardType[]>(mockAds.slice(0, 6));
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query?: string) => {
    const searchText = query || searchQuery;
    if (!searchText.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchText)}&mode=${searchMode}`
      );
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        const mapped: AdCardType[] = data.results.map(
          (r: Record<string, unknown>) => ({
            id: r.id as string,
            imageUrl: r.imageUrl as string,
            brandName: r.brandName as string,
            platform: r.platform as string,
            mediaType: r.mediaType as string,
            status: r.status as string,
            publishedAt: r.publishedAt as string,
            durationDays: r.durationDays as number,
            isSponsored: r.isSponsored as boolean,
            copyText: r.copyText as string,
          })
        );
        setPopularResults(mapped.slice(0, 6));
        setResults(mapped.slice(6));
      } else {
        setPopularResults(mockAds.slice(0, 6));
        setResults(mockAds.slice(6));
      }
    } catch {
      setPopularResults(mockAds.slice(0, 6));
      setResults(mockAds.slice(6));
    }
    setIsSearching(false);
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
            {searchTags.map((tag) => (
              <Badge
                key={tag}
                variant="light"
                color="gray"
                size="lg"
                radius="xl"
                style={{ cursor: "pointer", textTransform: "none" }}
                onClick={() => {
                  setSearchQuery(tag);
                  handleSearch(tag);
                }}
              >
                {tag}
              </Badge>
            ))}
          </Group>
        </Box>
      </Box>

      <Group justify="space-between" mb="xl" align="center">
        <Group gap="sm">
          <Select
            placeholder="플랫폼 전체"
            data={["전체", "인스타그램", "메타 라이브러리", "구글", "틱톡"]}
            defaultValue="전체"
            radius="md"
            style={{ width: 160 }}
          />
          <Select
            placeholder="소재 형태"
            data={["전체", "이미지", "비디오", "캐러셀"]}
            defaultValue="전체"
            radius="md"
            style={{ width: 140 }}
          />
          <ActionIcon variant="default" size="input-sm" radius="md">
            <IconFilter size={18} />
          </ActionIcon>
        </Group>

        <Group gap="xs">
          <Text size="sm" c="dimmed">
            정렬:
          </Text>
          <Select
            data={["최신순", "인기순", "저장순"]}
            defaultValue="최신순"
            variant="unstyled"
            size="sm"
            rightSection={<IconSortDescending size={16} />}
            styles={{
              input: { width: 80, fontWeight: 500 },
            }}
          />
        </Group>
      </Group>

      {isSearching ? (
        <Box ta="center" py="xl">
          <Loader size="lg" color="snipitBlue" />
          <Text size="sm" c="dimmed" mt="sm">
            검색 중...
          </Text>
        </Box>
      ) : (
        <>
          <Box mb={60}>
            <Group justify="space-between" mb="lg">
              <Group gap="sm">
                <Title order={3}>
                  {hasSearched ? "인기 결과" : "자주 저장된 레퍼런스"}
                </Title>
                <Text size="sm" c="dimmed">
                  다른 사용자가 자주 저장한 레퍼런스를 모아봤어요
                </Text>
              </Group>
              <Text size="sm" c="dimmed" style={{ cursor: "pointer" }}>
                다른 레퍼런스 보기
              </Text>
            </Group>
            <ScrollArea scrollbars="x" type="never">
              <Group gap="lg" wrap="nowrap" style={{ minWidth: "max-content" }}>
                {popularResults.map((ad) => (
                  <Box key={ad.id} style={{ width: 240, flexShrink: 0 }}>
                    <AdCard ad={ad} />
                  </Box>
                ))}
              </Group>
            </ScrollArea>
          </Box>

          <Box>
            <Title order={3} mb="lg">
              {hasSearched ? "더 많은 결과" : "더 다양한 레퍼런스"}
            </Title>
            <MasonryGrid>
              {results.map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </MasonryGrid>
            <PaywallOverlay />
          </Box>
        </>
      )}
    </Container>
  );
}
