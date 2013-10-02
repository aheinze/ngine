// code borowed from https://github.com/senchalabs/connect

var crypto = require('crypto');



exports.hasBody = function(req) {
  var encoding = 'transfer-encoding' in req.headers;
  var length = 'content-length' in req.headers && req.headers['content-length'] !== '0';
  return encoding || length;
};

exports.mime = function(req) {
  var str = req.headers['content-type'] || '';
  return str.split(';')[0];
};

exports.md5 = function(str, encoding){
  return crypto.createHash('md5').update(str).digest(encoding || 'hex');
};


// var etag = utils.etag(fs.statSync(filename));
exports.etag = function(stat) {
  return '"' + stat.size + '-' + Number(stat.mtime) + '"';
};

/**
 * Sign the given `val` with `secret`.
 *
 * @param {String} val
 * @param {String} secret
 * @return {String}
 * @api private
 * 
 * https://github.com/visionmedia/node-cookie-signature
 */

exports.sign = function(val, secret){
  if ('string' != typeof val) throw new TypeError('cookie required');
  if ('string' != typeof secret) throw new TypeError('secret required');
  return val + '.' + crypto.createHmac('sha256', secret).update(val).digest('base64').replace(/\=+$/, '');
};

/**
 * Unsign and decode the given `val` with `secret`,
 * returning `false` if the signature is invalid.
 *
 * @param {String} val
 * @param {String} secret
 * @return {String|Boolean}
 * @api private
 * 
 * https://github.com/visionmedia/node-cookie-signature
 */

exports.unsign = function(val, secret){
  if ('string' != typeof val) throw new TypeError('cookie required');
  if ('string' != typeof secret) throw new TypeError('secret required');
  var str = val.slice(0, val.lastIndexOf('.'));
  return exports.sign(str, secret) == val ? str : false;
};


// simple uuid https://github.com/makeable/uuid-v4.js
// @todo replace with more robust implementation
exports.uuid = (function(){
  
  var dec2hex = [];
  
  for (var i=0; i<=15; i++) {
    dec2hex[i] = i.toString(16);
  }
  
  return function() {
    var uuid = '';
    
    for (var i=1; i<=36; i++) {
      if (i===9 || i===14 || i===19 || i===24) {
        uuid += '-';
      } else if (i===15) {
        uuid += 4;
      } else if (i===20) {
        uuid += dec2hex[(Math.random()*4|0 + 8)];
      } else {
        uuid += dec2hex[(Math.random()*15|0)];
      }
    }
    return uuid;
  };
  
})();


exports.extend = function(obj) {

    Array.prototype.slice.call(arguments, 1).forEach(function(source) {
        if (source) {
            for (var prop in source) {
                if (source[prop].constructor === Object) {
                    if (!obj[prop] || obj[prop].constructor === Object) {
                        obj[prop] = obj[prop] || {};
                        exports.extend(obj[prop], source[prop]);
                    } else {
                        obj[prop] = source[prop];
                    }
                } else {
                    obj[prop] = source[prop];
                }
            }
        }
    });

    return obj;
};

exports.patchobject = function(obj, extensions) {
    for(var key in extensions) {
        obj[key] = extensions[key];
    }
};


exports.serviceContainer = (function(){

  var container = function(context){

      var services = {};

      return function() {

          switch(arguments.length) {
              case 1:
                  return services[arguments[0]] ? services[arguments[0]]() : null;
                  break;

              case 2:

                  var key = arguments[0], fn = arguments[1];

                  services[key] = (function() {
                      var obj; return function(){
                          if(!obj) obj = fn.apply(context);
                          return obj;
                      };
                  })();
                  break;

              default:
                  break;
          }
      }
  };

  return function(context) {
    return (new conainer(context));
  }

});