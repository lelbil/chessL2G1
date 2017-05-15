/** Module des schemas de BDD
 * @module Schema*/
var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;

var bcrypt = require('bcryptjs');


mongoose.connect('manager:azerty@localhost:29123/chess', function(err) {
	if (err) {
		throw err;
	}
});

//var db = mongoose.connection;

var schemas = {};
/** Schema des pièces
 * @memberof Schema*/
schemas.Piece = new mongoose.Schema({

	pos : {
		x : {
			type : Number,
			required : true
		} ,
		y : {
			type : Number,
			required : true
		}
	},

	ptype : {
		type : String,
		required : true
	},

	color : {
		type : String,
		required : true
	},

	hasNeverMoved : {
		type : Boolean,
		required : true,
		default : true
	},
	onBoard : {
		type : Boolean,
		required : true,
		default : false
	},

	lastMoveIsDouble : {
		type : Boolean,
		default : false
	}

});
/** Schema de sauvegarde
 * @memberof Schema*/
schemas.SaveSchema = new mongoose.Schema({

	nom : {
		type : String,
		required : true/*,
		match : /^ [a-zA-Z0-9]$/*/
	},

	board : {
		pieceList : {
			/*type : [{
				type : String,
				pos:{x:Number,y:Number},
				color:String,
				onBoard:Boolean,
				hasNeverMoved:Boolean,
				lastMoveIsDouble:Boolean
			}]*/
			type : mongoose.Schema.Types.Mixed,
			required : true
		},

		turnColor : {
			type : String,
			required : true
		},

		moveHistory : {
			type : [String]
		}
	},

	finish : {
		type : Boolean
	}

});
/** Schema des utilisateurs
 * @memberof Schema*/
schemas.userSchema = new mongoose.Schema ({
	pseudo : {
		type 	: String,
		required : true,
		unique : true/*,
		match	: /^[a-zA-Z0-9-_]$/*/
	},
	email : {
		type 	: String,
		required: true,
		unique 	: true/*,
		match	: /^[a-zA-Z0-9.-_]+@[a-zA-Z0-9.-_]+$/*/
	},
	password : {
		type	: String,//Buffer,
		required: true
	},
	profileimage: {
		type: String
	},
	register : {
		type	: Date,
		default	: Date.now
	},
	stats : {
		type : mongoose.Schema.ObjectId,
		ref : 'statsmodel'
	},
	gameSaved : {
		type : [{type : mongoose.Schema.ObjectId, ref : 'savesmodel'}]
	}

});
/** Schema des statistiques
 * @memberof Schema*/
schemas.StatsSchema = new mongoose.Schema ({
	win : {
		type : Number,
		required : true,
		default : 0
	},

	loose : {
		type : Number,
		required : true,
		default : 0
	},

	nul : {
		type : Number,
		required : true,
		default : 0
	},

	play_white : {
		type : Number,
		required : true,
		default : 0
	},

	play_black : {
		type : Number,
		required : true,
		default : 0
	},
	user : {
		type : mongoose.Schema.ObjectId,
		ref : 'usersmodel'
	}
});

module.exports.schemas = schemas;
var models = {
	userModel : mongoose.model("usersmodel",schemas.userSchema),
	saveModel : mongoose.model("savesmodel",schemas.SaveSchema),
	statsModel : mongoose.model("statsmodel", schemas.StatsSchema),
	pieceModel : mongoose.model("piecemodel", schemas.Piece)
};
module.exports.models = models;


/**
 * getUserById - Récupère un utilisateur par son id
 *
 * @param {string} id       Id de l'utilisateur
 * @param {function} callback Callback
 * @memberof Schema*/
module.exports.getUserById = function(id, callback){
	models.userModel.findById(id, callback);
};


/**
 * getUserByUsername - Récupère un utilisateur par son pseudo
 *
 * @param {string} username Pseudo
 * @param {function} callback Callback
 * @memberof Schema*/
module.exports.getUserByUsername = function(username, callback){
	var query = {pseudo: username};
	models.userModel.findOne(query, callback);
};


/**
 * comparePassword - Compare les mots de passe
 *
 * @param {string} candidat Hash candidat
 * @param {string} hash     Hash stocké
 * @param {function} callback Callback
 * @memberof Schema*/
module.exports.comparePassword = function(candidat, hash, callback){
	bcrypt.compare(candidat, hash, function(err, isMatch){
		callback(null, isMatch);
	});
};


/**
 * createUser - Crée un nouvel utilisateur
 *
 * @param {Object} newUser Nouvel utilisateur
 * @param {function} callback Callback
 * @memberof Schema*/
module.exports.createUser = function(newUser, callback){
	bcrypt.genSalt(10, function(err, salt) {
		bcrypt.hash(newUser.password, salt, function(err, hash) {
			newUser.password = hash;
			newUser.isNew = true;
			newUser.save(callback);
		});
	});
};
