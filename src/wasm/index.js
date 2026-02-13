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
 * Suzume instance for Japanese morphological analysis
 */
export class Suzume {
    constructor(module, handle) {
        this.module = module;
        this.handle = handle;
        // Wrap C functions
        this._analyze = module.cwrap('suzume_analyze', 'number', ['number', 'number']);
        this._resultFree = module.cwrap('suzume_result_free', null, ['number']);
        this._generateTags = module.cwrap('suzume_generate_tags', 'number', ['number', 'number']);
        this._tagsFree = module.cwrap('suzume_tags_free', null, ['number']);
        this._loadUserDict = module.cwrap('suzume_load_user_dict', 'number', [
            'number',
            'number',
            'number',
        ]);
        this._version = module.cwrap('suzume_version', 'number', []);
    }
    /**
     * Create a new Suzume instance
     *
     * @param options - Optional configuration options
     * @returns Promise resolving to Suzume instance
     */
    static async create(options) {
        const wasmPath = options?.wasmPath;
        // Dynamic import of the Emscripten-generated module
        const createModule = await import('./suzume.js');
        const module = await createModule.default({
            locateFile: (path) => {
                if (path.endsWith('.wasm') && wasmPath) {
                    return wasmPath;
                }
                return path;
            },
        });
        let handle;
        if (options &&
            (options.preserveVu !== undefined ||
                options.preserveCase !== undefined ||
                options.preserveSymbols !== undefined)) {
            // Create with options
            // suzume_options_t layout: 3 ints (12 bytes on wasm32)
            const OPTIONS_SIZE = 12;
            const optionsPtr = module._malloc(OPTIONS_SIZE);
            try {
                const HEAP32 = new Int32Array(module.HEAP32.buffer);
                // preserve_vu: default true
                HEAP32[optionsPtr >> 2] = options.preserveVu !== false ? 1 : 0;
                // preserve_case: default true
                HEAP32[(optionsPtr >> 2) + 1] = options.preserveCase !== false ? 1 : 0;
                // preserve_symbols: default false
                HEAP32[(optionsPtr >> 2) + 2] = options.preserveSymbols === true ? 1 : 0;
                const createWithOptions = module.cwrap('suzume_create_with_options', 'number', [
                    'number',
                ]);
                handle = createWithOptions(optionsPtr);
            }
            finally {
                module._free(optionsPtr);
            }
        }
        else {
            // Create with default options
            const createHandle = module.cwrap('suzume_create', 'number', []);
            handle = createHandle();
        }
        if (handle === 0) {
            throw new Error('Failed to create Suzume instance');
        }
        return new Suzume(module, handle);
    }
    /**
     * Analyze Japanese text into morphemes
     *
     * @param text - UTF-8 encoded Japanese text
     * @returns Array of morphemes
     */
    analyze(text) {
        const textBytes = this.module.lengthBytesUTF8(text) + 1;
        const textPtr = this.module._malloc(textBytes);
        try {
            this.module.stringToUTF8(text, textPtr, textBytes);
            const resultPtr = this._analyze(this.handle, textPtr);
            if (resultPtr === 0) {
                return [];
            }
            try {
                return this.parseResult(resultPtr);
            }
            finally {
                this._resultFree(resultPtr);
            }
        }
        finally {
            this.module._free(textPtr);
        }
    }
    /**
     * Generate tags from Japanese text
     *
     * @param text - UTF-8 encoded Japanese text
     * @returns Array of tag strings
     */
    generateTags(text) {
        const textBytes = this.module.lengthBytesUTF8(text) + 1;
        const textPtr = this.module._malloc(textBytes);
        try {
            this.module.stringToUTF8(text, textPtr, textBytes);
            const tagsPtr = this._generateTags(this.handle, textPtr);
            if (tagsPtr === 0) {
                return [];
            }
            try {
                return this.parseTags(tagsPtr);
            }
            finally {
                this._tagsFree(tagsPtr);
            }
        }
        finally {
            this.module._free(textPtr);
        }
    }
    /**
     * Load user dictionary from string data
     *
     * @param data - Dictionary data in CSV format
     * @returns true on success
     */
    loadUserDictionary(data) {
        const dataBytes = this.module.lengthBytesUTF8(data) + 1;
        const dataPtr = this.module._malloc(dataBytes);
        try {
            this.module.stringToUTF8(data, dataPtr, dataBytes);
            return this._loadUserDict(this.handle, dataPtr, dataBytes - 1) === 1;
        }
        finally {
            this.module._free(dataPtr);
        }
    }
    /**
     * Get Suzume version string
     */
    get version() {
        const versionPtr = this._version();
        return this.module.UTF8ToString(versionPtr);
    }
    /**
     * Destroy the Suzume instance and free resources
     */
    destroy() {
        if (this.handle !== 0) {
            const destroyHandle = this.module.cwrap('suzume_destroy', null, ['number']);
            destroyHandle(this.handle);
            this.handle = 0;
        }
    }
    // Parse suzume_result_t structure from WASM memory
    parseResult(resultPtr) {
        // suzume_result_t layout:
        // - morphemes: pointer (4 bytes on wasm32)
        // - count: size_t (4 bytes on wasm32)
        const HEAPU32 = new Uint32Array(this.module.HEAPU32.buffer);
        const morphemesPtr = HEAPU32[resultPtr >> 2];
        const count = HEAPU32[(resultPtr >> 2) + 1];
        const morphemes = [];
        // suzume_morpheme_t layout (7 pointers = 28 bytes on wasm32):
        // - surface: pointer
        // - pos: pointer
        // - base_form: pointer
        // - reading: pointer
        // - pos_ja: pointer
        // - conj_type: pointer
        // - conj_form: pointer
        const MORPHEME_SIZE = 28;
        for (let idx = 0; idx < count; idx++) {
            const morphPtr = morphemesPtr + idx * MORPHEME_SIZE;
            const surfacePtr = HEAPU32[morphPtr >> 2];
            const posPtr = HEAPU32[(morphPtr >> 2) + 1];
            const baseFormPtr = HEAPU32[(morphPtr >> 2) + 2];
            const readingPtr = HEAPU32[(morphPtr >> 2) + 3];
            const posJaPtr = HEAPU32[(morphPtr >> 2) + 4];
            const conjTypePtr = HEAPU32[(morphPtr >> 2) + 5];
            const conjFormPtr = HEAPU32[(morphPtr >> 2) + 6];
            morphemes.push({
                surface: this.module.UTF8ToString(surfacePtr),
                pos: this.module.UTF8ToString(posPtr),
                baseForm: this.module.UTF8ToString(baseFormPtr),
                reading: this.module.UTF8ToString(readingPtr),
                posJa: this.module.UTF8ToString(posJaPtr),
                conjType: conjTypePtr !== 0 ? this.module.UTF8ToString(conjTypePtr) : null,
                conjForm: conjFormPtr !== 0 ? this.module.UTF8ToString(conjFormPtr) : null,
            });
        }
        return morphemes;
    }
    // Parse suzume_tags_t structure from WASM memory
    parseTags(tagsPtr) {
        // suzume_tags_t layout:
        // - tags: pointer to char** (4 bytes on wasm32)
        // - count: size_t (4 bytes on wasm32)
        const HEAPU32 = new Uint32Array(this.module.HEAPU32.buffer);
        const tagsArrayPtr = HEAPU32[tagsPtr >> 2];
        const count = HEAPU32[(tagsPtr >> 2) + 1];
        const tags = [];
        for (let idx = 0; idx < count; idx++) {
            const tagPtr = HEAPU32[(tagsArrayPtr >> 2) + idx];
            tags.push(this.module.UTF8ToString(tagPtr));
        }
        return tags;
    }
}
// Default export
export default Suzume;
