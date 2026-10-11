/** True on touch-first devices (phones, tablets): no hover, imprecise pointer. */
export const isTouchDevice = typeof matchMedia !== 'undefined' && matchMedia('(hover: none) and (pointer: coarse)').matches
