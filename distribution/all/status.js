const distribution = global.distribution;

function status(config) {
  return {
    // Get status from all nodes in the group
    get: function() {
      const group = distribution.local.groups.get(config.gid);
      let aggregate = {counts: 0, heapTotal: 0, heapUsed: 0};

      const nodes = Object.values(group);
      const numberOfNodes = Object.keys(group).length;
      let completedRequests = 0;

      nodes.forEach((node) => {
        const remote = {node: node, service: 'status', method: 'get'};
        distribution.local.comm.send(['counts'], remote, (err, nodeStatus) => {
          if (!err) {
            aggregate.counts += nodeStatus.counts;
            aggregate.heapTotal += nodeStatus.heapTotal;
            aggregate.heapUsed += nodeStatus.heapUsed;
          }
          completedRequests++;
          if (completedRequests === numberOfNodes) {
            callback(null, aggregate);
          }
        });
        callback(null, aggregate);
      });
    },

    // Stop all nodes in the group and then stop itself
    stop: function() {
      const group = distribution.mygroup.groups.get(config.gid);

      const nodes = Object.values(group);
      let completedRequests = 0;

      nodes.forEach((node) => {
        const remote = {node: node, service: 'status', method: 'stop'};
        distribution.local.comm.send([], remote, (err) => {
          completedRequests++;
          if (completedRequests === nodes.length) {
            distribution.node.stop(() => {
              callback(null, {message: 'All nodes and service stopped.'});
            });
          }
        });
      });
    },

    // Spawn a new node and add it to the group
    spawn: function(nodeDetails, groupName, callback) {
      distribution.local.status.spawn(nodeDetails, (err, newNode) => {
        if (err) {
          callback(err);
          return;
        }
        distribution.mygroup.groups.add(groupName, newNode, (err) => {
          if (err) {
            callback(err);
          } else {
            callback(null, newNode);
          }
        });
      });
    },
  };
}

module.exports = status;
