import { useState } from 'react';
import { useTodos } from '../stores';
import { Status } from './Status';

let nextId = 1;

export function Todos() {
  const { entities, loaded, loading, error } = useTodos();
  const [title, setTitle] = useState('');
  const store = useTodos.getState;

  return (
    <section data-testid="todos">
      <h2>Todos · action overrides</h2>
      <Status prefix="todos" loaded={loaded} loading={loading} error={error} />

      <ul data-testid="todos-list">
        {entities.map((t) => (
          <li key={t.id} data-testid={`todo-${t.title}`}>
            <span data-testid={`todo-${t.title}-text`}>
              {t.pinned ? '📌 ' : ''}
              {t.title}
            </span>
            <button
              data-testid={`todo-${t.title}-pin`}
              onClick={() => store().update(t.id, { pinned: !t.pinned })}
            >
              {t.pinned ? 'Unpin' : 'Pin'}
            </button>
            <button data-testid={`todo-${t.title}-delete`} onClick={() => store().delete(t.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div className="row">
        <input
          placeholder="title"
          data-testid="todo-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          data-testid="todo-add"
          onClick={() => {
            store().add({ id: nextId++, title, pinned: false });
            setTitle('');
          }}
        >
          Add todo
        </button>
      </div>
    </section>
  );
}
