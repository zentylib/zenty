import { create as zustandCreate, StateCreator, StoreApi, UseBoundStore } from 'zustand';
import type { ZentyMiddleware } from './types/middleware.types';

/** State of a collection store. */
export type EntitiesState<T> = {
    entities: T[];
    loaded: boolean;
    loading: boolean;
    error: string | null;
};

/** Actions of a collection store. */
export type EntitiesActions<T, K extends keyof T> = {
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

/** Full state (data + actions) of a collection store. */
export type EntitiesStoreState<T, K extends keyof T> = EntitiesState<T> & EntitiesActions<T, K>;

export type EntitiesStore<T, K extends keyof T> = UseBoundStore<StoreApi<EntitiesStoreState<T, K>>>;

/**
 * All the customizable callbacks and initial data for the store.
 */
export interface EntitiesStoreOptions<T, K extends keyof T> {
    /** Which field on T is the unique identifier? */
    idKey: K;

    /** initial list of entities (defaults to []) */
    initialState?: T[];

    /** optional overrides for each action: receive the args + current state */
    add?: (item: T, state: EntitiesState<T>) => T[];
    addMany?: (items: T[], state: EntitiesState<T>) => T[];
    update?: (uid: T[K], patch: Partial<T>, state: EntitiesState<T>) => T[];
    updateMany?: (patches: (Pick<T, K> & Partial<T>)[], state: EntitiesState<T>) => T[];
    delete?: (uid: T[K], state: EntitiesState<T>) => T[];
    deleteMany?: (uids: T[K][], state: EntitiesState<T>) => T[];

    /** wrap the store, e.g. `(config) => devtools(config, { name: 'products' })` */
    middleware?: ZentyMiddleware<EntitiesStoreState<T, K>>;
}

/** Overload #1: if T has `id: string|number`, you may omit `idKey` (defaults to "id") */
export function createEntitiesStore<T extends { id: string | number }>(
    options?: Omit<EntitiesStoreOptions<T, 'id'>, 'idKey'> & { idKey?: 'id' }
): EntitiesStore<T, 'id'>;

/** Overload #2: general case—must pass `idKey`. */
export function createEntitiesStore<T extends Record<K, string | number>, K extends keyof T>(
    options: EntitiesStoreOptions<T, K>
): EntitiesStore<T, K>;

/** Implementation: the overloads above give callers the precise types. */
export function createEntitiesStore(options: object = {}): unknown {
    type Item = Record<PropertyKey, unknown>;
    return buildEntitiesStore(options as Partial<EntitiesStoreOptions<Item, PropertyKey>>);
}

function buildEntitiesStore<T, K extends keyof T>(
    options: Partial<EntitiesStoreOptions<T, K>>
): EntitiesStore<T, K> {
    const {
        idKey = 'id' as K,
        initialState = [],
        add,
        addMany,
        update,
        updateMany,
        delete: del,
        deleteMany,
        middleware,
    } = options;

    type State = EntitiesStoreState<T, K>;
    type Id = T[K];

    const label = String(idKey);
    const idOf = (item: Pick<T, K>): Id => item[idKey];
    const hasId = (entities: T[], uid: Id) => entities.some((e) => idOf(e) === uid);

    const runOverride = (
        fn: () => T[],
        extra: Partial<EntitiesState<T>> = {}
    ): Partial<EntitiesState<T>> => {
        try {
            return { entities: fn(), error: null, loading: false, ...extra };
        } catch (e) {
            return {
                error: e instanceof Error ? e.message : String(e),
                loading: false,
            };
        }
    };

    const initializer: StateCreator<State, [], []> = (set, get) => ({
        // initial state
        entities: initialState,
        // Same rule as createEntityStore: data handed in up front counts as loaded.
        loaded: initialState.length > 0,
        loading: false,
        error: null,

        setError: (error) => set(error === null ? { error } : { error, loading: false }),
        setLoading: (loading) => set({ loading }),

        add: (item) =>
            set((state) => {
                if (add) {
                    return runOverride(() => add(item, state), { loaded: true });
                }
                if (hasId(state.entities, idOf(item))) {
                    return {
                        loaded: true,
                        loading: false,
                        error: `Item with ${label}=${String(idOf(item))} already exists.`,
                    };
                }
                return {
                    entities: [...state.entities, item],
                    loaded: true,
                    loading: false,
                    error: null,
                };
            }),

        addMany: (items) =>
            set((state) => {
                if (addMany) {
                    return runOverride(() => addMany(items, state), { loaded: true });
                }
                const existing = new Set<Id>(state.entities.map(idOf));
                const seen = new Set<Id>();
                const duplicates = new Set<Id>();
                for (const item of items) {
                    const uid = idOf(item);
                    if (existing.has(uid) || seen.has(uid)) duplicates.add(uid);
                    seen.add(uid);
                }
                if (duplicates.size > 0) {
                    // All or nothing, like `add`: a rejected batch leaves the list untouched.
                    return {
                        loaded: true,
                        loading: false,
                        error: `Items with ${label}=${[...duplicates].map(String).join(', ')} already exist.`,
                    };
                }
                return {
                    entities: [...state.entities, ...items],
                    loaded: true,
                    loading: false,
                    error: null,
                };
            }),

        update: (uid, patch) =>
            set((state) => {
                if (update) {
                    return runOverride(() => update(uid, patch, state));
                }
                if (!hasId(state.entities, uid)) {
                    return {
                        loading: false,
                        error: `Item with ${label}=${String(uid)} was not found.`,
                    };
                }
                const nextId = patch[idKey];
                if (idKey in patch && nextId !== uid && hasId(state.entities, nextId as Id)) {
                    return {
                        loading: false,
                        error: `Cannot change ${label}=${String(uid)} to ${String(nextId)}: an item with that ${label} already exists.`,
                    };
                }
                return {
                    entities: state.entities.map((e) => (idOf(e) === uid ? { ...e, ...patch } : e)),
                    loading: false,
                    error: null,
                };
            }),

        updateMany: (patches) =>
            set((state) => {
                if (updateMany) {
                    return runOverride(() => updateMany(patches, state));
                }
                return {
                    entities: state.entities.map((e) => {
                        const p = patches.find((x) => idOf(x) === idOf(e));
                        return p ? { ...e, ...p } : e;
                    }),
                    loading: false,
                    error: null,
                };
            }),

        delete: (uid) =>
            set((state) => {
                if (del) {
                    return runOverride(() => del(uid, state));
                }
                if (!hasId(state.entities, uid)) {
                    return {
                        loading: false,
                        error: `Item with ${label}=${String(uid)} was not found.`,
                    };
                }
                return {
                    entities: state.entities.filter((e) => idOf(e) !== uid),
                    loading: false,
                    error: null,
                };
            }),

        deleteMany: (uids) =>
            set((state) => {
                if (deleteMany) {
                    return runOverride(() => deleteMany(uids, state));
                }
                return {
                    entities: state.entities.filter((e) => !uids.includes(idOf(e))),
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

        find: (uid) => get().entities.find((e) => idOf(e) === uid),

        has: (uid) => hasId(get().entities, uid),

        replaceAll: (items) =>
            set({
                entities: items,
                loaded: true,
                loading: false,
                error: null,
            }),
    });

    return zustandCreate<State>()(middleware ? middleware(initializer) : initializer);
}
