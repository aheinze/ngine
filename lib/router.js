/* 

Based on https://github.com/aaronblohowiak/routes.js


Basic string:

    "/articles" will only match routes that == "/articles".

Named parameters:

    "/articles/:title" will only match routes like "/articles/hello", but *not* "/articles/".

Optional named parameters:

    "/articles/:title?" will match "/articles/hello" AND "/articles/"

Periods before optional parameters are also optional:

    "/:n.:f?" will match "/1" and "/1.json"

Splaaaat! :

    "/assets/*" will match "/assets/blah/blah/blah.png" and "/assets/".
    
    "/assets/*.*" will match "/assets/1/2/3.js" as splats: ["1/2/3", "js"]

Mix splat with named parameters:

    "/account/:id/assets/*" will match "/account/2/assets/folder.png" as params: {id: 2}, splats:["folder.png"]


Named RegExp:

    "/lang/:lang([a-z]{2})" will match "/lang/en" but not "/lang/12" or "/lang/eng"

Raw RegExp:

    /^\/(\d{2,3}-\d{2,3}-\d{4})\.(\w*)$/ (note no quotes, this is a RegExp, not a string.) will match "/123-22-1234.json". Each match group will be an entry in splats: ["123-22-1234", "json"]

*/

/**
 * Convert path to route object
 *
 * A string or RegExp should be passed,
 * will return { re, src, keys} obj
 *
 * @param  {String / RegExp} path
 * @return {Object}
 */

var Route = function(path){
  //using 'new' is optional

  var src, re, keys = [];

  if(path instanceof RegExp){
    re = path;
    src = path.toString();
  }else{
    re = pathToRegExp(path, keys);
    src = path;
  }

  return {
     re: re,
     src: path.toString(),
     keys: keys
  }
};

/**
 * Normalize the given path string,
 * returning a regular expression.
 *
 * An empty array should be passed,
 * which will contain the placeholder
 * key names. For example "/user/:id" will
 * then contain ["id"].
 *
 * @param  {String} path
 * @param  {Array} keys
 * @return {RegExp}
 */
var pathToRegExp = function (path, keys) {
    path = path
        .concat('/?')
        .replace(/\/\(/g, '(?:/')
        .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
            keys.push(key);
            slash = slash || '';
            return ''
                + (optional ? '' : slash)
                + '(?:'
                + (optional ? slash : '')
                + (format || '') + (capture || '([^/]+?)') + ')'
                + (optional || '');
        })
        .replace(/([\/.])/g, '\\$1')
        .replace(/\*/g, '(.+)');
    return new RegExp('^' + path + '$', 'i');
};

/**
 * Attempt to match the given request to
 * one of the routes. When successful
 * a  {fn, params, splats} obj is returned
 *
 * @param  {Array} routes
 * @param  {String} pathname
 * @return {Object}
 */
var match = function (routes, pathname) {
    var captures, i = 0;

    for (var len = routes.length; i < len; ++i) {
        var route = routes[i],
            re = route.re,
            keys = route.keys,
            splats = [],
            params = {};

        if (captures = re.exec(pathname)) {
            for (var j = 1, len = captures.length; j < len; ++j) {
                var key = keys[j-1],
                    val = typeof captures[j] === 'string'
                        ? decodeURIComponent(captures[j])
                        : captures[j];
                if (key) {
                    params[key] = val;
                } else {
                    splats.push(val);
                }
            }
            return {
                params: params,
                splats: splats,
                route: route.src
            };
        }
    }
};

/**
 * Default "normal" router constructor.
 * accepts path, fn tuples via addRoute
 * returns {fn, params, splats, route}
 *  via match
 *
 * @return {Object}
 */

module.exports = {
    routes: [],
    routeMap : {},
    register: function(path, fn){
        if (!path) throw new Error(' route requires a path');
        if (!fn) throw new Error(' route ' + path.toString() + ' requires a callback');

        var route = Route(path);
        route.fn = fn;

        this.routes.push(route);
        this.routeMap[path] = fn;
    },

    match: function(pathname){
        var route = match(this.routes, pathname);

        if(route){
            route.fn = this.routeMap[route.route];
        }

        return route;
    }
}