var express = require('express');
var app = express();
var hgvis = require('./hgvis.js');

app.set('views', __dirname + '\\views');
app.use(express.static('public'));

app.get('/', function(req, res) {
	res.sendfile('index.html')
});

app.get('/load/:file', function(req, res) {
	console.log('loading commits from file: ' + req.params.file)
	res.json({ "all" : hgvis.getCommits(req.params.file)});
});

var server = app.listen(3000, function() {
	console.log('listening on port %d', server.address().port);
})