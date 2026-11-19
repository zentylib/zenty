type AnyFunction = (...args: never[]) => unknown;

/** A partial that allows nested objects to be partial too. */
export type DeepPartial<T> = T extends AnyFunction
  ? T
  : T extends readonly unknown[]
    ? T
    : T extends Date | RegExp | ReadonlyMap<unknown, unknown> | ReadonlySet<unknown>
      ? T
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;

type PlainObject = Record<string, unknown>;

/**
 * Only plain objects (`{}` literals, `Object.create(null)`) are merged key by key.
 * Arrays, Dates, Maps, Sets and class instances are replaced as a whole value,
 * matching what `DeepPartial` allows.
 */
function isPlainObject(value: unknown): value is PlainObject {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function mergePlain(target: PlainObject, source: PlainObject): PlainObject {
  const output: PlainObject = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    output[key] =
      isPlainObject(sourceVal) && isPlainObject(targetVal)
        ? mergePlain(targetVal, sourceVal)
        : sourceVal;
  }
  return output;
}

export function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  return mergePlain(target as PlainObject, source as PlainObject) as T;
}
