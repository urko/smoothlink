/**
 * Smoothlink: global namespace object.
 *
 * @author Urko Serrano
 * @version 0.1
 */

/**
 * Global constructor.
 *
 * @param {Array} modules			Additional modules.
 * @param {Function} mediaHandler	Handler for HTMLMediaElement.
 * @param {Function} callback		Callback when initial modules are loaded.
 */
var Smoothlink = function() {

	var S = this,
	// Turn arguments into an array
	args = Array.prototype.slice.call(arguments),
	// Last argument is the callback function
	callback = args.pop(),
	// Handler to place new HTMLMediaElement in DOM
	mediaHandler = args.pop(),
	// Extra modules are passed as an array
	modules = args[0];

	// Check arguments
	if((!callback || typeof callback != 'function') || (modules && typeof modules != 'object')) {
		throw "[Smoothlink] Usage: Smoothlink({modules}, {mediaHandler}, callback)";
	}

	// Check if the browser is capable to run the framework
	if(!S.supportHTML5()) {
		throw "[Smoothlink] browser does not support some HTML5 features";
	}

	// Check that the function was really called as a constructor
	if(!(this instanceof Smoothlink)) {
		return new Smoothlink(modules, mediaHandler, callback);
	}

	if(!modules) {
		// No modules means "only core" with basic modules
		modules = ["core"];
	} else if(modules === '*') {
		// Use all modules available
		modules = Smoothlink.MODULES;
	} else {
		// Check unknown modules
		for(var i = 0; i < modules.length; i += 1) {
			var module = modules[i], found = false;
			for(var j = 0; j < Smoothlink.MODULES.length; j += 1) {
				var myModule = Smoothlink.MODULES[j];
				if(module === myModule) {
					found = true;
				}
			}
			if(!found) {
				throw "[Smoothlink] Module " + module + " cannot be loaded";
			}
		}
		// Add given modules + core
		modules = ["core"].concat(modules);
	}

	// Private properties
	S.callback = callback;
	S.mediaHandler = mediaHandler;
	S.modules = modules;
	S.unloadPkgs = Smoothlink.PACKAGES.length;

	// Add internal core packages
	for(var i = 0; i < Smoothlink.PACKAGES.length; i += 1) {
		// Load the js files
		var pkg = Smoothlink.PACKAGES[i];
		var path = pkg.split("/");
		var pkgId = path[path.length - 1];
		// Check if the package is already loaded
		if(document.getElementById(pkgId) == null) {
			// Create the DOM element
			var script = document.createElement("script");
			script.id = pkgId;
			// Check if it is an external package
			if(pkg.indexOf("ext") === 0) {
				script.src = pkg.substring(4);
			} else {
				script.src = 'src/' + pkg + '.js';
			}
			script.type = 'text/javascript';
			// When the js file will be loaded, initiate it
			script.addEventListener('load', function() {
				// Simple hack to perform the callback
				S.unloadPkgs -= 1;
				// When all packages are loaded, include the external modules
				if(!S.unloadPkgs) {
					// Add external modules and perform callback
					S.addModules(S.modules);
				}
			}, false);
			// Add the new module in DOM
			var firstScript = document.getElementsByTagName('script')[0];
			firstScript.parentNode.insertBefore(script, firstScript);
		} else {
			// Discard the module because it was already included
			S.unloadPkgs -= 1;
		}
	}
}

// Prototype properties
var proto = {
	name : "Smoothlink ",
	version : "0.1",

	/**
	 * Return the Smoothlink version.
	 *
	 * @return {String} name	Smoothlink version.
	 */
	getName : function() {
		return this.name + this.version;
	},
	/**
	 * Check if the browser has all the features to run the framework.
	 *
	 * @return {Boolean} supported	True if the browser has all the desired html5
	 * features.
	 */
	supportHTML5 : function() {
		// HTML5 video support
		var video = !!document.createElement('video').canPlayType;
		// Geolocation support
		var geo = !!navigator.geolocation;
		// Local storage support
		var storage;
		try {
			// Only need it for a bug in older versions of Firefox
			// when cookies are disabled
			storage = 'localStorage' in window && window['localStorage'] !== null;
		} catch(e) {
			storage = false;
		}
		return video && geo && storage;
	},
	/**
	 * Set up the framework
	 */
	setup : function() {
		var S = this;
		// Init the framework and customize HTMLMediaElements
		S.init();
		S.scanMediaElements();
	},
	/**
	 * Add modules in the framework and callback when done.
	 *
	 * @param {Object} modules	Modules to be loaded.
	 */
	addModules : function(modules) {
		var S = this;
		S.unloadModules = modules.length;
		// Load the js files
		for(var i = 0; i < modules.length; i += 1) {
			var module = modules[i];
			// Check if the module is already loaded
			if(document.getElementById(module) == null) {
				// Create the DOM element
				var script = document.createElement("script");
				script.id = module;
				script.src = 'src/' + module + '/' + module + '.js';
				script.type = 'text/javascript';
				// When the js file will be loaded, initiate it
				script.addEventListener('load', function() {
					// Load the module
					Smoothlink.modules[this.id](S);
					// Simple hack to perform the callback
					S.unloadModules -= 1;
					if(!S.unloadModules) {
						// All modules loaded, setup Smoothlink
						S.setup();
						S.callback(S);
					}
				}, false);
				// Add the new module in DOM
				var firstScript = document.getElementsByTagName('script')[0];
				firstScript.parentNode.insertBefore(script, firstScript);
			} else {
				// Discard the module
				S.unloadModules -= 1;
			}
		}
	},
	/**
	 * Set the handler to place the HTMLMediaElement
	 *
	 * @param {Object} mediaHandler	Handler for HTMLMediaElements.
	 */
	setMediaHandler : function(mediaHandler) {
		var S = this;
		S.mediaHandler = mediaHandler;
	}
};

// Load the prototype
Smoothlink.prototype = proto;

// Internal and external packages
Smoothlink.PACKAGES = ["ext//socket.io/socket.io.js", "ext/src/ext/sjcl.js", "network/deviceWatcher", "network/netWrapper", "network/networkManager", "location/positionManager", "core/devices/device", "core/devices/deviceManager", "security/cryptoLib", "security/securityManager", "core/users/user", "core/users/currentUser", "core/users/userManager"];

// Modules available to be loaded
Smoothlink.MODULES = ["core"];
// Modules loaded in Smoothlink
Smoothlink.modules = {};
