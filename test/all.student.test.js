let distribution;
let local;

let status;

let lastPort = 8090;

beforeEach(() => {
  jest.resetModules();

  global.nodeConfig = {
    ip: '127.0.0.1',
    port: lastPort++, // Avoid port conflicts
  };

  distribution = require('../distribution');
  local = distribution.local;

  id = distribution.util.id;
  wire = distribution.util.wire;

  node = global.nodeConfig;

  routes = local.routes;
  comm = local.comm;
  status = local.status;
});

test('local.status.stop() gracefully shuts down the server', (done) => {
  // Mock the server's close method
  global.server = {
    close: jest.fn().mockImplementation((callback) =>
      callback()),
  };

  // Call the stop method
  status.stop();

  // Use setTimeout to ensure the close method has been called after
  // the event loop
  setTimeout(() => {
    expect(global.server.close).toHaveBeenCalled();
    done();
  }, 1);
});

jest.mock('child_process', () => ({
  fork: jest.fn(),
}));

test('local.status.spawn() spawns a new process with the correct configuration',
    () => {
      const mockFork = require('child_process').fork;

      // Prepare your configuration and callback
      const conf = {ip: '127.0.0.1', port: 8082};
      const callback = jest.fn();

      // Call the spawn method
      status.spawn(conf, callback);

      // Check if fork was called correctly
      expect(mockFork).toHaveBeenCalledWith(`/Users/jacksondavis/Desktop/Spring 
  2024 Code/cs_1380/m3/distribution/local/../../distribution.js`,
      expect.any(Array));
    });

test('(9 pts) RPC1', (done) => {
  let n = 0;

  const addOne = () => {
    return ++n;
  };

  const addOneRPC = distribution.util.wire.createRPC(
      distribution.util.wire.toAsync(addOne));

  const rpcService = {
    addOneRPC: addOneRPC,
  };

  distribution.node.start((server) => {
    local.routes.put(rpcService, 'rpcService', (e, v) => {
      local.routes.get('rpcService', (e, s) => {
        expect(e).toBeFalsy();
        s.addOneRPC((e, v) => {
          s.addOneRPC((e, v) => {
            s.addOneRPC((e, v) => {
              server.close();
              expect(e).toBeFalsy();
              expect(v).toBe(3);
              done();
            });
          });
        });
      });
    });
  });
});

// // ---LOCAL.GROUPS---

test('(2 pts) local.groups.get(random)', (done) => {
  distribution.local.groups.get('random', (e, v) => {
    expect(e).toBeDefined();
    expect(e).toBeInstanceOf(Error);
    expect(v).toBeFalsy();
    done();
  });
});

test('(2 pts) local.groups.del(random)', (done) => {
  distribution.local.groups.del('random', (e, v) => {
    expect(e).toBeDefined();
    expect(e).toBeInstanceOf(Error);
    expect(v).toBeFalsy();
    done();
  });
});

test('(2 pts) local.groups.put(browncs)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.local.groups.put('browncs', g, (e, v) => {
    expect(e).toBeFalsy();
    expect(v).toBe(g);
    done();
  });
});
