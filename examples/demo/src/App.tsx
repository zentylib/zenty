import { Products } from './sections/Products';
import { Users } from './sections/Users';
import { Todos } from './sections/Todos';
import { Settings } from './sections/Settings';
import { Profile } from './sections/Profile';
import { useSettings } from './stores';

export function App() {
  const theme = useSettings((s) => s.entity?.ui.theme ?? 'light');
  return (
    <main data-theme={theme} data-testid="app">
      <h1>Zenty demo</h1>
      <p>Every zenty feature, wired to real React components.</p>
      <Products />
      <Users />
      <Todos />
      <Settings />
      <Profile />
    </main>
  );
}
