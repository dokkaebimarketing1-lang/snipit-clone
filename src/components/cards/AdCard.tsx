"use client";

import { useMemo, useState } from "react";
import { Anchor, Avatar, Badge, Box, Card, Group, Image, Text } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import "@mantine/carousel/styles.css";
import {
  IconCalendar,
  IconExternalLink,
  IconLayoutGrid,
  IconNote,
  IconPhoto,
  IconPlayerPlay,
  IconTag,
} from "@tabler/icons-react";
import { AdCard as AdCardType, MediaType, MediaTag, Platform } from "@/types";

interface AdCardProps {
  ad: AdCardType;
}

const platformColors: Record<Platform, string> = {
  meta: "rgba(0, 114, 235, 0.3)",
  instagram: "rgba(162, 49, 193, 0.29)",
  google: "rgba(52, 168, 82, 0.3)",
  tiktok: "rgba(0, 0, 0, 0.29)",
  youtube: "rgba(255, 0, 0, 0.3)",
};

const platformNames: Record<Platform, string> = {
  meta: "Meta 광고",
  instagram: "Instagram 광고",
  google: "Google 광고",
  tiktok: "TikTok 광고",
  youtube: "YouTube 광고",
};

const mediaTypeIcon: Record<MediaType, React.ComponentType<{ size?: number; color?: string }>> = {
  photo: IconPhoto,
  video: IconPlayerPlay,
  reels: IconPlayerPlay,
  carousel: IconLayoutGrid,
};

const mediaTagColors: Record<MediaTag, string> = {
  "메타": "blue",
  "네이버GFA": "green",
  "구글": "red",
  "크리테오": "orange",
  "데이블": "violet",
  "타불라": "cyan",
  "틱톡": "dark",
  "당근": "orange",
  "릴스": "grape",
  "쇼츠": "red",
  "기타": "gray",
};

