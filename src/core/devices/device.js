/**
 * Smoothlink: Device
 *
 * @author Urko Serrano
 * @version 0.1
 */

/**
 * Device: functional constructor.
 *
 * @param {Literal} params	Initial parameters.
 */
var device = function(params) {

	var that = {}, id = params["id"], coords = params["coords"];

	// Public methods

	/**
	 * Get the device id.
	 *
	 * @return {String} id	Device id.
	 */
	that.getId = function() {
		return id;
	};
	
	/**
	 * Get the device coordinates.
	 *
	 * @return {Coordinates} coords	Device coordinates.
	 */
	that.getCoords = function() {
		return coords;
	};
	
	/**
	 * Set the device coordinates.
	 *
	 * @param {Coordinates} coords	New coordinates.
	 */
	that.setCoords = function(newCoords) {
		coords = newCoords;
	};
	
	return that;
};
