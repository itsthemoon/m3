const {groups: localGroups} = global.distribution.local;

function groupsTemplate(gid) {
  return {
    get: function(name) {
      const group = localGroups[name];
      if (!group) {
        console.log('the name bro ', name);
        return callback(new Error('Group not found'), null);
      }

      const results = {};
      const nodes = Object.values(group);
      let completedRequests = 0;

      nodes.forEach((node) => {
        const remote = {
          node: node, service: 'groups', method: 'get',
          params: {name: name},
        };
        global.distribution.local.comm.send([], remote, (err, nodeGroup) => {
          completedRequests++;
          if (!err) {
            results[node.sid] = nodeGroup;
          } else {
            // Handle error, maybe log it or add to results as an error message
            results[node.sid] = {error: err.message};
          }

          if (completedRequests === nodes.length) {
            // All requests are completed, return the aggregated results
            callback(null, results);
          }
        });
      });
    },

    put: function(name, nodes, callback) {
      // Directly call localGroups.put with all nodes at once
      localGroups.put(name, nodes, (err) => {
        if (err) {
          console.error('Error in local put operation:', err);
          callback(err, null); // Pass the error to the callback
        } else {
          // Create a results object indicating success for all nodes
          const results = Object.keys(nodes).reduce((acc, key) => {
            acc[key] = {success: true};
            return acc;
          }, {});

          callback(null, results); // Callback with success results
        }
      });
    },

    add: function(name, node, callback) {
      localGroups.add(name, node, (err) => {
        if (err) return callback(err, null);

        const group = localGroups[name];
        const results = {};
        const nodesArray = Object.values(group);
        let completedRequests = 0;

        nodesArray.forEach((node) => {
          const remote = {
            node: node, service: 'groups', method: 'add',
            params: {name: name, node: node},
          };
          global.distribution.local.comm.send([], remote, (err) => {
            completedRequests++;
            if (!err) {
              results[node.sid] = {success: true};
            } else {
              results[node.sid] = {error: err.message};
            }

            if (completedRequests === nodesArray.length) {
              callback(null, results);
            }
          });
        });
      });
    },

    rem: function(name, sid, callback) {
      localGroups.rem(name, sid, (err) => {
        if (err) return callback(err, null);

        const group = localGroups[name];
        const results = {};
        const nodesArray = Object.values(group);
        let completedRequests = 0;

        nodesArray.forEach((node) => {
          const remote = {
            node: node, service: 'groups', method: 'rem',
            params: {name: name, sid: sid},
          };
          global.distribution.local.comm.send([], remote, (err) => {
            completedRequests++;
            if (!err) {
              results[node.sid] = {success: true};
            } else {
              results[node.sid] = {error: err.message};
            }

            if (completedRequests === nodesArray.length) {
              callback(null, results);
            }
          });
        });
      });
    },

    del: function(name, callback) {
      const group = localGroups[name];
      if (!group) return callback(new Error('Group not found'), null);

      localGroups.del(name, (err) => {
        if (err) return callback(err, null);

        const results = {};
        const nodesArray = Object.values(group);
        let completedRequests = 0;

        nodesArray.forEach((node) => {
          const remote = {
            node: node, service: 'groups', method: 'del',
            params: {name: name},
          };
          global.distribution.local.comm.send([], remote, (err) => {
            completedRequests++;
            if (!err) {
              results[node.sid] = {success: true};
            } else {
              results[node.sid] = {error: err.message};
            }

            if (completedRequests === nodesArray.length) {
              callback(null, results);
            }
          });
        });
      });
    },
  };
}


module.exports = groupsTemplate;
