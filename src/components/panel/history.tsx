"use client";

import { useHistory } from "@/hooks/db/use-gen-history";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trash2, Trophy } from "lucide-react";
import { getModelById } from "@/constants/models";
import Image from "next/image";
import { GalleryModal } from "@/components/ui/gallery/gallery-modal";
import { useState, useMemo } from "react";
import type { MediaItemType } from "@/components/ui/gallery/gallery";
import type { History as HistoryType } from "@/db/types";
import { useMonitorMessage } from "@/hooks/global/use-monitor-message";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface GalleryItem extends MediaItemType {
  id: string;
  url: string;
  base64: string;
  title: string;
  desc: string;
  tag?: string;
}

export default function History() {
  const t = useTranslations("history");
  const commonT = useTranslations("common");
  const [page, setPage] = useState(1);
  const { history, deleteHistory } = useHistory(page);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { handleDownload } = useMonitorMessage();

  // 将当前记录的图片转换为GalleryModal需要的格式
  const currentGalleryItems = useMemo(() => {
    if (!selectedItem || !history) return [];

    const record = history.items.find((h) =>
      h.images.some((img) => img.base64 === selectedItem.base64)
    );

    if (!record) return [];

    return record.images.map((image, index) => ({
      id: `${record.id}-${index}`,
      url: "",
      base64: image.base64,
      title: getModelById(image.model)?.name || image.model,
      desc: image.prompt,
      tag:
        record.type === "pk" && record.winner === index
          ? t("winner", {
              model: getModelById(image.model)?.name,
            })
          : undefined,
    }));
  }, [selectedItem, history, t]);

  const handleImageClick = (
    record: HistoryType,
    image: HistoryType["images"][0]
  ) => {
    const modelName = getModelById(image.model)?.name || image.model;
    setSelectedItem({
      id: `${record.id}-${record.images.indexOf(image)}`,
      url: "",
      base64: image.base64,
      title: modelName,
      desc: image.prompt,
      tag:
        record.type === "pk" && record.winner === record.images.indexOf(image)
          ? t("winner", { model: modelName })
          : undefined,
    });
    setIsModalOpen(true);
  };

  if (!history) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="flex size-full flex-col gap-4">
      <div className="@container">
        <div className="rounded-lg border bg-card text-card-foreground focus-within:border-transparent focus-within:ring-1 focus-within:ring-violet-500">
          <div className="grid gap-4 p-4">
            {history.items.map((record) => (
              <div
                key={record.id}
                className="group relative rounded-lg border bg-background p-4"
              >
                {/* 头部信息 */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {record.type === "gen" ? t("typeGen") : t("typePk")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(record.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    onClick={() => deleteHistory(record.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* 提示词 */}
                <div className="mb-4">
                  <div className="text-xs text-muted-foreground">
                    {t("prompt")}
                  </div>
                  <div className="mt-1 text-sm">{record.rawPrompt}</div>
                </div>

                {/* 图片展示 */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {record.images.map((image, index) => (
                    <div key={index} className="space-y-2">
                      <div
                        className={cn(
                          "group/image relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg border transition-all",
                          record.type === "pk" &&
                            record.winner === index &&
                            "ring-2 ring-primary",
                          "hover:scale-[1.02]"
                        )}
                        onClick={() => handleImageClick(record, image)}
                      >
                        <Image
                          src={image.base64}
                          alt={image.prompt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        {/* 图片数量指示器 */}
                        {index === 0 && record.images.length > 1 && (
                          <div className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                            {record.images.length} {t("imageCount")}
                          </div>
                        )}
                        {record.type === "pk" && record.winner === index && (
                          <div className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground">
                            <Trophy className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div
                        className={cn(
                          "text-center text-sm font-medium",
                          record.type === "pk" &&
                            record.winner === index &&
                            "flex items-center justify-center gap-1 text-primary"
                        )}
                      >
                        {record.type === "pk" && record.winner === index && (
                          <Trophy className="h-4 w-4" />
                        )}
                        {getModelById(image.model)?.name}
                      </div>
                    </div>
                  ))}
                </div>

                {/* PK结果 */}
                {record.type === "pk" && record.winner !== undefined && (
                  <div className="mt-2 text-center text-sm text-muted-foreground">
                    {record.winner === -1
                      ? t("tie")
                      : t("winner", {
                          model: getModelById(
                            record.images[record.winner].model
                          )?.name,
                        })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {history.totalPages > 1 && (
            <div className="border-t px-4 py-3 pb-20 @lg:pb-3">
              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={cn(
                        page === 1 && "pointer-events-none opacity-50"
                      )}
                      aria-label={commonT("pagination.previous")}
                    >
                      <span>{commonT("pagination.previous")}</span>
                    </PaginationPrevious>
                  </PaginationItem>
                  {Array.from(
                    { length: history.totalPages },
                    (_, i) => i + 1
                  ).map((pageNumber) => {
                    // Show first page, current page, last page, and pages around current page
                    if (
                      pageNumber === 1 ||
                      pageNumber === history.totalPages ||
                      (pageNumber >= page - 1 && pageNumber <= page + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => setPage(pageNumber)}
                            isActive={page === pageNumber}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    // Show ellipsis for gaps
                    if (
                      pageNumber === 2 ||
                      pageNumber === history.totalPages - 1
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationEllipsis>
                            <span className="sr-only">
                              {commonT("pagination.more_pages")}
                            </span>
                          </PaginationEllipsis>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((p) => Math.min(history.totalPages, p + 1))
                      }
                      className={cn(
                        page === history.totalPages &&
                          "pointer-events-none opacity-50"
                      )}
                      aria-label={commonT("pagination.next")}
                    >
                      <span>{commonT("pagination.next")}</span>
                    </PaginationNext>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>

      {/* 图片预览弹窗 */}
      {selectedItem && (
        <GalleryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedItem={selectedItem}
          setSelectedItem={(item) => setSelectedItem(item as GalleryItem)}
          mediaItems={currentGalleryItems}
          showDelete={false}
          onDownload={(item) => {
            if (item.base64) {
              handleDownload(item.base64, `${item.desc.slice(0, 10)}.png`);
            }
          }}
        />
      )}
    </div>
  );
}
