import type { RepositoryContext } from "../repository/repository.ts";
import { searchWithGitFallback } from "./fallback.ts";
import { isRipgrepAvailable, searchWithRipgrep } from "./ripgrep.ts";
import type { SearchRequest, SearchResult } from "./types.ts";

export async function searchRepository(
  repo: RepositoryContext,
  request: SearchRequest,
): Promise<SearchResult> {
  if (await isRipgrepAvailable()) {
    try {
      return await searchWithRipgrep(repo, request);
    } catch {
      // Fall through to git+Bun when rg fails unexpectedly.
    }
  }
  return await searchWithGitFallback(repo, request);
}

export type { SearchMatch, SearchRequest, SearchResult } from "./types.ts";
