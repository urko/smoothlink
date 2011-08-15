/**
 * Smoothlink: core
 *
 * @author Urko Serrano
 * @version 0.1
 */

if( typeof Smoothlink === 'undefined') {
	throw "[Smoothlink] The framework has not been initialized";
}

/**
 * Snippet for Object.create function
 */
if(!Object.create) {
	Object.create = function(o) {
		function F() {
		}
		F.prototype = o;
		return new F();
	};
}

/**
 * Snippet for Object.keys function
 */
if(!Object.keys) {
	Object.keys = function(o) {
		if(o !== Object(o))
			throw new TypeError('Object.keys called on non-object');
		var ret = [], p;
		for(p in o) {
			if(Object.prototype.hasOwnProperty.call(o, p)) {
				ret.push(p);
			}
		}
		return ret;
	};
}

/**
 * Framework front-end.
 *
 * In principle, the framework behaves in passive mode waiting for migration
 * requests or until a user logs in. Then, the framework turns into active.
 *
 * @param {Function} S	Smoothlink sandbox.
 */
Smoothlink.modules.core = function(S) {

	// Handler to place new HTMLMediaElements in DOM
	var mediaHandler = S.mediaHandler,
	// Handler to get the list of device ids requested
	devicesHandler,
	// Handler to accept a remote user
	acceptHandler,
	// Handler to notify the app when a user logs out
	logoutHandler,
	// Handler to notify the app when a user logs in
	loginHandler,
	// Timer for local device discovery
	loginTimer,
	// Network Manager package
	networkMng, networkMngParams = {},
	// Position manager package
	positionMng, positionMngParams = {},
	// Device manager package
	deviceMng, deviceMngParams = {},
	// User manager package
	userMng, userMngParams = {};

	// Callback functions

	/**
	 * Accept a migration if valid.
	 *
	 * @param {Literal} params migration parameters.
	 */
	var acceptMigration = function(params) {

		// Perform remote login if the user is accepted
		if(!userMng.remoteLogin(params.user)) {
			console.log("Remote user " + params.user.id + " could not be logged");
			return -1;
		}

		// Set origin id to migrate back
		deviceMng.setOriginId(params.id);

		// Check if the media element is already placed
		var media = document.getElementById(params.media.id);

		if(!media) {
			// Create the HTMLMediaElement
			media = document.createElement(params.media.type);
			media.id = params.media.id;
			// Create the list of sources
			for( i = 0; i < params.media.sources.length; i++) {
				// Create and append the source element
				var source = document.createElement("source");
				source.setAttribute("src", params.media.sources[i]);
				media.appendChild(source);
			}
			// Callback with the new media element
			mediaHandler(media);
			media = setMediaElement(media);
			// iPhone doesn't not set the current time properly only
			// fetching meta data. Also Safari does not set time offset
			// WebM properly. Force it while progress
			var setMTime = function() {
				try {
					this.currentTime = params.media.currentTime;
					if(this.currentTime == params.media.currentTime) {
						this.removeEventListener('progress', setMTime);
						console.log("Time offset set forcing");
					} else {
						console.log("Forcing time offset");
					}
				} catch (err) {
					console.log("Error forcing time offset. Trying ...");
				}
			};
			// Set the offset when metadata is loaded
			media.addEventListener('loadedmetadata', function() {
				// Add network info for the network wrapper
				if(!!params.netInfo) {
					// Add network info from the origin
					networkMng.setNetInfo(this.currentSrc, params.netInfo);
				}
				try {
					this.currentTime = params.media.currentTime;
					if(this.currentTime == params.media.currentTime) {
						console.log("Time offset set");
					} else {
						// Force setting time offset
						console.log("Trying to force time offset");
						// Try force method only with iOS devices
						var agent = navigator.userAgent.toLowerCase();
						var iOS = agent.match(/(iphone|ipod|ipad)/);
						if(iOS) {
							media.addEventListener('progress', setMTime, false);
						}
					}
				} catch (err) {
					console.log("Error while setting time offset. Trying force mode");
					// Force setting time offset
					media.addEventListener('progress', setMTime, false);
				}
			}, false);
		} else {
			// The video was already played. Update the current time (it was paused)
			// an return the same DOM element
			media.currentTime = params.media.currentTime;
			// Set net info when metadata is loaded
			media.addEventListener('loadedmetadata', function() {
				// Add network info for the network wrapper
				if(!!params.netInfo) {
					// Add network info from the origin
					networkMng.setNetInfo(this.currentSrc, params.netInfo);
				}
			}, false);
		}
		media.play();
	};
	
	/**
	 * Accept a list of devices if valid.
	 *
	 * @param {Literal} devParams	List of devices
	 */
	var parseDevices = function(devParams) {
		if(userMng.userLogged()) {
			// Set the new devices found
			deviceMng.updateDevices(devParams);
			devicesHandler(Object.keys(devParams));
		}
	};
	
	/**
	 * Parse a user profile request.
	 * 
	 * @param {Literal} profileParams	User profile request parameters
	 */
	var checkProfile = function(profileParams) {
		// Check if it's a profile response
		if(!!profileParams.user) {
			// Store the new user profile
			loginHandler(profileParams.user);
		} else {
			// Send the user profile if any
			var usrProfile = userMng.getUser(profileParams.userId);
			if(!!usrProfile) {
				var msg = {
					id : deviceMng.getCurrentDevice(),
					targetId : profileParams.id,
					user : {
						id : profileParams.userId,
						profile : usrProfile
					}
				};
				networkMng.sendProfile(msg);
			}
		}
	};
	
	/**
	 * Parse an accept message from a remote user.
	 * 
	 * @param {Literal} acceptParams	Accept user request parameters
	 */
	var acceptUser = function(acceptParams) {
		// Check if it's an accept ack
		if(!!acceptParams.targetId && userMng.userLogged()) {
			// Confirmation from a device
			// Check if the user corresponds with the current user
			if(userMng.getCurrentUser() === acceptParams.userId) {
				userMng.addKnownDevice(acceptParams.id);
				console.log("Device " + acceptParams.id + " added as known");
			} else {
				console.log("Accept ack received but for other current user " + acceptParams.userId);
			}
		} else {
			// Verify the user is not already known
			if(userMng.userValid(acceptParams.userId)) {
				S.validateUser(acceptParams);
			} else {
				// Accept msg from other device
				acceptHandler(acceptParams);
			}
		}
	};
	
	/**
	 * Update to a new device watcher if needed.
	 * It is called when a new location is set or after
	 * the init message response is received.
	 */
	var updateDW = function() {
		// Get the current position
		var pos = positionMng.getCurrentPosition();
		// Generate location message
		var msg = {
			id : deviceMng.getCurrentDevice(),
			coords : {
				latitude : pos.coords.latitude,
				longitude : pos.coords.longitude
			}
		};
		// Check if there are device watchers available
		var dwList = networkMng.getDWs();
		if(dwList) {
			// Check if the DW needs to be updated
			var currentDW = networkMng.getCurrentDW();
			var distance = positionMng.distance(dwList[currentDW]);
			var newDW = currentDW;
			for(var dw in dwList) {
				var newDistance = positionMng.distance(dwList[dw]);
				if(newDistance < distance) {
					distance = newDistance;
					newDW = dw;
				}
			}
			// Connect to the closest device watcher
			if(newDW != currentDW) {
				networkMng.connectDW(newDW);
				// Send the init msg to the new device watcher
				networkMng.init(msg);
			} else {
				// Update the loaction at DW
				networkMng.sendLocation(msg);
			}
		} else {
			// Send the init msg to the device watcher
			networkMng.init(msg);
		}
	};
	
	// Setup packages

	// Network Manager
	networkMngParams["callback"] = acceptMigration;
	networkMngParams["parseDevices"] = parseDevices;
	networkMngParams["checkProfile"] = checkProfile;
	networkMngParams["acceptUser"] = acceptUser;
	networkMngParams["updateDW"] = updateDW;
	networkMng = networkManager(networkMngParams);

	// Position Manager
	positionMngParams["callback"] = updateDW;
	positionMng = positionManager(positionMngParams);

	// Device Manager
	localStorage["deviceId"] = localStorage["deviceId"] || (new Date).getTime();
	deviceMngParams["currentDevice"] = localStorage["deviceId"];
	deviceMng = deviceManager(deviceMngParams);

	// User Manager
	userMng = userManager(userMngParams);

	// Private methods

	/**
	 * Clear the menu on the given media element.
	 *
	 * @param {Object} media	Media element.
	 */
	var clearMenu = function(media) {
		// Remove the device list if any
		var devList = document.getElementById("list_" + media.id);
		while(devList.hasChildNodes()) {
			devList.removeChild(devList.lastChild);
		}
		var menu = document.getElementById("menu_" + media.id);
		// Disable migration menu
		menu.style.display = "none";
	};
	
	/**
	 * Function used to choose the device to migrate to.
	 */
	var chooseDevices = function() {
		// Check if a user is logged in
		if(!userMng.userLogged()) {
			console.log("No current user");
			return -1;
		}
		var media = this;
		// Check auto mode
		if(userMng.getMode()) {
			// Get the list of close devices
			S.getDevices(function(devs) {
				var targetDevice = false;
				var distance = Number.MAX_VALUE;
				// Select the closest known device
				for(var devId in devs) {
					// Check if the device fulfills the requirements
					var dist = devs[devId].distance;
					if((dist < distance) && userMng.isKnownDevice(devId)) {
						distance = dist;
						targetDevice = devId;
					}
				}
				if(!!targetDevice) {
					S.migrate(media, devId);
				}
			});
		} else {
			// Get the device list
			S.getDevices(function(devs) {
				var m = document.getElementById("menu_" + media.id);
				var devList = document.getElementById("list_" + media.id);
				// If no close device, don't show menu
				if(Object.keys(devs).length > 0) {
					// For video elements, check if fullscreen
					if(!!media.webkitSupportsFullscreen) {
						// Disable fullscreen (Useful for iOS mobile devices)
						media.webkitExitFullscreen();
					}
					// Enable migration menu
					m.style.display = "inherit";
				}
				// Add devices on the menu
				for(var devId in devs) {
					// Add item to the menu list
					var item = document.createElement('li');
					devList.appendChild(item);
					item.id = devId;
					// If known, display the friendly name
					if(userMng.isKnownDevice(devId)) {
						var name = userMng.getDeviceName(devId);
						item.innerHTML = name + " - " + devs[devId].distance + "m.";
					} else {
						item.innerHTML = devId + " - " + devs[devId].distance + "m.";
					}
					// Add the event listeners
					item.addEventListener('click', function(event) {
						// Check if the selected device is known
						if(userMng.isKnownDevice(this.id)) {
							// Clear menu
							clearMenu(media);
							S.migrate(media, this.id);
						} else {
							// Ask for permission to the remote device
							var devices = {};
							devices[devId] = devs[devId];
							S.setKnownDevices(devices);
						}
					}, false);
					// Event to colour a device if waiting for permission
					item.addEventListener('mouseover', function(event) {
						if(userMng.isKnownDevice(this.id)) {
							this.style['color'] = "#4BE046";
						}
					}, false);
				}
			});
		}
	};
	
	/**
	 * Adapt a media elements for migration.
	 * 
	 * @param {Object} mediaOld	Media element to be adapted.
	 */
	var setMediaElement = function(mediaOld) {
		// Wrap media element in a div and append menu
		var wrapper = document.createElement('div');
		var mediaCloned = mediaOld.cloneNode(true);
		wrapper.appendChild(mediaCloned);
		wrapper.className = "sl_wrapper";
		mediaOld.parentNode.replaceChild(wrapper, mediaOld);
		var media = mediaCloned;

		// Set the div menu
		var menu = document.createElement('div');
		menu.id = "menu_" + media.id;
		menu.className = "sl_menu";
		media.parentNode.appendChild(menu);
		
		// Add title and dev list elements
		var title = document.createElement('h3');
		title.innerHTML = "Migration: target devices";
		menu.appendChild(title);
		var list = document.createElement('ul');
		list.id = "list_" + media.id;
		menu.appendChild(list);

		// iOS does not allow video in canvas neither touch events on video
		var agent = navigator.userAgent.toLowerCase();
		var iOS = agent.match(/(iphone|ipod|ipad)/);
		// Show the menu at the bottom for audio elements and iOS
		if(iOS || (media.nodeName.toLowerCase() === 'audio')) {
			menu.style.position = "inherit";
		}

		// Add the event listeners
		media.addEventListener('pause', chooseDevices, false);
		media.addEventListener('play', function() {clearMenu(this)
		}, false);
		// Customize the media element (override attributes)
		media.setAttribute("controls", "controls");
		media.setAttribute("preload", "metadata");

		return media;
	};
	
	// Public methods

	/**
	 * Migrate the media to the target deviceId.
	 *
	 * @param {Object} media	HTMLMediaElement to be migrated.
	 * @param {String} targetId	Id of the target device.
	 */
	S.migrate = function(media, targetId) {

		// Check if the target device is valid and there is current user
		if(deviceMng.valid(targetId) && userMng.userLogged()) {

			// Get the list of sources within the media tag
			var srcs = media.childNodes;
			var sources = [];
			for( i = 0; i < srcs.length; i++) {
				// For some reasons, filter the nodes
				if(!!srcs[i].src) {
					sources.push(srcs[i].src);
				}
			}

			// Retrieve current position
			var position = positionMng.getCurrentPosition();
			var latit = position.coords.latitude;
			var longit = position.coords.longitude;

			// The current device has to be added on the list of current devices
			var myCurrentDevice = deviceMng.getCurrentDevice();
			userMng.addKnownDevice(myCurrentDevice);

			// Logout the current user from the origin device
			var userId = userMng.getCurrentUser();
			var userPass = userMng.getPassword();
			userMng.logout();

			// Create migration message
			var msg = {
				id : deviceMng.getCurrentDevice(),
				coords : {
					latitude : latit,
					longitude : longit
				},
				targetId : targetId,
				user : {
					id : userId,
					password : userPass,
					profile : userMng.getUser(userId)
				},
				media : {
					type : media.nodeName,
					id : media.id,
					sources : sources,
					currentTime : media.currentTime
				}
			};
			// Clear the local user profile
			userMng.clearProfile(userId);
			// Request the migration to the network manager
			networkMng.requestMigration(msg, media.currentSrc);
			
		} else {
			console.log("Device " + targetId + " is not valid");
		}
	};
	
	/**
	 * Migrate the media to the previous origin if any.
	 *
	 * @param {Object} media	HTMLMediaElement to be migrated.
	 */
	S.migrateBack = function(media) {
		// Check if there is a previous origin
		var target = deviceMng.getOriginId();
		if(!!target) {
			S.migrate(media, target);
		}
	};
	
	/**
	 * Init method
	 */
	S.init = function() {
		// Create netInfo script element
		var netInfo = document.createElement('script');
		netInfo.id = "netInfo";
		// Append to the html body
		document.childNodes[1].appendChild(netInfo);
		// Init position manager
		positionMng.init();
		// Set default user permission policy
		acceptHandler = function(accept) {
			// Reject all user's permission requests
			console.log("Remote user " + accept.userId + " on device " + accept.id + " rejected (default)");
		};
	};
	
	// Methods to manage content

	/**
	 * Scan DOM for HTMLMediaElement and customize them.
	 */
	S.scanMediaElements = function() {
		// Video elements
		var videos = document.getElementsByTagName('video');
		for(var i = 0; i < videos.length; i++) {
			setMediaElement(videos[i]);
		}
		// Audio elements
		var audios = document.getElementsByTagName('audio');
		for(var i = 0; i < audios.length; i++) {
			setMediaElement(audios[i]);
		}
	};
	
	/**
	 * Clear the controls of the HTMLMediaElement.
	 */
	S.clearMediaControls = function() {
		// If the app layer wants to customize the media controls, deactivate
		// the pause event listener in all the HTMLMediaElements within DOM

		// Video elements
		var videos = document.getElementsByTagName('video');
		for(var i = 0; i < videos.length; i++) {
			// Remove the event listener when user click pause button
			videos[i].removeEventListener('pause', chooseDevices);
		}
		
		// Audio elements
		var audios = document.getElementsByTagName('audio');
		for(var i = 0; i < audios.length; i++) {
			// Remove the event listener when user click pause button
			audios[i].removeEventListener('pause', chooseDevices);
		}
	};
	
	/**
	 * Set a handler for HTMLMediaElment.
	 *
	 * @param {Function} callback	handler to place HTMLMediaElement.
	 */
	S.getContent = function(callback) {
		mediaHandler = callback;
	};
	
	// Methods to manage devices

	/**
	 * Request the list of the closest devices and activate the callback handler.
	 *
	 * @param {Function} 	callback	Callback when a new list is received.
	 * @param {Boolean}		allDevs		Request known and unknown devices (optional).
	 */
	S.getDevices = function(callback, allDevs) {
		// Check if a user is logged in
		if(!userMng.userLogged()) {
			console.log("No current user");
			return -1;
		}
		// If no parameter given, request only known devices
		devicesHandler = function(devIds) {
			var all = ( typeof allDevs === "undefined") ? true : allDevs;
			if(!all) {
				// Filter the list to show only known devices
				var knownDevs = userMng.getKnownDevices();
				var onlyKnown = function(dev, i, devs) {
					return !!knownDevs[dev];
				};
				devIds = devIds.filter(onlyKnown);
			}
			// Generate the info for each device
			var devices = deviceMng.getDevices(devIds);
			var devList = {};
			for(var devId in devices) {
				// Calculate relative distance
				var dist = positionMng.distance(devices[devId].getCoords());
				devList[devId] = {
					distance : dist
				};
			}
			callback(devList);
		};
		// Retrieve current position
		var position = positionMng.getCurrentPosition();
		var latit = position.coords.latitude;
		var longit = position.coords.longitude;

		// Create request message
		var msg = {
			coords : {
				latitude : latit,
				longitude : longit
			}
		};

		// Add also the unkown devices. Request closer devices and store them
		networkMng.requestDevices(msg);
	};
	
	/**
	 * Set the list of known devices in the current user.
	 *
	 * @param {Literal} newDevices	List of new known devices.
	 */
	S.setKnownDevices = function(newDevices) {
		// Check if a user is logged in
		if(!userMng.userLogged()) {
			console.log("No current user");
			return -1;
		}
		// Check which devices are new
		var oldDevList = userMng.getKnownDevices();
		var reqDevices = {};
		for(var devId in newDevices) {
			// Send accept message if new
			if(!oldDevList[devId]) {
				reqDevices[devId] = devId;
			}
		}
		// Create request message
		var msg = {
			id : deviceMng.getCurrentDevice(),
			userId : userMng.getCurrentUser(),
			devList : reqDevices
		};
		// Send accept messages to all new device.
		// Devices will be added when ack is received.
		networkMng.requestAccept(msg);
	};
	
	/**
	 * Add or set a name for a known device.
	 *
	 * @param {Object} device	Id of known device.
	 * @param {Object} name		Name to be set for the device.
	 */
	S.setDeviceName = function(device, name) {
		// Check if a user is logged in
		if(!userMng.userLogged()) {
			console.log("No current user");
			return -1;
		}
		userMng.setDeviceName(device, name);
	};
	
	// Methods to manage users

	/**
	 * Create a new user in the framework.
	 *
	 * @param {String} 		userId		User id.
	 * @param {String}		password	User password
	 * @return {Boolean} 	created	Returns true if the user is created.
	 */
	S.createUser = function(userId, password) {
		// Rely upon the user manager
		return userMng.createUser(userId, password);
	};
	
	/**
	 * Log the user in the framework.
	 *
	 * @param {String} userId		Unique user id.
	 * @param {String} password		User password.
	 * @param {Function} callback	Function callback.
	 * @return {Boolean} logged		Returns if the user has been logged in.
	 */
	S.login = function(userId, password, callback) {
		var logged = false;
		// Check local user profile
		logged = userMng.login(userId, password);
		if(logged) {
			callback();
		} else {
			// Search for user profile among close devices
			loginHandler = function(user) {
				if(userId === user.id) {
					user.password = password;
					if(userMng.remoteLogin(user)) {
						// Clear timer for user profile discovery
						clearTimeout(loginTimer);
						callback();
					}
				}

			}
			var myUser = userId;
			var msg = {
				id : deviceMng.getCurrentDevice(),
				userId : myUser
			};
			networkMng.requestUser(msg);
			// Set a time in case user profile is not found in the network
			loginTimer = setTimeout(function() {
				S.createUser(userId, password);
				callback();
			}, 2000);
		}
	};
	
	/**
	 * Log out the current user.
	 */
	S.logout = function() {
		// Clear origin for migration back
		deviceMng.setOriginId(false);
		// Rely upon the user manager
		userMng.logout();
		logoutHandler();
	};
	
	/**
	 * Event handler when a user logs out.
	 * 
	 * @param {Function} callback	Function callback.
	 */
	S.onLogout = function(callback) {
		logoutHandler = callback;
	};
	
	/**
	 * Remove the current user on the user list.
	 */
	S.removeUser = function() {
		// Rely upon the user manager
		userMng.removeUser();
	};
	
	/**
	 * Handler to accept a new user.
	 *
	 * @param {Object} callback	Callback function to accept a remote user
	 */
	S.acceptUser = function(callback) {
		// The msg includes the user Id and the device Id where it comes from {userId,id}
		acceptHandler = callback;
	};
	
	/**
	 * Validate a user on the user list
	 *
	 * @param {Literal} msg	Msg with userId and deviceId
	 */
	S.validateUser = function(msg) {
		userMng.validateUser(msg.userId);
		// Send accept ack message
		msg['targetId'] = msg.id;
		msg.id = deviceMng.getCurrentDevice();
		networkMng.validate(msg);
	};
	
	// Methods to manage the framework

	/**
	 * Check if the framework is in auto-mode.
	 * 
	 * @return {Boolean} auto	Returns if the framework is in auto-mode.
	 */
	S.isAuto = function() {
		// Check if a user is logged in
		if(!userMng.userLogged()) {
			console.log("No current user");
			return -1;
		}
		return userMng.getMode();
	};
	
	/**
	 * Set the auto-mode
	 *
	 * @param {Boolean} mode	Value of the auto-mode.
	 */
	S.setAuto = function(mode) {
		// Check if a user is logged in
		if(!userMng.userLogged()) {
			console.log("No current user");
			return -1;
		}
		userMng.setMode(mode);
	};
	
	/**
	 * Return the id of the current device using the user agent.
	 * 
	 * @return {String} id	Returns the device id.
	 */
	S.viewId = function() {
		return deviceMng.getCurrentDevice();
	};
	
	/**
	 * Return the origin id if the current device has received
	 * a migration request.
	 * 
	 * @return {String} originId	Returns the origin id if exists.
	 */
	S.viewOriginId = function() {
		return deviceMng.getOrigin();
	};
};
