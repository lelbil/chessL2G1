/** Module de gestion des routes
 * @module RouteManagement
*/
var schemas = require('./userSchema');
var utilities = require("../../public/js/utilities.js");
var model = require("./userdoc.js");
var structures = require("../../public/js/structures.js");

var g = require('./global.js');
var rooms = g.rooms;
var gameIds = g.gameIds;
var RoomInfo = g.RoomInfo;
var userWaiting = g.userWaiting;
var sessions = g.sessions;

var rm = {
	get : {},
	post : {}
};

// ============================== GET ==============================


/**
 * forall - Fonction de log des fonctions get
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 * @param {function} next Prochain fonction de traitement
 */
rm.get.forall = function(req, res, next){
	res.locals.user = req.user || null;
	next();
	console.log(res.statusCode + "-" + res.statusMessage + " " + req.method + " " + req._parsedUrl._raw);
};


/**
 * accueil - Fonction de gestion de get de la racine
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 */
rm.get.accueil = function(req, res) {
	//res.sendFile('/server/html/acceuil.html', {root:'./'}); //this serves static html
	res.render('acceuil');
	//console.log(res.statusCode + "-" + res.statusMessage + " " + req.method + " " + req._parsedUrl._raw);
};
/**
 * local - Fonction de gestion de get du jeu local
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 */
rm.get.local = function(req, res) {
	res.sendFile('./server/html/gamescreen.html', {root:'./'});
};


/**
 * ia - Fonction de gestion de get du jeu contre IA
 *
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 */
rm.get.ia = function(req, res){
	res.sendFile('./server/html/gameai.html', {root:'./'});
};


/**
 * fastGame - Fonction de récupération de l'id de partie rapide
 *
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 */
rm.get.fastGame = function(req, res) {

	/*var id;
	do
	{
		id = utilities.generateRandomString("AZERTYUIOPQSDFGHJKLMWXCVBN0123456789", 8);
	}while(gameIds.indexOf(id) !== -1);
	gameIds.push(id);
	res.redirect('/p/' + id);
	*/
	var chosenSide = req.params.side, time = req.params.time;
	req.connection.on("close", function(){
		let idx = userWaiting.findIndex(function(val){
			return val.res === res;
		});
		if(idx !== -1)
		{
			userWaiting.splice(idx, 1);
		}
	});
	let user = userWaiting.find(function(val){
		if(val.chosenSide)
		{
			if(chosenSide && chosenSide != ((val.chosenSide == structures.PieceColor.black) ? structures.PieceColor.white : structures.PieceColor.black))
				return;
		}
		if(val.chosenTime)
		{
			if(time && time != val.chosenTime)
				return;
		}
		return val;
	});
	if(user)
	{
		if(!user.chosenSide)
		{
			if(!chosenSide || chosenSide == structures.PieceColor.black)
			{
				user.chosenSide = structures.PieceColor.white;
				chosenSide = structures.PieceColor.black;
			}else
			{
				user.chosenSide = structures.PieceColor.black;
				chosenSide = structures.PieceColor.white;
			}
		}else
		{
			if(!chosenSide)
			{
				chosenSide = (user.chosenSide == structures.PieceColor.black) ? structures.PieceColor.white : structures.PieceColor.black;
			}
		}

		if(!user.chosenTime && !time)
		{
			time = user.chosenTime = 10;
		}else
		{
			if(user.chosenTime)
				time = user.chosenTime;
		}

		var id;
		do
		{
			id = utilities.generateRandomString("AZERTYUIOPQSDFGHJKLMWXCVBN0123456789", 8);
		}while(gameIds.indexOf(id) !== -1);
		gameIds.push(id);
		//clearInterval(user.update);
		user.res.send(JSON.stringify({id : id, side: user.chosenSide, time: time}));
		res.send(JSON.stringify({id : id, side: chosenSide, time: time}));
		userWaiting.splice(userWaiting.indexOf(user), 1);
	}else
	{
		//var up = setInterval(function(){res.write(userWaiting.length.toString());}, 1000);
		userWaiting.push({res: res, chosenSide : chosenSide, chosenTime : time/*, update : up*/});
	}
};


/**
 * game - Fonction de gestion du get sur la page de jeu
 *
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 */
rm.get.game = function(req, res){
	if(gameIds.indexOf(req.params.id) === -1)
		res.redirect('/');
	else
		res.sendFile('./server/html/gamescreen.html', {root:'./'});
};


/**
 * inscription - Fonction de gestion du get pour l'inscription
 *
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 */
rm.get.inscription = function(req,res){
	res.sendFile('./server/html/inscription.html', {root:'./'});
};


/**
 * connexion - Fonction de gestion du get pour la connexion
 *
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 */
rm.get.connexion = function(req, res){
	res.sendFile('./server/html/connexion.html', {root:'./'});
};


/**
 * deconnexion - Fonction pour déconnecter l'utilisateur
 *
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 */
rm.get.deconnexion = function(req, res){
	req.logout();
	req.flash('success', 'Vous êtes déconnecté');
	res.redirect('/');
};


/**
 * gameSaved - Fonction de récupération des parties sauvegardées
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 */
rm.get.gameSaved = function(req, res)
{
	if(req && req.session && req.session.passport && req.session.passport.user)
	{
		model.getSaves(req.session.passport.user).then(function(user)
		{
			let arr = [];
			user.gameSaved.forEach(function(val)
			{
				arr.push(val.nom);
			});
			res.send(JSON.stringify(arr));
		}).catch(function(e)
		{
			res.status(404).send("{}");
		});
	}else
	{
		res.status(401).send("{}");
	}
};


