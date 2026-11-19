import { useProfile } from '../stores';
import { Status } from './Status';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Profile() {
  const { entity, loaded, loading, error, set, update, clear, setLoading, setError } = useProfile();

  const load = async () => {
    setLoading(true);
    await wait(300);
    set({ name: 'Alice', address: { city: 'Berlin', zip: '10115' } }); // ends loading
  };

  return (
    <section data-testid="profile">
      <h2>Profile · createEntityStore, shallow update, starts empty</h2>
      <Status prefix="profile" loaded={loaded} loading={loading} error={error} />

      <p data-testid="profile-value">{entity ? JSON.stringify(entity) : 'no profile'}</p>

      <div className="row">
        <button data-testid="profile-update" onClick={() => update({ name: 'Bob' })}>
          Rename to Bob
        </button>
        <button data-testid="profile-load" onClick={load}>
          Load profile
        </button>
        <button data-testid="profile-move" onClick={() => update({ address: { city: 'Munich' } })}>
          Move to Munich (replaces address)
        </button>
        <button data-testid="profile-fail" onClick={() => setError('Profile service down')}>
          Report error
        </button>
        <button data-testid="profile-clear" onClick={clear}>
          Clear
        </button>
      </div>
    </section>
  );
}
