/**
 * Suzume - Lightweight Japanese morphological analyzer
 *
 * @example
 * ```typescript
 * import { Suzume } from 'suzume';
 *
 * const suzume = await Suzume.create();
 * const result = suzume.analyze('すもももももももものうち');
 * console.log(result);
 * ```
 */
/**
 * Options for creating a Suzume instance
 */
export interface SuzumeOptions {
    /** Preserve ヴ (don't normalize to ビ etc.), default: true */
    preserveVu?: boolean;
    /** Preserve case (don't lowercase ASCII), default: true */
    preserveCase?: boolean;
    /** Preserve symbols/emoji in output, default: false */
    preserveSymbols?: boolean;
}
/**
 * Morpheme - A single unit of morphological analysis
 */
export interface Morpheme {
    /** Surface form (as it appears in the text) */
    surface: string;
    /** Part of speech (English) */
    pos: string;
    /** Base/dictionary form */
    baseForm: string;
    /** Reading in katakana */
    reading: string;
    /** Part of speech (Japanese) */
    posJa: string;
    /** Conjugation type (Japanese, e.g., "一段", "五段・カ行") - null for non-conjugating words */
    conjType: string | null;
    /** Conjugation form (Japanese, e.g., "連用形", "終止形") - null for non-conjugating words */
    conjForm: string | null;
}
/**
 * Tag entry with POS information
 */
export interface Tag {
    /** Tag text (surface or lemma) */
    tag: string;
    /** Part of speech (English) */
    pos: string;
}
/**
 * Options for tag generation
 */
export interface TagOptions {
    /** POS categories to include (default: all content words) */
    pos?: ('noun' | 'verb' | 'adjective' | 'adverb')[];
    /** Exclude basic/common words with hiragana-only lemma (default: false) */
    excludeBasic?: boolean;
    /** Use lemma instead of surface form (default: true) */
    useLemma?: boolean;
    /** Minimum tag length in characters (default: 2) */
    minLength?: number;
    /** Maximum number of tags, 0 for unlimited (default: 0) */
    maxTags?: number;
}
/**
 * Suzume instance for Japanese morphological analysis
 */
export declare class Suzume {
    private module;
    private handle;
    private cleanupRef;
    private _analyze;
    private _resultFree;
    private _generateTags;
    private _generateTagsWithOptions;
    private _tagsFree;
    private _loadUserDict;
    private _loadBinaryDict;
    private _version;
    private constructor();
    /**
     * Create a new Suzume instance
     *
     * @param options - Optional configuration options
     * @returns Promise resolving to Suzume instance
     */
    static create(options?: SuzumeOptions & {
        wasmPath?: string;
    }): Promise<Suzume>;
    /**
     * Analyze Japanese text into morphemes
     *
     * @param text - UTF-8 encoded Japanese text
     * @returns Array of morphemes
     */
    analyze(text: string): Morpheme[];
    /**
     * Generate tags from Japanese text
     *
     * @param text - UTF-8 encoded Japanese text
     * @param options - Optional tag generation options
     * @returns Array of tag entries with POS information
     */
    generateTags(text: string, options?: TagOptions): Tag[];
    /**
     * Load user dictionary from string data
     *
     * @param data - Dictionary data in CSV format
     * @returns true on success
     */
    loadUserDictionary(data: string): boolean;
    /**
     * Load binary dictionary from buffer data (as user dictionary)
     *
     * @param data - Binary dictionary data (.dic format)
     * @returns true on success
     */
    loadBinaryDictionary(data: Uint8Array): boolean;
    /**
     * Get Suzume version string
     */
    get version(): string;
    /**
     * Destroy the Suzume instance and free resources.
     * Called automatically via FinalizationRegistry when garbage collected,
     * but can be called explicitly for immediate cleanup.
     */
    destroy(): void;
    private parseResult;
    private parseTags;
}
export default Suzume;
