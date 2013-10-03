/**
 * Storage.js - a simple storage helper inspired by the redis api.
 *
 * @author     Artur Heinze
 */

function Storage(name, adapter){

	var $this    = this;

    this.name    = name;
    this.adapter = adapter;
    this.data    = adapter.load(name);
    this.expires = {};

    setInterval(function(){

    	var time = (new Date()).getTime();

    	for(var key in $this.expires) {
    		if($this.expires[key] < time) {
    			delete $this.data[key];
    			delete $this.expires[key];
    		}
    	}

    }, 60000);
}

Storage.prototype.store = function(key){
    this.adapter.store(this.name, this.data);
};

Storage.prototype.toString = function(key){
    return JSON.stringify(this.data);
};

Storage.prototype.flushdb = function(){
    
    this.data    = {};
    this.expires = {};

    this.store();

    return true;
};

Storage.prototype.get = function(key, def){
    return this.data[key] !== undefined ? this.data[key] : def;
};

Storage.prototype.set = function(key, value){
    this.data[key] = value;
    this.store();
};

Storage.prototype.setex = function(key, seconds, value){
    this.set(key, value);
    this.expire(key, seconds);
};

Storage.prototype.expire = function(key, seconds) {
	if(this.data[key]) this.expires[key] = (new Date()).getTime() + (seconds*1000);
};

Storage.prototype.exists = function(key){
    return this.get(key, "___no___") !== "___no___";
};

Storage.prototype.del = function(){
    
    var keys    = arguments,
        key     = null,
        removed = 0;

    for (var i=0;i<keys.length;i++){

        key = keys[i];

        if(this.exists(key)){
            delete this.data[key];

            if(this.expires[key]) {
            	delete this.expires[key];
            }

            removed++;
        }
    }

    this.store();

    return removed;
};

Storage.prototype.type = function(key){
    
    key = this.get(key);

    if(typeof(key) === 'object'){
        return JSON.stringify(key)[0] === "[" ? "list":"set";
    }

    return typeof(key);
};

Storage.prototype.append = function(key, value){
    
    value = String(value);
    
    var current = String(this.get(key, "")),
        newone  = current+value;

    this.set(key, newone);

    return newone.length;
};

Storage.prototype.incr = function(key, by){
    
    by = by || 1;
    
    var current = Number(this.get(key, 0)),
        newone  = current+by;

    this.set(key, newone);

    return newone;
};

Storage.prototype.decr = function(key, by){
    by = by || 1;
    return this.incr(key, (by * -1));
};

/* List methods */

Storage.prototype.llen = function(key){
    return this.get(key, []).length;
};

Storage.prototype.lpush = function(key, value){
    var list = this.get(key, []),
        ret  = list.unshift(value);

    this.set(key, list);
    return ret;
};

Storage.prototype.rpush = function(key, value){
    var list = this.get(key, []),
        ret  = list.push(value);

    this.set(key, list);
    return ret;
};

Storage.prototype.lset = function(key, index, value){
    var list = this.get(key, []);

    if(index < 0) {
        index = list.length - Math.abs(index); 
    }

    if (list[index]) {
        list[index] = value;
        this.set(key, list);
        return true;
    }

    return false;
};

Storage.prototype.lindex = function(key, index){
    var list = this.get(key, []);

    if (index < 0) {
        index = list.length - Math.abs(index); 
    }

    return list[index] ? list[index] : null;
};

/* Hash methods */

Storage.prototype.hset = function(key, field, value){
    var set = this.get(key, {});

    set[field] = value;
    this.set(key, set);
};

Storage.prototype.hget = function(key, field, def){
    var set = this.get(key, {});

    return set[field] !== undefined ? set[field] : def;
};

Storage.prototype.hgetall = function(key){
    return this.get(key, {});
};

Storage.prototype.hexists = function(key, field){
    var set = this.get(key, {});

    return (set[field] !== undefined);
};

Storage.prototype.hkeys = function(key){
    var set  = this.get(key, {}),
        keys = [], 
        name = null;

    for (name in set) {
        if (set.hasOwnProperty(name)) {
            keys.push(name);
        }
    }

    return keys;
};

Storage.prototype.hvals = function(key){
    var set  = this.get(key, {}),
        vals = [], 
        name = null;

    for (name in set) {
        if (set.hasOwnProperty(name)) {
            vals.push(keys[name]);
        }
    }

    return vals;
};

Storage.prototype.hlen = function(key){
    return this.hkeys(key).length;
};

Storage.prototype.hdel = function(key){
    
    if(!this.exists(key)) return 0;

    var set     = this.get(key, {}),
        field   = null,
        removed = 0;

    for (var i=1;i<arguments.length;i++){

        field = arguments[i];

        if(set[field] !== undefined){
            delete set[field];
            removed++;
        }
    }

    this.set(key, set);

    return removed;
};

Storage.prototype.hincrby = function(key, field, by){
    by = by || 1;
    var current = Number(this.hget(key, field, 0)),
        newone  = current+by;

    this.hset(key, field, newone);

    return newone;
};

Storage.prototype.hmget = function(key){
    var set     = this.get(key, {}),
        field   = null,
        values  = [];

    for (var i=1;i<arguments.length;i++){
        field = arguments[i];
        values.push(set[field] !== undefined ? set[field]:null);
    }

    return values;
};

Storage.prototype.hmset = function(key){
    var set     = this.get(key, {}),
        field   = null,
        value   = null;

    for (var i=1;i<arguments.length;i++){
        field = arguments[i];
        value = arguments[(i + 1)] ? arguments[(i + 1)]:null;
        set[field] = value;
        i = i + 1;
    }

    this.set(key, set);
};

module.exports = {
    "select": function(name, adapter){
        return (new Storage(name, this.adapters[adapter] || this.adapters['memory']));
    },

    adapters: {
        'memory': (function(){
        	var dbs = {};

        	return {
        		load  : function(name) { return dbs[name] || {}; },
        		store : function(name, data) { dbs[name] = data; }
        	}
        })()
    }
};