/**
 * Smoothlink: Net Wrapper skeleton
 *
 * @author Urko Serrano
 * @version 0.1
 */

// Callback function for JSON-P
var jsonCallback;

/**
 * Net Wrapper: functional constructor.
 *
 * @param {Literal} params Initial parameters.
 */
var netWrapper = function(params) {

	var that = {};

	// Public methods

	/**
	 * Get information from the transport protocol.
	 * 
	 * @param {String} Media source.
	 * @param {Function} Callback function.
	 */
	that.getNetInfo = function(src, callback) {
		// Set a timeout in case of delay.
		var t = setTimeout(function() {
			console.log('timeout to retrieve protocol info');
			callback(false);
		}, 5000);
		// Implement JSON-P response
		jsonCallback = function(netInfo) {
			// Clear the timeout previously set
			clearTimeout(t);
			// Make callback with the info given by the http gateway
			callback(netInfo);
		};
		// Http gateway request
		var request = src + "?info&callback=jsonCallback";
		// Set the script element to request info via JSON-P
		var handler = document.getElementById("netInfo");
		handler.setAttribute("src", request);
	};
	
	/**
	 * Set information to the underlying transport protocol.
	 * 
	 * @param {String} src 		Media source.
	 * @param {Object} netInfo	Network information.
	 */
	that.setNetInfo = function(src, netInfo) {
		// Check protocol version from origin
		if((netInfo.protocol.indexOf("swift") == 0) && netInfo.info.length) {
			// Http gateway request
			var request = src + "?info=" + netInfo.info.toString();
			console.log("Request sent: " + request);
			// Set the script element to send info via JSON-P
			var handler = document.getElementById("netInfo");
			handler.setAttribute("src", request);
		}
	};
	
	return that;
};
