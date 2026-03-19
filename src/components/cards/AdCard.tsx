"use client";

import { useMemo, useState } from "react";
import { Anchor, Box, Card, Group, Image, Text } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import "@mantine/carousel/styles.css";
import {
  IconCalendar,
  IconExternalLink,
  IconLayoutGrid,
  IconPhoto,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { AdCard as AdCardType, MediaType, Platform } from "@/types";

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

function formatDate(date: string): string {
  const [year, month, day] = date.split(".");
  return `${year}.${month}.${day}`;
}

export function AdCard({ ad }: AdCardProps) {
  const MediaIcon = mediaTypeIcon[ad.mediaType];
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [failedCarouselImages, setFailedCarouselImages] = useState<string[]>([]);
  const snapshotUrl = useMemo(() => `https://www.facebook.com/ads/library/?id=${encodeURIComponent(ad.id)}`, [ad.id]);
  
  const isCarousel = ad.imageUrls && ad.imageUrls.length > 1;
  const hasImageError = isCarousel
    ? ad.imageUrls!.every(url => failedCarouselImages.includes(url))
    : failedImageUrl === ad.imageUrl;

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
      </Box>
    </Card>
  );
}
