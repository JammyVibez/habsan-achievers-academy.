import { Prisma } from '@prisma/client';

export function isPrismaUniqueViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/** P2021: a queried table is missing (usually migrations were not applied). */
export function isPrismaMissingTable(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021';
}

/** Database cannot be reached or the connection pool timed out. */
export function isPrismaConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P1001' || error.code === 'P1002' || error.code === 'P2024')
  ) {
    return true;
  }
  const message = error instanceof Error ? error.message : '';
  return /can't reach database server|failed to connect|connection (refused|timed out)|ECONNREFUSED/i.test(message);
}

export function databaseUnavailableMessage(): string {
  return 'The school database is not reachable right now. Check DATABASE_URL (and that the database is running), then try again.';
}

export function databaseSchemaMessage(): string {
  return 'The database is missing required tables. Run "npm run db:deploy" (or "npm run db:push") to apply the schema, then try again.';
}
