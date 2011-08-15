/**
 * Smoothlink: Security manager
 *
 * @author Urko Serrano
 * @version 0.1
 */

var securityManager = function() {

	var that = {},
	// Crypto library
	crypto = cryptoLib(),
	// Current user's password
	currentPassword;

	// Public methods

	/**
	 * Perform the log in access for a user.
	 *
	 * @param {Object} userEncrypted	User profile encrypted.
	 * @param {String} password			User password.
	 * @return {Object} user			User profile unencrypted or null.
	 */
	that.login = function(userEncrypted, password) {
		var user = null, userText;
		// Throw sjcl.exception.corrupt if password incorrect.
		try {
			userText = crypto.decrypt(userEncrypted, password);
			user = JSON.parse(userText);
			currentPassword = password;
		} catch (err) {
			// Invalid password
			console.log("Invalid password: " + err);
		}
		return user;
	};
	
	/**
	 * Log out the current user.
	 *
	 * @param {Object} user		Unencrypted user.
	 * @return {String} user profile encrypted.
	 */
	that.logout = function(user) {
		// Convert user profile into plaintext
		var userText = JSON.stringify(user);
		//var userText = JSON.stringify(user);
		// Rely upon the crypto library
		return crypto.encrypt(userText, currentPassword);
	};
	
	/**
	 * Retrieve the password of the current user.
	 * 
	 * @return {String} User password.
	 */
	that.getPassword = function() {
		return currentPassword;
	};
	
	/**
	 * Set the user password.
	 * 
	 * @param {String} newPassword New user password.
	 */
	that.setPassword = function(newPassword) {
		currentPassword = newPassword;
	};
	
	return that;
};
