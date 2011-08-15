/**
 * Smoothlink: Position manager
 *
 * @author Urko Serrano
 * @version 0.1
 */

/**
 * Position manager: functional constructor.
 *
 * @param {Literal} params Initial parameters.
 */
var positionManager = function(params) {

	var that = {},
	// Current position object
	currentPos,
	// First time the location is set
	first = true, watchId, fallbackId,
	// Callback when location changes
	callback = params["callback"];

	/**
	 * Set the current position internally.
	 * 
	 * @param {Object} pos New device position.
	 */
	var setPosition = function(pos) {
		currentPos = pos;
		// Callback to indicate new position
		callback();
	};
	
	/**
	 * Fallback function to handling errors.
	 * 
	 * @param {Object} err	Error message. 
	 */
	var fallback = function(err) {
		// If the error was not by permission denied, disable high accuracy
		if(err.code != 1) {
			fallbackId = navigator.geolocation.watchPosition(
			// Success callback
			setPosition, function(err) {
				console.log("Geolocation error: " + err.message);
			}, {
				enableHighAccuracy : false,
				// Milliseconds to wait for a position
				timeout : 300000,
				// Allows the device to answer immediately with a cached position
				maximumAge : 60000
			});
		} else {
			console.log("Geolocation error: " + err.message);
		}
	};
	
	// Public methods

	that.init = function() {
		// Activate watch function
		if(navigator.geolocation) {
			/**
			 * Different methods to calculate location:
			 * 	- Triangulate your position based on your relative proximity to 3g towers.
			 *  - GPS location.
			 *  - WiFi.
			 */
			watchId = navigator.geolocation.watchPosition(
			// Callback
			setPosition,
			// Error handler
			fallback, {
				// Probably not supported by some devices
				enableHighAccuracy : true,
				// #milliseconds to wait for a position
				// timeout: 300000,
				timeout : 60000,
				// Allows the device to answer immediately with a cached position
				//maximumAge: 60000
				maximumAge : 120000
			});
		} else {
			console.log("Geolocation not supported");
		}
	};
	
	/**
	 * Return the latest coordinates (Position object)
	 *
	 * @return {Object} coords	Device coordinates.
	 */
	that.getCurrentPosition = function() {
		return currentPos || {
			coords : {
				latitude : 0,
				longitude : 0
			}
		};
	};
	
	/**
	 * Return the relative distance of the device with the given coordinate.
	 *
	 * @return {Int} distance	Relative distance in meters.
	 */
	that.distance = function(target) {
		var origin = that.getCurrentPosition();
		var lat1 = origin.coords.latitude;
		var lon1 = origin.coords.longitude;
		var lat2 = target.latitude;
		var lon2 = target.longitude;

		// Haversine formula: http://www.movable-type.co.uk/scripts/latlong.html
		var R = 6371;
		var dLat = ( lat2 - lat1) * Math.PI / 180;
		// To radians
		var dLon = ( lon2 - lon1) * Math.PI / 180;
		// To radians
		var lat1 = lat1 * Math.PI / 180;
		// To radians
		var lat2 = lat2 * Math.PI / 180;
		// To radians

		var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		var d = R * c;

		// To meters
		return d * 1000;	
	};
	
	return that;
};
