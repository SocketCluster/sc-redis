SC-Redis
======

This is a Redis adaptor for SocketCluster: http://socketcluster.io/
It allows you to interact with SocketCluster channels via Redis and vice-versa.

This module is useful if you have a simple setup on a single host and just want to be able to synchronize pub/sub channels between SC and Redis - So if you publish a message to a channel in Redis, clients connected to SC which are subscribed to that channel will also get the message.

This is not an ideal solution for scaling SC horizontally (unless you can modify it to work with Redis Cluster maybe). The recommended approach for scaling SC horizontally is now SCC https://github.com/SocketCluster/socketcluster/blob/master/scc-guide.md.

## Install

```bash
npm install sc-redis
```

Make sure that you have the latest version of SocketCluster installed.

## Usage

Put the following code inside the SocketCluster sample app - Inside **broker.js**:

```js
var scRedis = require('sc-redis');

module.exports.run = function (broker) {
  console.log('   >> Broker PID:', process.pid);
  scRedis.attach(broker);
};
```

You will need to provide some brokerOptions to SocketCluster (in **server.js**) - These will automatically be added as an options property on your broker object.
Example (substitute with relevant values):

```js
var socketCluster = new SocketCluster({
  // ...
  brokerOptions: {
    host: '54.204.147.15',
    port: 6379
  }
});
```

Note that SC-Redis uses the Node Redis client to hook into a Redis server.
Any option described here: https://github.com/mranney/node_redis#overloading can be provided as a broker option - In production you may want to provide the 'password' property.

Feel free to modify server.js to get some of these options from the command line if appropriate (instead of having them hard-coded inside server.js).

To test, you need to launch your Redis server (on the host and port you specified in brokerOptions).
Then you need to launch your SC server using (make sure your Redis server is running before you launch your SC instance):

```bash
node server
```

Open your browser window and connect to your SC server... By default it's at: http://localhost:8000/ - Then open the developer console.
Note that your client will subscribe to a 'pong' channel on SocketCluster. SC-Redis will automatically handle all the synchronization work.

On the host on which your Redis server is running, you can interact with it using:

```bash
redis-cli
```

Then inside the Redis prompt, you can enter:

```bash
publish pong 'o:{"a":123, "b":456}'
```

You should see the object appear in your browser's developer console (from SocketCluster).

Note that SC-Redis messages always need to start with 'o:' (if the data is a JSON object) or 's:' (if data should be interpreted as a string).

 
## Contributing

SC-Redis is currently 'experimental'. It still needs a bit of polishing before you can use it in production.
TODO:
- Better error logging (capture errors from Redis client and emit 'error' on broker object?)
- Reconnect behavior (after Redis client connection drops out) - Not sure if this is necessary or Node Redis client already does that automatically?
- Synchronize data with Redis - Not just pub/sub channels - Will need to make changes to nData (https://github.com/SocketCluster/ndata) to make this possible.

Pull requests are welcome.
 
 
## License

(The MIT License)

Copyright (c) 2013-2015 TopCloud

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
