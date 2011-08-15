/**
 * Smoothlink: User manager
 *
 * @author Urko Serrano
 * @version 0.1
 */

/**
 * User manager: functional constructor.
 *
 * @param {Literal} params Initial parameters.
 */
var userManager = function(params) {

	var that = {},
	// Current user is not mandatory at this point
	currentUser = false,
	// Security Manager package
	securityMng, securityMngParams = {};
	
	// Security Manager
	securityMng = securityManager();

	// Public methods

	// Methods to manage users

	/**
	 * Create a new user and set it as a current user.
	 *
	 * @param {String} userId		User id.
	 * @return {Boolean} created 	If user was created.
	 */
	that.createUser = function(userId, password) {
		var created = false;
		// Create a new user profile
		if(!currentUser && !that.getUser()) {
			var userParams = {
				"userId" : userId
			};
			currentUser = CurrentUser(userParams);
			securityMng.setPassword(password);
			created = true;
		}
		return created;
	};
	
	/**
	 * Validate a user in the device
	 */
	that.validateUser = function(userId) {
		// Create new user without profile
		localStorage[userId] = true;
	};
	
	/**
	 * Check if a user is already validated
	 */
	that.userValid = function(userId) {
		return !!localStorage[userId];
	};
	
	/**
	 * Perform the log in for a valid user in the system.
	 *
	 * @param {String} userId	User id.
	 * @param {String} password	User password.
	 * @return {Boolean} logged If user is logged.
	 */
	that.login = function(userId, password) {
		var logged = false, userProfile = that.getUser(userId);

		// Check if the user is already logged
		if(!currentUser && userProfile) {
			// Perform log in with the encrypted user profile
			var userParams = securityMng.login(userProfile, password);
			if(!!userParams) {
				var myUser = CurrentUser(userParams);
				if(myUser) {
					currentUser = myUser;
					logged = true;
				}
			}
		}
		return logged;
	};
	
	/**
	 * Perform the log in for a remote user.
	 *
	 * @param {String} user	User profile encrypted.
	 * @return {Boolean} logged If user is logged.
	 */
	that.remoteLogin = function(user) {
		var logged = false;

		if(!currentUser && that.userValid(user.id)) {
			// Get the unencrypted remote profile
			var userParams = securityMng.login(user.profile, user.password);
			var newUser = CurrentUser(userParams);
			// Check if it has permission in the device
			if(newUser) {
				currentUser = newUser;
				logged = true;
			}
		}
		return logged;
	};
	
	/**
	 * Log out the current user.
	 */
	that.logout = function() {
		// Encrypt the user profile and store it
		var userId = currentUser.getId(), userEncrypted = securityMng.logout(currentUser);
		localStorage[userId] = userEncrypted;
		currentUser = null;
	};
	
	/**
	 * Clear the current user profile.
	 * 
	 * @param {String} userId	User id.
	 */
	that.clearProfile = function(userId) {
		localStorage[userId] = true;
		currentUser = null;
	};
	
	/**
	 * Retrieve the password of the current user.
	 * 
	 * @return {String} user password.
	 */
	that.getPassword = function() {
		return securityMng.getPassword();
	};
	
	/**
	 * Check if a current user is logged.
	 * 
	 * @return {Booleans} if a current user exists.
	 */
	that.userLogged = function() {
		return !!currentUser;
	};
	
	/**
	 * Retrieve the current user in the system.
	 * 
	 * @return {String} user id of the current user.
	 */
	that.getCurrentUser = function() {
		return currentUser.getId();
	};
	
	/**
	 * Return the encrypted user stringified.
	 *
	 * @param {String} userId		User id.
	 * @return {String} user profile encrypted.
	 */
	that.getUser = function(userId) {
		var userProfile = localStorage[userId];
		return (userProfile === "true") ? false : userProfile;
	};
	
	/**
	 * Get the mode of the current user.
	 * 
	 * @return {Boolean} Mode of the framework.
	 */
	that.getMode = function() {
		return currentUser.getMode();
	};
	
	/**
	 * Set the mode of the current user.
	 *
	 * @param {Boolean} mode Mode value
	 */
	that.setMode = function(mode) {
		currentUser.setMode(mode);
	};
	
	/**
	 * Delete the current user profile.
	 */
	that.removeUser = function() { 
		delete localStorage[currentUser.getId()];
		currentUser = null;
	};
	
	// Methods to manage the list of known devices for the current user

	/**
	 * Add the given device Id to the list of known devices.
	 *
	 * @param {String} deviceId Device id to be added.
	 */
	that.addKnownDevice = function(deviceId) {
		currentUser.addKnownDevice(deviceId);
	};
	
	/**
	 * Set the list of known devices in the current user.
	 *
	 * @param {Literal} deviceIds	List of known new devices.
	 */
	that.setKnownDevices = function(deviceIds) {
		currentUser.setKnownDevices(deviceIds);
	};
	
	/**
	 * Return the list of known devices.
	 *
	 * @return {Array} deviceIds	List of known devices.
	 */
	that.getKnownDevices = function() {
		return currentUser.getKnownDevices();
	};
	
	/**
	 * Return if the device is known.
	 *
	 * @param {Literal} devId	Device Id.
	 * @return {Boolean} if the device is known.
	 */
	that.isKnownDevice = function(devId) {
		var devs = currentUser.getKnownDevices();
		var name = devs[devId];
		return !!name || (devId === name);
	};
	
	/**
	 * Add a friendly name to a known device.
	 *
	 * @param {String} devId	Device Id.
	 * @param {String} name		User name.
	 */
	that.setDeviceName = function(devId, name) {
		var valid = that.isKnownDevice(devId);
		// Check if it is a known device
		if(valid) {
			currentUser.setDeviceName(devId, name);
		}
	};
	
	/**
	 * Get the name of a known device.
	 */
	that.getDeviceName = function(devId) {
		var value = devId;
		var valid = that.isKnownDevice(devId);
		// Check if it is a known device
		if(valid) {
			value = currentUser.getDeviceName(devId);
		}
		return value;
	};
	
	return that;
};