function formatDate(date: string): string {
  if (date.includes(".")) {
    const [year, month, day] = date.split(".");
    return `${year}.${month}.${day}`;
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function AdCard({ ad }: AdCardProps) {
  const MediaIcon = mediaTypeIcon[ad.mediaType];
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [failedCarouselImages, setFailedCarouselImages] = useState<string[]>([]);
  const [memoExpanded, setMemoExpanded] = useState(false);
  const snapshotUrl = useMemo(() => ad.externalUrl || `https://www.facebook.com/ads/library/?id=${encodeURIComponent(ad.id)}`, [ad.id, ad.externalUrl]);
  
  const isCarousel = ad.imageUrls && ad.imageUrls.length > 1;
  const hasImageError = isCarousel
    ? ad.imageUrls!.every(url => failedCarouselImages.includes(url))
    : !ad.imageUrl || failedImageUrl === ad.imageUrl;

  const renderPlaceholder = (showLink = true) => (
    <Box
      style={{
        width: "100%",
        aspectRatio: "4 / 5",
        background: "linear-gradient(160deg, #f3f4f6 0%, #e5e7eb 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 16,
      }}
    >
      <Box
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: "#334155",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
        }}
      >
        {ad.brandName.charAt(0) || "A"}
      </Box>
      <Text size="sm" fw={600} ta="center" lineClamp={1} c="dark.6">
        {ad.brandName}
      </Text>
      {showLink && (
        <Anchor href={snapshotUrl} target="_blank" rel="noreferrer" size="xs" fw={600} c="blue.7" underline="hover">
          광고 보기
        </Anchor>
      )}
    </Box>
  );

  return (
    <Card
      padding={0}
      radius="md"
      withBorder
      style={{
        border: "1px solid #e5e7eb",
        borderLeft: `3px solid ${platformColors[ad.platform]}`,
        borderRadius: 12,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "pointer",
        marginBottom: 12,
        breakInside: "avoid",
        backgroundColor: "#ffffff",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.09)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <Card.Section style={{ position: "relative" }}>
        {hasImageError ? (
          renderPlaceholder(true)
        ) : isCarousel ? (
          <Carousel
            withIndicators
            emblaOptions={{ loop: true }}
            styles={{
              indicator: {
                width: 6,
                height: 6,
                transition: 'width 250ms ease',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                '&[data-active]': {
                  width: 16,
                  backgroundColor: '#ffffff',
                },
              },
              indicators: {
                bottom: 10,
              }
            }}
          >
            {ad.imageUrls!.map((url, index) => (
              <Carousel.Slide key={url}>
                {failedCarouselImages.includes(url) ? (
                  renderPlaceholder(false)
                ) : (
                  <Image
                    src={url}
                    alt={`${ad.brandName} - ${index + 1}`}
                    loading="lazy"
                    onError={() => setFailedCarouselImages(prev => [...prev, url])}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                )}
              </Carousel.Slide>
            ))}
          </Carousel>
        ) : (
          <Image
            src={ad.imageUrl}
            alt={ad.brandName}
            loading="lazy"
            onError={() => setFailedImageUrl(ad.imageUrl)}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        )}
        <Box
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MediaIcon size={14} color="#ffffff" />
        </Box>
      </Card.Section>

      <Box p="md">
        <Group gap={6} mb={8} wrap="nowrap">
          <Anchor
            href={ad.externalUrl ?? "#"}
            target={ad.externalUrl ? "_blank" : undefined}
            rel={ad.externalUrl ? "noreferrer" : undefined}
            underline="never"
            c="gray.7"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1,
              border: "1px solid #d1d5db",
              borderRadius: 999,
              padding: "4px 8px",
            }}
          >
            <span>{platformNames[ad.platform]}</span>
            <IconExternalLink size={12} />
          </Anchor>
        </Group>

        <Text fw={700} size="sm" lineClamp={1} mb={4}>
          {ad.brandName}
        </Text>

        <Text size="xs" c="dimmed" mb={8}>
          {formatDate(ad.publishedAt)}
        </Text>

        <Group justify="space-between" wrap="nowrap">
          <Group gap={5} wrap="nowrap">
            <Box
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: ad.status === "active" ? "#22c55e" : "#9ca3af",
              }}
            />
            <Text size="xs" c="dimmed">
              {ad.status === "active" ? "게재 중" : "게재 종료"}
            </Text>
          </Group>

          <Group gap={4} wrap="nowrap">
            <IconCalendar size={12} color="#9ca3af" />
            <Text size="xs" c="dimmed">
              {ad.durationDays}일간 게재
            </Text>
          </Group>
        </Group>

        {/* 태그 영역 */}
        {(ad.mediaTag || (ad.hashtags && ad.hashtags.length > 0)) && (
          <Group gap={4} mt={8} wrap="wrap">
            {ad.mediaTag && (
              <Badge
                size="xs"
                variant="filled"
                color={mediaTagColors[ad.mediaTag] || "gray"}
              >
                {ad.mediaTag}
              </Badge>
            )}
            {ad.hashtags?.map((tag) => (
              <Badge key={tag} size="xs" variant="outline" color="gray">
                #{tag}
              </Badge>
            ))}
          </Group>
        )}

        {/* 메모 영역 */}
        {ad.memo && (
          <Box
            mt={8}
            p={8}
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: 6,
              cursor: "pointer",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setMemoExpanded((prev) => !prev);
            }}
          >
            <Group gap={4} mb={2}>
              <IconNote size={12} color="#6b7280" />
              <Text size="xs" fw={600} c="gray.6">메모</Text>
            </Group>
            <Text size="xs" c="gray.7" lineClamp={memoExpanded ? undefined : 2}>
              {ad.memo}
            </Text>
          </Box>
        )}

        {/* 저장자 + 카테고리 */}
        {(ad.savedBy || ad.category) && (
          <Group justify="space-between" mt={8} wrap="nowrap">
            {ad.savedBy && (
              <Group gap={6} wrap="nowrap">
                <Avatar
                  src={ad.savedByAvatar}
                  size={20}
                  radius="xl"
                  alt={ad.savedBy}
                >
                  {ad.savedBy.charAt(0)}
                </Avatar>
                <Text size="xs" c="gray.6" truncate>
                  {ad.savedBy}
                </Text>
              </Group>
            )}
            {ad.category && (
              <Badge size="xs" variant="light" color="pink" radius="sm">
                {ad.category}
              </Badge>
            )}
          </Group>
        )}
      </Box>
    </Card>
  );
}
