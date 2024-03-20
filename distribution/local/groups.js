const util = require('../util/util');

// In-memory store for groups
const groups = {};

// Retrieves a set of nodes corresponding to a name
function get(name, callback) {
  const group = groups[name];
  if (group) {
    process.nextTick(() => {
      if (typeof callback === 'function') {
        callback(null, group);
      } else {
        console.error('Error: callback is not a function.');
      }
    });
  } else {
    process.nextTick(() => {
      callback(new Error('Group not found'), null);
    });
  }
}

function put(name, nodes, callback) {
  groups[name] = nodes;

  // After updating the group, instantiate all services for this group.
  instantiateServicesForGroup(name);

  process.nextTick(() => {
    // Ensure callback is a function before calling
    if (typeof callback === 'function') {
      callback(null, nodes);
    } else {
      console.error('Error: callback is not a function.');
    }
  });
}

function instantiateServicesForGroup(groupName) {
  if (!global.distribution[groupName]) {
    global.distribution[groupName] = {};
  }

  global.distribution[groupName].status =
        require('../all/status.js')({gid: groupName});
  // distribution[groupName].routes =
  // require('../all/routes.js')({ gid: groupName });
  global.distribution[groupName].comm =
        require('../all/comm.js')({gid: groupName});
  global.distribution[groupName].groups =
        require('../all/groups.js')({gid: groupName});
  // distribution[groupName].gossip =
  // require('../all/gossip.js')({ gid: groupName });
}

// Adds a node to an existing group
function add(name, node, callback) {
  if (!groups[name]) {
    groups[name] = {};
  }
  const sid = util.id.getSID(node);
  groups[name][sid] = node;

  if (typeof callback === 'function') {
    callback(null, groups[name]);
  } else {
    console.error('Error: callback is not a function.');
  }
}

// Removes a node from a group
function rem(name, sid, callback) {
  if (groups[name] && groups[name][sid]) {
    delete groups[name][sid];

    if (typeof callback === 'function') {
      callback(null, groups[name]);
    } else {
      console.error('Error: callback is not a function.');
    }
  } else {
    callback(new Error('Group or SID not found'), null);
  }
}

// Deletes a group
function del(name, callback) {
  if (groups[name]) {
    const deletedGroup = groups[name];
    delete groups[name];
    if (typeof callback === 'function') {
      callback(null, deletedGroup);
    } else {
      console.error('Error: callback is not a function.');
    }
  } else {
    callback(new Error('Group not found'), null);
  }
}


module.exports = {
  get,
  put,
  add,
  rem,
  del,
};
