"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Title,
  Group,
  Box,
  Text,
  Loader,
  Button,
  ActionIcon,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { AdCard } from "@/components/cards/AdCard";
import { MasonryGrid } from "@/components/common/MasonryGrid";
import { AdCard as AdCardType } from "@/types";

export default function BrandProfilePage() {
  const params = useParams();
  const router = useRouter();
  const brandName = decodeURIComponent(params.name as string);
  
  const [results, setResults] = useState<AdCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchBrandAds = async (currentPage: number, isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const searchParams = new URLSearchParams({
        brandName,
        page: currentPage.toString(),
        limit: "24",
      });

      const res = await fetch(`/api/search?${searchParams.toString()}`);
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
        
        if (isLoadMore) {
          setResults((prev) => [...prev, ...mapped]);
        } else {
          setResults(mapped);
        }
        setTotalCount(data.totalCount || 0);
      } else if (!isLoadMore) {
        setResults([]);
        setTotalCount(0);
      }
    } catch {
      if (!isLoadMore) {
        setResults([]);
        setTotalCount(0);
      }
    }
    
    setIsLoading(false);
    setIsLoadingMore(false);
  };

  useEffect(() => {
    fetchBrandAds(1, false);
  }, [brandName]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBrandAds(nextPage, true);
  };

  return (
    <Container size="xl" py="xl">
      <Group mb="xl" align="center">
        <ActionIcon variant="subtle" color="gray" onClick={() => router.back()} size="lg">
          <IconArrowLeft size={24} />
        </ActionIcon>
        <Box>
          <Title order={2}>{brandName}</Title>
          <Text size="sm" c="dimmed">
            총 {totalCount}개의 광고 레퍼런스
          </Text>
        </Box>
      </Group>

      {isLoading ? (
        <Box ta="center" py="xl">
          <Loader size="lg" color="snipitBlue" />
          <Text size="sm" c="dimmed" mt="sm">
            브랜드 광고를 불러오는 중...
          </Text>
        </Box>
      ) : results.length > 0 ? (
        <Box>
          <MasonryGrid>
            {results.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </MasonryGrid>
          
          {results.length < totalCount && (
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
        </Box>
      ) : (
        <Box ta="center" py={60}>
          <Text size="lg" c="dimmed">
            이 브랜드의 광고 레퍼런스가 없습니다.
          </Text>
        </Box>
      )}
    </Container>
  );
}