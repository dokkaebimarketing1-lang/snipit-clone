"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Title,
  Text,
  Group,
  Button,
  SimpleGrid,
  Card,
  Stack,
  ThemeIcon,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconCloudUpload,
  IconFolder,
  IconFolderOpen,
  IconArrowLeft,
  IconLink,
  IconPlus,
  IconTrash,
  IconFilter,
  IconLayoutBoard,
} from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";
import { AdCard as AdCardType, Folder, MEDIA_TAGS, MediaTag } from "@/types";
import { AdUploader } from "@/components/ads/AdUploader";
import { UrlImportModal } from "@/components/ads/UrlImportModal";
import { AdCard } from "@/components/cards/AdCard";

export default function BoardPage() {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [savedAds, setSavedAds] = useState<AdCardType[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Modal states
  const [folderOpened, { open: openFolder, close: closeFolder }] = useDisclosure(false);
  const [uploadOpened, { open: openUpload, close: closeUpload }] = useDisclosure(false);
  const [urlImportOpened, { open: openUrlImport, close: closeUrlImport }] = useDisclosure(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedMediaTag, setSelectedMediaTag] = useState<MediaTag | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const { getFolders } = await import("@/app/actions/folders");
      const foldersData = await getFolders();
      if (foldersData) {
        setFolders(
          foldersData.map((f: Record<string, unknown>) => ({
            id: f.id as string,
            name: f.name as string,
            boards: [],
          }))
        );
      }
    } catch { /* ignore */ }

    try {
      const { getSavedAds } = await import("@/app/actions/saved-ads");
      const adsData = await getSavedAds();
      if (adsData) {
        setSavedAds(
          adsData.map((a: Record<string, unknown>) => {
            const pubDate = (a.published_at as string) || (a.created_at as string);
            const dateObj = pubDate ? new Date(pubDate) : new Date();
            const formatted = isNaN(dateObj.getTime()) ? "" : `${dateObj.getFullYear()}.${String(dateObj.getMonth()+1).padStart(2,"0")}.${String(dateObj.getDate()).padStart(2,"0")}`;
            return {
              id: a.id as string,
              imageUrl: (a.image_url as string) || "",
              brandName: (a.brand_name as string) || "Unknown",
              platform: (a.platform as AdCardType["platform"]) || "meta",
              mediaType: (a.media_type as AdCardType["mediaType"]) || "photo",
              status: (a.status as AdCardType["status"]) || "active",
              publishedAt: formatted,
              durationDays: (a.duration_days as number) || 0,
              isSponsored: (a.is_sponsored as boolean) || false,
              externalUrl: a.external_id as string,
              copyText: a.copy_text as string,
              memo: a.memo as string,
              mediaTag: a.media_tag as AdCardType["mediaTag"],
              hashtags: (a.hashtags as string[]) || [],
              category: a.category as string,
              folderId: a.folder_id as string,
            } as AdCardType & { folderId?: string };
          })
        );
      }
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (!user) { setFolders([]); setSavedAds([]); } }, [user]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const { createFolder } = await import("@/app/actions/folders");
      const formData = new FormData();
      formData.set("name", newFolderName);
      await createFolder(formData);
      setNewFolderName("");
      closeFolder();
      loadData();
    } catch {
      setFolders((prev) => [...prev, { id: `local-${Date.now()}`, name: newFolderName, boards: [] }]);
      setNewFolderName("");
      closeFolder();
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const { deleteFolder } = await import("@/app/actions/folders");
      await deleteFolder(folderId);
      if (selectedFolder === folderId) setSelectedFolder(null);
      loadData();
    } catch {
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
    }
  };

  // Filter ads by selected folder and media tag
  const filteredAds = savedAds.filter((ad) => {
    const ext = ad as AdCardType & { folderId?: string };
    const folderMatch = selectedFolder ? ext.folderId === selectedFolder : true;
    const tagMatch = selectedMediaTag ? ad.mediaTag === selectedMediaTag : true;
    return folderMatch && tagMatch;
  });

  const unclassifiedCount = savedAds.filter((a) => !(a as AdCardType & { folderId?: string }).folderId).length;
  const selectedFolderName = selectedFolder
    ? folders.find((f) => f.id === selectedFolder)?.name || "폴더"
    : null;

  // Count ads per folder
  const folderAdCount = (folderId: string) =>
    savedAds.filter((a) => (a as AdCardType & { folderId?: string }).folderId === folderId).length;

  return (
    <>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Group gap="sm">
            {selectedFolder && (
              <ActionIcon variant="subtle" onClick={() => setSelectedFolder(null)}>
                <IconArrowLeft size={20} />
              </ActionIcon>
            )}
            <ThemeIcon size="lg" radius="md" variant="light" color="blue">
              <IconLayoutBoard size={20} />
            </ThemeIcon>
            <Title order={2}>
              {selectedFolderName || "커브 광고 드라이브"}
            </Title>
            {selectedFolder && (
              <Badge variant="light" color="blue">{filteredAds.length}개</Badge>
            )}
          </Group>
          <Group gap="sm">
            <Button variant="light" leftSection={<IconFolder size={16} />} onClick={openFolder}>
              새 폴더
            </Button>
            <Button variant="light" color="indigo" leftSection={<IconLink size={16} />} onClick={openUrlImport}>
              URL 가져오기
            </Button>
            <Button variant="light" color="teal" leftSection={<IconCloudUpload size={16} />} onClick={openUpload}>
              파일 업로드
            </Button>
          </Group>
        </Group>

        {/* 매체 태그 필터 */}
        <Group gap={6} wrap="wrap">
          <IconFilter size={16} color="var(--mantine-color-gray-5)" />
          <Badge
            variant={selectedMediaTag === null ? "filled" : "outline"}
            color="gray"
            style={{ cursor: "pointer" }}
            onClick={() => setSelectedMediaTag(null)}
          >
            전체
          </Badge>
          {MEDIA_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant={selectedMediaTag === tag ? "filled" : "outline"}
              color={selectedMediaTag === tag ? "blue" : "gray"}
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedMediaTag(selectedMediaTag === tag ? null : tag)}
            >
              {tag}
            </Badge>
          ))}
        </Group>

        {/* 폴더 목록 (폴더 미선택 시) */}
        {!selectedFolder && (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
            {folders.map((folder) => (
              <Card
                key={folder.id}
                withBorder
                padding="lg"
                radius="md"
                style={{ cursor: "pointer", transition: "all 0.2s" }}
                onClick={() => setSelectedFolder(folder.id)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = ""; }}
              >
                <Stack align="center" gap="sm">
                  <IconFolderOpen size={40} color="var(--mantine-color-blue-5)" />
                  <Text fw={600} ta="center" lineClamp={1}>{folder.name}</Text>
                  <Badge variant="light" color="blue">{folderAdCount(folder.id)}개</Badge>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Stack>
              </Card>
            ))}

            {/* 분류 안됨 폴더 */}
            <Card
              withBorder
              padding="lg"
              radius="md"
              style={{ cursor: "pointer", borderStyle: "dashed", transition: "all 0.2s" }}
              onClick={() => setSelectedFolder("unclassified")}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
            >
              <Stack align="center" gap="sm">
                <IconFolder size={40} color="var(--mantine-color-gray-5)" />
                <Text fw={600} ta="center" c="dimmed">분류 안됨</Text>
                <Badge variant="light" color="gray">{unclassifiedCount}개</Badge>
              </Stack>
            </Card>

            {/* 새 폴더 추가 버튼 */}
            <Card
              withBorder
              padding="lg"
              radius="md"
              style={{ cursor: "pointer", borderStyle: "dashed", borderColor: "#c7d2fe", transition: "all 0.2s" }}
              onClick={openFolder}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#eef2ff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; }}
            >
              <Stack align="center" justify="center" gap="sm" h="100%">
                <IconPlus size={32} color="var(--mantine-color-indigo-4)" />
                <Text fw={600} c="indigo.4">새 폴더</Text>
              </Stack>
            </Card>
          </SimpleGrid>
        )}

        {/* 폴더 선택 시: 광고 카드 그리드 */}
        {selectedFolder && (
          <>
            {filteredAds.length > 0 ? (
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
                {filteredAds.map((ad) => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
              </SimpleGrid>
            ) : (
              <Box ta="center" py="xl">
                <Text size="lg" c="dimmed" mb="sm">이 폴더에 광고가 없습니다</Text>
                <Group justify="center" gap="sm">
                  <Button variant="light" color="indigo" leftSection={<IconLink size={16} />} onClick={openUrlImport}>
                    URL 가져오기
                  </Button>
                  <Button variant="light" color="teal" leftSection={<IconCloudUpload size={16} />} onClick={openUpload}>
                    파일 업로드
                  </Button>
                </Group>
              </Box>
            )}
          </>
        )}

        {/* 폴더 미선택 + 전체 광고 미리보기 */}
        {!selectedFolder && savedAds.length > 0 && (
          <Stack gap="md" mt="md">
            <Group gap="sm">
              <Text fw={600} size="lg">전체 레퍼런스</Text>
              <Badge variant="light" color="blue">
                {selectedMediaTag ? savedAds.filter((a) => a.mediaTag === selectedMediaTag).length : savedAds.length}개
              </Badge>
            </Group>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
              {(selectedMediaTag ? savedAds.filter((a) => a.mediaTag === selectedMediaTag) : savedAds).map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </SimpleGrid>
          </Stack>
        )}
      </Stack>

      {/* Create Folder Modal */}
      <Modal opened={folderOpened} onClose={closeFolder} title="새 폴더 만들기">
        <Stack gap="md">
          <TextInput
            label="폴더 이름"
            placeholder="예: 메타 광고, 건강기능식품, 뷰티"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeFolder}>취소</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>만들기</Button>
          </Group>
        </Stack>
      </Modal>

      {/* File Upload Modal */}
      <AdUploader
        opened={uploadOpened}
        onClose={closeUpload}
        boards={folders.map((f) => ({ id: f.id, name: f.name }))}
        onUploadComplete={() => { loadData(); }}
      />

      {/* URL Import Modal */}
      <UrlImportModal
        opened={urlImportOpened}
        onClose={closeUrlImport}
        folders={folders.map((f) => ({ id: f.id, name: f.name }))}
        onImportComplete={() => { loadData(); }}
      />
    </>
  );
}
