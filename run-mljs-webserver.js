#!/usr/bin/env node
var servers = require("./mljs-webserver");

var server = new servers.MLJSWebServer(5001,5002,"./mljsrest/src","192.168.123.157",8122);

// this will now run until we quit
