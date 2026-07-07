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
    /** Analysis mode, default: normal */
    mode?: 'normal' | 'search' | 'split';
    /** Apply lemmatization, default: true */
    lemmatize?: boolean;
    /** Merge consecutive noun compounds, default: false */
    mergeCompounds?: boolean;
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
    /** Part of speech (Japanese) */
    posJa: string;
    /** Conjugation type (Japanese, e.g., "一段", "五段・カ行") - null for non-conjugating words */
    conjType: string | null;
    /** Conjugation form (Japanese, e.g., "連用形", "終止形") - null for non-conjugating words */
    conjForm: string | null;
    /** Extended POS subcategory (English, e.g., "VerbRenyokei", "AuxTenseTa") */
    extendedPos: string;
    /** Start character offset in normalized text */
    start: number;
    /** End character offset in normalized text */
    end: number;
    /** True if matched from a user dictionary */
    isUserDict: boolean;
    /** True if the morpheme is a formal noun */
    isFormalNoun: boolean;
    /** True if the morpheme is low information for tag generation */
    isLowInfo: boolean;
    /** True if generated as an unknown word */
    isUnknown: boolean;
    /** True if matched from any dictionary */
    isFromDictionary: boolean;
    /** Candidate score/cost */
    score: number;
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
    /** Exclude particles (default: true) */
    excludeParticles?: boolean;
    /** Exclude auxiliaries (default: true) */
    excludeAuxiliaries?: boolean;
    /** Exclude formal nouns (default: true) */
    excludeFormalNouns?: boolean;
    /** Exclude low information words (default: true) */
    excludeLowInfo?: boolean;
    /** Remove duplicate tags (default: true) */
    removeDuplicates?: boolean;
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
    private _lastError;
    private _dictionaryWarningCount;
    private _dictionaryWarning;
    private layouts;
    private unregisterToken;
    private constructor();
    private static loadCLayouts;
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
     * Load user dictionary from string data, throwing with C API details on failure.
     *
     * @param data - Dictionary data in CSV format
     */
    loadUserDictionaryOrThrow(data: string): void;
    /**
     * Load binary dictionary from buffer data (as user dictionary)
     *
     * @param data - Binary dictionary data (.dic format)
     * @returns true on success
     */
    loadBinaryDictionary(data: Uint8Array): boolean;
    /**
     * Load binary dictionary from buffer data, throwing with C API details on failure.
     *
     * @param data - Binary dictionary data (.dic format)
     */
    loadBinaryDictionaryOrThrow(data: Uint8Array): void;
    /**
     * Get Suzume version string
     */
    get version(): string;
    /**
     * Last C API error for this thread, or empty string if the last C API call succeeded.
     */
    get lastError(): string;
    /**
     * Dictionary warnings produced while auto-loading dictionaries at construction.
     */
    get dictionaryWarnings(): string[];
    /**
     * Destroy the Suzume instance and free resources.
     * Called automatically via FinalizationRegistry when garbage collected,
     * but can be called explicitly for immediate cleanup.
     */
    destroy(): void;
    private ensureAlive;
    private parseResult;
    private parseTags;
}
export default Suzume;
