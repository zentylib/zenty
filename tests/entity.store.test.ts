import {createEntityStore} from "../src";

type User = { id: number; name: string; age?: number };

describe('createEntityStore', () => {
  it('should initialize with null', () => {
    const store = createEntityStore<User>({ initialState: null });
    expect(store.getState().entity).toBeNull();
    expect(store.getState().loaded).toBe(false);
  });

  it('should set and get an entity', () => {
    const store = createEntityStore<User>({ initialState: null });
    const user = { id: 1, name: 'Alice' };
    store.getState().set(user);
    expect(store.getState().entity).toEqual(user);
    expect(store.getState().loaded).toBe(true);
  });

  it('should update an existing entity', () => {
    const store = createEntityStore<User>({ initialState: { id: 1, name: 'Alice' } });
    store.getState().update({ name: 'Bob' });
    expect(store.getState().entity?.name).toBe('Bob');
  });

  it('should clear the entity', () => {
    const store = createEntityStore<User>({ initialState: { id: 1, name: 'Alice' } });
    store.getState().clear();
    expect(store.getState().entity).toBeNull();
    expect(store.getState().loaded).toBe(false);
  });

  it('should end loading when set lands', () => {
    const store = createEntityStore<User>();
    store.getState().setLoading(true);
    store.getState().set({ id: 1, name: 'Alice' });
    expect(store.getState().loading).toBe(false);
    expect(store.getState().loaded).toBe(true);
  });

  it('should end loading when setError is called with a message, but not when cleared with null', () => {
    const store = createEntityStore<User>();
    store.getState().setLoading(true);
    store.getState().setError(null);
    expect(store.getState().loading).toBe(true);
    store.getState().setError('Could not load the user');
    expect(store.getState().loading).toBe(false);
    expect(store.getState().error).toBe('Could not load the user');
  });

  it('should accept nested partials when deepMerge is on', () => {
    type Settings = {
      ui: { theme: string; language: string };
      flags: { beta: boolean };
    };
    const store = createEntityStore<Settings>({
      deepMerge: true,
      initialState: {
        ui: { theme: 'light', language: 'en' },
        flags: { beta: false },
      },
    });

    // No cast: `update` is typed as DeepPartial<Settings> here.
    store.getState().update({ ui: { theme: 'dark' } });

    expect(store.getState().entity?.ui).toEqual({ theme: 'dark', language: 'en' });
  });

  it('should accept a middleware wrapper', () => {
    let wrapped = false;
    const store = createEntityStore<User>({
      middleware: (config: any) => (set: any, get: any, api: any) => {
        wrapped = true;
        return config(set, get, api);
      },
    });
    expect(wrapped).toBe(true);
    store.getState().set({ id: 1, name: 'Alice' });
    expect(store.getState().entity?.name).toBe('Alice');
  });
});
