/** An error whose message is meant for the user (shown as-is in a toast). */
export class UserError extends Error {}

export const userMessage = (err: unknown, fallback: string) => (err instanceof UserError ? err.message : fallback)

const MB = 1024 * 1024
export const MAX_IMPORT_BYTES = 25 * MB
export const MAX_IMAGE_BYTES = 20 * MB

export function assertMaxSize(file: Blob, max: number, what: string) {
  if (file.size > max) {
    throw new UserError(`${what} est trop volumineux (${Math.round(file.size / MB)} Mo, maximum ${max / MB} Mo)`)
  }
}
