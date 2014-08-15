
var Configurator = {};

Configurator.configure = function(db) {
  // REPLACE THIS WITH YOUR TEST INSTANCE SETTINGS
  var config = {
    host: "192.168.123.217"
  };
  // END REPLACE
  // Example overrideable config: {host: "localhost", port: 9090, adminport: 8002, ssl: false, auth: "digest", username: "admin",password: "admin", database: "mldbtest", searchoptions: {}, fastthreads: 10, fastparts: 100 }
  db.configure(config);
};

module.exports = Configurator;
