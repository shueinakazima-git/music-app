function withMockedDb(mockConn, controllerRelPath, fn, extraExports = {}) {
  const dbPath = require.resolve('../server/db');
  const ctrlPath = require.resolve(`../server/controllers/${controllerRelPath}`);

  const origDb = require.cache[dbPath];
  const origCtrl = require.cache[ctrlPath];

  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: Object.assign(
      { getConnection: async () => mockConn },
      extraExports
    )
  };

  delete require.cache[ctrlPath];
  const controller = require(`../server/controllers/${controllerRelPath}`);

  const run = async () => {
    try {
      await fn(controller);
    } finally {
      if (origDb) require.cache[dbPath] = origDb; else delete require.cache[dbPath];
      if (origCtrl) require.cache[ctrlPath] = origCtrl; else delete require.cache[ctrlPath];
    }
  };

  return run();
}

module.exports = {
  withMockedDb
};
