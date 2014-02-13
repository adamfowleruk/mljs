#!/usr/bin/env node
var servers = require("./mljs-webserver");

var server = new servers.MLJSWebServer(5001,5002,"./mljsrest/src","192.168.123.145",8080);

// this will now run until we quit
