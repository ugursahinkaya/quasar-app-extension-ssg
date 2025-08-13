/* Quasar App Extension entry */
module.exports = function (api) {
  // compatibility
  api.compatibleWith('quasar', '^2.0.0')
  try {
    api.compatibleWith('@quasar/app-vite', '^1.0.0 || ^2.0.0')
  } catch {}

  // extend quasar.conf
  api.extendQuasarConf((conf) => {
    // Ensure arrays exist
    conf.boot = conf.boot || []
    conf.ssr = conf.ssr || {}
    conf.ssr.middlewares = conf.ssr.middlewares || []
    conf.framework = conf.framework || {}

    // Add our boot files by reference to your package
    const bootEntries = [
      { path: '~@ugursahinkaya/ssg/boot-server', client: false },
      { path: '~@ugursahinkaya/ssg/boot-client', server: false }
    ]

    // merge without duplicates
    const asKey = (b) => `${b.path}|${b.client===false?'client:false':''}|${b.server===false?'server:false':''}`
    const existing = new Set((conf.boot || []).map(asKey))
    for (const b of bootEntries) {
      if (!existing.has(asKey(b))) conf.boot.push(b)
    }

    // SSR middleware (reference the package directly)
    if (!conf.ssr.middlewares.includes('~@ugursahinkaya/ssg/render-middleware')) {
      conf.ssr.middlewares.push('~@ugursahinkaya/ssg/render-middleware')
    }

    // Framework: ensure Meta plugin
    const plugins = new Set(conf.framework.plugins || [])
    plugins.add('Meta')
    conf.framework.plugins = Array.from(plugins)

    // Optional: default language 'tr' if not set
    conf.framework.lang = conf.framework.lang || 'tr'

    // Example: dev server host/allowedHosts (optional)
    conf.build = conf.build || {}
    const prevExtend = conf.build.extendViteConf
    conf.build.extendViteConf = function (viteConf, ctx) {
      viteConf.server = viteConf.server || {}
      if (viteConf.server.host == null) viteConf.server.host = true
      viteConf.server.allowedHosts = Array.from(new Set([...(viteConf.server.allowedHosts || []), 'ssr.bartin.edu.tr']))
      if (typeof prevExtend === 'function') return prevExtend(viteConf, ctx)
    }
  })

  // On install: write src-ssr/server.ts if missing
  api.onInstall(() => {
    const fs = require('fs')
    const path = require('path')
    const appRoot = api.resolve.app()
    const serverTs = path.join(appRoot, 'src-ssr', 'server.ts')
    const serverJs = path.join(appRoot, 'src-ssr', 'server.js')

    const hasServerEntry = fs.existsSync(serverTs) || fs.existsSync(serverJs)
    if (!hasServerEntry) {
      api.render('./src/templates/server.ts.ejs', {}, { force: true, path: 'src-ssr/server.ts' })
      api.log('Created src-ssr/server.ts passthrough to @ugursahinkaya/ssg/server')
    }
  })

  // Command to force re-generate server.ts
  api.registerCommand('ssg:write-server', () => {
    api.render('./src/templates/server.ts.ejs', {}, { force: true, path: 'src-ssr/server.ts' })
    api.log('Rewrote src-ssr/server.ts from template.')
  })
}