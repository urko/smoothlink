/**
 * Smoothlink: Crypto library skeleton
 *
 * @author Urko Serrano
 * @version 0.1
 */

var cryptoLib = function() {

	var that = {};

	// Public methods

	/**
	 * Encrypt the user profile with the given password.
	 *
	 * @param {String} user		User profile stringified.
	 * @param {String} password	User password.
	 * @return {String} text encrypted.
	 */
	that.encrypt = function(user, password) {
		return sjcl.encrypt(password, user);
	};
	
	/**
	 * Decrypt the given user profile.
	 *
	 * @param {String} userEncrypted	User profile encrypted.
	 * @param {String} password			User password.
	 * @return {String} user profile
	 */
	that.decrypt = function(userEncrypted, password) {
		return sjcl.decrypt(password, userEncrypted);
	};
	
	return that;
};
