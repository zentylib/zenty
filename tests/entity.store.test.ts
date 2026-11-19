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

  it('should reset error and loading on clear, like the collection store', () => {
    const store = createEntityStore<User>({ initialState: { id: 1, name: 'Alice' } });
    store.getState().setLoading(true);
    store.getState().setError('Profile service down');
    store.getState().setLoading(true);
    store.getState().clear();
    expect(store.getState()).toMatchObject({ entity: null, loaded: false, loading: false, error: null });
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

  it('should keep Date values intact when deepMerge is on', () => {
    type Profile = { name: string; meta: { updatedAt: Date; views: number } };
    const store = createEntityStore<Profile>({
      deepMerge: true,
      initialState: { name: 'Alice', meta: { updatedAt: new Date(0), views: 1 } },
    });
    const now = new Date('2026-01-01T00:00:00.000Z');
    store.getState().update({ meta: { updatedAt: now } });
    expect(store.getState().entity?.meta.updatedAt).toBeInstanceOf(Date);
    expect(store.getState().entity?.meta.updatedAt.getTime()).toBe(now.getTime());
    expect(store.getState().entity?.meta.views).toBe(1);
  });

  it('should replace nested objects on update when deepMerge is off', () => {
    type Settings = { ui: { theme: string; language?: string } };
    const store = createEntityStore<Settings>({ initialState: { ui: { theme: 'light', language: 'en' } } });
    store.getState().update({ ui: { theme: 'dark' } });
    expect(store.getState().entity?.ui).toEqual({ theme: 'dark' });
  });

  it('should report an update while there is no entity and stop loading', () => {
    const store = createEntityStore<User>();
    store.getState().setLoading(true);
    store.getState().update({ name: 'Bob' });
    expect(store.getState().entity).toBeNull();
    expect(store.getState().loaded).toBe(false);
    expect(store.getState().loading).toBe(false);
    expect(store.getState().error).toMatch(/no entity is set/);
  });

  it('should clear a previous error on set and on update', () => {
    const store = createEntityStore<User>();
    store.getState().update({ name: 'Bob' });
    store.getState().set({ id: 1, name: 'Alice' });
    expect(store.getState().error).toBeNull();
    store.getState().setError('stale');
    store.getState().update({ name: 'Bob' });
    expect(store.getState().error).toBeNull();
    expect(store.getState().entity?.name).toBe('Bob');
  });

  it('should treat a falsy but non-null entity as set', () => {
    const store = createEntityStore<number>({ initialState: 0 });
    expect(store.getState().loaded).toBe(true);
  });

  it('should accept a middleware wrapper', () => {
    let wrapped = false;
    const store = createEntityStore<User>({
      middleware: (config) => (set, get, api) => {
        wrapped = true;
        return config(set, get, api);
      },
    });
    expect(wrapped).toBe(true);
    store.getState().set({ id: 1, name: 'Alice' });
    expect(store.getState().entity?.name).toBe('Alice');
  });
});
