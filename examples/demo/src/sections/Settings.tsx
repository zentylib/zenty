import { useSettings } from '../stores';
import { Status } from './Status';

export function Settings() {
  const { entity, loaded, loading, error, update, clear, set } = useSettings();
  // Selector on a nested value: re-renders only when the theme changes.
  const theme = useSettings((s) => s.entity?.ui.theme);

  const savedAt = entity?.meta.savedAt;

  return (
    <section data-testid="settings">
      <h2>Settings · createEntityStore with deepMerge</h2>
      <Status prefix="settings" loaded={loaded} loading={loading} error={error} />

      {entity ? (
        <dl>
          <dt>theme</dt>
          <dd data-testid="settings-theme">{theme}</dd>
          <dt>language</dt>
          <dd data-testid="settings-language">{entity.ui.language}</dd>
          <dt>email</dt>
          <dd data-testid="settings-email">{String(entity.notifications.email)}</dd>
          <dt>push</dt>
          <dd data-testid="settings-push">{String(entity.notifications.push)}</dd>
          <dt>savedAt</dt>
          <dd data-testid="settings-saved-at">
            {savedAt instanceof Date ? `Date ${savedAt.toISOString()}` : `NOT A DATE: ${JSON.stringify(savedAt)}`}
          </dd>
          <dt>saves</dt>
          <dd data-testid="settings-saves">{entity.meta.saves}</dd>
          <dt>recent</dt>
          <dd data-testid="settings-recent">{entity.recent.join(', ')}</dd>
        </dl>
      ) : (
        <p data-testid="settings-empty">no settings</p>
      )}

      <div className="row">
        <button
          data-testid="settings-toggle-theme"
          onClick={() => update({ ui: { theme: theme === 'dark' ? 'light' : 'dark' } })}
        >
          Toggle theme
        </button>
        <button data-testid="settings-german" onClick={() => update({ ui: { language: 'de' } })}>
          Deutsch
        </button>
        <button
          data-testid="settings-toggle-push"
          onClick={() => update({ notifications: { push: !entity?.notifications.push } })}
        >
          Toggle push
        </button>
        <button
          data-testid="settings-save"
          onClick={() =>
            update({
              meta: { savedAt: new Date('2026-06-15T12:00:00.000Z'), saves: (entity?.meta.saves ?? 0) + 1 },
            })
          }
        >
          Save (sets nested Date)
        </button>
        <button data-testid="settings-replace-recent" onClick={() => update({ recent: ['settings'] })}>
          Replace recent (array)
        </button>
        <button data-testid="settings-clear" onClick={clear}>
          Clear
        </button>
        <button
          data-testid="settings-update-empty"
          onClick={() => update({ ui: { theme: 'dark' } })}
        >
          Update (works only when set)
        </button>
        <button
          data-testid="settings-reset"
          onClick={() =>
            set({
              ui: { theme: 'light', language: 'en' },
              notifications: { email: true, push: false },
              meta: { savedAt: new Date('2025-01-01T00:00:00.000Z'), saves: 0 },
              recent: ['home'],
            })
          }
        >
          Reset (set)
        </button>
      </div>
    </section>
  );
}
