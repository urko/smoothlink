/**
 * Smoothlink: User
 *
 * @author Urko Serrano
 * @version 0.1
 */

/**
 * User: functional constructor.
 *
 * @param {Literal} params	Initial parameters.
 */
var user = function(params) {

	var that = {},
	// User id
	id = params["userId"],
	// List of known devices by the user
	knownDevices = params["knownDevices"] || {},
	// Automode (false by default)
	auto = params["auto"] || false;

	// Public methods

	that.knownDevices = knownDevices;
	that.auto = auto;

	/**
	 * Return the user id.
	 */
	that.myId = function() {
		return id;
	};
	
	return that;
};
