/** Module d'authentification
 * @module Authentication*/

var schemas = require('./userSchema');

var auth = {};


/**
 * serializeUser - Sérialise l'utilisateur
 * @memberof Authentication
 * @param {userModel} user Utilisateur
 * @param {function} done Callback
 *
 */
auth.serializeUser = function(user, done) {
	done(null, user.id);
};


/**
 * deserializeUser - Deserialise un utilisateur
 * @memberof Authentication
 * @param {string} id   id de l'utilisateur
 * @param {function} done callback
 *
 */
auth.deserializeUser = function(id, done) {
	schemas.getUserById(id, function(err, user) {
		done(err, user);
	});
};


/**
 * strategyFunction - Stratégie d'authentification
 * @memberof Authentication
 * @param {string} username Pseudo
 * @param {string} password Mote de passe
 * @param {function} done     Callback
 *
 */
auth.strategyFunction = function(username, password, done){
	schemas.getUserByUsername(username, function(err, user){
		if(err) throw err;
		if(!user){
			return done(null, false, {message: 'Unknown User'});
		}

		schemas.comparePassword(password, user.password, function(err, isMatch){
			if(err) return done(err);
			if(isMatch){
				return done(null, user);
			} else {
				return done(null, false, {message:'Invalid Password'});
			}
		});
	});
};


module.exports = auth;
