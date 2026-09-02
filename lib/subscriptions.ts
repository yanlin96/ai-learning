import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { findTrainLine } from "@/lib/train-lines";

export type LineSubscription = {
  id: string;
  lineId: string;
  reminderTime: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionInput = {
  lineId: string;
  reminderTime: string;
  enabled?: boolean;
};

const DATA_FILE = resolve(process.cwd(), "data", "subscriptions.json");
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

async function validate(input: SubscriptionInput) {
  if (!await findTrainLine(input.lineId)) throw new Error("Unknown train line");
  if (!TIME_PATTERN.test(input.reminderTime)) throw new Error("Reminder time must use HH:mm");
}

async function readAll(): Promise<LineSubscription[]> {
  try {
    return JSON.parse(await readFile(DATA_FILE, "utf8")) as LineSubscription[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function saveAll(items: LineSubscription[]) {
  await mkdir(dirname(DATA_FILE), { recursive: true });
  const temporary = `${DATA_FILE}.tmp`;
  await writeFile(temporary, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  await rename(temporary, DATA_FILE);
}

export async function listSubscriptions() {
  return readAll();
}

export async function createSubscription(input: SubscriptionInput) {
  await validate(input);
  const items = await readAll();
  if (items.some((item) => item.lineId === input.lineId)) {
    throw new Error("A reminder already exists for this line");
  }
  const now = new Date().toISOString();
  const item: LineSubscription = {
    id: randomUUID(),
    lineId: input.lineId,
    reminderTime: input.reminderTime,
    enabled: input.enabled ?? true,
    createdAt: now,
    updatedAt: now,
  };
  await saveAll([...items, item]);
  return item;
}

export async function updateSubscription(id: string, input: SubscriptionInput) {
  await validate(input);
  const items = await readAll();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Reminder not found");
  if (items.some((item) => item.id !== id && item.lineId === input.lineId)) {
    throw new Error("A reminder already exists for this line");
  }
  const updated: LineSubscription = {
    ...items[index],
    ...input,
    enabled: input.enabled ?? items[index].enabled,
    updatedAt: new Date().toISOString(),
  };
  items[index] = updated;
  await saveAll(items);
  return updated;
}

export async function deleteSubscription(id: string) {
  const items = await readAll();
  if (!items.some((item) => item.id === id)) throw new Error("Reminder not found");
  await saveAll(items.filter((item) => item.id !== id));
}
