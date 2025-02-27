import Dexie, { Table } from "dexie";

import { History } from "./types";

class ImageArenaDB extends Dexie {
  history!: Table<History>;

  constructor() {
    super("image-arena-db");
    this.version(1).stores({
      history: "id, rawPrompt, type, createdAt",
    });
  }
}

export const db = new ImageArenaDB();
