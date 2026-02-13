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
 * Suzume instance for Japanese morphological analysis
 */
export declare class Suzume {
    private module;
    private handle;
    private _analyze;
    private _resultFree;
    private _generateTags;
    private _tagsFree;
    private _loadUserDict;
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
     * @returns Array of tag strings
     */
    generateTags(text: string): string[];
    /**
     * Load user dictionary from string data
     *
     * @param data - Dictionary data in CSV format
     * @returns true on success
     */
    loadUserDictionary(data: string): boolean;
    /**
     * Get Suzume version string
     */
    get version(): string;
    /**
     * Destroy the Suzume instance and free resources
     */
    destroy(): void;
    private parseResult;
    private parseTags;
}
export default Suzume;
