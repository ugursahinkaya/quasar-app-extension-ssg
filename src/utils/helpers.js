'use strict';

const fs = require('fs');

function pushBootOnce(conf, entry) {
  conf.boot = conf.boot || [];
  const key = `${entry.path}|${entry.client === false ? 'client:false' : ''}|${entry.server === false ? 'server:false' : ''}`;
  const existing = new Set(conf.boot.map(b => `${b.path}|${b.client === false ? 'client:false' : ''}|${b.server === false ? 'server:false' : ''}`));
  if (!existing.has(key)) conf.boot.push(entry);
}

function safeDeleteFile(targetAbsPath, mustContain) {
  try {
    if (fs.existsSync(targetAbsPath)) {
      const content = fs.readFileSync(targetAbsPath, 'utf8');
      if (content.includes(mustContain)) {
        fs.rmSync(targetAbsPath, { force: true });
        return true;
      }
    }
  } catch {}
  return false;
}

module.exports = {
  pushBootOnce,
  safeDeleteFile
};
