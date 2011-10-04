# Smoothlink

Smoothlink is a web-based cross-device interaction framework.

## Framework

The Smoothlink framework abstracts away the logic of device interaction for media content migration in real-time.
For instance, it allows to keep watching a movie from one device to another automatically regardless of
the underlying software platforms, device hardware or Internet access networks.

Smoothlink is designed to be cross-browser and it is based on open web standards with minimal user intervention.

The framework integrates locality-aware features to announce the presence of a device in the network.
The device discovery service is performed with the assistance of network entities named device watchers.

Multimedia streams are retrieved via the Swift content-centric transport protocol or external sources.
Smoothlink communicates with the transport protocol to update useful network information in a media migration.

### Platform

Web browser (requires HTML5: Media Elements, Geolocation, Local Storage)

### How to use the application example
	
	1. Run a device watcher.
	2. Edit example.html to set the media sources.
	3. Load example.html in the web browser of each device.

## Device watcher

Device watcher represents an entity that keeps track of devices in its surroundings.
It stores geographical position of devices as well as provides services for device discovery and migration.

A network of device watchers may be located in different spots, monitoring the presence of devices.

### Platform

OS (requires Socket.IO 0.8+, Node.JS 0.4.12+, Python 2.5.2+)

### How to use

	1. Edit devWatcher.js to include the device watcher information.
	2. Run the program.

	```js
	node devWatcher.js
	```

The application supports two optional arguments separated by blank spaces:
	- The port to run the device watcher (8081 by default).
	- A list of device watcher coordinates in the format:
		ip:port=latitude,longitude

Example with optional arguments:

```js
node devWatcher.js 80 127.0.0.1:8080=-27.08,-109.32 127.0.0.1:8081=39.915,116.397
```

Useful links
---
  - [libswift](http://libswift.org/)
  - [socket.io](http://socket.io/)
  - [nodejs.org](http://nodejs.org/)