import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { NoticeAudience, NoticePriority } from '@prisma/client';

export type NoticeRow = {
  id: string;
  title: string;
  content: string;
  targetAudience: NoticeAudience;
  targetClass: string | null;
  priority: NoticePriority;
  isPublished: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorName: string;
};

function serializeNotice(notice: {
  id: string;
  title: string;
  content: string;
  targetAudience: NoticeAudience;
  targetClass: string | null;
  priority: NoticePriority;
  isPublished: boolean;
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { firstName: string; lastName: string };
}): NoticeRow {
  return {
    id: notice.id,
    title: notice.title,
    content: notice.content,
    targetAudience: notice.targetAudience,
    targetClass: notice.targetClass,
    priority: notice.priority,
    isPublished: notice.isPublished,
    publishedAt: notice.publishedAt?.toISOString() ?? null,
    expiresAt: notice.expiresAt?.toISOString() ?? null,
    createdAt: notice.createdAt.toISOString(),
    updatedAt: notice.updatedAt.toISOString(),
    authorName: `${notice.createdBy.firstName} ${notice.createdBy.lastName}`.trim() || 'Admin',
  };
}

const authorSelect = { createdBy: { select: { firstName: true, lastName: true } } } as const;

/** Missing table / enum during deploy or prerender should not crash public pages. */
function isSchemaMissingError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2021: table does not exist; P2010: raw query failed; P1001/P1002 connection can also appear at build.
    return error.code === 'P2021' || error.code === 'P2010';
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return /does not exist|notices|NoticePriority|NoticeAudience/i.test(message);
}

export async function listAllNotices(): Promise<NoticeRow[]> {
  try {
    const rows = await prisma.notice.findMany({
      orderBy: [{ createdAt: 'desc' }],
      include: authorSelect,
    });
    return rows.map(serializeNotice);
  } catch (error) {
    if (isSchemaMissingError(error)) {
      console.warn('[notices] listAllNotices skipped (schema not ready):', error);
      return [];
    }
    throw error;
  }
}

export async function listPublishedNotices(limit?: number): Promise<NoticeRow[]> {
  const now = new Date();
  try {
    const rows = await prisma.notice.findMany({
      where: {
        isPublished: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: authorSelect,
    });
    return rows.map(serializeNotice);
  } catch (error) {
    if (isSchemaMissingError(error)) {
      console.warn('[notices] listPublishedNotices skipped (schema not ready):', error);
      return [];
    }
    throw error;
  }
}

export async function getNoticeById(id: string) {
  try {
    const row = await prisma.notice.findUnique({
      where: { id },
      include: authorSelect,
    });
    return row ? serializeNotice(row) : null;
  } catch (error) {
    if (isSchemaMissingError(error)) {
      console.warn('[notices] getNoticeById skipped (schema not ready):', error);
      return null;
    }
    throw error;
  }
}
