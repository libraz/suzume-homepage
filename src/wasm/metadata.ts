import meta from './meta.json'

// Single source of truth for every WASM build fact shown on the site. All of
// these are pulled from the generated `meta.json` (written by `yarn copy:wasm`),
// so nothing here needs hand-editing per release — update the artifact and the
// numbers follow.

// Sizes: round bytes upward so the displayed integer is never smaller than the
// artifact. Derived from the byte counts, not from meta.json's pre-rounded
// `sizeKB` / `gzipKB` fields, so a single rounding rule governs every label.
export const WASM_SIZE_BYTES = meta.size
export const WASM_GZIP_BYTES = meta.gzipSize
export const WASM_SIZE_KB = Math.ceil(meta.size / 1024)
export const WASM_GZIP_KB = Math.ceil(meta.gzipSize / 1024)
export const WASM_SIZE = `${WASM_SIZE_KB}KB`
export const WASM_GZIP_SIZE = `${WASM_GZIP_KB}KB`

// Build provenance.
export const SUZUME_VERSION = meta.version
export const WASM_MD5 = meta.md5
export const WASM_BUILD_DATE = meta.buildDate
export const WASM_COMMIT_HASH = meta.commitHash
