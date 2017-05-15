var Board = require("../../public/js/board.js");
var express = require('express');
var global = {};

global.gameIds = [];
global.sessions = [];
global.rooms = [];
global.userWaiting = [];
global.app = express();
global.server = require('http').createServer(global.app);
global.io = require('socket.io').listen(global.server);
/** Classe de stockage des informations de salon*/
global.RoomInfo = class RoomInfo {

 /**
  * Crée un nouveau stockage d'informations de salon
  *
  * @param {string} id    Id du salon
  * @param {string} state Etat du plateau à la création de la partie
  *
  */
	constructor(id, state)
	{

		this.id = id || "";
		this.type = (state)? "Private" : "Public";
		this.white = undefined;
		this.black = undefined;
		this.specs = [];
		this.board = new Board(state);
		this.promotionMove = undefined;
	}
};
/** Classe de stockage des informations de session*/
global.SessionInfo = class SessionInfo {

 /**
  * Crée un nouveau stockage des informations de session
  *
  * @param {string} id Id de session
  */
	constructor(id)
	{
		this.id = id;
		this.roomsSides = [];
		this.userId = undefined;
		this.username = "";
	}
};


/**
 * errorFormatter - Fonction de formatage des erreurs
 *
 * @param {string} param Paramètres
 * @param {string} msg   Message
 * @param {string} value Valeur
 *
 * @returns {Object} Erreur formatée
 */
global.errorFormatter = function(param, msg, value) {
	var namespace = param.split('.')
	, root    = namespace.shift()
	, formParam = root;

	while(namespace.length) {
		formParam += '[' + namespace.shift() + ']';
	}
	return {
		param : formParam,
		msg   : msg,
		value : value
	};
};


/**
 * messages - Callback pour les messages express
 *
 * @param {Object} req  requète
 * @param {Object} res  réponse
 * @param {function} next prochaine fonction de gestion
 *
 * @returns {type} Description
 */
global.messages = function (req, res, next) {
	res.locals.messages = require('express-messages')(req, res);
	next();
};

module.exports = global;
