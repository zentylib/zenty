type Props = {
  prefix: string;
  loaded: boolean;
  loading: boolean;
  error: string | null;
  onClearError?: () => void;
};

/** Shows a store's loaded / loading / error flags with stable test ids. */
export function Status({ prefix, loaded, loading, error, onClearError }: Props) {
  return (
    <div className="status">
      <span data-testid={`${prefix}-loaded`}>loaded: {String(loaded)}</span>
      <span data-testid={`${prefix}-loading`}>loading: {String(loading)}</span>
      <span data-testid={`${prefix}-error`} className={error ? 'error' : ''}>
        error: {error ?? 'none'}
      </span>
      {error && onClearError && (
        <button data-testid={`${prefix}-clear-error`} onClick={onClearError}>
          Dismiss error
        </button>
      )}
    </div>
  );
}
