/* Quasar App Extension install script */
'use strict';

const fs = require('fs');
const path = require('path');
const { findRouterFile, overrideHomeRouteComponent, addHomeRouteIfMissing } = require('./utils/router');

module.exports = function (api) {
  const appRoot = api.appDir || process.cwd();

  try {
    const serverTs = path.join(appRoot, 'src-ssr', 'server.ts');
    const serverJs = path.join(appRoot, 'src-ssr', 'server.js');
    if (!fs.existsSync(serverTs) && !fs.existsSync(serverJs)) {
      api.renderFile('./src/templates/server.ts.ejs', 'src-ssr/server.ts');
      api.onExitLog('Created src-ssr/server.ts');
    }
  } catch (e) {
    api.onExitLog(`Skipping server.ts generation: ${e?.message || e}`);
  }

  try {
    const target = path.join(appRoot, 'src', 'layouts', 'DynamicLayout.vue');
    if (!fs.existsSync(target)) {
      api.renderFile('./src/templates/DynamicLayout.vue.ejs', 'src/layouts/DynamicLayout.vue');
      api.onExitLog('Created src/layouts/DynamicLayout.vue');
    }
  } catch (e) {
    api.onExitLog(`Skipping DynamicLayout.vue generation: ${e?.message || e}`);
  }

  try {
    const routerFile = findRouterFile(appRoot);
    if (!routerFile) {
      api.onExitLog('Router file not found; skipped route override.');
    } else {
      let code = fs.readFileSync(routerFile, 'utf8');
      const res1 = overrideHomeRouteComponent(code);
      if (res1.changed) {
        fs.writeFileSync(routerFile, res1.code, 'utf8');
        api.onExitLog('Overridden "/" route to use DynamicLayout.vue');
      } else if (res1.reason === 'no-home-route') {
        const res2 = addHomeRouteIfMissing(code);
        if (res2.changed) {
          fs.writeFileSync(routerFile, res2.code, 'utf8');
          api.onExitLog('Added "/" route using DynamicLayout.vue');
        } else {
          api.onExitLog(`Router unchanged (${res1.reason} | ${res2.reason}).`);
        }
      } else {
        api.onExitLog(`Router unchanged (${res1.reason}).`);
      }
    }
  } catch (e) {
    api.onExitLog(`Router override error: ${e?.message || e}`);
  }
};
