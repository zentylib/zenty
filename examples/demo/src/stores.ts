import {
  createEntitiesStore,
  createEntityStore,
  type EntitiesStoreState,
  type ZentyMiddleware,
} from 'zenty';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

/* ------------------------------------------------------------------ */
/* Products: default `id` key, persist + devtools middleware            */
/* ------------------------------------------------------------------ */

export type Product = { id: number; name: string; price: number };

export const SEED_PRODUCTS: Product[] = [
  { id: 1, name: 'Laptop', price: 1200 },
  { id: 2, name: 'Phone', price: 800 },
];

export const SERVER_PRODUCTS: Product[] = [
  { id: 100, name: 'Monitor', price: 300 },
  { id: 101, name: 'Webcam', price: 90 },
  { id: 102, name: 'Desk', price: 450 },
];

export const PRODUCTS_STORAGE_KEY = 'zenty-demo-products';

export const useProducts = createEntitiesStore<Product>({
  initialState: SEED_PRODUCTS,
  middleware: (config) =>
    devtools(
      persist(config, {
        name: PRODUCTS_STORAGE_KEY,
        storage: createJSONStorage(() => localStorage),
        // `state` is typed as the full products store: no casts.
        // Persist `loaded` with the data, so a cleared list stays "not loaded" after a reload.
        partialize: (state) => ({ entities: state.entities, loaded: state.loaded }),
      }),
      { name: 'products', enabled: import.meta.env.DEV },
    ),
});

/* ------------------------------------------------------------------ */
/* Users: custom string `idKey`, reusable typed middleware             */
/* ------------------------------------------------------------------ */

export type User = { userId: string; name: string; role: 'admin' | 'member' };

export const USERS_STORAGE_KEY = 'zenty-demo-users';

const persistUsers: ZentyMiddleware<EntitiesStoreState<User, 'userId'>> = (config) =>
  persist(config, {
    name: USERS_STORAGE_KEY,
    storage: createJSONStorage(() => sessionStorage),
  });

export const useUsers = createEntitiesStore<User, 'userId'>({
  idKey: 'userId',
  middleware: persistUsers,
});

/* ------------------------------------------------------------------ */
/* Todos: custom action overrides (normalise, validate, guard)         */
/* ------------------------------------------------------------------ */

export type Todo = { id: number; title: string; pinned: boolean };

export const useTodos = createEntitiesStore<Todo>({
  add: (item, state) => {
    const title = item.title.trim();
    if (!title) throw new Error('A todo needs a title.');
    if (state.entities.some((t) => t.title.toLowerCase() === title.toLowerCase())) {
      throw new Error(`"${title}" is already on the list.`);
    }
    return [...state.entities, { ...item, title }];
  },
  delete: (id, state) => {
    const todo = state.entities.find((t) => t.id === id);
    if (todo?.pinned) throw new Error('Unpin it before deleting.');
    return state.entities.filter((t) => t.id !== id);
  },
});

/* ------------------------------------------------------------------ */
/* Settings: single entity with deepMerge (nested partial updates)     */
/* ------------------------------------------------------------------ */

export type Settings = {
  ui: { theme: 'light' | 'dark'; language: 'en' | 'de' };
  notifications: { email: boolean; push: boolean };
  meta: { savedAt: Date; saves: number };
  recent: string[];
};

export const INITIAL_SETTINGS: Settings = {
  ui: { theme: 'light', language: 'en' },
  notifications: { email: true, push: false },
  meta: { savedAt: new Date('2025-01-01T00:00:00.000Z'), saves: 0 },
  recent: ['home'],
};

export const useSettings = createEntityStore<Settings>({
  deepMerge: true,
  initialState: INITIAL_SETTINGS,
});

/* ------------------------------------------------------------------ */
/* Profile: single entity, starts empty, shallow updates               */
/* ------------------------------------------------------------------ */

export type Profile = {
  name: string;
  address: { city: string; zip?: string };
};

export const useProfile = createEntityStore<Profile>();
