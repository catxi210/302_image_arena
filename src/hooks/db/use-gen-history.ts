import { createScopedLogger } from "@/utils/logger";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/db";
import { History } from "@/db/types";
import { useCallback } from "react";
import { AddHistory } from "@/db/types";

const logger = createScopedLogger("use-gen-history");
const PAGE_SIZE = 10;

export const useHistory = (page = 1) => {
  const offset = (page - 1) * PAGE_SIZE;

  const genHistory = useLiveQuery(async () => {
    const genHistory = await db.history
      .orderBy("createdAt")
      .filter((x) => x.type === "gen")
      .reverse()
      .offset(offset)
      .limit(PAGE_SIZE)
      .toArray();
    return genHistory;
  }, [page]);

  const pkHistory = useLiveQuery(async () => {
    const pkHistory = await db.history
      .orderBy("createdAt")
      .filter((x) => x.type === "pk")
      .reverse()
      .offset(offset)
      .limit(PAGE_SIZE)
      .toArray();
    return pkHistory;
  }, [page]);

  const history = useLiveQuery(async () => {
    const [items, total] = await Promise.all([
      db.history
        .orderBy("createdAt")
        .reverse()
        .offset(offset)
        .limit(PAGE_SIZE)
        .toArray(),
      db.history.count(),
    ]);

    return {
      items,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      currentPage: page,
    };
  }, [page]);

  const addHistory = useCallback(async (history: AddHistory) => {
    const id = crypto.randomUUID();
    await db.history.add({
      ...history,
      id,
      createdAt: Date.now(),
    });
    return id;
  }, []);

  const updateHistory = useCallback((id: string, history: Partial<History>) => {
    db.history.update(id, history);
  }, []);

  const deleteHistory = useCallback((id: string) => {
    db.history.delete(id);
  }, []);

  const updateHistoryImage = useCallback(
    async (
      historyId: string,
      index: number,
      image: {
        base64: string;
        prompt: string;
        model: string;
        status: "success" | "failed";
      }
    ) => {
      await db.history
        .where("id")
        .equals(historyId)
        .modify((history: History) => {
          history.images[index] = image;
        });
    },
    []
  );

  const updateHistoryImageStatus = useCallback(
    async (
      historyId: string,
      index: number,
      status: "pending" | "success" | "failed"
    ) => {
      await db.history
        .where("id")
        .equals(historyId)
        .modify((history: History) => {
          history.images[index].status = status;
        });
    },
    []
  );

  return {
    genHistory,
    pkHistory,
    history,
    addHistory,
    updateHistory,
    deleteHistory,
    updateHistoryImage,
    updateHistoryImageStatus,
  };
};
