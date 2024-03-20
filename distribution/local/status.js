const id = require('../util/id');
const serialization = require('../util/serialization');
const wire = require('../util/wire');
const {spawn} = require('node:child_process');
const path = require('node:path');

const status = {};

global.moreStatus = {
  sid: id.getSID(global.nodeConfig),
  nid: id.getNID(global.nodeConfig),
  counts: 0,
};

status.get = function(configuration, callback) {
  callback = callback || function() { };


  if (configuration in global.nodeConfig) {
    callback(null, global.nodeConfig[configuration]);
  } else if (configuration in moreStatus) {
    callback(null, moreStatus[configuration]);
  } else if (configuration === 'heapTotal') {
    callback(null, process.memoryUsage().heapTotal);
  } else if (configuration === 'heapUsed') {
    callback(null, process.memoryUsage().heapUsed);
  } else {
    callback(new Error('Status key not found'));
  }
};

status.stop = function(callback) {
  callback = callback || function() { };
  console.log('trying to stop a node');
  try {
    global.distribution.server.close(() => {
      console.log('Node server has been stopped.');
      // global.distribution.allNodesConfig.remove(global.nodeConfig)
      callback(null, 'Node stopped successfully');
    });

    setTimeout(() => {
      console.log('Forcefully shutting down the node server.');
      callback('Node stopped forcefully', null);
      process.exit(1);
    }, 1);
  } catch (err) {
    console.log('Error stopping the node', err);
    callback(err, null);
  }
};

status.spawn = function(conf, callback) {
  if (conf.onStart) {
    funcStr = `
      let onStart = ${conf.onStart.toString()};
      let callbackRPC = ${wire.createRPC(wire.toAsync(callback)).toString()};
      onStart();
      callbackRPC(null, global.nodeConfig, () => {});
      `;
  } else {
    conf.onStart = wire.createRPC(wire.toAsync(callback));
  }

  // Serialize configuration and include RPC
  const serializedConf = serialization.serialize(conf);

  // Fork a new process for the distribution.js file, passing the serialized
  // configuration
  const child = spawn('node', [path.join(__dirname, '../../distribution.js'),
    '--config', serializedConf]);
  // listen to the child
  child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
};

module.exports = status;
