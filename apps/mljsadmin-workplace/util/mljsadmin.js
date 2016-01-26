var mljs = require('mljs'), env = require("../config/env.js"), parseArgs = require("minimist");
var fs = require('fs');
var Q = require("q");
var winston = require('winston');
var itob = require('istextorbinary');


// globals
if (undefined == Array.prototype.contains) {
  Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
      if (this[i] === obj) {
        return true;
      }
    }
    return false;
  };
}




// Command line administration tool for MarkLogic using MLJS and the REST API


var logger = new (winston.Logger)({
  transports: [
  new winston.transports.File({ filename: 'mljsadmin.log',level: 'debug' })
  ],
  exceptionHandlers: [
  new winston.transports.File({ filename: 'mljsadmin.log',level: 'debug' })
  ]
});


env.appname = env.database + "-rest-" + env.port; // fix for naming of rest api instance
var db = new mljs();
// override Winston logger for the command line output and hidden error messages (to a file)
db.setLogger(logger);
db.configure(env);
//console.log("ENV: " + JSON.stringify(env));

//var mdb = new mljs();
//mdb.setLogger(logger);
var menv = {};
for (var name in env) {
  menv[name] = "" + env[name];
}
menv.port = menv.modulesport;
menv.database = menv.modulesdatabase;
menv.appname = menv.database + "-rest-" + menv.port;
//mdb.configure(menv);
console.log("CONTENTENV: " + JSON.stringify(env));
console.log("MODULESENV: " + JSON.stringify(menv));


// TODO validate options. If any look dumb, then fail with usage message and examples
var usage = function(msg) {
  if (undefined != msg) {
    console.log("INVALID COMMAND: " + msg);
  }
  console.log("usage: mljsadmin install");
  console.log("       mljsadmin --install");
  console.log("       mljsadmin --install=restapi");
  console.log("       mljsadmin --install=modulesrestapi");
  console.log("       mljsadmin --install=extensions");
  console.log("       mljsadmin --install=modules [-m ./modules]");
  console.log("       mljsadmin --install=triggers");
  console.log("       mljsadmin update");
  console.log("       mljsadmin --update");
  console.log("       mljsadmin --update=restapi NOT IMPLEMENTED");
  console.log("       mljsadmin --update=dbconfig");
  console.log("       mljsadmin --update=modulesdbconfig");
  console.log("       mljsadmin --update=searchoptions");
  console.log("       mljsadmin --update=ontology [-o ./data/ontology.ttl] [-g ontologyGraphName]");
  console.log("       mljsadmin --update=workplace [-w ./data/mljs-workplace.xml]");
  console.log("       mljsadmin capture");
  console.log("       mljsadmin --capture=restapi NOT IMPLEMENTED");
  console.log("       mljsadmin --capture=dbconfig");
  console.log("       mljsadmin --capture=modulesdbconfig");
  console.log("       mljsadmin --capture=extensions NOT IMPLEMENTED");
  console.log("       mljsadmin --capture=searchoptions");
  console.log("       mljsadmin --capture=ontology [-o ./data/ontology.ttl] [-g ontologyGraphName]");
  console.log("       mljsadmin --capture=workplace [-w ./data/mljs-workplace.xml]");
  console.log("       mljsadmin --capture=triggers NOT IMPLEMENTED");
  console.log("       mljsadmin remove");
  console.log("       mljsadmin --remove");
  console.log("       mljsadmin --remove=restapi");
  console.log("       mljsadmin --remove=modulesrestapi");
  console.log("       mljsadmin --remove=extensions");
  console.log("       mljsadmin --remove=triggers");
  console.log("       mljsadmin load");
  console.log("       mljsadmin --load");
  console.log("       mljsadmin --load=initial");
  console.log("       mljsadmin --load=folder -f /some/base/folder");
  console.log("       mljsadmin clean [-i includeCollection1,includeCollection2] [-e excludeCollection3,excludeCollection4]"); // removes all content from database (including workplace)
  console.log("       mljsadmin reset "); // clean followed by update ontology, workplace, load initial
  console.log("       mljsadmin patch NOT IMPLEMENTED"); // patch mljs and mljsadmin to latest MASTER release
  console.log("       mljsadmin devpatch NOT IMPLEMENTED"); // patch mljs and mljsadmin to latest DEV release
  process.exit(1);
};

