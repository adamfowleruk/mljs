#!/usr/bin/env node
var servers = require("mljs-webserver");

var server = new servers.MLJSServer(8080,8081,"./mljsrest/src","localhost",8040);

// this will now run until we quit
