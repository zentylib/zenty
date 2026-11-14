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

export function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  const output: any = { ...target };
  Object.keys(source as object).forEach((key) => {
    const sourceVal = (source as any)[key];
    const targetVal = (target as any)[key];

    if (
      sourceVal &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      output[key] = deepMerge(targetVal, sourceVal);
    } else {
      output[key] = sourceVal;
    }
  });
  return output as T;
}
