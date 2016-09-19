var express      = require('express')
var multiparty   = require('connect-multiparty');
var uuid         = require('node-uuid');
var fs           = require('fs');
var path         = require('path');
var querystring  = require("querystring");
var url          = require('url');

var app = express()
var multipartMiddleware = multiparty();
app.use(multiparty({uploadDir:'./file' }));
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.post('/base64', function(req, resp){
    var imgData = req.body.imgData,
        base64Data = imgData.replace(/^data:image\/\w+;base64,/, ""),
        dataBuffer = new Buffer(base64Data, 'base64'),
        imageName = uuid.v1() + '.png';
    fs.writeFile('./file' + imageName, dataBuffer, function(err) {
        if(err){
          resp.end(err);
        }else{
          resp.end(JSON.stringify({name:imageName,size:base64Data.length/1024,path:'./' + imageName}));
        }
    });
});

app.post('/upload', multipartMiddleware, function(req, resp) {
  resp.end(JSON.stringify({'name': req.files.file.originalFilename,'size': req.files.file.size,path:req.files.file.path}));
});

app.get('/:name',function(req,res,next){
    var queryOpts = querystring.parse(url.parse(req.url).query),
        fileName = req.params.name;
    if (queryOpts.attname) {
       var filePath = path.join('./file', fileName);
       var stats = fs.statSync(filePath);
       if(stats.isFile()){
          res.set({
             'Content-Type': 'application/octet-stream',
             'Content-Disposition': 'attachment; filename=' + (encodeURIComponent(queryOpts.attname) || fileName),
             'Content-Length': stats.size
          });
          fs.createReadStream(filePath).pipe(res);
       } else {
          res.end(404);
       }
    }else{
       fs.readFile('./file/' + fileName,'binary',function(err, file) {
       	if (err) {
        	  res.end(err);
        	  return;
       	}else{
           res.writeHead(200, {'Content-Type': 'image/jpeg'});
           res.write(file,'binary');
           res.end();
       	}
       });
    }
});
app.listen(9090)
