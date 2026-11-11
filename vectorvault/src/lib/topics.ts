// Validation and normalization for repository topics and issue
// labels. Both are stored as PostgreSQL "text[]" columns, so the
// rules are shared: lowercase slugs, no duplicates, capped.

export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 30;

const TAG_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

export type TagResult = {
  tags: string[];
  error: string | null;
};

/**
 * Normalizes free-form input (comma or space separated) into a
 * clean, deduplicated list of tags. Returns an error message
 * when an individual tag is invalid.
 */
export function normalizeTags(input: string | string[]): TagResult {
  const raw = Array.isArray(input) ? input.join(",") : input;

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const part of raw.split(/[\s,]+/)) {
    let tag = part.trim().toLowerCase();

    if (tag.startsWith("#")) {
      tag = tag.slice(1);
    }

    tag = tag.replace(/^\.+/, "").replace(/\.+$/, "");

    if (!tag) continue;

    if (tag.length > MAX_TAG_LENGTH) {
      return {
        tags: [],
        error: `Each topic must be ${MAX_TAG_LENGTH} characters or fewer.`,
      };
    }

    if (!TAG_PATTERN.test(tag)) {
      return {
        tags: [],
        error: `"${tag}" is not valid. Topics can only contain letters, numbers, dots, hyphens and underscores, and must start with a letter or number.`,
      };
    }

    if (!seen.has(tag)) {
      seen.add(tag);
      tags.push(tag);
    }

    if (tags.length > MAX_TAGS) {
      return {
        tags: [],
        error: `No more than ${MAX_TAGS} topics are allowed.`,
      };
    }
  }

  return { tags, error: null };
}

export const normalizeTopics = normalizeTags;
export const normalizeLabels = normalizeTags;
