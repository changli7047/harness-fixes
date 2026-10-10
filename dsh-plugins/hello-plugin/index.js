/** Minimal external bundle plugin used to validate the install → compose → load path. */
export const name = 'hello-plugin'

/** Log at load time so a boot proves the layer is mounted. */
export function apply() {
  console.log('[hello-plugin] plugin loaded!')
}
