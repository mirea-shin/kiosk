export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number,
  maxWait?: number,
) {
  let timer: ReturnType<typeof setTimeout>
  let lastFired = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    clearTimeout(timer)

    if (maxWait && now - lastFired >= maxWait) {
      lastFired = now
      fn(...args)
      return
    }

    timer = setTimeout(() => {
      lastFired = Date.now()
      fn(...args)
    }, ms)
  }
}
