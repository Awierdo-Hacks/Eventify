export declare const DATABASE_URL_VARIABLES: string[];
export declare function resolveDatabaseUrl(
  source?: Record<string, string | undefined>
): { url: string; variable: string } | null;
