
var http  = require("http"),
    url   = require("url"),
    path  = require("path"),
    fs    = require("fs"),
    qs    = require("./lib/querystring.js"),
    utils = require("./lib/utils.js"),
    session = require("./lib/session.js"),

    EventEmitter = require("fs").EventEmitter;

var Ngine = $self = {};

Ngine.router    = require('./lib/router.js');
Ngine.template  = require("./lib/ejs.js")
Ngine.mimeTypes = require('./config/mime-types.js');
Ngine.autoext   = require('./config/auto-extensions.js');


Ngine.session   = {
    "autostart": true,
    "name"     : "nginesession",
    "handler"  : "memory"
};

Ngine.session.handlers = {};
Ngine.session.handlers.memory = require("./lib/sessions/memory.js");

Ngine.port      = 3000;
Ngine.public    = false;

Ngine.service     = utils.serviceContainer(Ngine);

Ngine.set = function() {

    switch(arguments.length) {
        case 1:
            var $this = this;
            Object.keys(arguments[0]).forEach(function(key){
                $this[key] = arguments[key];
            });
            break;
        case 2:
            this[arguments[0]] = arguments[1];
            break;
    }
};


Ngine.render = (function(){

    return function(filepath, context, cache) {

        var output;

        context = extend({
            "__filename" : filepath,
            "__dirname"  : path.dirname(filepath),
            "$ngine"      : this
        }, context);

        try {
            this.template.renderFile(filepath, {
                "locals": context
            }, function(err, content) {
                output = content;
            });
        } catch(e) {
            return e.message;
        }

        return output;
    }

})();

Ngine.responsehandler = (function(){

        return function(req, res) {

            var pathname = req.uri.pathname,
                route    = $self.router.match(pathname);

            if(route) {

               req.route = route;

               var ret = route.fn.apply(this, [req, res]);

               if(ret === false) {
                    res.finalize('Route not found', 404);
               }

               return;
            }

            // no static folder defined
            if(!req.$ngine.public) {
                res.writeHead(404, {"Content-Type": "text/plain"});
                res.end();
                return;
            }

            // lookup static file from public folder

            var filename = path.join(req.$ngine.public, pathname);


            fs.exists(filename, function(exists) {

                if(exists) {

                    if (fs.statSync(filename).isDirectory()) {
                        if (fs.existsSync(path.join(filename,'index.ejs'))) {
                            filename = path.join(filename,'index.ejs');
                        } else if (fs.existsSync(path.join(filename,'index.html'))) {
                            filename = path.join(filename,'index.html');
                        } else {
                            res.finalize(null, 404);
                            return;
                        }
                    }

                    var ext = filename.replace(/.*[\.\/\\]/, '').toLowerCase();

                    if(req.$ngine.autoext[ext]) {

                        req.$ngine.autoext[ext].apply(req.$ngine, [filename, req, res]);

                    } else {

                        fs.readFile(filename, "binary", function(err, content) {

                            if(err) {
                                res.finalize(String(err), 500, "text/plain");
                                return;
                            }

                            res.writeHead(200, {"Content-Type": Ngine.mimeTypes[ext] || 'text/plain'});
                            res.end(content, "binary");
                        });

                    }

                } else {
                    res.finalize(null, 404);
                    return;
                }

            });

        }
})();


Ngine.listen = function(port) {

    if(port) this.port = parseInt(port, 10);

    var $ngine = this;

    this.server = http.createServer(function(req, res){

        var uri = url.parse(req.url);

        utils.patchobject(req, {
            "$ngine" : $ngine,
            "uri"  : uri,
            "postdata" : {},
            "getdata": qs.parse(uri.query),
            "route": false,
            "session": session(req, res, Ngine.session),
            "param": function(key, def) {
                return req.postdata[key] || req.getdata[key] || def;
            }
        });

        utils.patchobject(res, {
            "view404": path.join(__dirname,'views/404.html'),
            "finalize": function(content, status, type) {

                status = status || 200;
                type   = type   || "text/html";

                if(status==404) {
                    fs.readFile(res.view404, "binary", function(err, content) {

                        if(err) {
                            res.finalize(String(err), 500, "text/plain");
                            return;
                        }

                        res.writeHead(status, {"Content-Type": 'text/html'});
                        res.end(content);
                    });
                } else {
                   res.writeHead(status, {"Content-Type": type});
                   res.end(content);
                }
            },

            "redirect": function(urlorpath) {
                response.writeHead(302, {'Location': urlorpath});
                response.end();
            },

            "render": function(filepath, context){
                var content = $ngine.render(filepath, context);

                res.finalize(content);
            },

            "nocache": function(){
                // Set to expire far in the past.
                res.setHeader("Expires", "Sat, 6 May 1995 12:00:00 GMT");
                // Set standard HTTP/1.1 no-cache headers.
                res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
                // Set IE extended HTTP/1.1 no-cache headers (use addHeader).
                res.addHeader("Cache-Control", "post-check=0, pre-check=0");
                // Set standard HTTP/1.0 no-cache header.
                res.setHeader("Pragma", "no-cache");
            }
        });

        if(req.method=='POST' && utils.hasBody(req)) {

            var postdata = '';

            req.on('data', function (data) {
                postdata += data;
            });

            req.on('end',function(){

                req.postdata = qs.parse(postdata);

                $ngine.responsehandler(req, res);
            });

        } else {
            $ngine.responsehandler(req, res);
        }
    });

    this.server.listen(parseInt(this.port, 10));

    console.log("Lime server running at => http://localhost:" + this.port + " (CTRL + C to shutdown)");
};

module.exports = Ngine;