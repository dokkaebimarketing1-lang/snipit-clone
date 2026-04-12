"use client";

import { useState } from "react";
import {
  Button,
  Group,
  Modal,
  Progress,
  Select,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { IconLink, IconPlus, IconTrash } from "@tabler/icons-react";
import { MEDIA_TAGS, MediaTag } from "@/types";
import { importUrls } from "@/app/actions/saved-ads";

interface FolderOption {
  id: string;
  name: string;
}

interface UrlImportModalProps {
  opened: boolean;
  onClose: () => void;
  boardId?: string;
  folders?: FolderOption[];
  onImportComplete: () => void;
}

export function UrlImportModal({ opened, onClose, boardId, folders, onImportComplete }: UrlImportModalProps) {
  const [urls, setUrls] = useState<string[]>([""]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [mediaTag, setMediaTag] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [category, setCategory] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ saved: number; failed: number; errorMsg?: string } | null>(null);

  const addUrlField = () => {
    if (urls.length < 20) setUrls((prev) => [...prev, ""]);
  };

  const removeUrlField = (index: number) => {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const updateUrl = (index: number, value: string) => {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  };

  const handleBulkPaste = (value: string) => {
    const lines = value.split(/[\n,]/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      setUrls(lines.slice(0, 20));
    } else {
      updateUrl(0, value);
    }
  };

  const handleImport = async () => {
    const validUrls = urls.filter((u) => u.trim().length > 0);
    if (validUrls.length === 0) return;

    setImporting(true);
    setProgress(20);

    try {
      const data = await importUrls(validUrls, {
        boardId: boardId || undefined,
        folderId: selectedFolderId || undefined,
        mediaTag: mediaTag || undefined,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        memo: memo || undefined,
        category: category || undefined,
      });

      setProgress(90);
      setResult({ saved: data.saved, failed: data.failed });
      setProgress(100);
      onImportComplete();
    } catch (err) {
      setResult({ saved: 0, failed: validUrls.length, errorMsg: err instanceof Error ? err.message : String(err) });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setUrls([""]);
    setMediaTag(null);
    setHashtags([]);
    setMemo("");
    setCategory("");
    setProgress(0);
    setResult(null);
    onClose();
  };

  const validCount = urls.filter((u) => u.trim().length > 0).length;

  return (
    <Modal opened={opened} onClose={handleClose} title="URL로 광고 가져오기" size="lg">
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          광고 URL을 입력하면 자동으로 정보를 가져와 보드에 추가합니다.
          여러 URL을 한 번에 붙여넣기할 수 있습니다 (줄바꿈 또는 쉼표로 구분).
        </Text>

        {urls.map((url, index) => (
          <Group key={index} gap="xs" wrap="nowrap">
            <TextInput
              placeholder="https://www.facebook.com/ads/library/?id=..."
              value={url}
              onChange={(e) => {
                if (index === 0 && !url) {
                  handleBulkPaste(e.currentTarget.value);
                } else {
                  updateUrl(index, e.currentTarget.value);
                }
              }}
              leftSection={<IconLink size={14} />}
              style={{ flex: 1 }}
              disabled={importing}
            />
            {urls.length > 1 && (
              <Button
                variant="subtle"
                color="red"
                size="xs"
                px={6}
                onClick={() => removeUrlField(index)}
                disabled={importing}
              >
                <IconTrash size={14} />
              </Button>
            )}
          </Group>
        ))}

        {urls.length < 20 && (
          <Button
            variant="light"
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={addUrlField}
            disabled={importing}
            w="fit-content"
          >
            URL 추가
          </Button>
        )}

        {folders && folders.length > 0 && (
          <Select
            label="폴더 선택"
            placeholder="폴더를 선택하세요"
            data={folders.map((f) => ({ value: f.id, label: f.name }))}
            value={selectedFolderId}
            onChange={setSelectedFolderId}
            clearable
            searchable
          />
        )}

        <Select
          label="매체 태그 (선택)"
          placeholder="매체를 선택하세요"
          data={MEDIA_TAGS.map((tag) => ({ value: tag, label: tag }))}
          value={mediaTag}
          onChange={setMediaTag}
          clearable
          searchable
        />

        <TagsInput
          label="해시태그 (선택)"
          placeholder="태그 입력 후 Enter"
          value={hashtags}
          onChange={setHashtags}
          splitChars={[",", " "]}
          maxTags={10}
        />

        <TextInput
          label="카테고리 (선택)"
          placeholder="예: 건강기능식품, 뷰티, 패션"
          value={category}
          onChange={(e) => setCategory(e.currentTarget.value)}
        />

        <Textarea
          label="메모 (선택)"
          placeholder="가져오는 광고에 대한 메모"
          value={memo}
          onChange={(e) => setMemo(e.currentTarget.value)}
          minRows={2}
          autosize
        />

        {importing && <Progress value={progress} size="sm" animated />}

        {result && (
          <>
            <Text size="sm" c={result.failed > 0 ? "orange" : "green"} fw={600}>
              {result.saved}개 가져오기 완료{result.failed > 0 ? `, ${result.failed}개 실패` : ""}
            </Text>
            {result.errorMsg && <Text size="xs" c="red">{result.errorMsg}</Text>}
          </>
        )}

        <Group justify="flex-end">
          <Button variant="light" onClick={handleClose} disabled={importing}>
            {result ? "닫기" : "취소"}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              loading={importing}
              disabled={validCount === 0}
              leftSection={<IconLink size={16} />}
            >
              가져오기 ({validCount})
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
