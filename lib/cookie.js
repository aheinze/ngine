var qs = require('querystring');

exports.parse = function(req) {
    
    var sessions = req.headers.cookie ? qs.parse(req.headers.cookie.replace(/;\s/g, "&")) : {};

    return sessions;
};