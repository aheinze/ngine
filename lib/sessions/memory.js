var storage = require("../storage.js");


function Session(id, options) {

    this.id      = id;
    this.options = options;
    this.storage = storage.select("ngine-sessions");
}

Session.prototype.write = function(key, value) {
   this.storage.hset(this.id, key, value); 
};
Session.prototype.read = function(key, def) {
    return this.storage.hget(this.id, key, def); 
};
Session.prototype.remove = function(key) {
    this.storage.hdel(this.id, key); 
};
Session.prototype.destroy = function() {
    this.storage.flushdb();
};


module.exports = Session;