/**Module des fonctions d'interaction avec la BDD
 * @module Model
 */
//var mongoose = require('mongoose');
//var userSchema = require('./userSchema.js').userSchema;
var mongooseModel = require('./userSchema.js').models;

/* Connexion au model, s'il n'existe pas, création auto */
//var mongooseModel = //mongoose.model('userModel', userSchema);


var model = {
	/** findUserById - Envoi une requete pour récupérer l'utilisateur ayant l'id spécifié
	 * @memberof Model
	 * @param {string} id Id de l'utilisateur
	 * @returns {Promise} Promesse de la requete
	 */
	findUserById : function(id)
	{
		return mongooseModel.userModel.findById(id);
	},
	/** user_save  - Sauvegarde un utilisateur
	 * @memberof Model
	 * @param {Object} data Utilisateur à sauvegarder
	 * */
	user_save : function(data){
		if(model.pseudo_exist(data.pseudo))
		{
			console.log("Erreur pseudo existant");
			return;
		}
		var stats = new mongooseModel.statsModel(
			{
				win:0,
				loose:0,
				nul:0
			}
		);

		var user = new mongooseModel.userModel(
			{
				pseudo : data.pseudo,
				password : data.password,
				email : data.email,
				stats : stats._id
			}
		);
		stats.isNew  = true;
		user.isNew = true;
		stats.save(function(err, saved){
			if (err) {
				console.error(err);
			}
		});
		user.save(function(err, saved){
			if (err) {
				console.error(err);
			}
			else
				console.log("Utilisateur ajouté !");
		});

	},

	/** user_change_pseudo - Permet de changer le pseudo d'un utilisateur
	 * @memberof Model
	 * @param {Object} user Utilisateur
	 * @param {string} new_pseudo Nouveau pseudo
	 * */
	user_change_pseudo : function(user, new_pseudo){
		if(model.pseudo_exist(new_pseudo))
		{
			console.log("Erreur pseudo existant");
			return;
		}
		mongooseModel.userModel.update(
			{
				pseudo: user.pseudo
			},
			{
				pseudo : new_pseudo
			},
			function(err)
			{
				if(err)
				{
					throw err;
				}
			}
		);
		console.log('Pseudo modifié !');
	},
	/** user_change_email - Permet de changer le mail d'un utilisateur
	 * @memberof Model
	 * @param {Object} user Utilisateur
	 * @param {string} new_email Nouveau mail
	 * */
	user_change_email : function(user, new_email){
		mongooseModel.userModel.update(
			{
				email : user.email
			},
			{
				email : new_email
			},
			function(err)
			{
				if(err)
				{
					throw err;
				}
			}
		);
		console.log('Email modifié !');
	},
	/** pseudo_exist - Vérifie si le pseudo existe
	 * @memberof Model
	 * @param {string} pseudo Pseudo à vérifier
	 * @returns {bool} true si le pseudo existe
	 * */
	pseudo_exist : function(pseudo){
		let res;
		mongooseModel.userModel.findOne({pseudo: pseudo}, function(err, result)
		{
			if(err)
				console.error(err);
			if(result)
				res = true;
			else
				res = false;
		});
		return res;
	},
	/** user_search_stats - Récupère les statistiques d'un joueur
	 * @memberof Model
	 * @param {string} pseudo Pseudo de l'utilisateur
	 * @returns {Promise} Promesse de la requete
	 * */
	user_search_stats : function(pseudo) {
		var query = mongooseModel.userModel.findOne({"pseudo":pseudo})
		.populate('stats')
		.exec(function(err, result){
			if (err)
			{
				throw err;
			}else
				return result.stats;
		});
		return query;
	},

	/** update_stats - Permet de mettre à jour les statistiques d'un utilisateur
	 * @memberof Model
	 * @param {string} pseudo Pseudo de l'utilisateur
	 * @param {Object} resultat Resultat de la partie pour l'utilisateur
	 */
	update_stats : function(pseudo, resultat) {
		var user;
		mongooseModel.userModel.findOne({pseudo : pseudo}, function(err, result)
		{
			if(err)
				console.error(err);
			if(result)
				user = result;
		});
		if(!user)
		{
			//console.error(`User ${pseudo} not found`);
			return;
		}
		if(resultat === 'win')
			user.stats.win++;
		if(resultat === 'loose')
			user.stats.loose++;
		if(resultat === 'nul')
			user.stats.nul++;
		mongooseModel.userModel.findByIdAndUpdate(
			user.stats._id,
			{
				win : user.stats.Win,
				loose : user.stats.Loose,
				nul :user.stats.Nul
			},
			function(err, raw)
			{
				if(err)
					console.error(err);
				else
					console.log(raw);
			}
		);
	},
	/** getSaves - Obtient la liste des parties sauvegardées
	 * @memberof Model
	 * @param {string} userid ID de l'utilisateur
	 * @returns {Promise} Promesse de la requete
	 */
	getSaves : function(userid)
	{
		var query = mongooseModel.userModel.findById(userid).populate('gameSaved').exec();
		return query;
	},

	/** stockSave - Permet de stocker une sauvegarde de partie dans la BDD
	 * @memberof Model
	 * @param {Object} new_save Nouvelle sauvegarde
	 * @param {String} pseudo Pseudo de l'utilisateur
	 * @returns {Object} Promesse de la requete
	 * */
	stockSave : function(new_save, pseudo) {
		/*
		var query = mongooseModel.userModel.findOne(
			{
				pseudo : pseudo
			}
			.populate('gameSaved')
			.exec(
				function(err, result)
				{
					if(err)
						console.error(err);
					else
						return result.gameSaved;
				}
			)
		);
		query.push(new_save);
		mongooseModel.userModel.update(
			{
				gameSaved : query.gameSaved
			}
		);*/
		try{
			var save_board = JSON.parse(new_save.board);
			if(save_board.turnColor && save_board.pieceList && save_board.moveHistory)
			{
				let save = new mongooseModel.saveModel(
					{
						nom:new_save.name,
						finish : false,
						board : save_board
					}
				);
				save.isNew = true;
				var query = save.save(function(err)
				{
					if(err)
						throw err;
					else
						query = mongooseModel.userModel.findOneAndUpdate({_id : pseudo}, {'$push' : {gameSaved : save._id}}, function(err, add){});
				});
			}

		}catch(e)
		{
			console.error("Erreur lors de la sauvegarde de board : " + e.message);
		}


		return query;
	},


	/** destockSave - Récupère une sauvegarde
	 * @memberof Model
	 * @param {string} id Id de l'utilisateur
	 * @param {string} nameGame Nom de la sauvegarde
	 * @returns {Promise} Promesse de la requete
	 * */
	destockSave : function(id, nameGame) {
		var query = mongooseModel.userModel.findOne(
			{
				_id : id
			}, 'gameSaved'
		)
		.populate({
			path : 'gameSaved',
			match : {nom : nameGame},
			limit : 1
		})
		.exec();
		return query;
	}
};
	/* */
//mongoose.connection.close();

module.exports = model;
	/* mongoose sauvegarde d'un utilisateur */
