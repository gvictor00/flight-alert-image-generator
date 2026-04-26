import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

export interface HistoryItem {
  id: string;
  template: string;
  route: string;
  createdAt: string;
  payload: string;
}

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(HISTORY_FILE);
  } catch {
    await fs.writeFile(HISTORY_FILE, '[]', 'utf8');
  }
}

export async function readHistory(): Promise<HistoryItem[]> {
  await ensureFile();
  const content = await fs.readFile(HISTORY_FILE, 'utf8');
  return JSON.parse(content) as HistoryItem[];
}

export async function appendHistory(item: HistoryItem): Promise<void> {
  const items = await readHistory();
  items.unshift(item);
  await fs.writeFile(HISTORY_FILE, JSON.stringify(items.slice(0, 50), null, 2), 'utf8');
}
