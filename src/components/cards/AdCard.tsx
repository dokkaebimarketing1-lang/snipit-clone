"use client";

import { Card, Image, Text, Badge, Group, Box, ActionIcon } from "@mantine/core";
import { IconExternalLink, IconPhoto, IconVideo, IconBrandInstagram, IconBrandTiktok, IconBrandGoogle, IconCalendar } from "@tabler/icons-react";
import { AdCard as AdCardType } from "@/types";

interface AdCardProps {
  ad: AdCardType;
}

const platformColors = {
  meta: "rgba(0, 114, 235, 0.3)",
  instagram: "rgba(162, 49, 193, 0.29)",
  google: "rgba(52, 168, 82, 0.3)",
  tiktok: "rgba(0, 0, 0, 0.29)",
  youtube: "rgba(255, 0, 0, 0.3)",
};

const platformNames = {
  meta: "Meta 광고",
  instagram: "Instagram 광고",
  google: "Google 광고",
  tiktok: "TikTok 광고",
  youtube: "YouTube 광고",
};

export function AdCard({ ad }: AdCardProps) {
  const MediaIcon = ad.mediaType === "video" || ad.mediaType === "reels" ? IconVideo : IconPhoto;

  return (
    <Card
      shadow="sm"
      padding="0"
      radius="md"
      withBorder
      style={{
        border: "1px solid #e5e7eb",
        borderLeft: `3px solid ${platformColors[ad.platform]}`,
        borderRadius: 12,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "pointer",
        marginBottom: "12px",
        breakInside: "avoid",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.02)";
        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      <Card.Section style={{ position: "relative" }}>
        <Image
          src={ad.imageUrl}
          alt={ad.brandName}
          loading="lazy"
          style={{ width: "100%", height: "auto", display: "block" }}
        />
         <Box
           style={{
             position: "absolute",
             top: 8,
             right: 8,
             backgroundColor: "rgba(0,0,0,0.4)",
             backdropFilter: "blur(4px)",
             borderRadius: 6,
             padding: "4px 6px",
             display: "flex",
             alignItems: "center",
             justifyContent: "center",
           }}
         >
           <MediaIcon size={14} color="white" />
         </Box>
      </Card.Section>

       <Box p="md">
         <Group justify="space-between" mb="xs">
           <Group gap="xs">
             <Text size="xs" c="dimmed" fw={500}>
               {platformNames[ad.platform]}
             </Text>
             {ad.externalUrl && (
               <ActionIcon size="xs" variant="transparent" color="gray">
                 <IconExternalLink size={14} />
               </ActionIcon>
             )}
           </Group>
         </Group>

         <Group justify="space-between" mb="xs">
           <Text fw={700} size="sm" lineClamp={1}>
             {ad.brandName}
           </Text>
           <Text size="xs" c="dimmed">
             {ad.publishedAt}
           </Text>
         </Group>

         {ad.isSponsored && ad.sponsorName && (
           <Text size="xs" c="blue" mb={8}>
             [협찬 광고] @{ad.sponsorName}
           </Text>
         )}

         <Group justify="space-between" mt="xs">
           <Group gap={4}>
             <Box style={{
               width: 8, height: 8, borderRadius: "50%",
               backgroundColor: ad.status === "active" ? "#10b981" : "#9ca3af",
               boxShadow: ad.status === "active" ? "0 0 6px rgba(16,185,129,0.5)" : "none",
             }} />
             <Text size="xs" c="dimmed">{ad.status === "active" ? "게재 중" : "게재 종료"}</Text>
           </Group>
           <Group gap={4}>
             <IconCalendar size={12} color="#9ca3af" />
             <Text size="xs" c="dimmed">{ad.durationDays}일간 게재</Text>
           </Group>
         </Group>
       </Box>
    </Card>
  );
}
