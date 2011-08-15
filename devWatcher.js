/**
 * Device watcher (extension for a counter router-like in CCNs)
 */

/*
 * Load modules
 */

var http = require("http"), url = require("url"), path = require("path"), fs = require("fs");

/*
* Parse arguments
*/

// Default port
var port = 8081;

// Example of default coordinates for device watchers
var tslab1Pos = {
	latitude : 59.404734,
	longitude : 17.944558
};
var tslab2Pos = {
	latitude : 59.405062,
	longitude : 17.943678
};

// List of device watchers
var dwList = {};

process.argv.forEach(function(val, index) {
	// Skip node and js file
	if(index > 1) {
		if(isNaN(val)) {
			// Set device watcher
			var arg = val.split("=");
			var addr = arg[0];
			var coords = arg[1].split(",");
			dwList[addr] = {
				latitude : parseFloat(coords[0]),
				longitude : parseFloat(coords[1])
			};
		} else {
			// Set local port
			port = val;
		}
	}
});

// Check if dwList is empty
if(Object.keys(dwList).length == 0) {
	// Default device watchers
	dwList["192.168.1.37:8081"] = tslab1Pos;
}

// Web server
var server = http.createServer(function(request, response) {
	// Check if the requested file exists.
	var uri = url.parse(request.url).pathname;
	var filename = path.join(process.cwd(), uri);
	path.exists(filename, function(exists) {
		if(!exists) {
			response.writeHeader(404);
			response.end("404 Not Found\n");
		} else {
			// Retrieve the file
			fs.readFile(filename, "binary", function(err, file) {
				if(err) {
					response.writeHeader(500);
					response.end(err + "\n");
				} else {
					// Get the mime type
					var getMimeType = require('simple-mime')('application/javascript');
					// Send the binary file
					response.writeHeader(200, {
						"Content-Type" : getMimeType(filename)
					});
					response.end(file, "binary");
				}
			});
		}
	});
});
server.listen(port);

//Create a Socket.IO instance, passing it the web server
var io = require('socket.io').listen(server);

// Config Socket.IO for production based on NODE_ENV environment.
// ex. > NODE_ENV=production node deviceWatcher.js
io.configure('production', function() {
	io.enable('browser client minification');
	io.enable('browser client etag');
	io.set('log level', 1);
});

// Accept connections from devices/browsers
io.sockets.on('connection', function(socket) {
	// Handler events from devices

	// Init
	socket.on('init', function(msg, reponse) {
		// Store the unique agent ID and the initial coords
		// Note: A device could have different agentIds for each browser
		socket.set('agentId', msg.id);
		socket.set('coords', msg.coords);
		// Send the list of closest device watchers
		reponse(dwList);
	});
	// Location update
	socket.on('location', function(msg, reponse) {
		socket.set('coords', msg.coords);
		reponse();
	});
	// User profile request
	socket.on('profile', function(msg, reponse) {
		// Send profiles request to all devices
		var socketIds = Object.keys(io.sockets.sockets);
		for(var i = 0; i < socketIds.length; i++) {
			var socketId = socketIds[i];
			var agentId = io.sockets.socket(socketId).store.data.agentId;
			if(agentId != msg.id) {
				io.sockets.socket(socketId).emit('profile', msg);
			}
		}
		reponse();
	});
	// Profile ack request
	socket.on('profileAck', function(msg, response) {
		// Send the response to the target device
		var socketIds = Object.keys(io.sockets.sockets);
		for(var i = 0; i < socketIds.length; i++) {
			var socketId = socketIds[i];
			var agentId = io.sockets.socket(socketId).store.data.agentId;
			if(msg.targetId === agentId) {
				// Send profile ack msg
				io.sockets.socket(socketId).emit('profileAck', msg);
			}
		}
		// Ack
		response();
	});
	// Device list request
	socket.on('devices', function(msg, response) {
		// Update the coordinates
		socket.set('coords', msg.coords);
		// Get the device list
		var devList = {};
		var socketIds = Object.keys(io.sockets.sockets);
		for(var i = 0; i < socketIds.length; i++) {
			// Don't send its own info
			var socketId = socketIds[i];
			var socketD = io.sockets.socket(socketId);
			// Check if socket disconnected
			if((socketId != socket.id) && !socketD.disconnected) {
				// Note: Agent id is the permanent unique id for a device,
				//       not the id property in socket.IO which is temporal
				var agentId = socketD.store.data.agentId;
				var coordinates = socketD.store.data.coords;
				if(agentId && coordinates) {
					devList[agentId] = {
						coords : coordinates
					};
				}
			}
		}
		// Send the device list as response
		response(devList);
	});
	// Accept request
	socket.on('accept', function(msg, response) {
		// Generate individual accept message
		var acceptMsg = {};
		acceptMsg["userId"] = msg.userId;
		acceptMsg["id"] = msg.id;
		// Send accept messages for each device
		var socketIds = Object.keys(io.sockets.sockets);
		for(var i = 0; i < socketIds.length; i++) {
			var socketId = socketIds[i];
			var agentId = io.sockets.socket(socketId).store.data.agentId;
			if(msg.devList[agentId]) {
				// Send accept msg with the id of the origin
				io.sockets.socket(socketId).emit('accept', acceptMsg);
			}
		}
		// Ack
		response();
	});
	// Accept ack request
	socket.on('acceptAck', function(msg, response) {
		// Send accept messages for each device
		var socketIds = Object.keys(io.sockets.sockets);
		for(var i = 0; i < socketIds.length; i++) {
			var socketId = socketIds[i];
			var agentId = io.sockets.socket(socketId).store.data.agentId;
			if(msg.targetId === agentId) {
				// Send accept ack msg
				io.sockets.socket(socketId).emit('acceptAck', msg);
			}
		}
		// Ack
		response();
	});
	// Migration request
	socket.on('migrate', function(msg, response) {
		// Update the coordinates
		socket.set('coords', msg.coords);
		// Migrate to the target device
		var socketIds = Object.keys(io.sockets.sockets);
		for(var i = 0; i < socketIds.length; i++) {
			var socketId = socketIds[i];
			var agentId = io.sockets.socket(socketId).store.data.agentId;
			if(agentId === msg.targetId) {
				io.sockets.socket(socketId).emit('migrate', msg);
			}
		}
		// Ack
		response();
	});
});
