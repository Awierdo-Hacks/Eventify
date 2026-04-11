const DATABASE_URL_KEYS = [
  "DATABASE_URL",
  "DATABASE_URL_POSTGRES_URL",
  "DATABASE_URL_PRISMA_DATABASE_URL",
] as const;

function getEnvValue(key: string) {
  const value = process.env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function getDatabaseUrl() {
  for (const key of DATABASE_URL_KEYS) {
    const value = getEnvValue(key);
    if (value) {
      return value;
    }
  }

  throw new Error(
    `Missing database connection string. Set one of: ${DATABASE_URL_KEYS.join(", ")}`
  );
}

export function getSourceDatabaseUrl() {
  const value = getEnvValue("SOURCE_DATABASE_URL");
  if (!value) {
    throw new Error("Missing SOURCE_DATABASE_URL for the source database connection.");
  }

  return value;
}
