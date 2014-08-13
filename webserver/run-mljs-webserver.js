#!/usr/bin/env node
var servers = require("./mljs-webserver");

process.argv.forEach(function(val) {console.log("Param " + val);});
var server = new servers.MLJSWebServer(process.argv[2],process.argv[3],process.argv[4],process.argv[5],process.argv[6],process.argv[7]);

// this will now run until we quit
