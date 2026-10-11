import { readAsDataURL } from './download'
import { assertMaxSize, MAX_IMAGE_BYTES, UserError } from './errors'

const MAX_DIMENSION = 1600

/**
 * Reads an image file as a data URL, downscaling very large photos so documents
 * stay light in IndexedDB. GIFs and SVGs are kept as-is (animation / vectors).
 */
export async function imageFileToDataURL(file: Blob): Promise<string> {
  assertMaxSize(file, MAX_IMAGE_BYTES, 'Cette image')
  if (!/^image\/(png|jpeg|gif|webp|avif|bmp|svg\+xml)$/.test(file.type)) throw new UserError("Format d'image non pris en charge")
  if (/gif|svg/.test(file.type)) return readAsDataURL(file)
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 1.5e6) {
      bitmap.close()
      return readAsDataURL(file)
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    return canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88)
  } catch {
    return readAsDataURL(file)
  }
}
