/**
 * Smoothlink: Current user
 *
 * @author Urko Serrano
 * @version 0.1
 */

/**
 * Current user: functional constructor (inherited from user).
 *
 * @param {Literal} params	Initial parameters.
 */
var CurrentUser = function(params) {

	var that = {}, myUser = user(params);

	// Object.create not working in Opera
	that = Object.create(myUser);

	// Public methods

	/**
	 * Add the given device Id to the list of known devices.
	 *
	 * @param {String} deviceId Device Ids to be added.
	 */
	that.addKnownDevice = function(deviceId) {
		// Only update if does not exist before to keep
		// the friendly name in case
		if(!that.knownDevices[deviceId]) {
			that.knownDevices[deviceId] = deviceId;
		}
	};
	
	/**
	 * Set the list of known devices in the current user.
	 *
	 * @param {Literal} deviceIds	List of known new devices.
	 */
	that.setKnownDevices = function(deviceIds) {
		that.knownDevices = deviceIds;
	};
	
	/**
	 * Set a friendly name for a known device.
	 *
	 * @param {Object} devId
	 * @param {Object} name
	 */
	that.setDeviceName = function(devId, name) {
		that.knownDevices[devId] = name;
	};
	
	
	/**
	 * Get the name of a known device.
	 * 
	 * @param {devId}	Device Id.
	 */
	that.getDeviceName = function(devId) {
		// Could be a friendly name or the device id
		return that.knownDevices[devId];
	};
	
	/**
	 * Get all known devices of the current user.
	 * 
	 * @return {Literal} List of known devices.
	 */
	that.getKnownDevices = function() {
		return that.knownDevices;
	};
	
	/**
	 * Retrieve the id of the current device.
	 * 
	 * @return {String} Current user id.
	 */
	that.getId = function() {
		return that.myId();
	};
	
	/**
	 * Get the mode of the framework according to
	 * the current user.
	 * 
	 * @return {Boolean} if the framework is in auto mode.
	 */
	that.getMode = function() {
		return that.auto;
	};
	
	/**
	 * Set the mode of the framework.
	 * 
	 * @param {Boolean} mode New mode for the framework.
	 */
	that.setMode = function(mode) {
		that.auto = mode;
	};
	
	/**
	 * Method to allow JSON to stringify the class.
	 */
	that.toJSON = function() {
		return {
			userId : that.myId(),
			knownDevices : that.knownDevices,
			auto : that.auto
		};
	};
	
	return that;
};