var crapout = function(msg) {
  console.log("FATAL ERROR: " + msg);
  console.log(" - Check mljsadmin.log for details");
  process.exit(1);
};


var targets = {

  // WORKS
  /**
  * Base install command, calls all other commands in order
  **/
  install: function(params) {
    //targets.install_restapi().then(targets.install_modulesrestapi()).then(targets.install_extensions());
    var funcs = [targets.install_restapi,function(){return Q.delay(10000);},targets.install_modulesrestapi,
      function(){return Q.delay(10000);},targets.install_modules,targets.install_extensions,targets.install_triggers,
      function(){return Q.delay(5000);},targets.update,targets.load_initial
      ]; // NB triggers done immediately after extensions incase any triggers need to run on loaded initial content
    funcs.reduce(Q.when, Q(params));
  },



  // WORKS
  /**
   * Create REST API instance. Optionally create database if it doesn't exist
   **/
  install_restapi:function() {
    var deferred = Q.defer();
    console.log(" - install_restapi()");
    //console.log("    - config: " + JSON.stringify(env));
    db.create(function(result) {
      if (result.inError) {
        console.log(JSON.stringify(result));
        crapout(result.detail);
      } else {
        // all ok
        console.log("    - SUCCESS");
        deferred.resolve("SUCCESS");
      }
    });
    return deferred.promise;
  },

  // WORKS
  install_modulesrestapi: function() {
    var deferred = Q.defer();
    console.log(" - install_modulesrestapi()");
    //console.log("    - config: " + JSON.stringify(modulesenv));
    db.create(menv,function(result) {
      if (result.inError) {
        crapout(result.error);
      } else {
        // all ok
        console.log("    - SUCCESS");
        deferred.resolve("SUCCESS");
      }
    });
    return deferred.promise;
  },

  // WORKS
  install_modules: function(params) {
    console.log(" - install_modules()");
    var folder = "./modules";
    if (undefined != params && undefined != params.m) {
      folder = params.m;
    }

    // loop through folder recursively and save modules to mdb

    var mdb = new mljs();
    mdb.setLogger(logger);
    mdb.configure(menv);

    var settings = {
      folder: folder, recursive: true, ignore: [".load.json", ".initial.json",".DS_Store"],
      prefix: "/", stripBaseFolder: true, collections: []
    };
    console.log("calling load folder: " + JSON.stringify(settings));
    return targets._loadFolder(mdb,folder,settings);
  },

  // WORKS
  install_extensions: function() {
    var deferred = Q.defer();
    console.log(" - install_extensions()");
    // install rest extensions in REST server
    // read data/restapi.json file for list of extensions
    var installModule = function(moduleName, methodArray, content) {
      var deferred3 = Q.defer();
      db.installExtension(moduleName,methodArray,content,function(result) {
        console.log("    - SUCCESS - " + moduleName);
        deferred3.resolve(moduleName);
      });
      return deferred3.promise;
    };
    var readFile = function(ext) {
      var deferred2 = Q.defer();
      fs.readFile('./rest-api/ext/' + ext.name + ".xqy", 'utf8', function (err,content) {
        if (err) {
          crapout(err);
        }
        installModule(ext.name,ext.methods,content).then(function(output) {
          deferred2.resolve(ext.name);
        });
      });
      return deferred2.promise;
    };
    fs.readFile('./data/restapi.json', 'utf8', function (err,data) {
      if (err) {
        crapout(err);
      }
      var json = JSON.parse(data);
      var exts = json.extensions;
      var promises = [];
      for (var e = 0,maxe = exts.length,ext;e < maxe;e++) {
        ext = exts[e];
        // process each extension and install
        // TODO check for xqy vs js implementation (V8 only)
        promises[e] = readFile(ext);
      }
      Q.all(promises).then(function(output) {
        deferred.resolve("SUCCESS - completed rest extension installation");
      });
    });
    return deferred.promise;
  },


  install_triggers: function(params) {
    var deferred = Q.defer();
    console.log(" - install_triggers()");
    // install rest extensions in REST server
    // read data/restapi.json file for list of extensions
    var installTrigger = function(triggerInfo) {
      var deferred3 = Q.defer();
      db.installTrigger(triggerInfo,function(result) {
        console.log("    - SUCCESS - installing trigger " + triggerInfo.name + " : " + triggerInfo.comment);
        deferred3.resolve(params);
      });
      return deferred3.promise;
    };
    fs.readFile('./data/restapi.json', 'utf8', function (err,data) {
      if (err) {
        crapout(err);
      }
      var json = JSON.parse(data);
      var triggers = json.triggers;
      var promises = [];
      if (undefined != triggers) {
        for (var e = 0,maxe = triggers.length,trg;e < maxe;e++) {
          trg = triggers[e];
          // process each trigger and install

          // MUST OVERWRITE DB NAME!
          trg.module.database = env.modulesdatabase;

          promises[e] = installTrigger(trg);
        }
      }
      Q.all(promises).then(function(output) {
        deferred.resolve(params);
      });
    });
    return deferred.promise;
  },


  /**
   * Generic update handler - calls all remaining configuration updating handlers
   **/
  update:function(params) {
    console.log(" - update()");
    //targets.update_ontology()
    //  .then(targets.update_workplace()).then(targets.update_searchoptions());
    var funcs = [targets.update_dbconfig,targets.update_modulesdbconfig,
      targets.update_workplace,targets.update_searchoptions,targets.update_ontology];
    return funcs.reduce(Q.when, params);
  },



  /**
   * Install REST API extensions, if they exist (rest-api/ext/*)
   **/
  update_restapi:function() {
    console.log(" - update_restapi()");
    console.log("   - Not yet implemented");
  },



  /**
   * Install ontology, if it exists (config/ontology.ttl) in Turtle format ('ontology' named graph) - optional custom name
   **/
  update_ontology:function(params) {
    var deferred = Q.defer();
    console.log(" - update_ontology()");
    var file = './data/ontology.ttl';
    if (undefined != params && undefined != params.o) {
      file = params.o;
    }
    var graphname = "ontology";
    if (undefined != params && undefined != params.g) {
      graphname = params.g;
    }
    console.log("    - loading ontology from file: " + file);
    //console.log("   - Not yet implemented");
    // TODO check if OPTIONAL ontology exists
    fs.readFile(file, 'utf8', function (err,data) {
      if (err) {
        // doesn't exist
        console.log("    - SKIPPING as Ontology file does not exist: " + file);
        deferred.resolve(params);
        //crapout(err);
      } else {
        db.saveGraph(data,graphname,{format: "turtle"},function(result) {
          if (result.inError) {
            crapout(result.detail);
          } else {
            // all ok
            console.log("    - SUCCESS installing ontology to graph: " + graphname);
            deferred.resolve("SUCCESS");
          }
        });
      }
    });
    return deferred.promise;
  },

  // WORKS
  /**
   * Install workplace file, if it exists (config/mljs-workplace.xml)
   **/
  update_workplace:function(params) {
    var deferred = Q.defer();
    console.log(" - update_workplace()");
    var file = './data/mljs-workplace.xml';
    if (undefined != params && undefined != params.w) {
      file = params.w;
    }
    console.log("    - Installing workplace xml file: " + file);
    //console.log("   - Not yet implemented");
    fs.readFile(file, 'utf8', function (err,data) {
      if (err) {
        crapout(err);
      }
      //console.log("data: " + data);
      //console.log("data.toString(): " + data.toString());
      db.saveWorkplace(data,function(result) {
        if (result.inError) {
          console.log(JSON.stringify(result));
          crapout(result.detail);
        } else {
          // all ok
          console.log("    - SUCCESS installing workplace xml file: " + file);
          deferred.resolve(params);
        }
      });
    });
    return deferred.promise;
  },

// WORKS
   /**
   * Install extra database configuration if it exists (config/ml-config.xml OR deploy/ml-config.xml (Roxy old files))
   **/
  update_dbconfig:function(params) {
    console.log(" - update_dbconfig()");
    return targets.__applyDatabasePackage(params,env.database,"contentdbconfig");
  },

// WORKS
  update_modulesdbconfig: function(params) {
    console.log(" - update_modulesdbconfig()");
    return targets.__applyDatabasePackage(params,env.modulesdatabase,"modulesdbconfig");
  },

  __applyDatabasePackage: function(params,name,filename) {
    var deferred = Q.defer();
    // read file
    var file = "./packages/databases/" + filename + ".xml"; // TODO check and skip
    console.log("    - reading package xml file: " + file);
    fs.readFile(file, 'utf8', function (err,data) {
      if (err) {
        //crapout(err);
        console.log("    - No package found for: " + filename + ", skipping");
        deferred.resolve(params);
      } else {
        console.log("    - Read file: " + file);
        // create/update package
        db.createPackage(name,data,function(result) {
          if (result.inError) {
            crapout(result.detail);
          } else {
            console.log("    - Created package: " + name);

            db.addDatabaseToPackage(name,name,data,function(result) {
              if (result.inError) {
                crapout(result.detail);
              } else {
                console.log("    - Added database to package: " + name);

                // apply package
                db.installPackage(name,function(result) {
                  if (result.inError) {
                    crapout(result.detail);
                  } else {
                    console.log("   - SUCCESS installed database package for " + name);

                    db.deletePackage(name,function(result) {
                      if (result.inError) {
                        crapout(result.detail);
                      } else {
                        deferred.resolve(params);
                      }

                    });
                  }
                });
              }
            });
          }
        });
      }
    });
    return deferred.promise;
  },


  // WORKS
  /**
  * Install REST API extensions, if they exist (rest-api/ext/*)
  **/
  update_searchoptions:function() {
    var deferred = Q.defer();
    console.log(" - update_searchoptions()");
    fs.readdir("./rest-api/config/options", function (err, files) {
      if (err) {
        crapout(err);
      }
      console.log("    - Found options: " + files);
      var saveWP = function(file) {
        var deferred2 = Q.defer();

        fs.readFile("./rest-api/config/options/" + file, 'utf8',function(err,data) {
          if (err) {
            crapout(err);
          }
          var pos = file.lastIndexOf(".");
          var ext = file.substring(pos + 1);
          var name = file.substring(0,pos);
          var format = "json";
          if (ext == "xml") {
            format = "xml";
          }
          //console.log("data: " + data);
          var doc = null;
          if ("json" == format) {
            doc = JSON.parse(data);
          } else {
            // XML
            doc = data; // db.textToXML(data);
          }
          db.saveSearchOptions(name,doc,function(result) {
            if (result.inError) {
              crapout(JSON.stringify(result) + " for " + file);
            } else {
              // all ok
              console.log("    - SUCCESS for " + file); // TODO may not work, may need to be shielded in function wrapper
              deferred2.resolve(file);
            }
          });
        });

        return deferred2.promise;
      };
      var promises = [];
      for (var f = 0,maxf = files.length,file;f < maxf;f++) {
        file = files[f];
        promises[f] = saveWP(file);
      }
      Q.all(promises).then(function(output) {
        deferred.resolve("All search options installed");
      }); // no fail() as we instantly end the app anyway
      //console.log("   - Not yet implemented");
    });
    return deferred.promise;
  },



/*
 * READ ONLY COMMANDS, FOR PRE-SHARING DEMOS
 */


 capture: function(params) {
   targets.capture_workplace(params); //.then(targets.capture_ontology());
   var funcs = [targets.capture_dbconfig,targets.capture_modulesdbconfig,targets.capture_workplace,targets.capture_ontology,targets.capture_searchoptions];
   return funcs.reduce(Q.when, Q(params)); // TODO pass in params
 },

  // WORKS
  /**
   * Capture workplace configuration
   **/
  capture_workplace: function(params) {
    var deferred = Q.defer();
    var file = './data/mljs-workplace.xml';
    if (undefined != params && undefined != params.w) {
      folder = params.w;
    }
    console.log(" - capture_workplace()");
    console.log("   - saving to file: " + file);
    db.workplace(function(result) {
      if (result.inError) {
        crapout(result.detail); // workplace extension not installed???
      } else {
        //console.log(JSON.stringify(result));
        // all ok
        fs.writeFile(file, result.body, function (err) {
          if (err) return crapout(err);
          console.log("    - SUCCESS capturing workplace to: " + file);
          deferred.resolve(params);
        });
      }
    });
    return deferred.promise;
  },

  // WORKS
  /**
   * Capture ontology in Turtle format ('ontology' named graph) - optional custom name
   **/
  capture_ontology: function(params) {
    var deferred = Q.defer();
    console.log(" - capture_ontology()");
    var file = './data/ontology.ttl';
    if (undefined != params && undefined != params.o) {
      file = params.o;
    }
    var graphname = "ontology";
    if (undefined != params && undefined != params.g) {
      graphname = params.g;
    }
    console.log("   - Storing ontology in file: " + file + " from ontology graph: " + graphname);
    db.graph(graphname,{format: "turtle"},function(result) {
      if (result.inError) {
        crapout(result.detail);
      } else {
        // all ok
        fs.writeFile(file, result.body, function (err) {
          if (err) return crapout(err);
          console.log("    - SUCCESS capturing ontology to file: " + file);
          deferred.resolve(params);
        });
      }
    });
    return deferred.promise;
  },


  __saveSearchOptions: function(params,name,uri) {
    var deferred = Q.defer();

    db.searchOptions(name,{format:"xml"},function(result) {
      if (result.inError) {
        crapout(result.detail);
      } else {
        fs.writeFile("./rest-api/config/options/" + name + ".xml", result.body, function (err) {
          if (err) return crapout(err);
          console.log("    - SUCCESS saving search options: " + name);
          deferred.resolve(params);
        });
      }
    });

    return deferred.promise;
  },

// WORKS
/**
 * Capture all search options (Packaging API?)
 **/
  capture_searchoptions: function(params) {
    var deferred = Q.defer();
    console.log(" - capture_ontology()");
    db.searchoptions(function(result) {
      if (result.inError) {
        crapout(result.detail);
      } else {
        var promises = [];
        var files = result.doc;
        for (var f = 0,maxf = files.length,file;f < maxf;f++) {
          file = files[f];
          promises[f] = targets.__saveSearchOptions(params,file.name,file.uri);
        }
        Q.all(promises).then(function(output) {
          console.log(" - All search options captured");
          deferred.resolve(params);
        }); // no fail() as we instantly end the app anyway
      }
    });
    return deferred.promise;
  },

// WORKS
/**
 * Capture MarkLogic database configuration (Packaging API?)
 **/
 capture_dbconfig: function(params) {
   return targets.__captureDatabase(params,env.database,"contentdbconfig");
 },

// WORKS
 capture_modulesdbconfig: function(params) {
   return targets.__captureDatabase(params,env.modulesdatabase,"modulesdbconfig");
 },

 __captureDatabase: function(params,name,filename) {
   var deferred = Q.defer();
   // get content database XML package file
   db.getDatabasePackage(name,function(result) {
     if (result.inError) {
       console.log(JSON.stringify(result));
       crapout(result.detail);
     } else {
       // add to correct package folder
       fs.writeFile("./packages/databases/" + filename + ".xml", result.body, function (err) {
         if (err) return crapout(err);
         console.log("    - SUCCESS saving database package: " + name + " as " + filename + ".xml");
         deferred.resolve(params);
       });
     }
   });
   return deferred.promise;
 },



/**
 * TODO NA - just create with our scripts??? - Capture MarkLogic app server configuration (Packaging API?)
 **/



 // WORKS
  remove: function(params) {
    //targets.remove_extensions().then(targets.remove_restapi()).then(targets.remove_modulesrestapi());
    var funcs = [targets.remove_triggers,targets.remove_extensions,targets.remove_restapi,function(){return Q.delay(10000);},targets.remove_modulesrestapi];
    funcs.reduce(Q.when, Q(params));
  },

  // WORKS
  remove_restapi: function() {
    var deferred = Q.defer();
    console.log(" - remove_restapi()");
    //console.log("    - config: " + JSON.stringify(env));
    db.destroy(function(result) {
      if (result.inError) {
        crapout(result.detail);
      } else {
        // all ok
        console.log("    - SUCCESS");
        deferred.resolve("SUCCESS");
      }
    });
    return deferred.promise;

  },

  // WORKS
  remove_modulesrestapi: function() {
    var deferred = Q.defer();
    console.log(" - remove_modulesrestapi()");
    var modulesenv = {};
    for (var name in env) {
      modulesenv[name] = env[name];
    }
    modulesenv.port = modulesenv.modulesport;
    modulesenv.database = modulesenv.modulesdatabase;
    modulesenv.appname = modulesenv.database + "-rest-" + modulesenv.port;
    //console.log("    - config: " + JSON.stringify(modulesenv));
    db.destroy(modulesenv,function(result) {
      if (result.inError) {
        crapout(result.detail);
      } else {
        // all ok
        console.log("    - SUCCESS");
        deferred.resolve("SUCCESS");
      }
    });
    return deferred.promise;

  },


  remove_triggers: function(params) {
    var deferred = Q.defer();
    console.log(" - remove_triggers()");
    // install rest extensions in REST server
    // read data/restapi.json file for list of extensions
    var removeTrigger = function(triggerName,triggersDatabase) {
      var deferred3 = Q.defer();
      db.removeTrigger(triggerName,triggersDatabase,function(result) {
        console.log("    - SUCCESS - removed trigger " + triggerName);
        deferred3.resolve(params);
      });
      return deferred3.promise;
    };
    fs.readFile('./data/restapi.json', 'utf8', function (err,data) {
      if (err) {
        crapout(err);
      }
      var json = JSON.parse(data);
      var triggers = json.triggers;
      var promises = [];
      if (undefined != triggers) {
        for (var e = 0,maxe = triggers.length,trg;e < maxe;e++) {
          trg = triggers[e];
          // process each extension and install
          // TODO check for xqy vs js implementation (V8 only)
          promises[e] = removeTrigger(trg.name,env.triggersdatabase);
        }
      }
      Q.all(promises).then(function(output) {
        deferred.resolve(params);
      });
    });
    return deferred.promise;
  },

  // WORKS
  remove_extensions: function() {
    var deferred = Q.defer();
    console.log(" - remove_extensions()");
    // install rest extensions in REST server
    // read data/restapi.json file for list of extensions
    var removeModule = function(moduleName) {
      var deferred2 = Q.defer();
      db.removeExtension(moduleName,function(result) {
        console.log("    - SUCCESS - " + moduleName);
        deferred2.resolve(moduleName);
      });
      return deferred2.promise;
    };
    var readFile = function(ext) {
      return removeModule(ext.name);
    };
    fs.readFile('./data/restapi.json', 'utf8', function (err,data) {
      if (err) {
        crapout(err);
      }
      var json = JSON.parse(data);
      var exts = json.extensions;
      var promises = [];
      for (var e = 0,maxe = exts.length,ext;e < maxe;e++) {
        ext = exts[e];
        // process each extension and remove
        promises[e] = readFile(ext);
      }
      Q.all(promises).then(function(output) {
        deferred.resolve("SUCCESS");
      });
    });
    return deferred.promise;
  },




  // WORKS
  load: function(params) {
    targets.load_initial(params);
  },

  // WORKS
  load_initial: function() {
    // check for ./data/.initial.json to see what folder to load
    // process as for load
    console.log(" - load_initial()");
    return targets._loadFolder(db,"./data",".initial.json");
  },

  // WORKS
  load_folder: function(args) {
    // check to see if we have a parameter folder or not
    console.log(" - load_folder()");
    // TODO handle trailing slash in folder name of args.f
    // TODO windows file / and \ testing
    return targets._loadFolder(db,args.f,".load.json");
  },

  // WORKS
  _loadFolder: function(db,folder,settingsFile,base_opt,inheritedSettings) {
    var base = base_opt || folder;
    console.log("    - " + folder);
    //console.log("settings passed: " + JSON.stringify(inheritedSettings));
    // find .load.json in the folder for settings
    var settings = {
      folder: folder || "./data", recursive: true, ignore: [".load.json", ".initial.json"],
      prefix: "/", stripBaseFolder: true, collections: []
      // TODO support linking .jpg and .xml (and XHTML) files automatically
      // TODO support <filename>.meta XML files alongside main files
    };
    var filename = settings.folder + "/" + (settingsFile || ".load.json");

    //console.log("settings defaults: " + JSON.stringify(settings));

    for (var name in inheritedSettings) {
      settings[name] = inheritedSettings[name];
    }

    //console.log("settings now: " + JSON.stringify(settings));

    // get base folder
    // process this folder with those settings, recursively

    var deferred = Q.defer();

    // load extra override settings
    fs.readFile(filename, 'utf8', function (err,data) {
      if (err) {
        //crapout(err);
        console.log("    - settings file doesn't exist: " + filename);
        // doesn't exist - ignore and carry on
      }
      var json = {};
      if (undefined != data) {
        //console.log("settings loaded: " + data);
        json = JSON.parse(data); // TODO handle parameters with RELATIVE file paths (needed? auto?)
      }
      for (var name in json) {
        if ("folder" == name) {
          settings.folder = base + "/" + json.folder; // WORKS
          base = settings.folder; // reset base
        } else {
          settings[name] = json[name];
        }
      }
      console.log("      - Folder now: " + settings.folder);

      //console.log("settings finally: " + JSON.stringify(settings));

    // list all files and folders and treat these as width first progress update percentages
    fs.readdir(settings.folder, function (err, files) {
      if (err) {
        crapout(err);
      }
      //console.log("    - Found options: " + files);
      var saveFile = function(file) {
        var deferred2 = Q.defer();
        console.log("      - Found: " + settings.folder + "/" + file);
        if (settings.ignore.contains(file)) {
          console.log("      - Not uploading: " + settings.folder + "/" + file + " (File in ignored list setting)");
          deferred2.resolve(settings.folder + "/" + file);
        } else {

          fs.readFile(settings.folder + "/" + file, function(err,data) {


            if (err) {
              //crapout(err);
              console.log("    - ERROR reading file prior to save: " + settings.folder + "/" + file);
              deferred2.resolve(settings.folder + "/" + file);
            } else {
              itob.isText(file,data,function (err,result) {
                if (result) {
                  data = data.toString(); // convert to string if utf8, otherwise leave as binary buffer
                }

              // actually upload the file once working

              var vf = settings.folder;
              if (settings.stripBaseFolder) {
                vf = settings.folder.substring(base.length + 1);
              }
              /*if (0 == vf.indexOf("/")) {
                vf = vf.substring(1);
              }*/
              if (0 != vf.indexOf("/") && vf.length != 0) {
                vf = "/" + vf;
              }
              var vff = file;
              /*if (0 == vff.indexOf("/")) {
                vff = vff.substring(1);
              }*/
              if (0 != vff.indexOf("/")) {
                vff = "/" + vff;
              }
              var uri = settings.prefix + vf + vff;
              if ("//"==uri.substring(0,2)) {
                uri = uri.substring(1); // remove extra slash at front
              }
              var cols = "";
              for (var c = 0, maxc = settings.collections.length,col;c < maxc;c++) {
                col = settings.collections[c];
                if (c > 0) {
                  cols += ",";
                }
                cols += col;
              }
              var props = {
              };
              if (undefined != cols && "" != cols) {
                props.collection=cols;
              }
              if (uri.substring(uri.length - 4) == ".xqy") {
                props.contentType = "application/xquery";
              }
              db.save(data,uri,props,function(result) {
                if (result.inError) {
                  // just log the message
                  console.log("    - ERROR saving file to uri: " + uri);
                } else {
                  console.log("    - SUCCESS " + settings.folder + "/" + file + " => " + uri + " (" + result.docuri + ")");
                }
                deferred2.resolve(settings.folder + "/" + file);
              });

              }); // end itob
            } // end error if
          });
        }

        return deferred2.promise;
      };


      var promises = [];
      files.forEach(function (file,idx) {
        fs.lstat(settings.folder+'/'+file,function(err,stats) {
          if(err) {
            crapout(settings.folder + "/" + file + " : " + err);
          }
          if(stats.isDirectory()) {
            //get_folder(path+'/'+file,tree[idx].children);
            //console.log("Folder: " + folder + " , settings.folder: " + settings.folder + " , next folder: " + settings.folder+"/"+file);
            if (settings.folder+"/"+file != settings.folder /*&& settings.folder != folder*/) { // . and .. in directory listing
              if (settings.recursive) {
                var news = {};
                for (var name in settings) {
                  if (name != "folder") {
                    news[name] = settings[name];
                  }
                }
                promises[idx] = targets._loadFolder(db,settings.folder+"/"+file,".load.json",base,news);
              } else {
                console.log("    - Not recursively processing folder: " + settings.folder);
              }
            }
          } else {
            promises[idx] = saveFile(file);
          }
        });
      });
      /*
      for (var f = 0,maxf = files.length,file;f < maxf;f++) {
        file = files[f];
        // TODO test for file or folder
        promises[f] = saveFile(file);
      }*/
      Q.all(promises).then(function(output) {
        deferred.resolve("Folder processed: " + folder);
      }); // no fail() as we instantly end the app anyway
    });

  }); // fs.readFile JSON


    return deferred.promise;
  },

  patch: function(params) {
    console.log(" - patch()");
    console.log("   - NOT IMPLEMENTED");

    // like devpatch, but from MASTER not DEV
    return targets.__patch(params,"MASTER");
  },

  devpatch: function(params) {
    console.log(" - devpatch()");
    console.log("   - NOT IMPLEMENTED");

    // Fetch latest MLJS Workplace app from GitHub DEV branch repo
    return targets.__patch(params,"DEV");
  },

  __patch: function(params,branch) {
    // fetch

    // unpack
    // copy /apps/workplace/src to app
    // copy /apps/workplace/src/app and /apps/workplace/src/roxy to modules/app and modules/roxy
    // copy /apps/workplace/rest-api content over


    // Fetch latest MLJS core NPM content from GitHub DEV branch
    // in src/js/mljs.js and src/js/lib
    // copy to ./node_modules/mljs/
    // need to copy over package.json?

    // NB may need to list and fetch individual files :( or download tar.gz packages and unpack :)

  },




  clean: function(params) {
    var deferred = Q.defer();

    // wipe all data
    console.log(" - clean()");
    var qb = db.createQuery();
    var cqt = [];
    if (undefined != params && undefined != params.e) {
      // exclude
      var cols = params.e.split(",");
      for (var c = 0,maxc = cols.length,col;c < maxc;c++) {
        col = cols[c];
        cqt.push(qb.collection(col));
      }
    }
    var iqt = [];
    if (undefined != params && undefined != params.i) {
      // exclude
      var cols = params.i.split(",");
      for (var c = 0,maxc = cols.length,col;c < maxc;c++) {
        col = cols[c];
        iqt.push(qb.collection(col));
      }
    }

    var q = qb.and([qb.not(cqt),qb.or(iqt)]);
    qb.query(q);

    var query = qb.toJson();

    db.deleteUsingSearch(query,function(result) {
      if (result.inError) {
        // just log the message
        console.log("    - ERROR deleting content using query: " + JSON.stringify(query) + " ERROR: " + JSON.stringify(result));
      } else {
        console.log("    - SUCCESS deleting content");
      }
      deferred.resolve(params);

    });

    return deferred.promise;
  },

  reset: function(params) {
    var funcs = [targets.clean,targets.update_ontology,targets.update_workplace,targets.load_initial];
    funcs.reduce(Q.when, Q(params));
  }





};







