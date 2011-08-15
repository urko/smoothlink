/**
 * Smoothlink: Device Watcher (client)
 *
 * @author Urko Serrano
 * @version 0.1
 */

/**
 * Device: functional constructor.
 *
 * @param {Literal} params	Initial parameters.
 */
var deviceWatcher = function(params) {

	var that = {},
	// Callback when a message is received
	callback = params["callback"],
	// Socket with the device watcher
	socketParams, socket,
	// Current device watcher
	currentDW,
	// Device watcher list
	dwList = {};


	/**
	 * Connect to a device watcher.
	 * 
	 * @url {String}	Device watcher address.
	 */
	var connectDW = function(url) {
		// Create the socket
		socketParams = {};
		socketParams["transports"] = ['websocket', 'xhr-polling', 'jsonp-polling'];
		socketParams['connect timeout'] = 10000;
		socketParams["tryTransportsOnConnectTimeout"] = true;
		socketParams["reconnect"] = true;
		socketParams['reconnection delay'] = 1000;
		socketParams['max reconnection attempts'] = 10;
		// Connect to the device watcher
		socket = io.connect(url, socketParams);
		// Set current device watcher address
		currentDW = socket.socket.options.host + ':' + socket.socket.options.port;
		// Handle profile request
		socket.on('profile', function(msg) {
			// Send the data to the callback
			callback('profile', msg);
		});
		// Handle profile ack request
		socket.on('profileAck', function(msg) {
			// Send the data to the callback
			callback('profileAck', msg);
		});
		// Handle accept request
		socket.on('accept', function(msg) {
			// Send the data to the callback
			callback('accept', msg);
		});
		// Handle accept ack request
		socket.on('acceptAck', function(msg) {
			// Send the data to the callback
			callback('acceptAck', msg);
		});
		// Handle migration request
		socket.on('migrate', function(msg) {
			// Send the data to the callback
			callback('migrate', msg);
		});
	};
	
	/**
	 * Check if an object literal is empty.
	 * 
	 * @param {Object} object	Object to be checked.
	 */
	var isEmpty = function(object) {
		var empty = true;

		for(var i in object) {
			if(object.hasOwnProperty(i)) {
				empty = false;
			}
		}
		return empty;
	}
	
	// Connect to the device watcher (same ip and port)
	connectDW(null);

	// Public methods

	/**
	 * Send a message to the device watcher.
	 *
	 * @param {String} msgType	Type of the message to be sent
	 * @param {Literal} msg		Parameters to be sent to the device watcher.
	 */
	that.send = function(msgType, msg) {
		socket.emit(msgType, msg, function(response) {
			switch (msgType) {
				case 'init':
					// Update the device watcher list
					// The device will keep the current device watcher connection
					//  until it moves and there is a better candidate
					for(var dw in response) {
						dwList[dw] = response[dw];
					}
					// If the current DW cannot retrieve its public IP
					//console.log(socket.socket.options.host);
					callback('init', null);
					break;
				case 'location':
					console.log('Location update in device watcher');
					break;
				case 'profile':
					console.log('User profile discovery request sent');
					break;
				case 'profileAck':
					console.log('User profile sent');
					break;
				case 'devices':
					// Send the data to the callback
					callback('devices', response);
					break;
				case 'accept':
					console.log('Accept request sent');
					break;
				case 'acceptAck':
					console.log('Accept ack sent');
					break;
				case 'migrate':
					console.log('Migration request sent');
					break;
				default:
					console.log('Unexpected response: ' + response);
			}
		});
	};
	
	/**
	 * Get the list of device watchers.
	 * 
	 * @return {Literal} Device watcher list.
	 */
	that.getDWs = function() {
		var dws = dwList;
		if(isEmpty(dws)) {
			dws = false;
		}
		return dws;
	};
	
	/**
	 * Return the current device watcher connected.
	 * 
	 * @return {String} Current device watcher.
	 */
	that.getCurrentDW = function() {
		return currentDW;
	};
	
	/**
	 * Connect with the given device watcher.
	 * 
	 * @param {String} newDW	New device watcher.
	 */
	that.connectDW = function(newDW) {
		// Disconnect from previous device watcher
		socket.disconnect();
		var url = 'http://' + newDW;
		connectDW(url);
		console.log("Connected to device watcher " + url);
	};
	
	return that;
};
