export type SearchRequest = {
  pattern: string;
  path?: string;
  include?: string;
  caseSensitive?: boolean;
  fixedString?: boolean;
  maxMatches?: number;
  contextBefore?: number;
  contextAfter?: number;
};

export type SearchMatch = {
  path: string;
  line: number;
  column?: number;
  text: string;
  before?: string[];
  after?: string[];
};

export type SearchResult = {
  matches: SearchMatch[];
  truncated: boolean;
};
