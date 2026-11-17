import { create as zustandCreate, StoreApi, UseBoundStore } from 'zustand';
import type { ZentyMiddleware } from './types/middleware.types';

/**
 * All the customizable callbacks and initial data for the store.
 */
export interface EntitiesStoreOptions<
    T,
    K extends keyof T
> {
    /** Which field on T is the unique identifier? */
    idKey: K;

    /** initial list of entities (defaults to []) */
    initialState?: T[];

    /** optional overrides for each action: receive the args + current state */
    add?: (item: T, state: EntitiesState<T, K>) => T[];
    addMany?: (items: T[], state: EntitiesState<T, K>) => T[];
    update?: (uid: T[K], patch: Partial<T>, state: EntitiesState<T, K>) => T[];
    updateMany?: (patches: (Pick<T, K> & Partial<T>)[], state: EntitiesState<T, K>) => T[];
    delete?: (uid: T[K], state: EntitiesState<T, K>) => T[];
    deleteMany?: (uids: T[K][], state: EntitiesState<T, K>) => T[];

    /** wrap the store, e.g. `(config) => devtools(config, { name: 'products' })` */
    middleware?: ZentyMiddleware;
}

/** Internal shape of your store’s state */
type EntitiesState<T, K extends keyof T> = {
    entities: T[];
    loaded: boolean;
    loading: boolean;
    error: string | null;
};

/** Actions your store exposes */
type EntitiesActions<T, K extends keyof T> = {
    add: (item: T) => void;
    addMany: (items: T[]) => void;
    update: (uid: T[K], patch: Partial<T>) => void;
    updateMany: (patches: (Pick<T, K> & Partial<T>)[]) => void;
    delete: (uid: T[K]) => void;
    deleteMany: (uids: T[K][]) => void;
    clear: () => void;
    find: (uid: T[K]) => T | undefined;
    has: (uid: T[K]) => boolean;
    replaceAll: (items: T[]) => void;
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
};

/** Overload #1: if T has `id: string|number`, you may omit `idKey` (defaults to "id") */
export function createEntitiesStore<
    T extends { id: string | number }
>(
    options?: Omit<EntitiesStoreOptions<T, 'id'>, 'idKey'> & { idKey?: 'id' }
): UseBoundStore<StoreApi<EntitiesState<T, 'id'> & EntitiesActions<T, 'id'>>>;

/** Overload #2: general case—must pass `idKey`. */
export function createEntitiesStore<
    T extends Record<K, string | number>,
    K extends keyof T
>(
    options: EntitiesStoreOptions<T, K>
): UseBoundStore<StoreApi<EntitiesState<T, K> & EntitiesActions<T, K>>>;

/** Implementation */
export function createEntitiesStore(options: any = {}) {
    // default idKey to "id" if you omitted it
    const {
        idKey = 'id',
        initialState = [],
        add,
        addMany,
        update,
        updateMany,
        delete: del,
        deleteMany,
        middleware,
    } = options as EntitiesStoreOptions<any, any>;

    const runOverride = (
        fn: () => any[],
        extra: Partial<EntitiesState<any, any>> = {}
    ): Partial<EntitiesState<any, any>> => {
        try {
            return { entities: fn(), error: null, loading: false, ...extra };
        } catch (e) {
            return {
                error: e instanceof Error ? e.message : String(e),
                loading: false,
            };
        }
    };

    const initializer = (set: any, get: any) => ({
        // initial state
        entities: initialState,
        loaded: false,
        loading: false,
        error: null,

        setError: (error: string | null) =>
            set(error === null ? { error } : { error, loading: false }),
        setLoading: (loading: boolean) => set({ loading }),

        add: (item: any) =>
            set((state: EntitiesState<any, any>) => {
                if (add) {
                    return runOverride(() => add(item, state), { loaded: true });
                }
                if (state.entities.some((e) => e[idKey] === item[idKey])) {
                    return {
                        loaded: true,
                        loading: false,
                        error: `Item with ${String(idKey)}=${item[idKey]} already exists.`,
                    };
                }
                return {
                    entities: [...state.entities, item],
                    loaded: true,
                    loading: false,
                    error: null,
                };
            }),

        addMany: (items: any[]) =>
            set((state: EntitiesState<any, any>) => {
                if (addMany) {
                    return runOverride(() => addMany(items, state), { loaded: true });
                }
                return {
                    entities: [...state.entities, ...items],
                    loaded: true,
                    loading: false,
                    error: null,
                };
            }),

        update: (uid: any, patch: any) =>
            set((state: EntitiesState<any, any>) => {
                if (update) {
                    return runOverride(() => update(uid, patch, state));
                }
                if (!state.entities.some((e) => e[idKey] === uid)) {
                    return {
                        loading: false,
                        error: `Item with ${String(idKey)}=${uid} was not found.`,
                    };
                }
                return {
                    entities: state.entities.map((e) =>
                        e[idKey] === uid ? { ...e, ...patch } : e
                    ),
                    loading: false,
                    error: null,
                };
            }),

        updateMany: (patches: any[]) =>
            set((state: EntitiesState<any, any>) => {
                if (updateMany) {
                    return runOverride(() => updateMany(patches, state));
                }
                return {
                    entities: state.entities.map((e) => {
                        const p = patches.find((x) => x[idKey] === e[idKey]);
                        return p ? { ...e, ...p } : e;
                    }),
                    loading: false,
                    error: null,
                };
            }),

        delete: (uid: any) =>
            set((state: EntitiesState<any, any>) => {
                if (del) {
                    return runOverride(() => del(uid, state));
                }
                if (!state.entities.some((e) => e[idKey] === uid)) {
                    return {
                        loading: false,
                        error: `Item with ${String(idKey)}=${uid} was not found.`,
                    };
                }
                return {
                    entities: state.entities.filter((e) => e[idKey] !== uid),
                    loading: false,
                    error: null,
                };
            }),

        deleteMany: (uids: any[]) =>
            set((state: EntitiesState<any, any>) => {
                if (deleteMany) {
                    return runOverride(() => deleteMany(uids, state));
                }
                return {
                    entities: state.entities.filter((e) => !uids.includes(e[idKey])),
                    loading: false,
                    error: null,
                };
            }),

        clear: () =>
            set({
                entities: [],
                loaded: false,
                loading: false,
                error: null,
            }),

        find: (uid: any) => get().entities.find((e: any) => e[idKey] === uid),

        has: (uid: any) => get().entities.some((e: any) => e[idKey] === uid),

        replaceAll: (items: any[]) =>
            set({
                entities: items,
                loaded: true,
                loading: false,
                error: null,
            }),
    });

    return zustandCreate(middleware ? middleware(initializer) : initializer);
}
