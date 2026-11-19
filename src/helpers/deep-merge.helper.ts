/** A partial that allows nested objects to be partial too. */
export type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends readonly unknown[]
    ? T
    : T extends Date | RegExp | Map<any, any> | Set<any>
      ? T
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;

/**
 * Only plain objects (`{}` literals, `Object.create(null)`) are merged key by key.
 * Arrays, Dates, Maps, Sets and class instances are replaced as a whole value,
 * matching what `DeepPartial` allows.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  const output: any = { ...target };
  Object.keys(source as object).forEach((key) => {
    const sourceVal = (source as any)[key];
    const targetVal = (target as any)[key];

    if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
      output[key] = deepMerge(targetVal, sourceVal);
    } else {
      output[key] = sourceVal;
    }
  });
  return output as T;
}