// DO THE THANG




var argv = parseArgs(process.argv.slice(2));
/* Notes on usage of minimist:-
$ node example/parse.js -x 3 -y 4 -n5 -abc --beep=boop foo bar baz
{ _: [ 'foo', 'bar', 'baz' ],
x: 3,
y: 4,
n: 5,
a: true,
b: true,
c: true,
beep: 'boop' }
*/
var targetGroups = ["install","update","capture","remove","load","devpatch","reset","clean"];
if (argv._.length == 1) { // just one non option parameter, and no --option= parameters
  var found = false
  for (var g = 0,maxg = targetGroups.length,group;!found && g < maxg;g++) {
    group = targetGroups[g];
    if (argv._[0] == group) {
      found = true;
      targets[group]();
    }
  }
  if (!found) {
  /*
  if ("install" == argv._[0]) {
    // do install
    targets.install();
  } else if ("update" == argv._[0]) {
    // do update
    targets.update();
  } else if ("capture" == argv._[0]) {
    // do capture
    targets.capture();
  } else if ("remove" == argv._[0]) {
    // do capture
    targets.remove();
  } else {
  */
    // fail with usage
    usage("Unknown instruction: '" + argv._[0] + "'");
  }
} else { // either multiple or zero option parameters, and potentially many --option= parameters
  //console.log("_length=" + argv._.length + " , argv length: " + argv.length);
  //if (argv._.length == 0) {
    // try -- parameters
    //if (argv.length == 2) { // empty _ parameter and just one other option
      var found = false;
      for (var g = 0,maxg = targetGroups.length,group;g < maxg;g++) {
        group = targetGroups[g];
        if (undefined != argv[group]) {
          if (true === argv[group]) {
            found = true;
            targets[group](argv);
          } else {
            var funcname = group + "_" + argv[group];
            var func = targets[funcname];
            if (undefined != func && 'function' == typeof(func)) {
              found = true;
              // call function
              func(argv);
            } else {
              usage("Unknown " + group + " target: '" + argv[group] + "'");
            }
          }

        } // end group function exists if
      } // end target groups or
      if (!found) {
        var name = "";
        for (var n in argv) {
          if ("_" != n) {
            name = n;
          }
        }
        usage("Unknown option: '" + name + "'");
      }
    //} else {
    //  usage("Only one --option=whatever parameter allowed");
    //}
  //} else {
    // fail
  //  usage("Only one instruction (E.g. 'install') OR one option (E.g. '--install=something') can be used");
  //}
}
