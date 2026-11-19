// Builds zenty and packs it into .lib/zenty.tgz so the demo installs exactly
// what would be published to npm (not a symlink to the source).
import { execSync } from 'node:child_process';
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const demo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(demo, '../..');
const out = join(demo, '.lib');

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
execSync('npm run build', { cwd: root, stdio: 'inherit' });
execSync(`npm pack --pack-destination "${out}"`, { cwd: root, stdio: 'inherit' });
const tgz = readdirSync(out).find((f) => f.endsWith('.tgz'));
renameSync(join(out, tgz), join(out, 'zenty.tgz'));
console.log(`packed ${tgz} -> .lib/zenty.tgz`);

// The version number does not change between local builds, so npm would keep the
// copy recorded in package-lock.json. Reinstall to pick up the fresh tarball.
rmSync(join(demo, 'node_modules', 'zenty'), { recursive: true, force: true });
execSync('npm install --no-audit --no-fund zenty@file:.lib/zenty.tgz', { cwd: demo, stdio: 'inherit' });
