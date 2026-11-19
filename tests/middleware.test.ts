import { devtools, persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { createEntitiesStore, createEntityStore } from '../src';

type Product = { id: number; name: string };

function memoryStorage(): StateStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (name) => data.get(name) ?? null,
    setItem: (name, value) => {
      data.set(name, value);
    },
    removeItem: (name) => {
      data.delete(name);
    },
  };
}

describe('middleware', () => {
  it('persists a collection store with a typed partialize', () => {
    const storage = memoryStorage();
    const store = createEntitiesStore<Product>({
      middleware: (config) =>
        persist(config, {
          name: 'products',
          storage: createJSONStorage(() => storage),
          // `state` is fully typed: no cast needed to reach `entities`.
          partialize: (state) => ({ entities: state.entities }),
        }),
    });

    store.getState().add({ id: 1, name: 'Laptop' });

    const saved = JSON.parse(storage.data.get('products') ?? '{}');
    expect(saved.state).toEqual({ entities: [{ id: 1, name: 'Laptop' }] });
  });

  it('rehydrates a collection store from storage', () => {
    const storage = memoryStorage();
    storage.data.set(
      'products',
      JSON.stringify({ state: { entities: [{ id: 7, name: 'Saved' }] }, version: 0 })
    );

    const store = createEntitiesStore<Product>({
      middleware: (config) =>
        persist(config, { name: 'products', storage: createJSONStorage(() => storage) }),
    });

    expect(store.getState().entities).toEqual([{ id: 7, name: 'Saved' }]);
    expect(store.getState().has(7)).toBe(true);
  });

  it('persists a single-entity store with deepMerge', () => {
    type Settings = { ui: { theme: string; language: string } };
    const storage = memoryStorage();
    const store = createEntityStore<Settings>({
      deepMerge: true,
      initialState: { ui: { theme: 'light', language: 'en' } },
      middleware: (config) =>
        persist(config, {
          name: 'settings',
          storage: createJSONStorage(() => storage),
          partialize: (state) => ({ entity: state.entity }),
        }),
    });

    store.getState().update({ ui: { theme: 'dark' } });

    const saved = JSON.parse(storage.data.get('settings') ?? '{}');
    expect(saved.state.entity).toEqual({ ui: { theme: 'dark', language: 'en' } });
  });

  it('accepts devtools and composed middleware', () => {
    const storage = memoryStorage();
    const store = createEntitiesStore<Product>({
      middleware: (config) =>
        devtools(
          persist(config, { name: 'composed', storage: createJSONStorage(() => storage) }),
          { name: 'products', enabled: false }
        ),
    });

    store.getState().add({ id: 1, name: 'Laptop' });
    expect(store.getState().entities).toHaveLength(1);
    expect(storage.data.has('composed')).toBe(true);
  });

  it('rejects partialize keys that are not on the state', () => {
    createEntitiesStore<Product>({
      middleware: (config) =>
        persist(config, {
          name: 'typed',
          storage: createJSONStorage(() => memoryStorage()),
          // @ts-expect-error `entity` does not exist on a collection store
          partialize: (state) => ({ entity: state.entity }),
        }),
    });
    expect(true).toBe(true);
  });
});
