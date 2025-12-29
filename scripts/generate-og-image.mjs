import { Resvg } from '@resvg/resvg-js'
import opentype from 'opentype.js'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'src', 'public')
const fontsDir = join(__dirname, 'fonts')

// Load font
const fontPath = join(fontsDir, 'ArchitectsDaughter-Regular.ttf')
const font = opentype.loadSync(fontPath)

// Text to convert to path
const text = 'Suzume'
const fontSize = 140
const centerX = 600
const centerY = 260

// Get text path
const textPath = font.getPath(text, 0, 0, fontSize)
const bbox = textPath.getBoundingBox()
const textWidth = bbox.x2 - bbox.x1

// Calculate position for center alignment
const offsetX = centerX - textWidth / 2 - bbox.x1
const offsetY = centerY

// Generate path with correct position
const finalPath = font.getPath(text, offsetX, offsetY, fontSize)
const pathData = finalPath.toPathData(2)

// Read original SVG
let svgContent = readFileSync(join(publicDir, 'og-image.svg'), 'utf-8')

// Replace text element with path element
const textElementRegex = /<text[^>]*font-family="Architects Daughter"[^>]*>Suzume<\/text>/
const pathElement = `<path d="${pathData}" fill="white" filter="url(#glow)"/>`

const svgWithPath = svgContent.replace(textElementRegex, pathElement)

// Save SVG with embedded path
writeFileSync(join(publicDir, 'og-image.svg'), svgWithPath)
console.log('Updated og-image.svg with text converted to path')

// Generate PNG from the updated SVG
const resvg = new Resvg(svgWithPath, {
  font: {
    fontFiles: [fontPath],
    loadSystemFonts: true,
    defaultFontFamily: 'Arial',
  },
})

const pngData = resvg.render()
const pngBuffer = pngData.asPng()

writeFileSync(join(publicDir, 'og-image.png'), pngBuffer)
console.log('Generated og-image.png')