/**
 * gameExist - Permet de savoir si une partie existe
 *
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 */
rm.get.gameExist = function(req, res)
{
	if(req.params.id)
	{
		let r = rooms[req.params.id];
		if(r)
		{
			res.send("yes");
		}else
		{
			res.send("no");
		}
	}
};


/**
 * loadSave - Charge une partie pour qu'elle soit jouée en privé
 *
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 */
rm.get.loadSave = function(req, res)
{
	if(req && req.session && req.session.passport && req.session.passport.user && req.params.name)
	{
		if(!(req.session.passport.loadedSaves && req.session.passport.loadedSaves[req.params.name]))
		{
			model.destockSave(req.session.passport.user, req.params.name).then(function(game, err){
				if(game && game.gameSaved && game.gameSaved.length > 0 && game.gameSaved[0].board)
				{
					let id;
					do
					{
						id = utilities.generateRandomString("AZERTYUIOPQSDFGHJKLMWXCVBN0123456789", 9);
					}while(gameIds.indexOf(id) !== -1);
					gameIds.push(id);
					let room = new RoomInfo(id, JSON.stringify(game.gameSaved[0].board));
					room.id = id;
					rooms[id] = room;
					console.log("destocked : " + id);
					if(req.session.passport.loadedSaves === undefined)
						req.session.passport.loadedSaves = {};
					req.session.passport.loadedSaves[req.params.name] = id;
					res.send(id);
				}else
					res.status(500).send("");
			}).catch(function(err){
				console.error(err);
				res.status(500).send("");
			});
		}else
		{
			res.send(req.session.passport.loadedSaves[req.params.name]);
		}

	}
};


/**
 * username - Permet de récupérer le nom d'utilisateur lorsque l'on est connecté
 *
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 * @param {function} next Procahine fonction de gestion
 */
rm.get.username = function(req, res, next)
{
	let session;
	if(req && req.session && req.session.passport && req.session.passport.user)
	{
		if(req.query && req.query.token)
		{
			session = sessions.find(function(val)
			{
				if(val.id == req.query.token)
					return val;
			});
			if(session)
			{
				if(session.userId == req.session.passport.user)
				{
					if(session.username)
					{
						res.send(JSON.stringify({pseudo:session.username}));
					}
				}
			}
		}
		model.findUserById(req.session.passport.user).then(function(user, err){
			if(user)
			{
				session.userId = req.session.passport.user;
				session.username = user.pseudo;
				res.send(JSON.stringify({pseudo:user.pseudo}));
			}else
			{
				res.send(JSON.stringify({pseudo:undefined}));
			}
		}).catch(function(err){
			console.warn("Error getusername : " + err);
			res.send(JSON.stringify({pseudo:undefined}));
		});
	}
	else
	{
		res.send(JSON.stringify({pseudo:undefined}));
	}
};


// ============================== POST ==============================


/**
 * saveGame - Déclenche une sauvegarde en ligne de la partie
 *
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 */
rm.post.saveGame = function(req, res){
	if(req && req.session && req.session.passport && req.session.passport.user && req.params.id)
	{
		let room = rooms[req.params.id];
		if(room)
			model.stockSave({name : req.params.id +"-"+utilities.generateRandomString("0123456789", 5), board : room.board.toJsonState()}, req.session.passport.user);
	}
	res.redirect('/p/'+req.params.id);
};


/**
 * inscription - Gère une inscription d'un utiisateur
 *
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 */
rm.post.inscription = function(req, res){
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	var profileimage = 'noimage.jpg';
	if(req.file){
		console.log('uploading file..');
		profileimage = req.file.filename;
	} else {
		console.log('no file uploaded..');
	}

	//validation avec form-validator
	req.checkBody('name', 'le nom est requis!').notEmpty();
	req.checkBody('email', 'l\'email est requis!').notEmpty();
	req.checkBody('email', 'email invalide!').isEmail();
	req.checkBody('username', 'le nom d\'utilisateur est requis!').notEmpty();
	req.checkBody('password', 'le mot de passe est requis!').notEmpty();
	req.checkBody('password2', 'La confirmation du mot de passe est obligatoire!').notEmpty();
	req.checkBody('password2', 'les mots de passes ne sont pas les mêmes!').equals(req.body.password);

	var errors = req.validationErrors();

	if(errors) {
		res.sendFile('./server/html/inscription.html', {root: './', errors: errors});
		console.log(errors);

	} else {
		var newUser = new schemas.models.userModel({
			name: name,
			email: email,
			pseudo: username,
			password: password,
			profileimage: profileimage
		});
		//console.log(newUser);
		schemas.createUser(newUser, function(err, user){
			if(err) throw err;
			//console.log(user);
		});

		res.location('/');
		res.redirect('/');
	}
};


/**
 * connexion - Gère une connexion utilisateur
 *
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 */
rm.post.connexion = function(req, res) {
	req.flash('success', 'You are now logged in');
	res.redirect('/');
};

// ============================== 404 ==============================


/**
 * notFound - Fonction de gestion de l'erreur 404
 *
 * @memberof RouteManagement
 * @param {Object} req  Requète
 * @param {Object} res  Réponse
 * @param {function} next Prochaine fonction de gestion
 *
 */
rm.notFound = function(req, res, next) {
	res.redirect('/');
	console.log(res.statusCode + "-" + res.statusMessage + " " + req.method + " " + req._parsedUrl._raw);
};

module.exports = rm;
