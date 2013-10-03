var cookie = require("./cookie.js"),
    utils  = require("./utils.js");


function Session(id, options) {

    this.id      = id;
    this.options = options;
    this.handler = null;

    if(options.autostart) {
        this.init();
    }
}

Session.prototype.init = function() {
    if(!this.handler) {
        this.handler = new this.options.handlers[this.options.handler](this.id, this.options);
    }
};
Session.prototype.write = function(key, value) {
    if(!this.handler) this.init();

    this.handler.write(key, value);
};
Session.prototype.read = function(key, def) {
    if(!this.handler) this.init();

    return this.handler.read(key, def);
};
Session.prototype.remove = function(key) {
    if(!this.handler) this.init();

    this.handler.remove(key);
};
Session.prototype.destroy = function() {
    if(!this.handler) this.init();

    this.handler.destroy();
};


module.exports = function(req, res, options) {

    var data = cookie.parse(req.headers.cookie),
        id   = data[options.name] || (function(){
            var uuid = utils.uuid();

            res.setHeader("Set-Cookie", cookie.serialize(options.name, uuid, options));

            return uuid;
        })();

    var session = new Session(id, options);

    return session;
};