const redis = require('redis');
const assert = require('assert');

function assertBrokerOptions (brokerOptions) {
  assert(brokerOptions, '"brokerOptions" is required to create a Redis client with sc-redis');
  assert(brokerOptions.host, '"brokerOptions.host" is required to create a Redis client with sc-redis');
  assert(brokerOptions.port, '"brokerOptions.port" is required to create a Redis client with sc-redis');
}

function throwMissingRedisClientError (clientName) {
  throw new Error('Missing "' + clientName + '" option. Both "pubClient" and "subClient" must be specified if passing your own clients.');
}

module.exports.attach = function (broker, options) {
  options = options || {}

  const instanceId = broker.instanceId;
  var subClient = options.subClient;
  var pubClient = options.pubClient;

  if (!subClient && !pubClient) {
    const brokerOptions = broker.options.brokerOptions;
    assertBrokerOptions(brokerOptions);

    subClient = redis.createClient(brokerOptions.port, brokerOptions.host, brokerOptions);
    pubClient = redis.createClient(brokerOptions.port, brokerOptions.host, brokerOptions);
  } else if (!subClient && pubClient) {
    throwMissingRedisClientError("subClient");
  } else if (subClient && !pubClient) {
    throwMissingRedisClientError("pubClient");
  }

  broker.on('subscribe', subClient.subscribe.bind(subClient));
  broker.on('unsubscribe', subClient.unsubscribe.bind(subClient));
  broker.on('publish', function (channel, data) {
    if (data instanceof Object) {
      try {
        data = '/o:' + JSON.stringify(data);
      } catch (e) {
        data = '/s:' + data;
      }
    } else {
      data = '/s:' + data;
    }
    
    if (instanceId != null) {
      data = instanceId + data;
    }
    
    pubClient.publish(channel, data);
  });
  
  var instanceIdRegex = /^[^\/]*\//;
  
  subClient.on('message', function (channel, message) {
    var sender = null;
    message = message.replace(instanceIdRegex, function (match) {
      sender = match.slice(0, -1);
      return '';
    });
    
    // Do not publish if this message was published by 
    // the current SC instance since it has already been
    // handled internally
    if (sender == null || sender != instanceId) {
      var type = message.charAt(0);
      var data;
      if (type == 'o') {
        try {
          data = JSON.parse(message.slice(2));
        } catch (e) {
          data = message.slice(2);
        }
      } else {
        data = message.slice(2);
      }
      broker.publish(channel, {
        messages: [data]
      });
    }
  });
};