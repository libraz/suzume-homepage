/**
 * Suzume - Lightweight Japanese tokenizer
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
import { C_LAYOUTS } from './abi_layout.js';
import { decodeAnalysisResult, decodeTags } from './decode.js';
export var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["Success"] = 0] = "Success";
    ErrorCode[ErrorCode["InvalidUtf8"] = 1] = "InvalidUtf8";
    ErrorCode[ErrorCode["DictionaryLoadFailed"] = 2] = "DictionaryLoadFailed";
    ErrorCode[ErrorCode["FileNotFound"] = 3] = "FileNotFound";
    ErrorCode[ErrorCode["Parse"] = 4] = "Parse";
    ErrorCode[ErrorCode["OutOfMemory"] = 5] = "OutOfMemory";
    ErrorCode[ErrorCode["InvalidInput"] = 6] = "InvalidInput";
    ErrorCode[ErrorCode["Internal"] = 7] = "Internal";
})(ErrorCode || (ErrorCode = {}));
export class SuzumeError extends Error {
    constructor(message, code = ErrorCode.Internal) {
        super(message);
        this.name = 'SuzumeError';
        this.code = code;
    }
}
const modulePromises = new Map();
async function instantiateModule(wasmPath, freshWasmModule) {
    const createModule = await import('./suzume.js');
    const moduleOptions = {};
    if (wasmPath) {
        moduleOptions.locateFile = (path) => (path.endsWith('.wasm') ? wasmPath : path);
    }
    if (freshWasmModule) {
        return createModule.default(moduleOptions);
    }
    const key = wasmPath ?? '';
    const cached = modulePromises.get(key);
    if (cached) {
        return cached;
    }
    const pending = createModule.default(moduleOptions);
    modulePromises.set(key, pending);
    try {
        return await pending;
    }
    catch (error) {
        modulePromises.delete(key);
        throw error;
    }
}
const ANALYSIS_MODE_CODES = {
    normal: 0,
    search: 1,
    split: 2,
};
const ANALYSIS_MODE_NAMES = Object.fromEntries(Object.keys(ANALYSIS_MODE_CODES).map((name) => [
    ANALYSIS_MODE_CODES[name],
    name,
]));
// Keep the binding's public defaults explicit so CI can compare them with the
// C ABI initializer. Values are consumed below rather than duplicated there.
const EXTENDED_OPTION_DEFAULTS = {
    preserveVu: true,
    preserveCase: true,
    preserveSymbols: false,
    mode: 'normal',
    lemmatize: true,
    mergeCompounds: false,
    skipUserDictionary: false,
    skipCoreDictionary: false,
    skipEnvConfig: false,
    reportScorerConfig: false,
    scorerOptions: null,
    dataDirectory: null,
};
const EXTENDED_BOOL_FIELDS = [
    'preserveVu',
    'preserveCase',
    'preserveSymbols',
    'lemmatize',
    'mergeCompounds',
    'skipUserDictionary',
    'skipCoreDictionary',
    'skipEnvConfig',
    'reportScorerConfig',
];
// As with construction options, this is checked against suzume_init_tag_options.
const TAG_OPTION_DEFAULTS = {
    posFilter: 0,
    excludeBasic: false,
    useLemma: true,
    minLength: 2,
    maxTags: 0,
    excludeParticles: true,
    excludeAuxiliaries: true,
    excludeFormalNouns: true,
    excludeLowInfo: true,
    removeDuplicates: true,
};
const TAG_BOOL_FIELDS = [
    'excludeBasic',
    'useLemma',
    'excludeParticles',
    'excludeAuxiliaries',
    'excludeFormalNouns',
    'excludeLowInfo',
    'removeDuplicates',
];
const TAG_POS_FILTER_BITS = {
    noun: 1,
    verb: 2,
    adjective: 4,
    adverb: 8,
    particle: 16,
    auxiliary: 32,
};
function resolveTagPosFilter(options) {
    const selectedPos = options.posFilter !== undefined ? options.posFilter : options.pos;
    let filter = 0;
    for (const pos of selectedPos ?? []) {
        const bit = TAG_POS_FILTER_BITS[pos];
        if (bit === undefined) {
            throw new Error(`unknown POS filter name: ${JSON.stringify(pos)} ` +
                `(expected one of ${Object.keys(TAG_POS_FILTER_BITS).sort().join(', ')})`);
        }
        filter |= bit;
    }
    return filter;
}
const registry = new FinalizationRegistry((ref) => {
    if (ref.handle !== 0) {
        ref.module._suzume_destroy(ref.handle);
        ref.handle = 0;
    }
});
/**
 * Suzume instance for Japanese tokenization.
 *
 * Error contract note: under the WebAssembly build, a memory-allocation failure
 * aborts the module rather than returning NULL, so the C++ allocation-failure
 * path (which maps to a NULL return and a thrown Error on native/Python) is
 * effectively unreachable here.
 */
