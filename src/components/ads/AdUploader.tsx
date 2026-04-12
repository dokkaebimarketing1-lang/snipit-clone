"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Group,
  Image,
  Modal,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
  Textarea,
  ActionIcon,
} from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import "@mantine/dropzone/styles.css";
import {
  IconCloudUpload,
  IconPhoto,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { MEDIA_TAGS, MediaTag } from "@/types";

const ACCEPTED_MIME_TYPES = [
  ...IMAGE_MIME_TYPE,
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

interface AdUploaderProps {
  opened: boolean;
  onClose: () => void;
  boardId?: string;
  onUploadComplete: () => void;
}

export function AdUploader({ opened, onClose, boardId, onUploadComplete }: AdUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [mediaTag, setMediaTag] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ uploaded: number; failed: number } | null>(null);

  const handleDrop = (droppedFiles: File[]) => {
    const total = files.length + droppedFiles.length;
    if (total > 20) {
      setFiles((prev) => [...prev, ...droppedFiles.slice(0, 20 - prev.length)]);
    } else {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setProgress(10);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    if (boardId) formData.set("boardId", boardId);
    if (mediaTag) formData.set("mediaTag", mediaTag);
    if (hashtags.length > 0) formData.set("hashtags", hashtags.join(","));
    if (memo) formData.set("memo", memo);

    setProgress(30);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      setProgress(90);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setResult({ uploaded: data.uploaded, failed: data.failed });
      setProgress(100);
      onUploadComplete();
    } catch {
      setResult({ uploaded: 0, failed: files.length });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setMediaTag(null);
    setHashtags([]);
    setMemo("");
    setProgress(0);
    setResult(null);
    onClose();
  };

  const previewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => previewUrls.forEach((u) => URL.revokeObjectURL(u));
  }, [previewUrls]);

  const previews = files.map((file, index) => {
    const isVideo = file.type.startsWith("video/");
    const url = previewUrls[index];
    return (
      <Box key={`${file.name}-${index}`} pos="relative">
        {isVideo ? (
          <Box
            style={{
              width: "100%",
              height: 100,
              backgroundColor: "#1a1a2e",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text size="xs" c="white">{file.name}</Text>
          </Box>
        ) : (
          <Image src={url} height={100} radius="sm" alt={file.name} fit="cover" />
        )}
        <ActionIcon
          size="xs"
          color="red"
          variant="filled"
          pos="absolute"
          top={4}
          right={4}
          onClick={() => removeFile(index)}
        >
          <IconX size={10} />
        </ActionIcon>
        <Text size="xs" c="dimmed" truncate mt={2}>{file.name}</Text>
      </Box>
    );
  });

  return (
    <Modal opened={opened} onClose={handleClose} title="파일 업로드" size="lg">
      <Stack gap="md">
        <Dropzone
          onDrop={handleDrop}
          accept={ACCEPTED_MIME_TYPES}
          maxSize={50 * 1024 * 1024}
          disabled={uploading}
        >
          <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: "none" }}>
            <Dropzone.Accept>
              <IconCloudUpload size={40} color="var(--mantine-color-blue-6)" />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={40} color="var(--mantine-color-red-6)" />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconPhoto size={40} color="var(--mantine-color-dimmed)" />
            </Dropzone.Idle>
            <Box>
              <Text size="sm" fw={600} ta="center">
                이미지/영상을 드래그하거나 클릭하세요
              </Text>
              <Text size="xs" c="dimmed" ta="center" mt={4}>
                최대 20개 파일, 각 50MB 이하 (JPG, PNG, GIF, WebP, MP4, WebM)
              </Text>
            </Box>
          </Group>
        </Dropzone>

        {files.length > 0 && (
          <>
            <Text size="sm" fw={600}>{files.length}개 파일 선택됨</Text>
            <SimpleGrid cols={{ base: 3, sm: 4, md: 5 }} spacing="sm">
              {previews}
            </SimpleGrid>
          </>
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

        <Textarea
          label="메모 (선택)"
          placeholder="업로드하는 파일에 대한 메모"
          value={memo}
          onChange={(e) => setMemo(e.currentTarget.value)}
          minRows={2}
          maxRows={4}
          autosize
        />

        {uploading && <Progress value={progress} size="sm" animated />}

        {result && (
          <Text size="sm" c={result.failed > 0 ? "orange" : "green"} fw={600}>
            {result.uploaded}개 업로드 완료{result.failed > 0 ? `, ${result.failed}개 실패` : ""}
          </Text>
        )}

        <Group justify="flex-end">
          <Button variant="light" onClick={handleClose} disabled={uploading}>
            {result ? "닫기" : "취소"}
          </Button>
          {!result && (
            <Button
              onClick={handleUpload}
              loading={uploading}
              disabled={files.length === 0}
              leftSection={<IconCloudUpload size={16} />}
            >
              업로드 ({files.length})
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
