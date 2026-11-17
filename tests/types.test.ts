import { createEntityStore } from '../src';

describe('type tests', () => {
  it('deepMerge accepts nested partials while flat store rejects them', () => {
    type Settings = {
      theme: 'light' | 'dark';
      notifications: { email: boolean; push: boolean };
    };

    const deep = createEntityStore<Settings>({ deepMerge: true });
    deep.getState().update({ notifications: { push: true } }); // compiles

    const flat = createEntityStore<Settings>();
    // @ts-expect-error without deepMerge, nested partials must stay an error
    flat.getState().update({ notifications: { push: true } });

    expect(true).toBe(true);
  });
});
