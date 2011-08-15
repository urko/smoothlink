/**
 * Smoothlink: Device manager
 *
 * @author Urko Serrano
 * @version 0.1
 */

/**
 * Device manager: functional constructor.
 *
 * @param {Literal} params Initial parameters.
 */
var deviceManager = function(params) {

	var that = {}, currentDevice = params["currentDevice"], originId = false,
	// List of devices
	devices = {};

	// Public methods

	/**
	 * Get the list of devices according to their ids.
	 *
	 * @param {Array} deviceIds	Array of device ids.
	 * @return {Literal} devs	Returns the list of devices.
	 */
	that.getDevices = function(deviceIds) {
		// If deviceIds is empty, return all the devices.
		var devs = {};
		if( typeof deviceIds === 'undefined') {
			devs = devices;
		} else {
			for(var i = 0; i < deviceIds.length; i += 1) {
				if( typeof devices[deviceIds[i]] != 'undefined') {
					devs[deviceIds[i]] = devices[deviceIds[i]];
				}
			}
		}
		return devs;
	};
	
	/**
	 * Update the list of devices based on the given parameter.
	 * This method removes, adds or modifies the devices.
	 *
	 * @param {Literal} newDevices	The list of new devices.
	 */
	that.updateDevices = function(newDevices) {
		// Update new devices
		for(var devId in newDevices) {
			// Check if it was already discovered
			if(!!devices[devId]) {
				// Update coordinates
				devices[devId].setCoords(newDevices[devId].coords);
			} else {
				// Create device instance class
				var params = {
					id : devId,
					coords : newDevices[devId].coords
				};
				devices[devId] = device(params);
			}
		}
	};
	
	/**
	 * Get the current device id.
	 *
	 * @return {String} the id of the current device.
	 */
	that.getCurrentDevice = function() {
		return currentDevice;
	};
	
	/**
	 * Set the origin when a migration is performed.
	 *
	 * @param {String} newOriginId	Id of the origin device.
	 */
	that.setOriginId = function(newOriginId) {
		originId = newOriginId;
	};
	
	/**
	 * Get the origin id if a migration was performed.
	 *
	 * @return {String} the origin id of the last migration.
	 */
	that.getOriginId = function() {
		return originId;
	};
	
	/**
	 * Check if the device id belongs to a valid device object.
	 *
	 * @return {Boolean} if there is a valid device.
	 */
	that.valid = function(deviceId) {
		return !!devices[deviceId];
	};
	
	return that;
};
