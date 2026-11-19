import { create as zustandCreate, StateCreator, StoreApi, UseBoundStore } from 'zustand';
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

/** Full state (data + actions) of a single-entity store. */
export type EntityStoreState<T, D extends boolean = false> = EntityState<T> &
    EntityActions<T, EntityPatch<T, D>>;

/**
 * Options for `createEntityStore`.
 */
export interface EntityStoreOptions<T, D extends boolean = boolean> {
    /** initial entity (defaults to null) */
    initialState?: T | null;

    /** merge nested objects on `update` instead of replacing them (defaults to false) */
    deepMerge?: D;

    /** wrap the store, e.g. `(config) => persist(config, { name: 'settings' })` */
    middleware?: ZentyMiddleware<EntityStoreState<T, D extends true ? true : false>>;
}

export type EntityStore<T, D extends boolean = false> = UseBoundStore<
    StoreApi<EntityStoreState<T, D>>
>;

export function createEntityStore<T>(
    options: EntityStoreOptions<T, true> & { deepMerge: true }
): EntityStore<T, true>;

export function createEntityStore<T>(
    options?: EntityStoreOptions<T, false>
): EntityStore<T, false>;

export function createEntityStore<T>(
    options: EntityStoreOptions<T, boolean> = {}
): EntityStore<T, boolean> {
    const { initialState = null, deepMerge: shouldDeepMerge = false, middleware } = options;

    type State = EntityStoreState<T, boolean>;

    const initializer: StateCreator<State, [], []> = (set) => ({
        entity: initialState,
        loaded: initialState !== null,
        loading: false,
        error: null,

        setError: (error) => set(error === null ? { error } : { error, loading: false }),
        setLoading: (loading) => set({ loading }),

        set: (entity) => set({ entity, loaded: true, loading: false, error: null }),

        update: (updated) =>
            set((state) => {
                if (state.entity === null) {
                    return {
                        loading: false,
                        error: 'Cannot update: no entity is set. Call set() first.',
                    };
                }
                const entity = shouldDeepMerge
                    ? deepMerge(state.entity, updated as DeepPartial<T>)
                    : ({ ...state.entity, ...updated } as T);
                return { entity, loaded: true, loading: false, error: null };
            }),

        clear: () => set({ entity: null, loaded: false, loading: false, error: null }),
    });

    return zustandCreate<State>()(
        middleware
            ? (middleware as ZentyMiddleware<State>)(initializer)
            : initializer
    );
}
