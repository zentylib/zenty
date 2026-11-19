import { useState } from 'react';
import { SERVER_PRODUCTS, useProducts, type Product } from '../stores';
import { Status } from './Status';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Simulated API: resolves with products, or rejects when `fail` is set. */
async function fetchProducts(fail: boolean): Promise<Product[]> {
  await wait(400);
  if (fail) throw new Error('Server unavailable (503)');
  return SERVER_PRODUCTS;
}

export function Products() {
  // Whole-store subscription for the list...
  const { entities, loaded, loading, error } = useProducts();
  // ...and narrow selectors, the way real components subscribe.
  const count = useProducts((s) => s.entities.length);
  const total = useProducts((s) => s.entities.reduce((sum, p) => sum + p.price, 0));

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editNewId, setEditNewId] = useState('');
  const [deleteId, setDeleteId] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [selected, setSelected] = useState<number[]>([]);

  const store = useProducts.getState;

  const lookup = lookupId === '' ? undefined : Number(lookupId);
  const found = lookup === undefined ? undefined : store().find(lookup);
  const has = useProducts((s) => (lookup === undefined ? false : s.has(lookup)));

  const reload = async (fail: boolean) => {
    const { setLoading, setError, replaceAll } = store();
    setError(null); // clear old errors without stopping the spinner
    setLoading(true);
    try {
      replaceAll(await fetchProducts(fail)); // ends loading
    } catch (e) {
      setError((e as Error).message); // ends loading too
    }
  };

  const toggle = (pid: number) =>
    setSelected((s) => (s.includes(pid) ? s.filter((x) => x !== pid) : [...s, pid]));

  return (
    <section data-testid="products">
      <h2>Products · createEntitiesStore + persist + devtools</h2>
      <Status
        prefix="products"
        loaded={loaded}
        loading={loading}
        error={error}
        onClearError={() => store().setError(null)}
      />
      <p>
        <span data-testid="products-count">count: {count}</span> ·{' '}
        <span data-testid="products-total">total: {total}</span>
      </p>

      <ul data-testid="products-list">
        {entities.map((p) => (
          <li key={p.id} data-testid={`product-${p.id}`}>
            <input
              type="checkbox"
              aria-label={`select ${p.name}`}
              data-testid={`product-${p.id}-select`}
              checked={selected.includes(p.id)}
              onChange={() => toggle(p.id)}
            />
            <span data-testid={`product-${p.id}-text`}>
              #{p.id} {p.name} – {p.price}
            </span>
            <button data-testid={`product-${p.id}-delete`} onClick={() => store().delete(p.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div className="row">
        <h3>add</h3>
        <input placeholder="id" data-testid="add-id" value={id} onChange={(e) => setId(e.target.value)} />
        <input placeholder="name" data-testid="add-name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="price" data-testid="add-price" value={price} onChange={(e) => setPrice(e.target.value)} />
        <button
          data-testid="add-submit"
          onClick={() => store().add({ id: Number(id), name, price: Number(price) })}
        >
          Add
        </button>
      </div>

      <div className="row">
        <h3>addMany</h3>
        <button
          data-testid="add-many"
          onClick={() =>
            store().addMany([
              { id: 10, name: 'Mouse', price: 25 },
              { id: 11, name: 'Keyboard', price: 75 },
            ])
          }
        >
          Add Mouse + Keyboard
        </button>
        <button
          data-testid="add-many-duplicate"
          onClick={() =>
            store().addMany([
              { id: 12, name: 'Headset', price: 60 },
              { id: 1, name: 'Laptop again', price: 1 },
            ])
          }
        >
          Add batch with existing id 1
        </button>
      </div>

      <div className="row">
        <h3>update</h3>
        <input placeholder="id" data-testid="edit-id" value={editId} onChange={(e) => setEditId(e.target.value)} />
        <input placeholder="new name" data-testid="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
        <input placeholder="new id (optional)" data-testid="edit-new-id" value={editNewId} onChange={(e) => setEditNewId(e.target.value)} />
        <button
          data-testid="edit-submit"
          onClick={() =>
            store().update(Number(editId), {
              ...(editName ? { name: editName } : {}),
              ...(editNewId ? { id: Number(editNewId) } : {}),
            })
          }
        >
          Update
        </button>
      </div>

      <div className="row">
        <h3>delete / deleteMany / updateMany</h3>
        <input placeholder="id" data-testid="delete-id" value={deleteId} onChange={(e) => setDeleteId(e.target.value)} />
        <button data-testid="delete-submit" onClick={() => store().delete(Number(deleteId))}>
          Delete by id
        </button>
        <button
          data-testid="delete-selected"
          onClick={() => {
            store().deleteMany(selected);
            setSelected([]);
          }}
        >
          Delete selected ({selected.length})
        </button>
        <button
          data-testid="discount-selected"
          onClick={() =>
            store().updateMany(
              entities
                .filter((p) => selected.includes(p.id))
                .map((p) => ({ id: p.id, price: Math.round(p.price * 0.9) })),
            )
          }
        >
          10% off selected
        </button>
      </div>

      <div className="row">
        <h3>find / has</h3>
        <input placeholder="id" data-testid="lookup-id" value={lookupId} onChange={(e) => setLookupId(e.target.value)} />
        <span data-testid="lookup-has">has: {String(has)}</span>
        <span data-testid="lookup-find">find: {found ? found.name : '—'}</span>
      </div>

      <div className="row">
        <h3>async + replaceAll / clear</h3>
        <button data-testid="reload" onClick={() => reload(false)}>
          Load from server
        </button>
        <button data-testid="reload-fail" onClick={() => reload(true)}>
          Load (server fails)
        </button>
        <button data-testid="clear" onClick={() => store().clear()}>
          Clear
        </button>
      </div>
    </section>
  );
}
