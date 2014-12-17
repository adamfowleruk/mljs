module.exports = {
  // matches MLJS initialisation JSON format, with extra (ignored by MLJS core) parameters
  "host": "localhost", "port": 8009, "adminport": 8002, "ssl": false,
  "auth": "digest", "username": "admin","password": "admin",
  "database": "Documents","modulesdatabase": "Documents-modules",
  "triggersdatabase": "Triggers",

  // non MLJS settings follow (used by mljsadmin script)
  "modulesport": 8008, "xccport": 8010,
  "defaultuser": "nobody",
  "webport": 5001, "alertport": 5002, "apppath": "./app", "defaultpath": "/workplace.html5"
};
