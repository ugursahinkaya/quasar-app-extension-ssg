/* Quasar App Extension uninstall script */
'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function (api) {
  const appRoot = api.appDir || process.cwd();

  try {
    const serverTs = path.join(appRoot, 'src-ssr', 'server.ts');
    if (fs.existsSync(serverTs)) {
      const s = fs.readFileSync(serverTs, 'utf8');
      if (s.includes("@ugursahinkaya/ssg/server")) {
        fs.rmSync(serverTs, { force: true });
        api.onExitLog('Removed src-ssr/server.ts');
      }
    }
  } catch (e) {
    api.onExitLog(`Could not remove src-ssr/server.ts: ${e?.message || e}`);
  }

  try {
    const dyn = path.join(appRoot, 'src', 'layouts', 'DynamicLayout.vue');
    if (fs.existsSync(dyn)) {
      const s = fs.readFileSync(dyn, 'utf8');
      if (s.includes("@ugursahinkaya/ssg/layout-component")) {
        fs.rmSync(dyn, { force: true });
        api.onExitLog('Removed src/layouts/DynamicLayout.vue');
      }
    }
  } catch (e) {
    api.onExitLog(`Could not remove DynamicLayout.vue: ${e?.message || e}`);
  }

  api.onExitLog('Uninstall finished. Router changes left intact.');
};
