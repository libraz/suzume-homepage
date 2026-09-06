module.exports = {
  // Vitest 5 requires an explicit Vite >=6.4 peer dependency. This project
  // currently gets Vite 5 from VitePress 1; Vitest 5 fails at startup with
  // ERR_PACKAGE_PATH_NOT_EXPORTED for vite/module-runner. Revisit when adding
  // a compatible Vite dependency or upgrading VitePress.
  reject: ['vitest'],
};
