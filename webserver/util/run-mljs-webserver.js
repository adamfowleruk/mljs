#!/usr/bin/env node
var servers = require("./mljs-webserver");
var env = require("../config/env.js");

//process.argv.forEach(function(val) {console.log("Param " + val);});
console.log("Param " + JSON.stringify(env));
var server = new servers.MLJSWebServer(env.webport,env.alertport,env.apppath,env.host,env.port,env.defaultpath);

// this will now run until we quit
