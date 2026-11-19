import { useState } from 'react';
import { useUsers, type User } from '../stores';
import { Status } from './Status';

export function Users() {
  const { entities, loaded, loading, error } = useUsers();
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<User['role']>('member');

  const store = useUsers.getState;

  return (
    <section data-testid="users">
      <h2>Users · custom idKey "userId" + reusable typed middleware</h2>
      <Status prefix="users" loaded={loaded} loading={loading} error={error} />

      <ul data-testid="users-list">
        {entities.map((u) => (
          <li key={u.userId} data-testid={`user-${u.userId}`}>
            <span data-testid={`user-${u.userId}-text`}>
              {u.userId}: {u.name} ({u.role})
            </span>
            <button
              data-testid={`user-${u.userId}-promote`}
              onClick={() => store().update(u.userId, { role: 'admin' })}
            >
              Make admin
            </button>
            <button data-testid={`user-${u.userId}-delete`} onClick={() => store().delete(u.userId)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="row">
        <input placeholder="userId" data-testid="user-add-id" value={userId} onChange={(e) => setUserId(e.target.value)} />
        <input placeholder="name" data-testid="user-add-name" value={name} onChange={(e) => setName(e.target.value)} />
        <select data-testid="user-add-role" value={role} onChange={(e) => setRole(e.target.value as User['role'])}>
          <option value="member">member</option>
          <option value="admin">admin</option>
        </select>
        <button data-testid="user-add-submit" onClick={() => store().add({ userId, name, role })}>
          Add user
        </button>
        <button
          data-testid="user-add-team"
          onClick={() =>
            store().addMany([
              { userId: 'ana', name: 'Ana', role: 'member' },
              { userId: 'ben', name: 'Ben', role: 'member' },
            ])
          }
        >
          Add team (ana, ben)
        </button>
        <button data-testid="user-update-missing" onClick={() => store().update('ghost', { name: 'Nobody' })}>
          Update missing "ghost"
        </button>
        <button data-testid="user-remove-team" onClick={() => store().deleteMany(['ana', 'ben'])}>
          Remove team
        </button>
      </div>
    </section>
  );
}
