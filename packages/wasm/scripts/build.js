const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const wasmPackDir = path.dirname(require.resolve('wasm-pack/package.json'));
const wasmPackBin = path.join(wasmPackDir, 'binary', 'wasm-pack.exe');

// Build env with self-contained MinGW tools for dlltool
const env = { ...process.env };

if (os.platform() === 'win32') {
  const home = process.env.USERPROFILE || process.env.HOME;
  const selfContained = path.join(
    home, '.rustup', 'toolchains', 'stable-x86_64-pc-windows-gnu',
    'lib', 'rustlib', 'x86_64-pc-windows-gnu', 'bin', 'self-contained'
  );
  env.PATH = `${selfContained};${env.PATH}`;
}

const cmd = os.platform() === 'win32'
  ? `"${wasmPackBin}" build --target nodejs --out-dir pkg`
  : 'wasm-pack build --target nodejs --out-dir pkg';

try {
  execSync(cmd, { stdio: 'inherit', cwd: __dirname + '/..', env });
} catch (e) {
  process.exit(1);
}
