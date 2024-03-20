const http = require('http');
const url = require('url');

let local = require('../local/local');
const serialization = require('../util/serialization');

/*
    The start function will be called to start your node.
    It will take a callback as an argument.
    After your node has booted, you should call the callback.
*/


function isValidBody(body) {
  error = undefined;
  if (body.length === 0) {
    return new Error('No body');
  }

  try {
    body = JSON.parse(body);
  } catch (error) {
    return error;
  }

  return error;
}


const start = function(onStart) {
  const server = http.createServer((req, res) => {
    /* Your server will be listening for PUT requests. */

    if (req.method !== 'PUT') {
      res.end(serialization.serialize(new Error('Method not allowed!')));
      return;
    }

    const pathname = url.parse(req.url).pathname;
    const [, service, method] = pathname.split('/');

    console.log(`[SERVER] (${global.nodeConfig.ip}:${global.nodeConfig.port})
        Request: ${service}:${method}`);


    let body = [];

    req.on('data', (chunk) => {
      body.push(chunk);
    });

    req.on('end', () => {
      body = Buffer.concat(body).toString();
      let error;

      if (error = isValidBody(body)) {
        res.end(serialization.serialize(error));
        return;
      }

      body = JSON.parse(body);
      body = serialization.deserialize(body);
      let args = body;


      /* Here, you can handle the service requests. */

      // Write some code...

      local.routes.get(service, (error, service) => {
        if (error) {
          res.end(serialization.serialize(error));
          console.error(error);
          return;
        }

        const serviceCallback = (e, v) => {
          res.end(serialization.serialize([e, v]));
        };

        console.log(`[SERVER] Args: ${JSON.stringify(args)} 
            ServiceCallback: ${serviceCallback}`);

        service[method](...args, serviceCallback);
      });
    });
  });


  // Write some code...

  /*
    Your server will be listening on the port and ip specified in the config
    You'll be calling the onStart callback when your server has successfully
    started.

    In this milestone, we'll be adding the ability to stop a node
    remotely through the service interface.
  */

  server.listen(global.nodeConfig.port, global.nodeConfig.ip, () => {
    console.log(`Server running at http://${global.nodeConfig.ip}:${global.nodeConfig.port}/`);
    onStart(server);
  });
};

module.exports = {
  start: start,
};
