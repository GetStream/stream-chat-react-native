#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TARGET_VERSION_RANGE = {
  maxExclusive: '5.2.7',
  minInclusive: '5.1.8',
};

const FILE_PATCHES = {
  'src/hooks/useBoundingClientRect.ts': {
    from: `    // @ts-ignore 👉 https://github.com/facebook/react/commit/53b1f69ba
    if (ref.current.unstable_getBoundingClientRect !== null) {
      // @ts-ignore https://github.com/facebook/react/commit/53b1f69ba
      const layout = ref.current.unstable_getBoundingClientRect();
      handler(layout);
      return;
    }

    // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable 🤞.
    if (ref.current.getBoundingClientRect !== null) {
      // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable.
      const layout = ref.current.getBoundingClientRect();
      handler(layout);
    }`,
    to: `    if (
      // @ts-ignore 👉 https://github.com/facebook/react/commit/53b1f69ba
      ref.current.unstable_getBoundingClientRect !== null &&
      // @ts-ignore 👉 https://github.com/facebook/react/commit/53b1f69ba
      typeof ref.current.unstable_getBoundingClientRect === 'function'
    ) {
      // @ts-ignore https://github.com/facebook/react/commit/53b1f69ba
      const layout = ref.current.unstable_getBoundingClientRect();
      handler(layout);
      return;
    }

    if (
      // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable.
      ref.current.getBoundingClientRect !== null &&
      // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable.
      typeof ref.current.getBoundingClientRect === 'function'
    ) {
      // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable.
      const layout = ref.current.getBoundingClientRect();
      handler(layout);
    }`,
  },
  'lib/module/hooks/useBoundingClientRect.js': {
    from: `    // @ts-ignore 👉 https://github.com/facebook/react/commit/53b1f69ba
    if (ref.current.unstable_getBoundingClientRect !== null) {
      // @ts-ignore https://github.com/facebook/react/commit/53b1f69ba
      const layout = ref.current.unstable_getBoundingClientRect();
      handler(layout);
      return;
    }

    // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable 🤞.
    if (ref.current.getBoundingClientRect !== null) {
      // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable.
      const layout = ref.current.getBoundingClientRect();
      handler(layout);
    }`,
    to: `    if (
    // @ts-ignore 👉 https://github.com/facebook/react/commit/53b1f69ba
    ref.current.unstable_getBoundingClientRect !== null &&
    // @ts-ignore 👉 https://github.com/facebook/react/commit/53b1f69ba
    typeof ref.current.unstable_getBoundingClientRect === 'function') {
      // @ts-ignore https://github.com/facebook/react/commit/53b1f69ba
      const layout = ref.current.unstable_getBoundingClientRect();
      handler(layout);
      return;
    }

    if (
    // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable 🤞.
    ref.current.getBoundingClientRect !== null &&
    // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable.
    typeof ref.current.getBoundingClientRect === 'function') {
      // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable.
      const layout = ref.current.getBoundingClientRect();
      handler(layout);
    }`,
  },
  'lib/commonjs/hooks/useBoundingClientRect.js': {
    from: `    // @ts-ignore 👉 https://github.com/facebook/react/commit/53b1f69ba
    if (ref.current.unstable_getBoundingClientRect !== null) {
      // @ts-ignore https://github.com/facebook/react/commit/53b1f69ba
      const layout = ref.current.unstable_getBoundingClientRect();
      handler(layout);
      return;
    }

    // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable 🤞.
    if (ref.current.getBoundingClientRect !== null) {
      // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable.
      const layout = ref.current.getBoundingClientRect();
      handler(layout);
    }`,
    to: `    if (
    // @ts-ignore 👉 https://github.com/facebook/react/commit/53b1f69ba
    ref.current.unstable_getBoundingClientRect !== null &&
    // @ts-ignore 👉 https://github.com/facebook/react/commit/53b1f69ba
    typeof ref.current.unstable_getBoundingClientRect === 'function') {
      // @ts-ignore https://github.com/facebook/react/commit/53b1f69ba
      var layout = ref.current.unstable_getBoundingClientRect();
      handler(layout);
      return;
    }

    if (
    // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable 🤞.
    ref.current.getBoundingClientRect !== null &&
    // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable.
    typeof ref.current.getBoundingClientRect === 'function') {
      // @ts-ignore once it \`unstable_getBoundingClientRect\` gets stable.
      var _layout = ref.current.getBoundingClientRect();
      handler(_layout);
    }`,
  },
};

function resolveBottomSheetPackageDirectory() {
  try {
    return path.dirname(require.resolve('@gorhom/bottom-sheet/package.json'));
  } catch {
    return undefined;
  }
}

function readInstalledVersion(bottomSheetPackageDirectory) {
  const packageJsonPath = path.join(bottomSheetPackageDirectory, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  return packageJson.version;
}

function parseVersion(version) {
  const [major = '0', minor = '0', patchWithSuffix = '0'] = version.split('.');
  const patch = patchWithSuffix.split('-')[0];

  return [major, minor, patch].map((part) => Number.parseInt(part, 10));
}

function compareVersions(left, right) {
  const leftParts = parseVersion(left);
  const rightParts = parseVersion(right);

  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] > rightParts[index]) {
      return 1;
    }

    if (leftParts[index] < rightParts[index]) {
      return -1;
    }
  }

  return 0;
}

function shouldPatchVersion(version) {
  return (
    compareVersions(version, TARGET_VERSION_RANGE.minInclusive) >= 0 &&
    compareVersions(version, TARGET_VERSION_RANGE.maxExclusive) < 0
  );
}

function patchFile(relativeFilePath, originalContents) {
  const patch = FILE_PATCHES[relativeFilePath];

  if (!patch) {
    return {
      changed: false,
      contents: originalContents,
    };
  }

  const nextContents = originalContents.replace(patch.from, patch.to);

  return {
    changed: nextContents !== originalContents,
    contents: nextContents,
  };
}

function patchBottomSheet(bottomSheetPackageDirectory) {
  const installedVersion = readInstalledVersion(bottomSheetPackageDirectory);

  if (!shouldPatchVersion(installedVersion)) {
    return { changedFilesCount: 0, installedVersion, skipped: true };
  }

  let changedFilesCount = 0;

  for (const relativeFilePath of Object.keys(FILE_PATCHES)) {
    const absoluteFilePath = path.join(bottomSheetPackageDirectory, relativeFilePath);

    if (!fs.existsSync(absoluteFilePath)) {
      continue;
    }

    const originalContents = fs.readFileSync(absoluteFilePath, 'utf8');
    const { changed, contents } = patchFile(relativeFilePath, originalContents);

    if (!changed) {
      continue;
    }

    fs.writeFileSync(absoluteFilePath, contents);
    changedFilesCount += 1;
  }

  return { changedFilesCount, installedVersion, skipped: false };
}

function run() {
  const bottomSheetPackageDirectory = resolveBottomSheetPackageDirectory();

  if (!bottomSheetPackageDirectory) {
    return;
  }

  const result = patchBottomSheet(bottomSheetPackageDirectory);

  if (result.skipped || result.changedFilesCount === 0) {
    return;
  }

  console.log(
    `[stream-chat-react-native-core] Applied gorhom/react-native-bottom-sheet PR #2561 patch to @gorhom/bottom-sheet@${result.installedVersion}.`,
  );
}

if (require.main === module) {
  run();
}

module.exports = {
  FILE_PATCHES,
  patchFile,
  run,
  shouldPatchVersion,
  TARGET_VERSION_RANGE,
};
