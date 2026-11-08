import type { AnalysisResult, Tag } from './index.js';
export interface DecodeMemory {
    UTF8ToString: (ptr: number) => string;
    HEAPU32: Uint32Array;
}
/** Byte view over the module heap, derived from HEAPU32 (HEAPU8 may not be exported). */
export declare function heapBytes(module: Pick<DecodeMemory, 'HEAPU32'>): Uint8Array;
export type ConjugationTypeLabel = (code: number) => string | null;
export type ConjugationFormLabel = (code: number) => string | null;
export type ExtendedPosLabel = (code: number) => string;
export type PosLabel = (code: number) => string;
export declare function decodeAnalysisResult(module: DecodeMemory, resultPtr: number, conjugationTypeLabel: ConjugationTypeLabel, conjugationFormLabel: ConjugationFormLabel, extendedPosLabel: ExtendedPosLabel, posLabel: PosLabel): AnalysisResult;
export declare function decodeTags(module: DecodeMemory, tagsPtr: number, posLabel: PosLabel): Tag[];
