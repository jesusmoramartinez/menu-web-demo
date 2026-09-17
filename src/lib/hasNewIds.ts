/** true si algún id de `current` no estaba en `previous` (lógica pura de useNewItemsAlert). */
export function hasNewIds(previous: ReadonlySet<string>, current: readonly string[]): boolean {
  return current.some((id) => !previous.has(id))
}
