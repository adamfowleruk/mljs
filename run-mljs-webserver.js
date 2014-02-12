#!/usr/bin/env node
var servers = require("mljs-webserver");

var server = new servers.MLJSServer(8080,8081,"http://localhost:8040","./mljsrest/src");

// this will now run until we quit
