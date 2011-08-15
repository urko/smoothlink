/**
 * Smoothlink: Network manager
 *
 * @author Urko Serrano
 * @version 0.1
 */

/**
 * Network management: functional constructor.
 *
 * @param {Literal} params	Initial parameters.
 */
var networkManager = function(params) {

	var that = {},
	// Callback when a migration is requested.
	callback = params["callback"],
	// Callback to parse the device and update it
	parseDevices = params["parseDevices"],
	// Callback to check if a user profile is stored locally
	checkProfile = params["checkProfile"],
	// Callback to accept a remote user
	acceptUser = params["acceptUser"],
	// Callback to update the device watcher if needed
	updateDW = params["updateDW"],
	// Device watcher package
	dWatcher, dWatcherParams = {},
	// Network wrapper module
	net;

	// Callback functions

	/**
	 * Parse a message coming from the device watcher.
	 *
	 * @param {String}	msgType	Message to be parsed.
	 * @param {String}	params	Params from the device watcher.
	 */
	var parseMessage = function(msgType, params) {

		switch(msgType) {
			case 'init':
				// Update the device watcher if needed
				updateDW();
				break;
			case 'profile':
				// Check local user profile
				checkProfile(params);
				break;
			case 'profileAck':
				// Store the new user profile
				checkProfile(params);
				break;
			case 'accept':
				// Accept remote user
				acceptUser(params);
				break;
			case 'acceptAck':
				// User accepted
				acceptUser(params);
				break;
			case 'migrate':
				// Accept migration an create the HTMLMediaElement
				callback(params);
				break;
			case 'devices':
				// Parse the list of devices
				parseDevices(params);
				break;
			default:
				// Unexpected msg
				throw "Unexpected msg: " + msgType;
		}
	};
	
	// Setup packages

	dWatcherParams["callback"] = parseMessage;
	dWatcher = deviceWatcher(dWatcherParams);

	// Network wrapper
	net = netWrapper();

	// Public methods

	/**
	 * Initial message sent to the device watcher.
	 *
	 * @param {Literal} msg	Init message.
	 */
	that.init = function(msg) {
		dWatcher.send('init', msg);
	};
	
	/**
	 * Send message to update location at device watcher.
	 *
	 * @param {Literal} msg	Location message.
	 */
	that.sendLocation = function(msg) {
		dWatcher.send('location', msg);
	};
	
	/**
	 * Request a user profile to the device watcher.
	 *
	 * @param {Literal} msg	User profile request message.
	 */
	that.requestUser = function(msg) {
		dWatcher.send('profile', msg);
	};
	
	/**
	 * Response for a user profile request.
	 *
	 * @param {Literal} msg	User profile request message
	 */
	that.sendProfile = function(msg) {
		dWatcher.send('profileAck', msg);
	};
	
	/**
	 * Request the list of devices to the device watcher.
	 *
	 * @param {Literal} msg	Devices request message.
	 */
	that.requestDevices = function(msg) {
		/*
		 * List is requested to the device watcher,
		 * but no list is returned for this method.
		 *
		 * Instead, the framework should receive a message
		 * from the device watcher with that info.
		 */
		dWatcher.send('devices', msg);
	};
	
	/**
	 * Request to accept the current user in other devices.
	 *
	 * @param {Literal} msg	Accept request message.
	 */
	that.requestAccept = function(msg) {
		/*
		 * The framework should receive a message
		 * from the device watcher with that info.
		 */
		dWatcher.send('accept', msg);
	};
	
	/**
	 * Reply accept msg of a user in other device
	 *
	 * @param {Literal} msg	Ack accept message
	 */
	that.validate = function(msg) {
		/*
		 * The framework should receive a message
		 * from the device watcher with that info.
		 */
		dWatcher.send('acceptAck', msg);
	};
	
	/**
	 * Request a migration to a target device.
	 *
	 * @param {Literal} msg			Migration msg.
	 * @param {Boolean} currentSrc	Current media source
	 */
	that.requestMigration = function(msg, currentSrc) {
		// Check if the media source comes from a http local gateway
		var netUsed = currentSrc.match(/(127.0.0.1|localhost)/);
		if(!!netUsed) {
			// Retrieve network info to add it in migration msg
			net.getNetInfo(currentSrc, function(netInfo) {
				msg["netInfo"] = netInfo;
				dWatcher.send('migrate', msg);
			});
		} else {
			dWatcher.send('migrate', msg);
		}
	};
	
	/**
	 * Get the list of device watchers.
	 * 
	 * @return {Literal} the device watcher list.
	 */
	that.getDWs = function() {
		return dWatcher.getDWs();
	};
	
	/**
	 * Get the ip of the current device watcher.
	 * 
	 * @return {String} the current device watcher.
	 */
	that.getCurrentDW = function() {
		return dWatcher.getCurrentDW();
	};
	
	/**
	 * Connect to a new device watcher.
	 * 
	 * @param {String} The new device watcher address.
	 */
	that.connectDW = function(newDW) {
		dWatcher.connectDW(newDW);
	};
	
	/**
	 * Set network info.
	 * 
	 * @param {String} src 		Source of the media content.
	 * @param {Object} netInfo	Network information.
	 */
	that.setNetInfo = function(src, netInfo) {
		// Check if the source comes from a http local gateway
		var netUsed = src.match(/(127.0.0.1|localhost)/);
		if(netUsed) {
			net.setNetInfo(src, netInfo);
		}
	};
	
	return that;
};
