import { prisma } from '@/lib/prisma';

const CLASS_CATALOG_KEY = 'class_catalog';

export const DEFAULT_CLASSES = [
  'Pre-Nursery',
  'Nursery 1',
  'Nursery 2',
  'Primary 1',
  'Primary 2',
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Primary 6',
  'JSS 1A',
  'JSS 1B',
  'JSS 1C',
  'JSS 2A',
  'JSS 2B',
  'JSS 2C',
  'JSS 3A',
  'JSS 3B',
  'JSS 3C',
  'SS 1A',
  'SS 1B',
  'SS 1C',
  'SS 2A',
  'SS 2B',
  'SS 2C',
  'SS 3A',
  'SS 3B',
  'SS 3C',
];

function normalizeClasses(classes: string[]): string[] {
  return [...new Set(classes.map((c) => c.trim()).filter(Boolean))];
}

/**
 * Classes shown in admission / student forms.
 * A database problem must never leave the class picker empty, otherwise no
 * application or student record can be submitted.
 */
export async function getClassCatalog(): Promise<string[]> {
  try {
    const block = await prisma.siteContentBlock.findUnique({
      where: { key: CLASS_CATALOG_KEY },
      select: { payload: true },
    });
    const payload = block?.payload as { classes?: unknown } | null;
    if (payload && Array.isArray(payload.classes)) {
      const classes = normalizeClasses(payload.classes.filter((v): v is string => typeof v === 'string'));
      if (classes.length > 0) return classes;
    }
  } catch (error) {
    console.warn('[class-catalog] falling back to default classes:', error);
  }
  return DEFAULT_CLASSES;
}

export async function setClassCatalog(classes: string[]): Promise<string[]> {
  const normalized = normalizeClasses(classes);
  await prisma.siteContentBlock.upsert({
    where: { key: CLASS_CATALOG_KEY },
    create: {
      key: CLASS_CATALOG_KEY,
      payload: { classes: normalized },
    },
    update: {
      payload: { classes: normalized },
    },
  });
  return normalized;
}
