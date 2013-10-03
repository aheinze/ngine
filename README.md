ngine
=====

Simple webserver + webframework for node


## Quick Start


    var ngine = require('ngine');

    // static folder
    ngine.public = __dirname + "/public";

    ngine.listen(3000);


Et voila you have a static webserver running with some gimmicks:

- index.html and index.ejs are recognized as entry points for folders (e.g. http://localhost:3000/anyfolder)
- __.md__ and __.markdown__ files will be auto-rendered to html (e.g. http://localhost:3000/page.md)
- you can link __.less__ and __.coffee__ files directly e.g. &lt;link href="css/site.less" rel="stylesheet"&gt;


## Routing

    var ngine = require('ngine');

    ngine.get('/test', function(req, res){
        res.finalize("test");
    });

    ngine.post('/test', function(req, res){
        res.finalize(req.param("anyfield"));
    });

    ngine.all('/frontpage', function(req, res){
        res.finalize("frontpage...");
    });

    ngine.listen(3000);


## License

(The MIT License)

Copyright (c) 2013 Artur Heinze

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
