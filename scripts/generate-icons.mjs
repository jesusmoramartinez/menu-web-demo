/**
 * Genera los PNG del manifest PWA a partir de los SVG fuente en scripts/assets/.
 * No forma parte del build normal (los PNG quedan commiteados en public/); correr
 * de nuevo sólo si se cambia el diseño del ícono.
 *
 *   node scripts/generate-icons.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const rounded = readFileSync(new URL('./assets/icon-source.svg', import.meta.url))
const square = readFileSync(new URL('./assets/icon-square-source.svg', import.meta.url))
const maskable = readFileSync(new URL('./assets/icon-maskable-source.svg', import.meta.url))

const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url))

await Promise.all([
  sharp(rounded).resize(192, 192).png().toFile(out('icon-192.png')),
  sharp(rounded).resize(512, 512).png().toFile(out('icon-512.png')),
  sharp(maskable).resize(512, 512).png().toFile(out('icon-maskable-512.png')),
  sharp(square).resize(180, 180).png().toFile(out('apple-touch-icon.png')),
  sharp(square).resize(32, 32).png().toFile(out('favicon-32.png')),
])

console.log('Íconos generados en public/')
