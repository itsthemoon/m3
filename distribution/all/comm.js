const local = global.distribution.local;
const id = global.distribution.util.id;


function comm(config) {
  return {
    send: function(message, remote, callback) {
      // Use the get method to retrieve nodes for the groupName
      local.groups.get(config.gid, (error, nodes) => {
        if (error) {
          console.error('Error retrieving group: ', error);
          callback(error, null); // Handle error appropriately
          return;
        }

        let counter = Object.keys(nodes).length;
        const values = {};
        const errors = {};

        // Iterate through the nodes object
        Object.values(nodes).forEach((node) => {
        // The signature for local.comm.send is
          // function(message, remote, callback)
          local.comm.send(message, {node: node, ...remote}, (error, value) => {
            counter--;

            if (error) {
              errors[id.getNID(node)] = error;
            } else {
              values[id.getNID(node)] = value;
            }

            if (counter === 0) {
              console.log('we did some stuff... ', errors, values);
              // Return both errors and values every time for
              // consistency, simplicity, and flexibility
              callback(errors, values);
            }
          });
        });
      });
    },
  };
}

module.exports = comm;
