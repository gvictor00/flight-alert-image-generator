import { NextResponse } from 'next/server';
import { readHistory } from '@/lib/rendering/history-store';

export async function GET() {
  const items = await readHistory();
  return NextResponse.json(items);
}
