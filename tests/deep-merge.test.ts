import { deepMerge } from "../src/helpers/deep-merge.helper";

describe("deepMerge", () => {
  it("should merge flat objects", () => {
    const result = deepMerge<{ a: number; b: number }>(
        { a: 1, b: 2 },
        { b: 3 }
    );
    expect(result).toEqual({ a: 1, b: 3 });
  });

  it("should deeply merge nested objects", () => {
    const result = deepMerge<{ a: { x: number } }>(
        { a: { x: 1 } },
        { a: { x: 2, y: 3 } as unknown as { x: number; y: number } }
    );
    expect(result).toEqual({ a: { x: 2, y: 3 } });
  });

  it("should replace Dates, Maps, Sets and arrays as whole values", () => {
    const at = new Date("2025-05-05T00:00:00.000Z");
    const tags = new Map([["b", 2]]);
    const ids = new Set([3]);
    const result = deepMerge(
        { at: new Date(0), tags: new Map([["a", 1]]), ids: new Set([1]), list: [1, 2] },
        { at, tags, ids, list: [9] }
    );
    expect(result.at).toBe(at);
    expect(result.tags).toBe(tags);
    expect(result.ids).toBe(ids);
    expect(result.list).toEqual([9]);
  });

  it("should replace class instances instead of flattening them", () => {
    class Money { constructor(public cents: number) {} }
    const next = new Money(500);
    const result = deepMerge({ price: new Money(100) }, { price: next });
    expect(result.price).toBe(next);
    expect(result.price).toBeInstanceOf(Money);
  });

  it("should merge into objects with a null prototype", () => {
    const target = Object.assign(Object.create(null), { x: 1, y: 2 });
    const result = deepMerge<{ o: { x: number; y: number } }>({ o: target }, { o: { x: 5 } });
    expect(result.o).toEqual({ x: 5, y: 2 });
  });

  it("should not mutate the target", () => {
    const target = { a: { x: 1, y: 2 } };
    deepMerge(target, { a: { x: 9 } });
    expect(target).toEqual({ a: { x: 1, y: 2 } });
  });

  it("should overwrite non-object values", () => {
    const result = deepMerge<{ a: unknown }>(
        { a: { x: 1 } },
        { a: 5 }
    );
    expect(result).toEqual({ a: 5 });
  });
});
