import { create as zustandCreate, StoreApi, UseBoundStore } from 'zustand';
import { deepMerge, DeepPartial } from './helpers/deep-merge.helper';
import type { ZentyMiddleware } from './types/middleware.types';

/** State of a single-entity store. */
export type EntityState<T> = {
    entity: T | null;
    loaded: boolean;
    loading: boolean;
    error: string | null;
};

/** Actions of a single-entity store. */
export type EntityActions<T, Patch> = {
    set: (entity: T) => void;
    update: (updated: Patch) => void;
    clear: () => void;
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
};

/**
 * `update` takes a `Partial<T>`, or a `DeepPartial<T>` when `deepMerge` is on.
 */
export type EntityPatch<T, D extends boolean> = D extends true
    ? DeepPartial<T>
    : Partial<T>;

/**
 * Options for `createEntityStore`.
 */
export interface EntityStoreOptions<T, D extends boolean = boolean> {
    /** initial entity (defaults to null) */
    initialState?: T | null;

    /** merge nested objects on `update` instead of replacing them (defaults to false) */
    deepMerge?: D;

    /** wrap the store, e.g. `(config) => persist(config, { name: 'settings' })` */
    middleware?: ZentyMiddleware;
}

export type EntityStore<T, D extends boolean = false> = UseBoundStore<
    StoreApi<EntityState<T> & EntityActions<T, EntityPatch<T, D>>>
>;

export function createEntityStore<T>(
    options: EntityStoreOptions<T, true> & { deepMerge: true }
): EntityStore<T, true>;

export function createEntityStore<T>(
    options?: EntityStoreOptions<T, boolean>
): EntityStore<T, false>;

export function createEntityStore<T>(options: EntityStoreOptions<T> = {}): any {
    const { initialState = null, deepMerge: shouldDeepMerge = false, middleware } = options;

    const initializer = (set: any) => ({
        entity: initialState,
        loaded: initialState !== null,
        loading: false,
        error: null,

        setError: (error: string | null) =>
            set(error === null ? { error } : { error, loading: false }),
        setLoading: (loading: boolean) => set({ loading }),

        set: (entity: T) => set({ entity, loaded: true, loading: false }),

        update: (updated: any) =>
            set((state: EntityState<T>) => {
                if (!state.entity) return state;
                const newEntity = shouldDeepMerge
                    ? deepMerge(state.entity, updated)
                    : { ...state.entity, ...updated };
                return { entity: newEntity, loaded: true, loading: false };
            }),

        clear: () => set({ entity: null, loaded: false, loading: false }),
    });

    return zustandCreate(middleware ? middleware(initializer) : initializer);
}
