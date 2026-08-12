import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProblems } from "@/features/problems/hooks/use-problems";
import { useCreatePost } from "../hooks/use-create-post";

interface CreatePostDialogProps {
  // Khi mở từ tab Discuss của 1 bài toán cụ thể — prefill + ẩn luôn ô chọn
  // problem, khác với mở từ trang /discuss chung (không prefill, cho chọn).
  defaultProblemId?: string;
  defaultProblemTitle?: string;
}

export function CreatePostDialog({
  defaultProblemId,
  defaultProblemTitle,
}: CreatePostDialogProps) {
  const { t } = useTranslation("discuss");
  const { data: problems } = useProblems();
  const createPost = useCreatePost();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [problemId, setProblemId] = useState(defaultProblemId ?? "");

  const reset = () => {
    setTitle("");
    setContent("");
    setTagsInput("");
    setProblemId(defaultProblemId ?? "");
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    const tagNames = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    createPost.mutate(
      {
        title: title.trim(),
        content: content.trim(),
        problemId: problemId || undefined,
        tagNames: tagNames.length > 0 ? tagNames : undefined,
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shrink-0">
          <Plus className="h-4 w-4" />
          {t("createPost.trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("createPost.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="discuss-post-title">
              {t("createPost.titleLabel")}
            </Label>
            <Input
              id="discuss-post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("createPost.titlePlaceholder")}
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="discuss-post-content">
              {t("createPost.contentLabel")}
            </Label>
            <Textarea
              id="discuss-post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("createPost.contentPlaceholder")}
              className="min-h-[140px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="discuss-post-tags">
              {t("createPost.tagsLabel")}
            </Label>
            <Input
              id="discuss-post-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder={t("createPost.tagsPlaceholder")}
            />
          </div>

          {defaultProblemId ? (
            <p className="text-xs text-muted-foreground">
              {t("createPost.linkedToProblem", {
                title: defaultProblemTitle,
              })}
            </p>
          ) : (
            <div className="space-y-1.5">
              <Label>{t("createPost.problemLabel")}</Label>
              <Select
                value={problemId || "none"}
                onValueChange={(value) =>
                  setProblemId(value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("createPost.problemPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {t("createPost.noProblem")}
                  </SelectItem>
                  {problems?.map((problem) => (
                    <SelectItem key={problem.id} value={problem.id}>
                      {problem.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!title.trim() || !content.trim() || createPost.isPending}
            onClick={handleSubmit}
          >
            {t("createPost.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
