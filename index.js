var redis = require('redis');

module.exports.attach = function (store) {
  var options = store.options;
  
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
    pubClient.publish(channel, data);
  });
  
  subClient.on('message', function (channel, message) {
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
  });
};