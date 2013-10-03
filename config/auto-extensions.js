
var path = require("path"),
    fs   = require("fs"),

    markdown = require("../lib/marked.js"),
    coffee   = require("../lib/coffee-script.js"),
    less     = require("../lib/less/index.js");


var markdownhandler = function(filename, req, res) {

    fs.readFile(filename, "utf-8", function(err, content) {

        if(err) {
            res.finalize(String(err), 500, "text/plain");
        } else {
            res.finalize(markdown(content));
        }
    });
};


module.exports = {

    "less": function(filename, req, res) {

        fs.readFile(filename, "utf-8", function(err, content) {

            if(err) {
                res.finalize(String(err), 500, "text/plain");
            } else {

                var options = {paths:[path.dirname(filename)],rootpath: path.dirname(filename), relativeUrls:true},
                    parser  = new(less.Parser)(options);

                parser.parse(content, function (err, tree) {

                    if (err) {
                        res.finalize(String(err), 500, "text/plain");
                    } else {
                        res.finalize(tree.toCSS(), 200, "text/css");
                    }
                });
            }
        });
    },

    "ejs": function(filename, req, res) {
        res.finalize(req.lime.render(filename, {"req":req}));
    },

    "coffee": function(filename, req, res) {

        fs.readFile(filename, "utf-8", function(err, content) {

            if(err) {
                res.finalize(String(err), 500, "text/plain");
            } else {
                
                var status = 200;

                try {
                    content = coffee.CoffeeScript.compile(content);
                }catch(e){
                    status  = 500;
                    content = e.message;
                }

                res.finalize(content, status, "application/x-javascript");
            }
        });
    },

    "md": markdownhandler,
    "markdown": markdownhandler
};