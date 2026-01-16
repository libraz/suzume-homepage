/**
 * Suzume - Lightweight Japanese morphological analyzer
 * Browser-compatible wrapper for the WASM module
 */

interface EmscriptenModule {
  cwrap: (name: string, returnType: string | null, argTypes: string[]) => (...args: unknown[]) => unknown
  UTF8ToString: (ptr: number) => string
  stringToUTF8: (str: string, ptr: number, maxBytes: number) => void
  lengthBytesUTF8: (str: string) => number
  _malloc: (size: number) => number
  _free: (ptr: number) => void
  HEAPU32: Uint32Array
}

export interface Morpheme {
  surface: string
  pos: string
  baseForm: string
  reading: string
  posJa: string
  conjType: string | null
  conjForm: string | null
}

export class Suzume {
  private module: EmscriptenModule
  private handle: number
  private _analyze: (handle: number, textPtr: number) => number
  private _resultFree: (resultPtr: number) => void
  private _versionFn: () => number

  private constructor(module: EmscriptenModule, handle: number) {
    this.module = module
    this.handle = handle
    this._analyze = module.cwrap('suzume_analyze', 'number', ['number', 'number']) as any
    this._resultFree = module.cwrap('suzume_result_free', null, ['number']) as any
    this._versionFn = module.cwrap('suzume_version', 'number', []) as any
  }

  static async create(): Promise<Suzume> {
    // Import the Emscripten module and WASM
    const createModule = (await import('./suzume.js')).default
    const wasmUrl = (await import('./suzume-wasm.wasm?url')).default

    const module: EmscriptenModule = await createModule({
      locateFile: (path: string) => {
        if (path.endsWith('.wasm')) {
          return wasmUrl
        }
        return path
      },
    })

    const createHandle = module.cwrap('suzume_create', 'number', []) as () => number
    const handle = createHandle()

    if (handle === 0) {
      throw new Error('Failed to create Suzume instance')
    }

    return new Suzume(module, handle)
  }

  analyze(text: string): Morpheme[] {
    const textBytes = this.module.lengthBytesUTF8(text) + 1
    const textPtr = this.module._malloc(textBytes)

    try {
      this.module.stringToUTF8(text, textPtr, textBytes)
      const resultPtr = this._analyze(this.handle, textPtr)

      if (resultPtr === 0) {
        return []
      }

      try {
        return this.parseResult(resultPtr)
      } finally {
        this._resultFree(resultPtr)
      }
    } finally {
      this.module._free(textPtr)
    }
  }

  get version(): string {
    const versionPtr = this._versionFn()
    return this.module.UTF8ToString(versionPtr)
  }

  destroy(): void {
    if (this.handle !== 0) {
      const destroyHandle = this.module.cwrap('suzume_destroy', null, ['number']) as (h: number) => void
      destroyHandle(this.handle)
      this.handle = 0
    }
  }

  private parseResult(resultPtr: number): Morpheme[] {
    const HEAPU32 = new Uint32Array(this.module.HEAPU32.buffer)
    const morphemesPtr = HEAPU32[resultPtr >> 2]
    const count = HEAPU32[(resultPtr >> 2) + 1]
    const morphemes: Morpheme[] = []
    const MORPHEME_SIZE = 28

    for (let idx = 0; idx < count; idx++) {
      const morphPtr = morphemesPtr + idx * MORPHEME_SIZE
      const surfacePtr = HEAPU32[morphPtr >> 2]
      const posPtr = HEAPU32[(morphPtr >> 2) + 1]
      const baseFormPtr = HEAPU32[(morphPtr >> 2) + 2]
      const readingPtr = HEAPU32[(morphPtr >> 2) + 3]
      const posJaPtr = HEAPU32[(morphPtr >> 2) + 4]
      const conjTypePtr = HEAPU32[(morphPtr >> 2) + 5]
      const conjFormPtr = HEAPU32[(morphPtr >> 2) + 6]

      morphemes.push({
        surface: this.module.UTF8ToString(surfacePtr),
        pos: this.module.UTF8ToString(posPtr),
        baseForm: this.module.UTF8ToString(baseFormPtr),
        reading: this.module.UTF8ToString(readingPtr),
        posJa: this.module.UTF8ToString(posJaPtr),
        conjType: conjTypePtr !== 0 ? this.module.UTF8ToString(conjTypePtr) : null,
        conjForm: conjFormPtr !== 0 ? this.module.UTF8ToString(conjFormPtr) : null,
      })
    }

    return morphemes
  }
}

export default Suzume
