//Modules externes
var express = require('express');
var path = require('path');
var session = require('express-session');
var passport = require('passport');
var expressValidator = require('express-validator');
var LocalStrategy = require('passport-local');
var multer = require('multer');
var bodyParser = require('body-parser');
//var mongoose = require('mongoose');
//var flash = require('connect-flash');
//var bcrypt = require('bcryptjs');
//var mongo = require('mongodb');
//var cookieParser = require('cookie-parser');

//Modules internes
//var structures = require('./public/js/structures.js');
//var Board = require("./public/js/board.js");
//var utilities = require("./public/js/utilities.js");
//var pieces = require("./public/js/pieces.js");
//var schemas = require('./server/js/userSchema');
//var model = require("./server/js/userdoc.js");
var global = require('./server/js/global.js');
var rm = require('./server/js/routeManagement.js');
var auth = require('./server/js/authentication.js');
var sm = require('./server/js/socketManagement.js');

//Variables de gestion
var app = global.app;
var server = global.server;
var io = global.io;


var upload = multer({dest: './public/uploads'});
//var passportSocketIO = require('passport.socketio');
//var db = mongoose.connection;


app.use(express.static('public/'));

//utiliser pug comme view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/server/html'));

//gérer les sessions
app.use(session({
	secret: 'secret',
	saveUninitialized: true,
	resave: true
}));

//Passport
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: true }));

//express-validator //code from express-validator github docs
app.use(expressValidator({ errorFormatter: global.errorFormatter }));

//connect-flash
app.use(require('connect-flash')());
app.use(global.messages);

//app gets
app.get('*', rm.get.forall);
app.get('/', rm.get.accueil);
app.get('/local', rm.get.local);
app.get('/local/IA',rm.get.ia);
app.get('/p', rm.get.fastGame);
app.get('/p/:id', rm.get.game);
app.get('/inscription', rm.get.inscription);
app.get('/connexion', rm.get.connexion);
app.get('/deconnexion', rm.get.deconnexion);
app.get("/getGameSaved", rm.get.gameSaved);
app.get("/pexist/:id", rm.get.gameExist);
app.get("/loadSave/:name", rm.get.loadSave);
app.get("/getusername", rm.get.username);

//app posts
app.post('/p/:id/save',rm.post.saveGame);
app.post('/inscription', upload.single('profileimage'), rm.post.inscription);
app.post('/connexion', passport.authenticate('local',{failureRedirect:'/connexion', failureFlash: 'Invalid username or password'}), rm.post.connexion);

app.use('*', rm.notFound); //Doit être en dernier !!

passport.serializeUser(auth.serializeUser);
passport.deserializeUser(auth.deserializeUser);
passport.use(new LocalStrategy(auth.strategyFunction));

io.sockets.on('connection', sm);
server.listen(process.env.PORT || 8080);

let d = new Date();
console.log("Server started on " +  d.getDate() +"/" + (d.getMonth()+1) +" "+ d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds());
