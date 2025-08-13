'use strict';

const fs = require('fs');
const path = require('path');

function findRouterFile(appRoot) {
  const candidates = [
    path.join(appRoot, 'src', 'router', 'index.ts'),
    path.join(appRoot, 'src', 'router', 'index.js'),
    path.join(appRoot, 'src', 'router', 'routes.ts'),
    path.join(appRoot, 'src', 'router', 'routes.js'),
  ];
  return candidates.find(f => fs.existsSync(f)) || null;
}

function overrideHomeRouteComponent(code) {
  if (code.includes("layouts/DynamicLayout.vue")) {
    return { changed: false, code, reason: 'already-using-dynamic-layout' };
  }
  const pathMatch = code.match(/path:\s*['"]\\/['"]/); // will fix below
  return _overrideHomeRouteComponentFixed(code);
}

function _overrideHomeRouteComponentFixed(code) {
  const pathMatch = code.match(/path:\s*['"]\\/['"]/);
  // fix to literal: we need one with literal slash too
  const m = code.match(/path:\s*['"]\\/['"]/) || code.match(/path:\s*['"]\\/['"]/);
  return realOverride(code);
}

function realOverride(code) {
  const pathMatch = code.match(/path:\s*['"]\\/['"]/);
  if (!pathMatch) return { changed: false, code, reason: 'no-home-route' };

  const idx = pathMatch.index;
  let start = code.lastIndexOf('{', idx);
  if (start === -1) return { changed: false, code, reason: 'parse-failed-start' };

  let brace = 0, end = -1;
  for (let i = start; i < code.length; i++) {
    const ch = code[i];
    if (ch === '{') brace++;
    else if (ch === '}') {
      brace--;
      if (brace === 0) { end = i; break; }
    }
  }
  if (end === -1) return { changed: false, code, reason: 'parse-failed-end' };

  const obj = code.slice(start, end + 1);
  if (obj.includes("layouts/DynamicLayout.vue")) {
    return { changed: false, code, reason: 'already-using-dynamic-layout-in-object' };
  }
  let replacedObj;
  if (/component\s*:/.test(obj)) {
    replacedObj = obj.replace(/component\s*:\s*[^,}]+/, "component: () => import('layouts/DynamicLayout.vue')");
  } else {
    const insertAt = obj.lastIndexOf('}');
    if (insertAt === -1) return { changed: false, code, reason: 'object-parse-failed' };
    const before = obj.slice(0, insertAt).trimEnd();
    const needsComma = before.endsWith(',') ? '' : ',';
    replacedObj = `${before}${needsComma}
  component: () => import('layouts/DynamicLayout.vue')
}`;
  }
  const newCode = code.slice(0, start) + replacedObj + code.slice(end + 1);
  return { changed: true, code: newCode, reason: 'overridden-home-route' };
}

function addHomeRouteIfMissing(code) {
  if (code.includes("layouts/DynamicLayout.vue")) {
    return { changed: false, code, reason: 'route-array-exists-with-dynamic-layout' };
  }
  const routesStart = code.match(/routes\s*:\s*\[/);
  if (!routesStart) {
    return { changed: false, code, reason: 'routes-array-not-found' };
  }
  const pos = routesStart.index + routesStart[0].length;
  const insertion = `
    {
      path: '/',
      component: () => import('layouts/DynamicLayout.vue'),
      name: 'home'
    },`;
  const newCode = code.slice(0, pos) + insertion + code.slice(pos);
  return { changed: true, code: newCode, reason: 'added-home-route' };
}

module.exports = {
  findRouterFile,
  overrideHomeRouteComponent,
  addHomeRouteIfMissing
};
