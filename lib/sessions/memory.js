var storage = require("../storage");


function Session(id, options) {

    this.id      = id;
    this.options = options;
    this.storage = storage.select("ngine-sessions-"+id);
}

Session.prototype.write = function(key, value) {
   this.storage.set(key, value); 
};
Session.prototype.read = function(key, def) {
    return this.storage.get(key, def); 
};
Session.prototype.remove = function(key) {
    this.storage.del(key); 
};
Session.prototype.destroy = function() {
    this.storage.flushdb();
};


module.exports = Session;