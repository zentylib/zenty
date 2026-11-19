import type { StateCreator, StoreMutatorIdentifier } from 'zustand';

/**
 * Wraps a store initializer, the same way Zustand middleware do.
 *
 * `S` is the full store state (data + actions), so middleware options such as
 * `persist`'s `partialize` see the real state type.
 *
 * ```ts
 * import { persist } from 'zustand/middleware';
 * const useProducts = createEntitiesStore<Product>({
 *   middleware: (config) =>
 *     persist(config, { name: 'products', partialize: (s) => ({ entities: s.entities }) }),
 * });
 * ```
 */
export type ZentyMiddleware<S> = (
    initializer: StateCreator<S, [], []>
) => StateCreator<S, [], [StoreMutatorIdentifier, unknown][]>;
