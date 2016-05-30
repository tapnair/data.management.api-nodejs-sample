var express= require('express');
var cookieParser= require('cookie-parser');
var session= require('express-session')
var app= express();

// this session will be used to save the oAuth token
app.use(cookieParser())
app.use(session({
  secret: 'forgedmtesting',
  resave: true,
  saveUninitialized: true
}));

// prepare server routing
var api = require('./routes/api');
app.use('/', express.static(__dirname + '/www')); // redirect static calls
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect static calls
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect static calls
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect static calls
app.use('/fonts', express.static(__dirname + '/node_modules/bootstrap/dist/fonts')); // redirect static calls
app.use('/api', api); // redirect API calls
app.set('port', process.env.PORT || 3000); // main port

// start server
var server = app.listen(app.get('port'), function () {
    console.log('Starting at ' + (new Date()).toString());
    console.log('Server listening on port ' + server.address().port);
});