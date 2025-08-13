/* Quasar App Extension entry (refined, modular) */
'use strict';

const fs = require('fs');
const path = require('path');
const { pushBootOnce, writeFromTemplate, safeDeleteFile } = require('./utils/helpers');
const { findRouterFile, overrideHomeRouteComponent, addHomeRouteIfMissing } = require('./utils/router');

module.exports = function (api) {
  // Compatibility
  api.compatibleWith('quasar', '^2.18.2');
  try {
    api.compatibleWith('@quasar/app-vite', '^2.3.0');
  } catch { }

  // Extend Quasar conf
  api.extendQuasarConf((conf) => {
    conf.boot = conf.boot || [];
    conf.ssr = conf.ssr || {};
    conf.ssr.middlewares = conf.ssr.middlewares || [];
    conf.framework = conf.framework || {};

    // Boot entries
    pushBootOnce(conf, { path: '~@ugursahinkaya/ssg/boot-server', client: false });
    pushBootOnce(conf, { path: '~@ugursahinkaya/ssg/boot-client', server: false });

    // SSR middleware
    if (!conf.ssr.middlewares.includes('~@ugursahinkaya/ssg/render-middleware')) {
      conf.ssr.middlewares.push('~@ugursahinkaya/ssg/render-middleware');
    }

    // Quasar Meta plugin
    const plugins = new Set(conf.framework.plugins || []);
    plugins.add('Meta');
    conf.framework.plugins = Array.from(plugins);
  });

  // Install-time filesystem ops
  api.onInstall(() => {
    const appRoot = api.resolve.app();

    // 1) SSR bridge
    try {
      const serverTs = path.join(appRoot, 'src-ssr', 'server.ts');
      const serverJs = path.join(appRoot, 'src-ssr', 'server.js');
      if (!fs.existsSync(serverTs) && !fs.existsSync(serverJs)) {
        writeFromTemplate(api, './src/templates/server.ts.ejs', 'src-ssr/server.ts', { force: true });
        api.log('Created src-ssr/server.ts passthrough to @ugursahinkaya/ssg/server');
      }
    } catch (e) {
      api.warn(`Skipping server.ts generation: ${e?.message || e}`);
    }

    // 2) DynamicLayout.vue
    try {
      const target = path.join(appRoot, 'src', 'layouts', 'DynamicLayout.vue');
      if (!fs.existsSync(target)) {
        writeFromTemplate(api, './src/templates/DynamicLayout.vue.ejs', 'src/layouts/DynamicLayout.vue', { force: true });
        api.log('Created layouts/DynamicLayout.vue from template');
      }
    } catch (e) {
      api.warn(`Skipping DynamicLayout.vue generation: ${e?.message || e}`);
    }

    // 3) Router override (home route)
    try {
      const routerFile = findRouterFile(appRoot);
      if (!routerFile) {
        api.warn('Router file not found (index.ts/js or routes.ts/js). Skipping route override.');
      } else {
        let code = fs.readFileSync(routerFile, 'utf8');
        const res1 = overrideHomeRouteComponent(code);
        if (res1.changed) {
          fs.writeFileSync(routerFile, res1.code, 'utf8');
          api.log('Overridden existing "/" route to use DynamicLayout.vue');
        } else if (res1.reason === 'no-home-route') {
          const res2 = addHomeRouteIfMissing(code);
          if (res2.changed) {
            fs.writeFileSync(routerFile, res2.code, 'utf8');
            api.log('Added new "/" route using DynamicLayout.vue');
          } else {
            api.log(`Router unchanged (${res1.reason} | ${res2.reason}).`);
          }
        } else {
          api.log(`Router unchanged (${res1.reason}).`);
        }
      }
    } catch (e) {
      api.warn(`Router override skipped due to error: ${e?.message || e}`);
    }
  });

  // Uninstall-time cleanup
  api.onUninstall(() => {
    const appRoot = api.resolve.app();

    // Remove our generated SSR bridge if it matches signature
    const serverTs = path.join(appRoot, 'src-ssr', 'server.ts');
    const removedServer = safeDeleteFile(serverTs, "@ugursahinkaya/ssg/server");
    if (removedServer) api.log('Removed src-ssr/server.ts created by this extension');

    // Remove our DynamicLayout if it matches signature
    const dynLayout = path.join(appRoot, 'src', 'layouts', 'DynamicLayout.vue');
    const removedLayout = safeDeleteFile(dynLayout, "@ugursahinkaya/ssg/layout-component");
    if (removedLayout) api.log('Removed layouts/DynamicLayout.vue created by this extension');

    // Router: we do not revert edits automatically to avoid breaking user code.
    api.log('onUninstall finished. Router changes were left intact on purpose.');
  });

  // Commands
  api.registerCommand('ssg:write-server', () => {
    try {
      writeFromTemplate(api, './src/templates/server.ts.ejs', 'src-ssr/server.ts', { force: true });
      api.log('Rewrote src-ssr/server.ts from template.');
    } catch (e) {
      api.warn(`Failed to rewrite server.ts: ${e?.message || e}`);
    }
  });
};