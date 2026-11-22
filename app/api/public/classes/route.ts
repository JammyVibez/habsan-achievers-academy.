import { NextResponse } from 'next/server';
import { DEFAULT_CLASSES, getClassCatalog } from '@/lib/class-catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const classes = await getClassCatalog();
    return NextResponse.json({ classes });
  } catch (error) {
    console.error('public classes', error);
    return NextResponse.json({ classes: DEFAULT_CLASSES });
  }
}