export class Suzume {
    constructor(module, handle) {
        this._posLabels = new Map();
        this._conjugationTypeLabels = new Map();
        this._conjugationFormLabels = new Map();
        this._extendedPosLabels = new Map();
        this.layouts = C_LAYOUTS;
        this.unregisterToken = {};
        this.module = module;
        this.handle = handle;
        this.cleanupRef = { module, handle };
        registry.register(this, this.cleanupRef, this.unregisterToken);
    }
    /**
     * Create a new Suzume instance
     *
     * @param options - Optional configuration options
     * @returns Promise resolving to Suzume instance
     */
    static async create(options) {
        const wasmPath = options?.wasmPath;
        const module = await instantiateModule(wasmPath, options?.freshWasmModule === true);
        let handle;
        if (options &&
            (EXTENDED_BOOL_FIELDS.some((field) => options[field] !== undefined) ||
                options.mode !== undefined ||
                options.scorerOptions !== undefined)) {
            // Create with options
            const layout = C_LAYOUTS.extendedOptions;
            const OPTIONS_SIZE = layout.size;
            const optionsPtr = module._malloc(OPTIONS_SIZE);
            let scorerOptionsPtr = 0;
            try {
                // _malloc hands back uninitialized heap, so seed the struct with the C
                // defaults before overriding fields. Every field below is written today,
                // but a field added to the C struct would otherwise be read as garbage.
                module._suzume_init_extended_options(optionsPtr);
                const heap = new Uint8Array(module.HEAPU32.buffer);
                const selectedMode = options.mode ?? EXTENDED_OPTION_DEFAULTS.mode;
                const modeValue = ANALYSIS_MODE_CODES[selectedMode];
                if (modeValue === undefined) {
                    throw new Error(`Invalid Suzume mode: ${String(options.mode)}`);
                }
                heap[optionsPtr + layout.mode] = modeValue;
                for (const field of EXTENDED_BOOL_FIELDS) {
                    heap[optionsPtr + layout[field]] =
                        (options[field] ?? EXTENDED_OPTION_DEFAULTS[field]) ? 1 : 0;
                }
                if (options.scorerOptions !== undefined) {
                    const scorerJson = typeof options.scorerOptions === 'string'
                        ? options.scorerOptions
                        : JSON.stringify(options.scorerOptions);
                    const scorerBytes = module.lengthBytesUTF8(scorerJson) + 1;
                    scorerOptionsPtr = module._malloc(scorerBytes);
                    module.stringToUTF8(scorerJson, scorerOptionsPtr, scorerBytes);
                    module.HEAPU32[(optionsPtr + layout.scorerOptionsJson) >> 2] = scorerOptionsPtr;
                }
                handle = module._suzume_create_with_extended_options(optionsPtr);
            }
            finally {
                if (scorerOptionsPtr !== 0) {
                    module._free(scorerOptionsPtr);
                }
                module._free(optionsPtr);
            }
        }
        else {
            // Create with default options
            handle = module._suzume_create();
        }
        if (handle === 0) {
            const message = module.UTF8ToString(module._suzume_last_error());
            throw new SuzumeError(message
                ? `Failed to create Suzume instance: ${message}`
                : 'Failed to create Suzume instance', module._suzume_last_error_code());
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
        return this.analyzeWithNormalizedText(text).morphemes;
    }
    /** Current analysis mode for this instance. */
    get mode() {
        this.ensureAlive();
        const mode = ANALYSIS_MODE_NAMES[this.module._suzume_mode(this.handle)];
        if (mode === undefined) {
            throw this.nativeError('mode query failed');
        }
        return mode;
    }
    /** Change analysis mode without reloading dictionaries. */
    set mode(value) {
        this.ensureAlive();
        const mode = ANALYSIS_MODE_CODES[value];
        if (mode === undefined) {
            throw new Error(`Invalid Suzume mode: ${String(value)}`);
        }
        if (this.module._suzume_set_mode(this.handle, mode) !== 1) {
            throw this.nativeError('mode change failed');
        }
    }
    /**
     * Analyze text and return the exact normalized text used for offsets.
     */
    analyzeWithNormalizedText(text) {
        this.ensureAlive();
        return this.withUtf8String(text, (textPtr, textBytes) => {
            const resultPtr = this.module._suzume_analyze_n(this.handle, textPtr, textBytes - 1);
            if (resultPtr === 0) {
                throw this.nativeError('analyze failed');
            }
            try {
                return this.parseResult(resultPtr);
            }
            finally {
                this.module._suzume_result_free(resultPtr);
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
        return this.withUtf8String(text, (textPtr, textBytes) => {
            if (options) {
                const posFilter = resolveTagPosFilter(options);
                const optionsPtr = this.module._malloc(this.layouts.tagOptions.size);
                try {
                    // Same reason as create(): seed the C defaults into freshly malloc'd
                    // memory, including the struct padding the field writes never touch.
                    this.module._suzume_init_tag_options(optionsPtr);
                    const heapU32 = this.module.HEAPU32;
                    const heapU8 = new Uint8Array(heapU32.buffer);
                    const layout = this.layouts.tagOptions;
                    heapU8[optionsPtr + layout.posFilter] = posFilter & 0xff;
                    heapU32[(optionsPtr + layout.minLength) >> 2] =
                        options.minLength ?? TAG_OPTION_DEFAULTS.minLength;
                    heapU32[(optionsPtr + layout.maxTags) >> 2] =
                        options.maxTags ?? TAG_OPTION_DEFAULTS.maxTags;
                    for (const field of TAG_BOOL_FIELDS) {
                        heapU8[optionsPtr + layout[field]] =
                            (options[field] ?? TAG_OPTION_DEFAULTS[field]) ? 1 : 0;
                    }
                    return this.consumeTags(this.module._suzume_generate_tags_with_options_n(this.handle, textPtr, textBytes - 1, optionsPtr));
                }
                finally {
                    this.module._free(optionsPtr);
                }
            }
            return this.consumeTags(this.module._suzume_generate_tags_n(this.handle, textPtr, textBytes - 1));
        });
    }
    /**
     * Load user dictionary from string data
     *
     * @param data - Dictionary data in current TSV format (legacy CSV is also accepted)
     * @returns true on success
     */
    loadUserDictionary(data) {
        return this.loadUserDictionaryCount(data) > 0;
    }
    /**
     * Load user dictionary and return the number of installed expanded entries.
     */
    loadUserDictionaryCount(data) {
        this.ensureAlive();
        return this.withUtf8String(data, (dataPtr, dataBytes) => this.module._suzume_load_user_dict_count(this.handle, dataPtr, dataBytes - 1));
    }
    /**
     * Load user dictionary from string data, throwing with C API details on failure.
     *
     * @param data - Dictionary data in current TSV format (legacy CSV is also accepted)
     */
    loadUserDictionaryOrThrow(data) {
        if (!this.loadUserDictionary(data)) {
            throw this.nativeError('user dictionary load failed');
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
            return this.module._suzume_load_binary_dict(this.handle, dataPtr, data.byteLength) === 1;
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
            throw this.nativeError('binary dictionary load failed');
        }
    }
    /**
     * Remove caller-loaded dictionaries while retaining the bundled user dictionary.
     */
    clearUserDictionaries() {
        this.ensureAlive();
        if (this.module._suzume_clear_user_dictionaries(this.handle) !== 1) {
            throw this.nativeError('dictionary clear failed');
        }
    }
    /**
     * Get Suzume version string
     */
    get version() {
        const versionPtr = this.module._suzume_version();
        return this.module.UTF8ToString(versionPtr);
    }
    /**
     * Last C API error for this thread, or empty string if the last C API call succeeded.
     */
    get lastError() {
        return this.module.UTF8ToString(this.module._suzume_last_error());
    }
    /** Stable native error category for the last failed C ABI call. */
    get lastErrorCode() {
        return this.module._suzume_last_error_code();
    }
    /** Current WebAssembly linear-memory size in bytes. */
    wasmMemoryBytes() {
        this.ensureAlive();
        return this.module.HEAPU32.buffer.byteLength;
    }
    /** Dictionary-loading, parsing, and scorer-configuration diagnostics. */
    get dictionaryWarnings() {
        this.ensureAlive();
        const count = this.module._suzume_dictionary_warning_count(this.handle);
        const warnings = [];
        for (let idx = 0; idx < count; idx++) {
            const warningPtr = this.module._suzume_dictionary_warning(this.handle, idx);
            if (warningPtr !== 0) {
                warnings.push(this.module.UTF8ToString(warningPtr));
            }
        }
        return warnings;
    }
    /** Whether the bundled L2 core dictionary is loaded. */
    get hasCoreDictionary() {
        this.ensureAlive();
        return this.module._suzume_has_core_dictionary(this.handle) === 1;
    }
    /**
     * Destroy this analyzer handle. The shared WASM runtime remains cached for
     * other and future Suzume instances.
     */
    destroy() {
        if (this.handle !== 0) {
            registry.unregister(this.unregisterToken);
            this.module._suzume_destroy(this.handle);
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
        for (let idx = 0; idx < value.length; idx++) {
            const codeUnit = value.charCodeAt(idx);
            if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
                const next = value.charCodeAt(idx + 1);
                if (next < 0xdc00 || next > 0xdfff) {
                    throw new SuzumeError('Input contains an unpaired UTF-16 surrogate', ErrorCode.InvalidUtf8);
                }
                idx++;
            }
            else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
                throw new SuzumeError('Input contains an unpaired UTF-16 surrogate', ErrorCode.InvalidUtf8);
            }
        }
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
            throw this.nativeError('tag generation failed');
        }
        try {
            return this.parseTags(tagsPtr);
        }
        finally {
            this.module._suzume_tags_free(tagsPtr);
        }
    }
    // Parse suzume_result_t structure from WASM memory
    parseResult(resultPtr) {
        return decodeAnalysisResult(this.module, resultPtr, (code) => this.conjugationTypeLabel(code), (code) => this.conjugationFormLabel(code), (code) => this.extendedPosLabel(code), (code) => this.posLabel(code));
    }
    // Parse suzume_tags_t structure from WASM memory
    parseTags(tagsPtr) {
        return decodeTags(this.module, tagsPtr, (code) => this.posLabel(code));
    }
    posLabel(code) {
        return this.cachedLabel(this._posLabels, this.module._suzume_pos_label, code, 'OTHER');
    }
    conjugationTypeLabel(code) {
        return this.cachedLabel(this._conjugationTypeLabels, this.module._suzume_conjugation_type_label, code, null);
    }
    conjugationFormLabel(code) {
        return this.cachedLabel(this._conjugationFormLabels, this.module._suzume_conjugation_form_label, code, null);
    }
    extendedPosLabel(code) {
        return this.cachedLabel(this._extendedPosLabels, this.module._suzume_extended_pos_label, code, 'UNKNOWN');
    }
    cachedLabel(cache, nativeLabel, code, fallback) {
        const cached = cache.get(code);
        if (cached !== undefined) {
            return cached;
        }
        const labelPtr = nativeLabel(code);
        const label = labelPtr === 0 ? fallback : this.module.UTF8ToString(labelPtr);
        cache.set(code, label);
        return label;
    }
    nativeError(action) {
        return new SuzumeError(`Suzume ${action}: ${this.lastError || 'unknown error'}`, this.lastErrorCode);
    }
}
// Default export
export default Suzume;
/** Return the package version without creating an analyzer handle. */
export async function version(options) {
    const module = await instantiateModule(options?.wasmPath, options?.freshWasmModule === true);
    return module.UTF8ToString(module._suzume_version());
}
