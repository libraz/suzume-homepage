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
const registry = new FinalizationRegistry((ref) => {
    if (ref.handle !== 0) {
        const destroyHandle = ref.module.cwrap('suzume_destroy', null, ['number']);
        destroyHandle(ref.handle);
        ref.handle = 0;
    }
});
/**
 * Suzume instance for Japanese morphological analysis.
 *
 * Error contract note: under the WebAssembly build, a memory-allocation failure
 * aborts the module rather than returning NULL, so the C++ allocation-failure
 * path (which maps to a NULL return and a thrown Error on native/Python) is
 * effectively unreachable here.
 */
export class Suzume {
    constructor(module, handle, layouts) {
        this.unregisterToken = {};
        this.module = module;
        this.handle = handle;
        this.cleanupRef = { module, handle };
        registry.register(this, this.cleanupRef, this.unregisterToken);
        // Wrap C functions
        this._analyze = module.cwrap('suzume_analyze', 'number', ['number', 'number']);
        this._resultFree = module.cwrap('suzume_result_free', null, ['number']);
        this._generateTags = module.cwrap('suzume_generate_tags', 'number', ['number', 'number']);
        this._generateTagsWithOptions = module.cwrap('suzume_generate_tags_with_options', 'number', [
            'number',
            'number',
            'number',
        ]);
        this._tagsFree = module.cwrap('suzume_tags_free', null, ['number']);
        this._loadUserDict = module.cwrap('suzume_load_user_dict', 'number', [
            'number',
            'number',
            'number',
        ]);
        this._loadBinaryDict = module.cwrap('suzume_load_binary_dict', 'number', [
            'number',
            'number',
            'number',
        ]);
        this._version = module.cwrap('suzume_version', 'number', []);
        this._lastError = module.cwrap('suzume_last_error', 'number', []);
        this._dictionaryWarningCount = module.cwrap('suzume_dictionary_warning_count', 'number', [
            'number',
        ]);
        this._dictionaryWarning = module.cwrap('suzume_dictionary_warning', 'number', [
            'number',
            'number',
        ]);
        this.layouts = layouts ?? Suzume.loadCLayouts(module);
    }
    static loadCLayouts(module) {
        const sizeofResult = module.cwrap('suzume_sizeof_result', 'number', []);
        const sizeofMorpheme = module.cwrap('suzume_sizeof_morpheme', 'number', []);
        const sizeofTags = module.cwrap('suzume_sizeof_tags', 'number', []);
        const sizeofTagOptions = module.cwrap('suzume_sizeof_tag_options', 'number', []);
        const sizeofExtendedOptions = module.cwrap('suzume_sizeof_extended_options', 'number', []);
        const offsetofResult = module.cwrap('suzume_offsetof_result', 'number', ['number']);
        const offsetofMorpheme = module.cwrap('suzume_offsetof_morpheme', 'number', ['number']);
        const offsetofTags = module.cwrap('suzume_offsetof_tags', 'number', ['number']);
        const offsetofTagOptions = module.cwrap('suzume_offsetof_tag_options', 'number', [
            'number',
        ]);
        const offsetofExtendedOptions = module.cwrap('suzume_offsetof_extended_options', 'number', [
            'number',
        ]);
        return {
            result: {
                size: sizeofResult(),
                morphemes: offsetofResult(0),
                count: offsetofResult(1),
            },
            morpheme: {
                size: sizeofMorpheme(),
                surface: offsetofMorpheme(0),
                pos: offsetofMorpheme(1),
                baseForm: offsetofMorpheme(2),
                posJa: offsetofMorpheme(3),
                conjType: offsetofMorpheme(4),
                conjForm: offsetofMorpheme(5),
                extendedPos: offsetofMorpheme(6),
                start: offsetofMorpheme(7),
                end: offsetofMorpheme(8),
                isUserDict: offsetofMorpheme(9),
                isFormalNoun: offsetofMorpheme(10),
                isLowInfo: offsetofMorpheme(11),
                isUnknown: offsetofMorpheme(12),
                isFromDictionary: offsetofMorpheme(13),
                score: offsetofMorpheme(14),
            },
            tags: {
                size: sizeofTags(),
                tags: offsetofTags(0),
                pos: offsetofTags(1),
                count: offsetofTags(2),
            },
            tagOptions: {
                size: sizeofTagOptions(),
                posFilter: offsetofTagOptions(0),
                excludeBasic: offsetofTagOptions(1),
                useLemma: offsetofTagOptions(2),
                minLength: offsetofTagOptions(3),
                maxTags: offsetofTagOptions(4),
                excludeParticles: offsetofTagOptions(5),
                excludeAuxiliaries: offsetofTagOptions(6),
                excludeFormalNouns: offsetofTagOptions(7),
                excludeLowInfo: offsetofTagOptions(8),
                removeDuplicates: offsetofTagOptions(9),
                structSize: offsetofTagOptions(10),
            },
            extendedOptions: {
                size: sizeofExtendedOptions(),
                structSize: offsetofExtendedOptions(0),
                preserveVu: offsetofExtendedOptions(1),
                preserveCase: offsetofExtendedOptions(2),
                preserveSymbols: offsetofExtendedOptions(3),
                mode: offsetofExtendedOptions(4),
                lemmatize: offsetofExtendedOptions(5),
                mergeCompounds: offsetofExtendedOptions(6),
            },
        };
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
        const moduleOptions = {};
        if (wasmPath) {
            moduleOptions.locateFile = (path) => (path.endsWith('.wasm') ? wasmPath : path);
        }
        const module = await createModule.default(moduleOptions);
        const layouts = Suzume.loadCLayouts(module);
        let handle;
        if (options &&
            (options.preserveVu !== undefined ||
                options.preserveCase !== undefined ||
                options.preserveSymbols !== undefined ||
                options.mode !== undefined ||
                options.lemmatize !== undefined ||
                options.mergeCompounds !== undefined)) {
            // Create with options
            const layout = layouts.extendedOptions;
            const OPTIONS_SIZE = layout.size;
            const optionsPtr = module._malloc(OPTIONS_SIZE);
            try {
                const heap = module.HEAPU32;
                // Zero the whole struct first so any field the C ABI may append later
                // defaults to zero instead of reading back uninitialized malloc bytes.
                new Uint8Array(heap.buffer).fill(0, optionsPtr, optionsPtr + OPTIONS_SIZE);
                const modeMap = {
                    normal: 0,
                    search: 1,
                    split: 2,
                };
                const selectedMode = options.mode ?? 'normal';
                const modeValue = modeMap[selectedMode];
                if (modeValue === undefined) {
                    throw new Error(`Invalid Suzume mode: ${String(options.mode)}`);
                }
                heap[(optionsPtr + layout.structSize) >> 2] = OPTIONS_SIZE;
                // preserve_vu: default true
                heap[(optionsPtr + layout.preserveVu) >> 2] = options.preserveVu !== false ? 1 : 0;
                // preserve_case: default true
                heap[(optionsPtr + layout.preserveCase) >> 2] = options.preserveCase !== false ? 1 : 0;
                // preserve_symbols: default false
                heap[(optionsPtr + layout.preserveSymbols) >> 2] = options.preserveSymbols === true ? 1 : 0;
                heap[(optionsPtr + layout.mode) >> 2] = modeValue;
                heap[(optionsPtr + layout.lemmatize) >> 2] = options.lemmatize !== false ? 1 : 0;
                heap[(optionsPtr + layout.mergeCompounds) >> 2] = options.mergeCompounds === true ? 1 : 0;
                const createWithOptions = module.cwrap('suzume_create_with_extended_options', 'number', [
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
            const lastError = module.cwrap('suzume_last_error', 'number', []);
            const message = module.UTF8ToString(lastError());
            throw new Error(message
                ? `Failed to create Suzume instance: ${message}`
                : 'Failed to create Suzume instance');
        }
        return new Suzume(module, handle, layouts);
    }
    /**
     * Analyze Japanese text into morphemes
     *
     * @param text - UTF-8 encoded Japanese text
     * @returns Array of morphemes
     */
    analyze(text) {
        this.ensureAlive();
        return this.withUtf8String(text, (textPtr) => {
            const resultPtr = this._analyze(this.handle, textPtr);
            if (resultPtr === 0) {
                throw new Error(`Suzume analyze failed: ${this.lastError || 'unknown error'}`);
            }
            try {
                return this.parseResult(resultPtr);
            }
            finally {
                this._resultFree(resultPtr);
            }
        });
    }
    /**
     * Generate tags from Japanese text
     *
     * @param text - UTF-8 encoded Japanese text
     * @param options - Optional tag generation options
     * @returns Array of tag entries with POS information
     */
    generateTags(text, options) {
        this.ensureAlive();
        return this.withUtf8String(text, (textPtr) => {
            if (options) {
                // Build pos_filter bitmask
                let posFilter = 0;
                if (options.pos) {
                    const posMap = { noun: 1, verb: 2, adjective: 4, adverb: 8 };
                    for (const pos of options.pos) {
                        posFilter |= posMap[pos] ?? 0;
                    }
                }
                const optionsPtr = this.module._malloc(this.layouts.tagOptions.size);
                try {
                    const heapU32 = this.module.HEAPU32;
                    const heapU8 = new Uint8Array(heapU32.buffer);
                    const layout = this.layouts.tagOptions;
                    heapU8[optionsPtr + layout.posFilter] = posFilter & 0xff;
                    heapU32[(optionsPtr + layout.excludeBasic) >> 2] = options.excludeBasic ? 1 : 0;
                    heapU32[(optionsPtr + layout.useLemma) >> 2] = options.useLemma !== false ? 1 : 0;
                    heapU32[(optionsPtr + layout.minLength) >> 2] = options.minLength ?? 2;
                    heapU32[(optionsPtr + layout.maxTags) >> 2] = options.maxTags ?? 0;
                    heapU32[(optionsPtr + layout.excludeParticles) >> 2] =
                        options.excludeParticles !== false ? 1 : 0;
                    heapU32[(optionsPtr + layout.excludeAuxiliaries) >> 2] =
                        options.excludeAuxiliaries !== false ? 1 : 0;
                    heapU32[(optionsPtr + layout.excludeFormalNouns) >> 2] =
                        options.excludeFormalNouns !== false ? 1 : 0;
                    heapU32[(optionsPtr + layout.excludeLowInfo) >> 2] =
                        options.excludeLowInfo !== false ? 1 : 0;
                    heapU32[(optionsPtr + layout.removeDuplicates) >> 2] =
                        options.removeDuplicates !== false ? 1 : 0;
                    // Forward-compat marker: the malloc'd buffer is uninitialized, so set
                    // the trailing size field to the full struct size the way the native
                    // header documents (mirrors the extended-options path above).
                    heapU32[(optionsPtr + layout.structSize) >> 2] = layout.size;
                    return this.consumeTags(this._generateTagsWithOptions(this.handle, textPtr, optionsPtr));
                }
                finally {
                    this.module._free(optionsPtr);
                }
            }
            return this.consumeTags(this._generateTags(this.handle, textPtr));
        });
    }
    /**
     * Load user dictionary from string data
     *
     * @param data - Dictionary data in CSV format
     * @returns true on success
     */
    loadUserDictionary(data) {
        this.ensureAlive();
        return this.withUtf8String(data, (dataPtr, dataBytes) => this._loadUserDict(this.handle, dataPtr, dataBytes - 1) === 1);
    }
    /**
     * Load user dictionary from string data, throwing with C API details on failure.
     *
     * @param data - Dictionary data in CSV format
     */
    loadUserDictionaryOrThrow(data) {
        if (!this.loadUserDictionary(data)) {
            throw new Error(`Suzume user dictionary load failed: ${this.lastError || 'unknown error'}`);
        }
    }
    /**
     * Load binary dictionary from buffer data (as user dictionary)
     *
     * @param data - Binary dictionary data (.dic format)
     * @returns true on success
     */
    loadBinaryDictionary(data) {
        this.ensureAlive();
        const dataPtr = this.module._malloc(data.byteLength);
        try {
            // Derive Uint8Array view from HEAPU32's underlying buffer (HEAPU8 may not be exported)
            const heapU32 = this.module.HEAPU32;
            const heapU8 = new Uint8Array(heapU32.buffer);
            heapU8.set(data, dataPtr);
            return this._loadBinaryDict(this.handle, dataPtr, data.byteLength) === 1;
        }
        finally {
            this.module._free(dataPtr);
        }
    }
    /**
     * Load binary dictionary from buffer data, throwing with C API details on failure.
     *
     * @param data - Binary dictionary data (.dic format)
     */
    loadBinaryDictionaryOrThrow(data) {
        if (!this.loadBinaryDictionary(data)) {
            throw new Error(`Suzume binary dictionary load failed: ${this.lastError || 'unknown error'}`);
        }
    }
    /**
     * Get Suzume version string
     */
    get version() {
        this.ensureAlive();
        const versionPtr = this._version();
        return this.module.UTF8ToString(versionPtr);
    }
    /**
     * Last C API error for this thread, or empty string if the last C API call succeeded.
     */
    get lastError() {
        return this.module.UTF8ToString(this._lastError());
    }
    /**
     * Dictionary warnings produced while auto-loading dictionaries at construction.
     */
    get dictionaryWarnings() {
        this.ensureAlive();
        const count = this._dictionaryWarningCount(this.handle);
        const warnings = [];
        for (let idx = 0; idx < count; idx++) {
            const warningPtr = this._dictionaryWarning(this.handle, idx);
            if (warningPtr !== 0) {
                warnings.push(this.module.UTF8ToString(warningPtr));
            }
        }
        return warnings;
    }
    /**
     * Destroy the Suzume instance and free resources.
     * Called automatically via FinalizationRegistry when garbage collected,
     * but can be called explicitly for immediate cleanup.
     */
    destroy() {
        if (this.handle !== 0) {
            registry.unregister(this.unregisterToken);
            const destroyHandle = this.module.cwrap('suzume_destroy', null, ['number']);
            destroyHandle(this.handle);
            this.handle = 0;
            this.cleanupRef.handle = 0;
        }
    }
    ensureAlive() {
        if (this.handle === 0) {
            throw new Error('Suzume instance has been destroyed');
        }
    }
    withUtf8String(value, operation) {
        const byteLength = this.module.lengthBytesUTF8(value) + 1;
        const pointer = this.module._malloc(byteLength);
        try {
            this.module.stringToUTF8(value, pointer, byteLength);
            return operation(pointer, byteLength);
        }
        finally {
            this.module._free(pointer);
        }
    }
    consumeTags(tagsPtr) {
        if (tagsPtr === 0) {
            throw new Error(`Suzume tag generation failed: ${this.lastError || 'unknown error'}`);
        }
        try {
            return this.parseTags(tagsPtr);
        }
        finally {
            this._tagsFree(tagsPtr);
        }
    }
    // Parse suzume_result_t structure from WASM memory
    parseResult(resultPtr) {
        const HEAPU32 = this.module.HEAPU32;
        const HEAPF32 = new Float32Array(HEAPU32.buffer);
        const resultLayout = this.layouts.result;
        const morphemeLayout = this.layouts.morpheme;
        const morphemesPtr = HEAPU32[(resultPtr + resultLayout.morphemes) >> 2];
        const count = HEAPU32[(resultPtr + resultLayout.count) >> 2];
        const morphemes = [];
        for (let idx = 0; idx < count; idx++) {
            const morphPtr = morphemesPtr + idx * morphemeLayout.size;
            const surfacePtr = HEAPU32[(morphPtr + morphemeLayout.surface) >> 2];
            const posPtr = HEAPU32[(morphPtr + morphemeLayout.pos) >> 2];
            const baseFormPtr = HEAPU32[(morphPtr + morphemeLayout.baseForm) >> 2];
            const posJaPtr = HEAPU32[(morphPtr + morphemeLayout.posJa) >> 2];
            const conjTypePtr = HEAPU32[(morphPtr + morphemeLayout.conjType) >> 2];
            const conjFormPtr = HEAPU32[(morphPtr + morphemeLayout.conjForm) >> 2];
            const extendedPosPtr = HEAPU32[(morphPtr + morphemeLayout.extendedPos) >> 2];
            const start = HEAPU32[(morphPtr + morphemeLayout.start) >> 2];
            const end = HEAPU32[(morphPtr + morphemeLayout.end) >> 2];
            morphemes.push({
                surface: this.module.UTF8ToString(surfacePtr),
                pos: this.module.UTF8ToString(posPtr),
                baseForm: this.module.UTF8ToString(baseFormPtr),
                posJa: this.module.UTF8ToString(posJaPtr),
                conjType: conjTypePtr !== 0 ? this.module.UTF8ToString(conjTypePtr) : null,
                conjForm: conjFormPtr !== 0 ? this.module.UTF8ToString(conjFormPtr) : null,
                extendedPos: this.module.UTF8ToString(extendedPosPtr),
                start,
                end,
                isUserDict: HEAPU32[(morphPtr + morphemeLayout.isUserDict) >> 2] !== 0,
                isFormalNoun: HEAPU32[(morphPtr + morphemeLayout.isFormalNoun) >> 2] !== 0,
                isLowInfo: HEAPU32[(morphPtr + morphemeLayout.isLowInfo) >> 2] !== 0,
                isUnknown: HEAPU32[(morphPtr + morphemeLayout.isUnknown) >> 2] !== 0,
                isFromDictionary: HEAPU32[(morphPtr + morphemeLayout.isFromDictionary) >> 2] !== 0,
                score: HEAPF32[(morphPtr + morphemeLayout.score) >> 2],
            });
        }
        return morphemes;
    }
    // Parse suzume_tags_t structure from WASM memory
    parseTags(tagsPtr) {
        const HEAPU32 = this.module.HEAPU32;
        const layout = this.layouts.tags;
        const tagsArrayPtr = HEAPU32[(tagsPtr + layout.tags) >> 2];
        const posArrayPtr = HEAPU32[(tagsPtr + layout.pos) >> 2];
        const count = HEAPU32[(tagsPtr + layout.count) >> 2];
        const tags = [];
        for (let idx = 0; idx < count; idx++) {
            const tagPtr = HEAPU32[(tagsArrayPtr >> 2) + idx];
            const posPtr = HEAPU32[(posArrayPtr >> 2) + idx];
            tags.push({
                tag: this.module.UTF8ToString(tagPtr),
                pos: this.module.UTF8ToString(posPtr),
            });
        }
        return tags;
    }
}
// Default export
export default Suzume;
