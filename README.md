# @ugursahinkaya/quasar-app-extension-ssg (refined)

Quasar App Extension that integrates **@ugursahinkaya/ssg** into a Quasar app while keeping your project minimal.

## What this AE does

- Adds boot files **by reference** to your package
- Adds SSR render middleware **by reference**
- Generates `src-ssr/server.ts` **once** (passthrough to `@ugursahinkaya/ssg/server`)
- Creates `src/layouts/DynamicLayout.vue` from template
- Overrides only the **home (`'/'`) route's component** to use `DynamicLayout.vue` (or injects it if missing)
- Provides `quasar ssg:write-server` to re-generate the SSR bridge
- Implements **onUninstall** to remove generated files safely (only if they match the template signature)

## Install (dev)

```bash
pnpm i
# publish or pack, then in your Quasar project:
# pnpm add <tarball | npm package>
# quasar ext add @ugursahinkaya/ssg
```

## Uninstall

```bash
quasar ext remove @ugursahinkaya/ssg
# AE will try to remove:
# - src-ssr/server.ts (only if it imports @ugursahinkaya/ssg/server)
# - src/layouts/DynamicLayout.vue (only if it imports our LayoutComponent)
# Router changes are left intact to avoid breaking your app.
```
