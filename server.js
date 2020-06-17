 
const express = require('express')
const fs = require('fs')
const path = require('path')
const os = require('os')
var walk    = require('walk');
const app = express()
const port = 3000;
const ipaddr = "localhost";

app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine', 'ejs');
const videoHomeDir = os.homedir() + `/Videos`;
var files   = [];

var walker  = walk.walk(videoHomeDir, { followLinks: false });

walker.on('file', function(root, stat, next) {
    files.push(root + '/' + stat.name);
    next();
});

walker.on('end', function() {
    console.log("GOT ALL VIDEOS")
});

app.get('/', function(req, res) {
    res.render('pages/index', {files: files, ipaddress:ipaddr,port:port});
})


app.get('/video/:id', function(req, res) {
  var video = files[req.params.id];
  const path = `${video}`;
  const stat = fs.statSync(path)
  const fileSize = stat.size
  const range = req.headers.range

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1]
      ? parseInt(parts[1], 10)
      : fileSize-1

    if(start >= fileSize) {
      res.status(416).send('Requested range not satisfiable\n'+start+' >= '+fileSize);
      return
    }
    
    const chunksize = (end-start)+1
    const file = fs.createReadStream(path, {start, end})
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    }

    res.writeHead(206, head)
    file.pipe(res)
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    }
    res.writeHead(200, head)
    fs.createReadStream(path).pipe(res)
  }

})


app.listen(port, function () {
  console.log(`Listening on port ${port}!`)
})
