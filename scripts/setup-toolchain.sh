#!/bin/sh
# Install the pinned official Node distribution and pnpm inside this checkout.
set -eu
cd "$(dirname "$0")/.."
node_version=$(cat .node-version)
case "$node_version" in
  24.[0-9]*.[0-9]*) ;;
  *) echo 'Expected an exact Node 24 version in .node-version' >&2; exit 1 ;;
esac
case "$(uname -s)" in
  Darwin) platform=darwin ;;
  Linux) platform=linux ;;
  *) echo 'Use the official Node installer on this platform.' >&2; exit 1 ;;
esac
case "$(uname -m)" in
  arm64|aarch64) arch=arm64 ;;
  x86_64) arch=x64 ;;
  *) echo 'Unsupported CPU architecture' >&2; exit 1 ;;
esac
archive="node-v${node_version}-${platform}-${arch}.tar.gz"
mkdir -p .tools/downloads .tools/node
curl --fail --silent --show-error --location "https://nodejs.org/dist/v${node_version}/${archive}" -o ".tools/downloads/$archive"
curl --fail --silent --show-error --location "https://nodejs.org/dist/v${node_version}/SHASUMS256.txt" -o .tools/downloads/SHASUMS256.txt
(
  cd .tools/downloads
  awk -v name="$archive" '$2 == name {print}' SHASUMS256.txt > selected.sha256
  test -s selected.sha256
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum --check selected.sha256
  else
    shasum -a 256 --check selected.sha256
  fi
)
tar -xzf ".tools/downloads/$archive" -C .tools/node --strip-components=1
export PATH="$PWD/.tools/node/bin:$PATH"
pnpm_spec=$(node --input-type=module -e "import fs from 'node:fs'; console.log(JSON.parse(fs.readFileSync('package.json')).packageManager)")
npm_config_cache="$PWD/.tools/npm-cache" npm install --prefix .tools/pnpm "$pnpm_spec"
printf '\nUse this toolchain in the current shell:\nexport PATH="%s/.tools/node/bin:%s/.tools/pnpm/node_modules/.bin:$PATH"\n' "$PWD" "$PWD"
