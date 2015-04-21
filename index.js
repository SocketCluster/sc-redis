var redis = require('redis');

module.exports.attach = function (store) {
  var options = store.options;
  var instanceId = store.instanceId;
  
  var subClient = redis.createClient(options.port, options.host, options);
  var pubClient = redis.createClient(options.port, options.host, options);
  
  store.on('subscribe', subClient.subscribe.bind(subClient));
  store.on('unsubscribe', subClient.unsubscribe.bind(subClient));
  store.on('publish', function (channel, data) {
    if (data instanceof Object) {
      try {
        data = 'o:' + JSON.stringify(data);
      } catch (e) {
        data = 's:' + data;
      }
    } else {
      data = 's:' + data;
    }
    
    if (instanceId != null) {
      data = instanceId + '/' + data;
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
      store.publish(channel, data);
    }
  });
};