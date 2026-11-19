import { createEntitiesStore } from "../src";

type Product = { id: number; name: string };

describe('createEntitiesStore', () => {
  it('should initialize with empty list', () => {
    const store = createEntitiesStore<Product>({ initialState: [] });
    expect(store.getState().entities).toEqual([]);
    expect(store.getState().loaded).toBe(false);
    expect(store.getState().loading).toBe(false);
    expect(store.getState().error).toBeNull();
  });

  it('should add a new product', () => {
    const store = createEntitiesStore<Product>({ initialState: [] });
    store.getState().add({ id: 1, name: 'Laptop' });
    expect(store.getState().entities).toHaveLength(1);
    expect(store.getState().loaded).toBe(true);
  });

  it('should add multiple products', () => {
    const store = createEntitiesStore<Product>({ initialState: [] });
    store.getState().addMany([{ id: 1, name: 'Laptop' }, { id: 2, name: 'Phone' }]);
    expect(store.getState().entities).toHaveLength(2);
    expect(store.getState().loaded).toBe(true);
  });

  it('should not add a duplicate product', () => {
    const store = createEntitiesStore<Product>({ initialState: [] });
    const product = { id: 1, name: 'Laptop' };
    store.getState().add(product);
    store.getState().add(product);
    expect(store.getState().entities).toHaveLength(1);
    expect(store.getState().error).toMatch(/already exists/);
  });

  it('should update a product', () => {
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }] });
    store.getState().update(1, { name: 'Tablet' });
    expect(store.getState().entities[0].name).toBe('Tablet');
  });

  it('should update multiple products', () => {
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }, { id: 2, name: 'Phone' }] });
    store.getState().updateMany([{ id: 1, name: 'Tablet' }, { id: 2, name: 'Smartphone' }]);
    expect(store.getState().entities[0].name).toBe('Tablet');
    expect(store.getState().entities[1].name).toBe('Smartphone');
  });

  it('should delete a product', () => {
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }] });
    store.getState().delete(1);
    expect(store.getState().entities).toHaveLength(0);
    expect(store.getState().loaded).toBe(true); // emptied, but still loaded
  });

  it('should delete multiple products', () => {
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }, { id: 2, name: 'Phone' }] });
    store.getState().deleteMany([1, 2]);
    expect(store.getState().entities).toHaveLength(0);
    expect(store.getState().loaded).toBe(true); // emptied, but still loaded
  });

  it('should clear all products', () => {
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }] });
    store.getState().clear();
    expect(store.getState().entities).toEqual([]);
    expect(store.getState().loaded).toBe(false);
  });

  it('should find a product by id', () => {
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }] });
    const found = store.getState().find(1);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Laptop');
  });

  it('should return undefined if product not found', () => {
    const store = createEntitiesStore<Product>({ initialState: [] });
    const found = store.getState().find(99);
    expect(found).toBeUndefined();
  });

  it('should check if product exists by id', () => {
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }] });
    expect(store.getState().has(1)).toBe(true);
    expect(store.getState().has(2)).toBe(false);
  });

  it('should replace all entities', () => {
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }] });
    store.getState().replaceAll([{ id: 2, name: 'Phone' }]);
    expect(store.getState().entities).toEqual([{ id: 2, name: 'Phone' }]);
  });

  it('should set and clear error manually', () => {
    const store = createEntitiesStore<Product>();
    store.getState().setError('Something went wrong');
    expect(store.getState().error).toBe('Something went wrong');
    store.getState().setError(null);
    expect(store.getState().error).toBeNull();
  });

  it('should set loading state manually', () => {
    const store = createEntitiesStore<Product>();
    store.getState().setLoading(true);
    expect(store.getState().loading).toBe(true);
    store.getState().setLoading(false);
    expect(store.getState().loading).toBe(false);
  });

  it('should end loading when replaceAll lands', () => {
    const store = createEntitiesStore<Product>();
    store.getState().setLoading(true);
    store.getState().replaceAll([{ id: 1, name: 'Laptop' }]);
    expect(store.getState().loading).toBe(false);
    expect(store.getState().entities).toHaveLength(1);
  });

  it('should end loading when setError is called with a message, but not when cleared with null', () => {
    const store = createEntitiesStore<Product>();
    store.getState().setLoading(true);
    store.getState().setError(null);
    expect(store.getState().loading).toBe(true);
    store.getState().setError('Could not load products');
    expect(store.getState().loading).toBe(false);
    expect(store.getState().error).toBe('Could not load products');
  });

  it('should catch errors thrown in overrides and report them to error state', () => {
    const store = createEntitiesStore<Product>({
      add: (item) => {
        if (item.name === 'bad') throw new Error('Bad product');
        return [item];
      },
      addMany: () => {
        throw new Error('Cannot add many');
      },
      update: (_id, patch) => {
        if (patch.name === 'bad') throw new Error('Bad update');
        return [];
      },
      updateMany: () => {
        throw new Error('Cannot update many');
      },
      delete: () => {
        throw new Error('Cannot delete');
      },
      deleteMany: () => {
        throw new Error('Cannot delete many');
      },
    });

    store.getState().setLoading(true);
    store.getState().add({ id: 1, name: 'bad' });
    expect(store.getState().error).toBe('Bad product');
    expect(store.getState().loading).toBe(false);

    store.getState().setLoading(true);
    store.getState().addMany([{ id: 1, name: 'bad' }]);
    expect(store.getState().error).toBe('Cannot add many');
    expect(store.getState().loading).toBe(false);

    store.getState().setLoading(true);
    store.getState().update(1, { name: 'bad' });
    expect(store.getState().error).toBe('Bad update');
    expect(store.getState().loading).toBe(false);

    store.getState().setLoading(true);
    store.getState().updateMany([{ id: 1, name: 'bad' }]);
    expect(store.getState().error).toBe('Cannot update many');
    expect(store.getState().loading).toBe(false);

    store.getState().setLoading(true);
    store.getState().delete(1);
    expect(store.getState().error).toBe('Cannot delete');
    expect(store.getState().loading).toBe(false);

    store.getState().setLoading(true);
    store.getState().deleteMany([1]);
    expect(store.getState().error).toBe('Cannot delete many');
    expect(store.getState().loading).toBe(false);
  });

  it('should report non-Error values thrown in overrides as strings', () => {
    const store = createEntitiesStore<Product>({
      add: () => {
        throw 'plain string failure';
      },
    });
    store.getState().add({ id: 1, name: 'Laptop' });
    expect(store.getState().error).toBe('plain string failure');
    expect(store.getState().entities).toEqual([]);
  });

  it('should keep entities unchanged when an override throws', () => {
    const initial = [{ id: 1, name: 'Laptop' }];
    const store = createEntitiesStore<Product>({
      initialState: initial,
      update: () => {
        throw new Error('nope');
      },
    });
    store.getState().update(1, { name: 'Tablet' });
    expect(store.getState().entities).toEqual(initial);
  });

  it('should use the override result and clear a previous error', () => {
    const store = createEntitiesStore<Product>({
      add: (item, state) => [...state.entities, { ...item, name: item.name.toUpperCase() }],
    });
    store.getState().setError('old');
    store.getState().add({ id: 1, name: 'laptop' });
    expect(store.getState().entities).toEqual([{ id: 1, name: 'LAPTOP' }]);
    expect(store.getState().error).toBeNull();
    expect(store.getState().loaded).toBe(true);
  });

  it('should only update the matching product and leave others untouched', () => {
    const phone = { id: 2, name: 'Phone' };
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }, phone] });
    store.getState().update(1, { name: 'Tablet' });
    expect(store.getState().entities).toEqual([{ id: 1, name: 'Tablet' }, phone]);
    expect(store.getState().entities[1]).toBe(phone);
  });

  it('should skip patches in updateMany whose id is not present', () => {
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }, { id: 2, name: 'Phone' }] });
    store.getState().updateMany([{ id: 2, name: 'Smartphone' }, { id: 99, name: 'Ghost' }]);
    expect(store.getState().entities).toEqual([{ id: 1, name: 'Laptop' }, { id: 2, name: 'Smartphone' }]);
  });

  it('should clear a previous error after a successful write', () => {
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }] });
    store.getState().delete(99);
    expect(store.getState().error).not.toBeNull();
    store.getState().delete(1);
    expect(store.getState().error).toBeNull();
  });

  it('should support string ids with a custom idKey across all actions', () => {
    type User = { userId: string; name: string };
    const store = createEntitiesStore<User, 'userId'>({ idKey: 'userId' });
    store.getState().addMany([{ userId: 'a', name: 'A' }, { userId: 'b', name: 'B' }]);
    store.getState().update('a', { name: 'AA' });
    store.getState().deleteMany(['b']);
    expect(store.getState().entities).toEqual([{ userId: 'a', name: 'AA' }]);
    expect(store.getState().find('a')?.name).toBe('AA');
    expect(store.getState().has('b')).toBe(false);
  });

  it('should be loaded when created with a non-empty initialState', () => {
    expect(createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }] }).getState().loaded).toBe(true);
    expect(createEntitiesStore<Product>({ initialState: [] }).getState().loaded).toBe(false);
    expect(createEntitiesStore<Product>().getState().loaded).toBe(false);
  });

  it('should reject an addMany batch that collides with existing ids', () => {
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }] });
    store.getState().setLoading(true);
    store.getState().addMany([{ id: 2, name: 'Phone' }, { id: 1, name: 'Dup' }]);
    expect(store.getState().entities).toEqual([{ id: 1, name: 'Laptop' }]);
    expect(store.getState().error).toBe('Items with id=1 already exist.');
    expect(store.getState().loading).toBe(false);
  });

  it('should reject an addMany batch with duplicate ids inside it', () => {
    const store = createEntitiesStore<Product>();
    store.getState().addMany([{ id: 2, name: 'A' }, { id: 3, name: 'B' }, { id: 2, name: 'C' }, { id: 3, name: 'D' }, { id: 2, name: 'E' }]);
    expect(store.getState().entities).toEqual([]);
    expect(store.getState().error).toBe('Items with id=2, 3 already exist.');
  });

  it('should accept an empty addMany batch', () => {
    const store = createEntitiesStore<Product>();
    store.getState().addMany([]);
    expect(store.getState().entities).toEqual([]);
    expect(store.getState().error).toBeNull();
    expect(store.getState().loaded).toBe(true);
  });

  it('should reject an update that changes the id to one already in use', () => {
    const initial = [{ id: 1, name: 'Laptop' }, { id: 2, name: 'Phone' }];
    const store = createEntitiesStore<Product>({ initialState: initial });
    store.getState().update(2, { id: 1 });
    expect(store.getState().entities).toEqual(initial);
    expect(store.getState().error).toBe('Cannot change id=2 to 1: an item with that id already exists.');
  });

  it('should allow an update that changes the id to a free one or keeps it', () => {
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }] });
    store.getState().update(1, { id: 1, name: 'Same id' });
    expect(store.getState().error).toBeNull();
    store.getState().update(1, { id: 5 });
    expect(store.getState().entities).toEqual([{ id: 5, name: 'Same id' }]);
    expect(store.getState().error).toBeNull();
  });

  it('should report an update on a missing id', () => {
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }] });
    store.getState().update(2, { name: 'Tablet' });
    expect(store.getState().entities).toEqual([{ id: 1, name: 'Laptop' }]);
    expect(store.getState().error).toMatch(/id=2 was not found/);
  });

  it('should report a delete on a missing id', () => {
    const store = createEntitiesStore<Product>({ initialState: [{ id: 1, name: 'Laptop' }] });
    store.getState().delete(2);
    expect(store.getState().entities).toEqual([{ id: 1, name: 'Laptop' }]);
    expect(store.getState().error).toMatch(/id=2 was not found/);
  });

  it('should use a custom id field in error messages', () => {
    type User = { userId: string; name: string };
    const store = createEntitiesStore<User, 'userId'>({ idKey: 'userId', initialState: [] });
    store.getState().update('u1', { name: 'Alice' });
    expect(store.getState().error).toMatch(/userId=u1 was not found/);
  });

  it('should accept a middleware wrapper', () => {
    let wrapped = false;
    const store = createEntitiesStore<Product>({
      middleware: (config: any) => (set: any, get: any, api: any) => {
        wrapped = true;
        return config(set, get, api);
      },
    });
    expect(wrapped).toBe(true);
    store.getState().add({ id: 1, name: 'Laptop' });
    expect(store.getState().entities).toHaveLength(1);
  });
});
