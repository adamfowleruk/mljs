var basic = require("./lib/basic-wrapper"),
    digest = require("./lib/digest-wrapper");

// DEFAULTS

var defaultdboptions = {
  host: "localhost", port: 8008, ssl: false, auth: "digest", username: "admin",password: "admin", database: "mldbtest", searchoptions: {}, fastthreads: 10, fastparts: 100
};

// INSTANCE CODE

// MLDB DATABASE OBJECT

var self;
var mldb = function(dboptions) {
  self = this;
  this.dboptions = (dboptions || defaultdboptions)
  
};

module.exports.init = function(opts) {
  return new mldb(opts);
};

/**
 * Does this database exist?
 */
mldb.prototype.exists = function(callback_opt) {
  
};

/**
 * Creates the database and rest server if it does not already exist
 */
mldb.prototype.create = function(callback_opt) {
  
};

/**
 * Destroys the database and rest api instance
 */
mldb.prototype.destroy = function(callback_opt) {
  
};

/**
 * Fetches a document with the given URI
 */
mldb.prototype.get = function(docuri,callback_opt) {
  
};

/**
 * Saves new docs with GUID-timestamp, new docs with specified id, or updates doc with specified id
 * NB handle json being an array of multiple docs rather than a single json doc
 */
mldb.prototype.save = function(json,docuri_opt,props_opt,callback_opt) {
  if (undefined == callback_opt && undefined == props_opt && typeof(docuri_opt)=="function") {
    callback_opt = docuri_opt;
    docuri_opt = undefined;
  }
  
  // TODO
};

/**
 * Updates the document with the specified uri by only modifying the passed in properties.
 * NB May not be possible in V6 REST API elegantly - may need to do a full fetch, update, save
 */
mldb.prototype.merge = function(json,docuri,callback_opt) {
  
};

/**
 * Deleted the specified document
 */ 
mldb.prototype.delete = function(docuri,callback_opt) {
  
};
mldb.prototype.remove = mldb.prototype.delete; // Convenience method for people with bad memories like me

/**
 * Returns all documents in a collection, optionally matching against the specified fields
 * No need to wrap in fast(), that is handled by the MarkLogic server
 */
mldb.prototype.collect = function(collection,fields_opt,callback_opt) {
  
};

/**
 * Lists all documents in a directory, to the specified depth (default: 1), optionally matching the specified fields
 */
mldb.prototype.list = function(directory,depth_opt,fields_opt,callback_opt) {
  
};

/**
 * Performs a search:search via REST
 */ 
mldb.prototype.search = function(query_opt,options_opt,callback) {
  
};

/**
 * Takes a csv file and adds to the database.
 * fast aware method
 */
mldb.prototype.ingestcsv = function(csvdata,docid_opt,callback_opt) {
  
};

/**
 * Generic wrapper to wrap any mldb code you wish to execute in parallel. E.g. uploading a mahoosive CSV file. Wrap ingestcsv with this and watch it fly!
 */
mldb.prototype.fast = function(callback_opt) {
  
};


