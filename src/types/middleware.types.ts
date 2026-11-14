/**
 * Wraps a store initializer, the same way Zustand middleware do.
 *
 * ```ts
 * import { persist } from 'zustand/middleware';
 * const useProducts = createEntitiesStore<Product>({
 *   middleware: (config) => persist(config, { name: 'products' }),
 * });
 * ```
 */
export type ZentyMiddleware = (initializer: any) => any;
