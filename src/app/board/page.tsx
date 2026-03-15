"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Title,
  Text,
  Group,
  Button,
  SimpleGrid,
  Card,
  Image,
  Stack,
  ThemeIcon,
  Accordion,
  Badge,
  ActionIcon,
  Menu,
  Modal,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconLayoutBoard,
  IconPlus,
  IconFolder,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconShare,
} from "@tabler/icons-react";
import { useAuth } from "@/hooks/useAuth";
import { mockBoards, mockFolders } from "@/data/mockAds";
import { Board, Folder } from "@/types";

export default function BoardPage() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>(mockBoards);
  const [folders, setFolders] = useState<Folder[]>(mockFolders);

  // Modal states
  const [boardOpened, { open: openBoard, close: closeBoard }] =
    useDisclosure(false);
  const [folderOpened, { open: openFolder, close: closeFolder }] =
    useDisclosure(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  // Fetch real data when authenticated
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const { getBoards } = await import("@/app/actions/boards");
      const { getFolders } = await import("@/app/actions/folders");
      const [boardsData, foldersData] = await Promise.all([
        getBoards(),
        getFolders(),
      ]);
      if (boardsData) {
        setBoards(
          boardsData.map(
            (b: Record<string, unknown>) =>
              ({
                id: b.id as string,
                name: b.name as string,
                folderId: (b.folder_id as string) ?? undefined,
                itemCount: 0,
                thumbnails: [],
                createdAt: b.created_at as string,
                updatedAt: b.updated_at as string,
              }) satisfies Board
          )
        );
      }
      if (foldersData) {
        setFolders(
          foldersData.map(
            (f: Record<string, unknown>) =>
              ({
                id: f.id as string,
                name: f.name as string,
                boards: (
                  (f.boards as Record<string, unknown>[]) || []
                ).map(
                  (b) =>
                    ({
                      id: b.id as string,
                      name: b.name as string,
                      folderId: f.id as string,
                      itemCount: 0,
                      thumbnails: [],
                      createdAt: b.created_at as string,
                      updatedAt: b.updated_at as string,
                    }) satisfies Board
                ),
              }) satisfies Folder
          )
        );
      }
    } catch {
      // Fall back to mock data if Supabase not configured
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset to mock data when logged out
  useEffect(() => {
    if (!user) {
      setBoards(mockBoards);
      setFolders(mockFolders);
    }
  }, [user]);

  // Create board handler
  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    try {
      const { createBoard } = await import("@/app/actions/boards");
      const formData = new FormData();
      formData.set("name", newBoardName);
      await createBoard(formData);
      setNewBoardName("");
      closeBoard();
      loadData();
    } catch {
      // Supabase not configured — add to local state
      setBoards((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          name: newBoardName,
          itemCount: 0,
          thumbnails: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      setNewBoardName("");
      closeBoard();
    }
  };

  // Create folder handler
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
      // Supabase not configured — add to local state
      setFolders((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          name: newFolderName,
          boards: [],
        },
      ]);
      setNewFolderName("");
      closeFolder();
    }
  };

  // Delete board handler
  const handleDeleteBoard = async (boardId: string) => {
    try {
      const { deleteBoard } = await import("@/app/actions/boards");
      await deleteBoard(boardId);
      loadData();
    } catch {
      // Remove from local state
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      setFolders((prev) =>
        prev.map((f) => ({
          ...f,
          boards: f.boards.filter((b) => b.id !== boardId),
        }))
      );
    }
  };

  // Delete folder handler
  const handleDeleteFolder = async (folderId: string) => {
    try {
      const { deleteFolder } = await import("@/app/actions/folders");
      await deleteFolder(folderId);
      loadData();
    } catch {
      // Remove from local state
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
    }
  };

  const standaloneBoards = boards.filter((b) => !b.folderId);

  const renderBoardCard = (board: Board) => (
    <Card key={board.id} withBorder padding="md" radius="md">
      <Card.Section>
        {board.thumbnails.length > 0 ? (
          <SimpleGrid cols={2} spacing={2} p={2}>
            {board.thumbnails.slice(0, 4).map((thumb, i) => (
              <Image
                key={`${board.id}-thumb-${i}`}
                src={thumb}
                height={100}
                alt={`Thumbnail ${i + 1}`}
                radius={
                  i === 0
                    ? "sm 0 0 0"
                    : i === 1
                      ? "0 sm 0 0"
                      : i === 2
                        ? "0 0 0 sm"
                        : "0 0 sm 0"
                }
              />
            ))}
          </SimpleGrid>
        ) : (
          <Stack
            align="center"
            justify="center"
            h={200}
            bg="gray.1"
            gap="xs"
          >
            <IconLayoutBoard size={32} color="var(--mantine-color-gray-5)" />
            <Text size="sm" c="dimmed">
              저장된 광고가 없습니다
            </Text>
          </Stack>
        )}
      </Card.Section>

      <Stack gap="xs" mt="md">
        <Group justify="space-between" wrap="nowrap">
          <Text fw={600} truncate>
            {board.name}
          </Text>
          <Menu position="bottom-end" shadow="sm">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={14} />}>
                이름 변경
              </Menu.Item>
              <Menu.Item leftSection={<IconShare size={14} />}>
                공유하기
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => handleDeleteBoard(board.id)}
              >
                삭제
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Group justify="space-between">
          <Badge variant="light" color="gray">
            {board.itemCount}개 항목
          </Badge>
          <Text size="xs" c="dimmed">
            업데이트: {board.updatedAt}
          </Text>
        </Group>
      </Stack>
    </Card>
  );

  return (
    <>
      <Stack gap="xl">
        <Group justify="space-between" align="flex-end">
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="light" color="blue">
              <IconLayoutBoard size={20} />
            </ThemeIcon>
            <Title order={2}>보드</Title>
          </Group>
          <Group gap="sm">
            <Button
              variant="light"
              leftSection={<IconFolder size={16} />}
              onClick={openFolder}
            >
              새 폴더
            </Button>
            <Button leftSection={<IconPlus size={16} />} onClick={openBoard}>
              새 보드 만들기
            </Button>
          </Group>
        </Group>

        {folders.length > 0 && (
          <Accordion
            multiple
            defaultValue={folders.map((f) => f.id)}
            variant="separated"
          >
            {folders.map((folder) => (
              <Accordion.Item key={folder.id} value={folder.id}>
                <Accordion.Control>
                  <Group gap="sm">
                    <IconFolder
                      size={20}
                      color="var(--mantine-color-gray-6)"
                    />
                    <Text fw={600}>{folder.name}</Text>
                    <Badge size="sm" variant="light" color="gray" circle>
                      {folder.boards.length}
                    </Badge>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                      ml="auto"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  {folder.boards.length > 0 ? (
                    <SimpleGrid
                      cols={{ base: 1, sm: 2, md: 3 }}
                      spacing="lg"
                      mt="md"
                    >
                      {folder.boards.map(renderBoardCard)}
                    </SimpleGrid>
                  ) : (
                    <Text size="sm" c="dimmed" ta="center" py="xl">
                      이 폴더에 보드가 없습니다
                    </Text>
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}

        {standaloneBoards.length > 0 && (
          <Stack gap="md" mt="xl">
            <Text fw={600} size="lg">
              분류되지 않은 보드
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {standaloneBoards.map(renderBoardCard)}
            </SimpleGrid>
          </Stack>
        )}
      </Stack>

      {/* Create Board Modal */}
      <Modal opened={boardOpened} onClose={closeBoard} title="새 보드 만들기">
        <Stack gap="md">
          <TextInput
            label="보드 이름"
            placeholder="보드 이름을 입력하세요"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateBoard();
            }}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeBoard}>
              취소
            </Button>
            <Button onClick={handleCreateBoard} disabled={!newBoardName.trim()}>
              만들기
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Create Folder Modal */}
      <Modal opened={folderOpened} onClose={closeFolder} title="새 폴더 만들기">
        <Stack gap="md">
          <TextInput
            label="폴더 이름"
            placeholder="폴더 이름을 입력하세요"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
            }}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeFolder}>
              취소
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              만들기
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
