# Zenty

[![npm version](https://img.shields.io/npm/v/zenty.svg)](https://www.npmjs.com/package/zenty)
[![CI](https://github.com/zentylib/zenty/actions/workflows/ci.yml/badge.svg)](https://github.com/zentylib/zenty/actions/workflows/ci.yml)
[![bundle size](https://img.shields.io/bundlephobia/minzip/zenty)](https://bundlephobia.com/package/zenty)
[![license](https://img.shields.io/npm/l/zenty.svg)](./LICENSE)

**Type-safe CRUD stores for Zustand in one line.**

Zenty is a powerful Zustand-based library that simplifies CRUD operations with elegant state management. It provides two main store creators for different use cases.

For more examples and advanced usage, visit our <a href="https://github.com/zentylib/zenty" target="_blank" rel="noopener noreferrer">GitHub repository</a> or try our <a href="https://zentylib.com" target="_blank" rel="noopener noreferrer">interactive demo</a>.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [createEntitiesStore](#createentitiesstore)
  - [createEntityStore](#createentitystore)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [TypeScript Support](#typescript-support)
- [Contributing](#contributing)

## Installation

```bash
npm install zenty zustand
```

```bash
yarn add zenty zustand
```

```bash
pnpm add zenty zustand
```

**Requirements:** React 18 or 19, Zustand 4.4+ or 5, and Node.js 18+ for tooling.
Zenty ships ESM and CommonJS builds with TypeScript types included.

## Quick Start

### Managing Collections with createEntitiesStore

```typescript
import { createEntitiesStore } from 'zenty';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

// Create a store for managing products
const useProductStore = createEntitiesStore<Product>();

// Use in your React component
function ProductList() {
  const { 
    entities, 
    loading, 
    error, 
    add, 
    update, 
    delete: deleteProduct 
  } = useProductStore();

  const handleAddProduct = () => {
    add({
      id: crypto.randomUUID(),
      name: 'New Product',
      price: 29.99,
      category: 'Electronics'
    });
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      
      <button onClick={handleAddProduct}>Add Product</button>
      
      {entities.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>Price: ${product.price}</p>
          <button onClick={() => deleteProduct(product.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Managing Single Entities with createEntityStore

```typescript
import { createEntityStore } from 'zenty';

interface User {
  id: string;
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

// Create a store for managing a single user
const useUserStore = createEntityStore<User>({
  deepMerge: true // Enable deep merging for nested objects
});

function UserProfile() {
  const { entity: user, loading, set, update } = useUserStore();

  const updateTheme = (theme: 'light' | 'dark') => {
    update({
      preferences: {
        theme
      }
    });
  };

  return (
    <div>
      {user && (
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <button onClick={() => updateTheme('dark')}>
            Switch to Dark Mode
          </button>
        </div>
      )}
    </div>
  );
}
```

## API Reference

### createEntitiesStore

Creates a Zustand store for managing collections of entities with built-in CRUD operations.

#### Signature

```typescript
// For entities with an 'id' field (idKey is optional)
function createEntitiesStore<T extends { id: string | number }>(
  options?: Omit<EntitiesStoreOptions<T, 'id'>, 'idKey'> & { idKey?: 'id' }
): EntitiesStore<T, 'id'>;

// For entities with a custom ID field (idKey is required)
function createEntitiesStore<T extends Record<K, string | number>, K extends keyof T>(
  options: EntitiesStoreOptions<T, K>
): EntitiesStore<T, K>;

// EntitiesStore<T, K> = UseBoundStore<StoreApi<EntitiesState<T> & EntitiesActions<T, K>>>
```

#### Options

```typescript
interface EntitiesStoreOptions<T, K extends keyof T> {
  idKey: K;                    // Which field is the unique identifier
  initialState?: T[];          // Initial list of entities (defaults to [])
  
  // Optional custom implementations for each action.
  // Errors thrown in them are caught and written to `error`.
  add?: (item: T, state: EntitiesState<T>) => T[];
  addMany?: (items: T[], state: EntitiesState<T>) => T[];
  update?: (uid: T[K], patch: Partial<T>, state: EntitiesState<T>) => T[];
  updateMany?: (patches: (Pick<T, K> & Partial<T>)[], state: EntitiesState<T>) => T[];
  delete?: (uid: T[K], state: EntitiesState<T>) => T[];
  deleteMany?: (uids: T[K][], state: EntitiesState<T>) => T[];

  // Optional Zustand middleware, e.g. persist or devtools
  middleware?: ZentyMiddleware<EntitiesStoreState<T, K>>;
}
```

#### State

```typescript
interface EntitiesState<T> {
  entities: T[];           // Array of entities
  loaded: boolean;         // Whether data has been loaded
  loading: boolean;        // Whether an operation is in progress
  error: string | null;    // Error message if any
}
```

#### Actions

```typescript
interface EntitiesActions<T, K extends keyof T> {
  add: (item: T) => void;                                    // Add single entity
  addMany: (items: T[]) => void;                            // Add multiple entities
  update: (uid: T[K], patch: Partial<T>) => void;          // Update single entity
  updateMany: (patches: (Pick<T, K> & Partial<T>)[]) => void; // Update multiple entities
  delete: (uid: T[K]) => void;                              // Delete single entity
  deleteMany: (uids: T[K][]) => void;                       // Delete multiple entities
  clear: () => void;                                        // Clear all entities
  find: (uid: T[K]) => T | undefined;                       // Find entity by ID
  has: (uid: T[K]) => boolean;                              // Check if entity exists
  replaceAll: (items: T[]) => void;                         // Replace all entities
  setError: (error: string | null) => void;                 // Set error state
  setLoading: (loading: boolean) => void;                   // Set loading state
}
```

### createEntityStore

Creates a Zustand store for managing a single entity.

#### Signature

```typescript
// update takes a Partial<T>
function createEntityStore<T>(
  options?: EntityStoreOptions<T, false>
): EntityStore<T, false>;

// with deepMerge: true, update takes a DeepPartial<T>
function createEntityStore<T>(
  options: EntityStoreOptions<T, true> & { deepMerge: true }
): EntityStore<T, true>;

// EntityStore<T, D> = UseBoundStore<StoreApi<EntityState<T> & EntityActions<T, EntityPatch<T, D>>>>
```

#### Options

```typescript
interface EntityStoreOptions<T, D extends boolean> {
  initialState?: T | null;  // Initial entity state (defaults to null)
  deepMerge?: D;            // Whether updates should deep merge (defaults to false)
  middleware?: ZentyMiddleware<EntityStoreState<T, D>>; // Optional Zustand middleware
}
```

When `deepMerge` is `true`, `update` is typed as `DeepPartial<T>`, so nested
objects can be partial without a cast:

```typescript
type Settings = { ui: { theme: string; language: string } };

const useSettings = createEntityStore<Settings>({
  deepMerge: true,
  initialState: { ui: { theme: 'light', language: 'en' } },
});
useSettings.getState().update({ ui: { theme: 'dark' } }); // language stays intact
```

`Date`, `Map`, `Set`, arrays and class instances are replaced as whole values,
only plain objects are merged.

#### State & Actions

```typescript
interface EntityState<T> {
  entity: T | null;         // The entity or null
  loaded: boolean;          // Whether entity has been loaded
  loading: boolean;         // Whether an operation is in progress
  error: string | null;     // Error message if any
}

// Patch is Partial<T>, or DeepPartial<T> with deepMerge: true
interface EntityActions<T, Patch> {
  set: (entity: T) => void;                    // Set the entire entity
  update: (updated: Patch) => void;            // Update parts of the entity
  clear: () => void;                           // Reset entity, loaded and error
  setError: (error: string | null) => void;    // Set error state
  setLoading: (loading: boolean) => void;      // Set loading state
}
```

## Examples

### Custom ID Field

```typescript
interface User {
  userId: string;
  name: string;
  email: string;
}

const useUserStore = createEntitiesStore<User, 'userId'>({
  idKey: 'userId',
  initialState: [
    { userId: '1', name: 'John', email: 'john@example.com' }
  ]
});
```

### Custom CRUD Operations

```typescript
type Product = {
  id: string;
  name: string;
  price?: number;
  createdAt?: Date;
  deleted?: boolean;
};

const useProductStore = createEntitiesStore<Product>({
  // Custom add logic with validation
  add: (item, state) => {
    if (state.entities.some(p => p.name === item.name)) {
      throw new Error('Product name must be unique');
    }
    return [...state.entities, { ...item, createdAt: new Date() }];
  },
  
  // Custom delete with soft delete
  delete: (id, state) => {
    return state.entities.map(p => 
      p.id === id ? { ...p, deleted: true } : p
    );
  }
});
```

### Deep Merging

```typescript
interface Settings {
  ui: {
    theme: string;
    language: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
  };
}

const useSettingsStore = createEntityStore<Settings>({
  deepMerge: true,
  initialState: {
    ui: { theme: 'light', language: 'en' },
    notifications: { email: true, push: false }
  }
});

// This will only update the theme, keeping language intact.
// Outside components use getState(); inside, `const { update } = useSettingsStore()`.
useSettingsStore.getState().update({ ui: { theme: 'dark' } });
```

### Zustand Middleware

Pass any Zustand middleware through `middleware`. It receives the store
initializer and returns the wrapped one:

```typescript
import { devtools, persist } from 'zustand/middleware';

const useProductStore = createEntitiesStore<Product>({
  middleware: (config) => devtools(persist(config, { name: 'products' })),
});
```

The same option exists on `createEntityStore`.

The middleware is fully typed against the store's state, so options like
`partialize` get autocompletion and type errors without casts:

```typescript
import { persist } from 'zustand/middleware';

const useProductStore = createEntitiesStore<Product>({
  middleware: (config) =>
    persist(config, {
      name: 'products',
      partialize: (state) => ({ entities: state.entities }), // state is typed
    }),
});
```

When you `partialize` a persisted store, keep `loaded` next to the data
(`({ entities: state.entities, loaded: state.loaded })`). Otherwise `loaded`
comes from `initialState` on every page load, even when the saved list is empty.

To define a middleware once and reuse it, type it with the exported state types:

```typescript
import { persist } from 'zustand/middleware';
import type { EntitiesStoreState, ZentyMiddleware } from 'zenty';

const persistProducts: ZentyMiddleware<EntitiesStoreState<Product, 'id'>> = (config) =>
  persist(config, { name: 'products' });
```

Besides `createEntitiesStore`, `createEntityStore` and the `deepMerge` helper,
zenty exports these types: `EntitiesStore`, `EntitiesStoreState`, `EntitiesState`,
`EntitiesActions`, `EntitiesStoreOptions`, `EntityStore`, `EntityStoreState`,
`EntityState`, `EntityActions`, `EntityStoreOptions`, `EntityPatch`, `DeepPartial`
and `ZentyMiddleware`.

### Missing and duplicate IDs

`update` and `delete` report a missing ID instead of doing nothing:

```typescript
type Product = { id: string; name: string };
const useProductStore = createEntitiesStore<Product>({
  initialState: [{ id: 'p1', name: 'Lamp' }],
});

useProductStore.getState().update('missing-id', { name: 'Nope' });
useProductStore.getState().error; // "Item with id=missing-id was not found."
```

Read `error` from a fresh `getState()` (or a hook) after the call. A state
object you grabbed before the call is a snapshot and still shows the old value.

IDs stay unique. `add` and `addMany` reject items whose ID is already in the
store (or repeated inside the batch), and `update` refuses to change an ID to
one that is taken. A rejected `addMany` adds nothing at all:

```typescript
useProductStore.getState().addMany([{ id: 'p2', name: 'New' }, { id: 'p1', name: 'Dup' }]);
useProductStore.getState().error; // "Items with id=p1 already exist." (p2 was not added either)
```

On a single-entity store, `update` before anything is `set` reports
`"Cannot update: no entity is set. Call set() first."`. A successful write
clears a previous `error`.

### `loaded`

`loaded` turns `true` once data has landed in the store: a non-empty
`initialState`, `set`, `replaceAll`, `add` or `addMany`. Deleting the last
item leaves it `true` (the list was loaded, it is just empty); only `clear()`
resets it to `false`.

### Async Operations

Zenty doesn't fetch for you, but every action that writes to the store
(`replaceAll`, `add`, `addMany`, `update`, `delete`, `setError`, …) ends the
`loading` state when it lands, so a `finally` block is optional:

```typescript
const useProductStore = createEntitiesStore<Product>();

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

async function fetchProducts() {
  const { setLoading, setError, replaceAll } = useProductStore.getState();

  setError(null); // clears an old error, keeps loading as it is
  setLoading(true);
  try {
    const response = await fetch('/api/products');
    const products = await response.json();
    replaceAll(products); // ends loading
  } catch (error) {
    setError(message(error)); // ends loading too
  }
}

async function createProduct(product: Omit<Product, 'id'>) {
  const { setLoading, setError, add } = useProductStore.getState();

  setLoading(true);
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(product)
    });
    const newProduct = await response.json();
    add(newProduct); // ends loading; reports a duplicate id in `error`
  } catch (error) {
    setError(message(error));
  }
}
```

## Best Practices

### 1. Use TypeScript

Always define your entity interfaces for better type safety:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const useProductStore = createEntitiesStore<Product>();
```

### 2. Handle Loading States

Always handle loading and error states in your components:

```typescript
function ProductList() {
  const { entities, loading, error } = useProductStore();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <ProductGrid products={entities} />;
}
```

### 3. Use Custom Operations for Complex Logic

Implement custom CRUD operations for validation and business logic:

```typescript
const useProductStore = createEntitiesStore<Product>({
  add: (item, state) => {
    // Validation
    if (!item.name.trim()) {
      throw new Error('Product name is required');
    }
    
    // Business logic
    const productWithDefaults = {
      ...item,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return [...state.entities, productWithDefaults];
  }
});
```


## TypeScript Support

Zenty is built with TypeScript and provides full type safety:

- **Generic Types**: Both store creators are fully generic
- **Type Inference**: TypeScript will infer types from your entity interfaces
- **Custom ID Fields**: Support for any field as the unique identifier
- **Overloads**: Function overloads for different use cases
- **Strict Typing**: All actions and state are strictly typed

## Developers
Zenty is developed and maintained by <a href="https://linkedin.com/in/milaim">Milaim Ajdari</a>
and <a href="https://www.linkedin.com/in/leonshabani/">Leon Shabani</a>.

## Contributing

Bug reports and pull requests are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md)
for setup and the checks a PR needs to pass, and [SECURITY.md](./SECURITY.md) for
reporting vulnerabilities privately.

## License

[MIT](./LICENSE)
