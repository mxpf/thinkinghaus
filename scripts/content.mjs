import path from "node:path";
import {
  calculateReadingTime,
  comparePostsByDate,
  createContentRepository,
  displayDate,
  parseNowEntry,
  parsePage,
  parsePost,
  resolveDocumentLinks,
  serializePost,
  validateContentGraph,
  validateIdentityManifest,
  validateManifestShape,
} from "@mxpf/write-placid-core/content";

export const projectRoot = path.resolve(import.meta.dirname, "..");

const repository = createContentRepository({ projectRoot });

export const {
  readContentRepository,
  readIdentityManifest,
  readNowEntries,
  readPages,
  readPosts,
} = repository;

export {
  calculateReadingTime,
  comparePostsByDate,
  displayDate,
  parseNowEntry,
  parsePage,
  parsePost,
  resolveDocumentLinks,
  serializePost,
  validateContentGraph,
  validateIdentityManifest,
  validateManifestShape,
};
