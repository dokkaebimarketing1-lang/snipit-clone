"use client";

import { useState } from "react";
import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  TagsInput,
  Textarea,
} from "@mantine/core";
import { MEDIA_TAGS, MediaTag } from "@/types";

interface SaveAdModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (data: { mediaTag: MediaTag | null; hashtags: string[]; memo: string }) => void;
  loading?: boolean;
}

export function SaveAdModal({ opened, onClose, onSave, loading }: SaveAdModalProps) {
  const [mediaTag, setMediaTag] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [memo, setMemo] = useState("");

  const handleSave = () => {
    onSave({
      mediaTag: mediaTag as MediaTag | null,
      hashtags,
      memo,
    });
    setMediaTag(null);
    setHashtags([]);
    setMemo("");
  };

  const handleClose = () => {
    setMediaTag(null);
    setHashtags([]);
    setMemo("");
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="광고 저장" size="md">
      <Stack gap="md">
        <Select
          label="매체 태그"
          placeholder="매체를 선택하세요"
          data={MEDIA_TAGS.map((tag) => ({ value: tag, label: tag }))}
          value={mediaTag}
          onChange={setMediaTag}
          clearable
          searchable
        />

        <TagsInput
          label="해시태그"
          placeholder="태그 입력 후 Enter"
          value={hashtags}
          onChange={setHashtags}
          splitChars={[",", " "]}
          maxTags={10}
        />

        <Textarea
          label="메모"
          placeholder="이 광고에 대한 메모를 남겨보세요"
          value={memo}
          onChange={(e) => setMemo(e.currentTarget.value)}
          minRows={3}
          maxRows={6}
          autosize
        />

        <Group justify="flex-end">
          <Button variant="light" onClick={handleClose}>
            취소
          </Button>
          <Button onClick={handleSave} loading={loading}>
            저장
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
