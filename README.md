# @ugursahinkaya/quasar-app-extension-ssg

Quasar App Extension that integrates **@ugursahinkaya/ssg** into a Quasar app:
- Adds boot files (client/server) **by reference** to your package
- Adds SSR render middleware **by reference**
- Optionally generates `src-ssr/server.ts` passthrough file on install

> This keeps the main Quasar project minimal and delegates SSR + meta + layout guts to `@ugursahinkaya/ssg`.

## Install (local dev)

```bash
# inside this repo
npm i
npm link

# in your Quasar project
npm link @ugursahinkaya/quasar-app-extension-ssg
quasar ext add @ugursahinkaya/quasar-app-extension-ssg
```

Alternatively, install from a local path:
```bash
quasar ext add file:/absolute/path/to/quasar-app-extension-ssg
```

## What it does

- Extends `quasar.config.*`:
  - `boot`: adds
    - `~@ugursahinkaya/ssg/boot-server` (client: false)
    - `~@ugursahinkaya/ssg/boot-client` (server: false)
  - `ssr.middlewares`: adds
    - `~@ugursahinkaya/ssg/render-middleware`
  - Ensures `framework.plugins` includes `"Meta"`
  - (Optional) sets `framework.lang = 'tr'` if missing
  - (Optional) sets `viteConf.server.host = true` and `allowedHosts = ['ssr.bartin.edu.tr']`

- Writes `src-ssr/server.ts` on install if missing, with a tiny passthrough to `@ugursahinkaya/ssg/server`.

## Commands

```bash
# force re-generate src-ssr/server.ts from template
quasar ssg:write-server
```

## Uninstall

```bash
quasar ext remove @ugursahinkaya/quasar-app-extension-ssg
```

## Notes

- Quasar CLI requires an actual `src-ssr/server.(js|ts)` entry file; we generate a one-liner bridge.
- Boot files & middleware are referenced directly from `@ugursahinkaya/ssg`, so there’s no duplication here.