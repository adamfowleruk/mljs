[Back to All Tutorials list](tutorial-all.html)
# Core API Samples

Below are all the functions available in the public core API. Private API and internal methods are not covered. See the raw JS files for code comments on these. For details on the Browser Widget UI libraries, see the <a href="Widget-Api">Widget Api</a> page.

##Conventions used in this document
Any variable with _opt in the name is optional. You can either not provide a value or provide undefined. mldb will introspect other variables to correctly deduce the required function. E.g. if no docuri_opt provided by callback_opt should be - if docuri_opt is a function, mldb correctly sets callback_opt to this.

##Function categories

<b>Global functions</b>
<ul>
 <li><a href="#textToXML">textToXML</a> - Converts an escaped string to an XMLDocument.</li>
 <li><a href="#xmlToJson">xmlToJson</a> - Converts an XMLDocument to a JSON object, with a flat structure. </li>
 <li><a href="#xmlToJsonStrict">xmlToJsonStrict</a> - Converts and XMLDocument to a JSON object, preserving the exact document structure.</li>
</ul>

<b>Driver configuration</b>
<ul>
 <li><a href="#mldb.init">mldb Constructor</a> - Basic constructor. Sets initial default configuration</li>
 <li><a href="#mldb.configure">mldb.configure</a> - Override the default (vanilla install) db configuration</li>
 <li><a href="#mldb.setLogger">mldb.setLogger</a> - Override the default (console) Winston logger</li>
</ul>

<b>Database Management</b>
<ul>
 <li><a href="#mldb.exists">mldb.exists</a> (aka mldb.test) - Check if a database exists AND it has a valid REST API endpoint</li>
 <li><a href="#mldb.create">mldb.create</a> - Create a REST API instance, and it's content database</li>
 <li><a href="#mldb.destroy">mldb.destroy</a> - Destroy a REST API instance, and it's content database</li>
</ul>

<b>Document management</b>
<ul>
 <li><a href="#mldb.get">mldb.get</a> - Fetch a document by uri (aka id)</li>
 <li><a href="#mldb.metadata">mldb.metadata</a> - Fetch a document's metadata by uri</li>
 <li><a href="#mldb.save">mldb.save</a> - Save or Update a document</li>
 <li><a href="#mldb.saveAll">mldb.saveAll</a> - Save or Update a set of documents (FAST aware)</li>
 <li><a href="#mldb.merge">mldb.merge</a> - Merge an existing JSON document with the provided information</li>
 <li><a href="#mldb.delete">mldb.delete</a> (aka mldb.remove) - Delete a document</li>
</ul>

<b>Search</b>
<ul>
 <li><a href="#mldb.collect">mldb.collect</a> - Fetch documents in a collection</li>
 <li><a href="#mldb.list">mldb.list</a> - Fetch documents in a directory</li>
 <li><a href="#mldb.keyvalue">mldb.keyvalue</a> - Fetch document by value (key, element, attribute)</li>
 <li><a href="#mldb.search">mldb.search</a> - Plain text query using default grammar</li>
 <li><a href="#mldb.searchCollection">mldb.searchCollection</a> - Plain text query using default grammar, against the specified collection(s) (comma separated)</li>
 <li><a href="#mldb.structuredSearch">mldb.structuredSearch</a> - Perform structured search</li>
 <li><a href="#mldb.saveSearchOptions">mldb.saveSearchOptions</a> - Persist options document used by structured search</li>
</ul>

<b>ACID Transactions</b>
<ul>
 <li><a href="#mldb.begin">mldb.beginTransaction</a> (aka mldb.begin) - Start transaction</li>
 <li><a href="#mldb.commit">mldb.commitTransaction</a> (aka mldb.commit) - Commit transaction</li>
 <li><a href="#mldb.rollback">mldb.rollbackTransaction</a> (aka mldb.rollback) - Abandon transaction</li>
</ul>

<b>REST API Extensions</b>
<ul>
 <li><a href="#mldb.saveBasicSearch">mldb.saveBasicSearch</a> - saves a text query as a document to the server for later reference, e.g. by an alert</li>
 <li><a href="#mldb.saveCollectionSearch">mldb.saveCollectionSearch</a> - saves a collection query as a document to the server for later reference, e.g. by an alert</li>
 <li><a href="#mldb.saveGeoNearSearch">mldb.saveGeoNearSearch</a> - saves a GeoSpatial near query (lon, lat, and radius in miles) to a document for later reference, e.g. by an alert</li>
 <li><a href="#mldb.saveExistingSearch">mldb.saveExistingSearch</a> - saves an existing search document copy to the specified URI so it can be referenced later, e.g. by an alert</li>
 <li><a href="#mldb.do">mldb.do</a> - Perform your own REST API call using mldb's helpers (E.g. new function, or your own extension)</li>
 <li><a href="#mldb.subscribe">mldb.subscribe</a> - subscribe to an alert</li>
 <li><a href="#mldb.unsubscribe">mldb.unsubscribe</a> - unsubscribe to an alert</li>
 <li><a href="#mldb.unsubscribeAndDelete">mldb.unsubscribeAndDelete</a> - unsubscribe to an alert, and delete the search document to which it refers</li>
 <li><a href="#mldb.deleteSavedSearch">mldb.deleteSavedSearch</a> - deletes a saved search document</li>
</ul>

<b>Utility functions</b>
<ul>
 <li><a href="#mldb.ingestcsv">mldb.ingestcsv</a> - Ingest a CSV file (FAST aware)</li>
 <li><a href="#mldb.fast">mldb.fast</a> - Wrap functions so they execute in parallel (see each function's docs)</li>
</ul>

##Alphabetical function list for global functions

<a name="textToXML">#</a> window.<b>textToXML</b>(text)

Converts an escaped JSON string to an XMLDocument. Uses the Browser's built in parser.

```javascript
var xmlString = "<mydoc reference='Grades'><class>Biology \n 101\t   </class><year>2014</year></mydoc>";
var xmlDoc = textToXML(xmlString);
var jsonDoc = xmlToJson(xmlDoc);
console.log(JSON.stringify(jsonDoc));
// prints: {mydoc: {reference: "Grades",class: "Biology 101",year: "2014"}}
```

- - - -
<a name="xmlToJson">#</a> window.<b>xmlToJson</b>(text)

Converts an XMLDocument instance to a JSON object. Merges adjacent text. Sets object value to text if it only contains text. Trims whitespace. Strips namespace from objects. Uses a flat structure, rather than an @prefix for attributes. Not safe to use if an attribute and element under the same node can have the same name, or if multiple elements have the same name with different namespaces. Used internally to convert MarkLogic error messages (which are XML by default, as per a server setting).

```javascript
var xmlString = "<mydoc reference='Grades'><class>Biology \n 101\t   </class><year>2014</year></mydoc>";
var xmlDoc = textToXML(xmlString);
var jsonDoc = xmlToJson(xmlDoc);
console.log(JSON.stringify(jsonDoc));
// prints: {mydoc: {reference: "Grades",class: "Biology 101",year: "2014"}}
```

- - - -
<a name="xmlToJsonStrict">#</a> window.<b>xmlToJsonStrict</b>(text)

Converts an escaped JSON string to an XMLDocument. Uses the Browser's built in parser.

```javascript
var xmlString = "<ns:mydoc xmlns:ns="http://somens.com/ns1" reference='Grades'><ns:class>Biology \n 101\t   </ns:class><ns:year>2014</ns:year></ns:mydoc>";
var xmlDoc = textToXML(xmlString);
var jsonDoc = xmlToJsonStrict(xmlDoc);
console.log(JSON.stringify(jsonDoc));
// prints: {"ns:mydoc": {"@attributes": {reference: "Grades"},"ns:class": "#text": [ "Biology \n"," 101\t   "],"ns:year": "2014"}}
```

- - - -
##Alphabetical function list for MLDB

<a name="mldb.begin">#</a> mldb.<b>begin</b>(name_opt,callback)

Begin a transaction. All altering functions subsequently called will be within this transaction boundary. Be aware that searches also execute within a transaction. Also, there is a transaction timeout on the server so it's not recommended to have longer running transactions across multiple requests.

```javascript
var db = new mldb();
db.begin("mytrans", function(result) {
  db.save({title: "first"},"/docs/1", function (sr1) {
  db.save({title: "second"},"/docs/2",function (sr2) {
  db.commit(function (cr) {
    if (cr.inError()) {
      console.log("error: " + JSON.stringify(cr.error));
    } else {
      console.log("success");
    }
})})})});
```
Links: [REST API](https://docs.marklogic.com/REST/POST/v1/transactions)

- - - -
<a name="mldb.collect">#</a> mldb.<b>collect</b>(collection,fields_opt,callback_opt)

Returns a search api response contain a paged list of documents, with their content, and total, for all documents within a collection.

```javascript
var db = new mldb(); // default options
  
// add three docs to the collection
var col = {collection: "testcol"};
var uris = ["/collections/1","/collections/2","/collections/3"];
db.save({name:"first"},uris[0],col,function(result) {
db.save({name:"second"},uris[1],col,function(result) {
db.save({name:"third"},uris[2],col,function(result) {

// get docs in collection
db.collect(col.collection,function(result) {
  console.log("Total result count: " + result.doc.total);
  // NB result.doc contains the JSON search result object from the REST API

});});});});
```

Links: [REST API](http://docs.marklogic.com/REST/GET/v1/search)

- - - -
<a name="mldb.commit">#</a> mldb.<b>commit</b>(callback)

Commits a transaction.

__See example in [mldb.begin](#mldb.begin) above.__

Links: [REST API](http://docs.marklogic.com/REST/POST/v1/transactions/*)

- - - -
<a name="mldb.configure">#</a> mldb.<b>configure</b>()

Configures the database driver to access a particular database. You can supply a subset of all options and they will be merged with the defaults (shown below for convenience).

```javascript
var options = {
  host: "localhost", port: 9090, adminport: 8002, 
  ssl: false, auth: "digest", username: "admin",password: "admin", 
  database: "mldbtest", 
  searchoptions: {}, fastthreads: 10, fastparts: 100
};
var db = new mldb();
db.configure(options);
```

```javascript
var options = {
  port: 5073
};
var db = new mldb();
db.configure(options);
```

Links: [REST API](https://docs.marklogic.com/REST/POST/v1/rest-apis)

- - - - 
<a name="mldb.init">#</a> mldb <b>Constructor</b>()

Creates an instance of the database driver with the default (vanilla local server) configuration

```javascript
var db = new mldb();
```

- - - -
<a name="mldb.create">#</a> mldb.<b>create</b>(callback_opt)

Creates a database with the options within this mldb instance. To set the options, call configure before you call create.

```javascript
var db = new mldb();
db.create(function(result) {
  console.log("Database created?: " + (!result.inError));
});
```

Links: [REST API]()

- - - -
<a name="mldb.delete">#</a> mldb.<b>delete</b>(docuri,callback_opt)

Deletes the document with the provided URI from the database.

```javascript
var db = new mldb();
db.delete("/docs/1",function(result) {
  console.log("Document deleted?: " + (!result.inError));
});
```

Links: [REST API](https://docs.marklogic.com/REST/DELETE/v1/documents)

- - - -
<a name="mldb.destroy">#</a> mldb.<b>destroy</b>(callback_opt)

Destroys this content database and REST API instance.

```javascript
var db = new mldb();
db.destroy(function(result) {
  console.log("Database and REST endpoint destroyed?: " + (!result.inError));
});
```

Links: [REST API](https://docs.marklogic.com/REST/DELETE/v1/rest-apis/*)

- - - -
<a name="mldb.do">#</a> mldb.<b>do</b>(options_opt,content_opt,callback_opt)

Performs the specified REST API call. This is a wrapper around the internal MLDB workings, so you get the benefits of all the authentication and connection maintenance being handled for you. This is intended for use by developers who need to execute their own custom resource handlers, or newly available REST API features before this driver has been updated.

```javascript
var db = new mldb(); // default options
  
var options = {
  path: "/v1/search?q=squirrel&format=json",
  method: "GET"
};
  
db.do(options,function(result) {
  console.log("Number of results: " + result.doc.total);
});
```

Links: [REST API](https://docs.marklogic.com/REST/GET/v1/rest-apis)

- - - -
<a name="mldb.exists">#</a> mldb.<b>exists</b>(callback)

Checks whether this database exists AND has a REST API instance to access it.

```javascript
var db = new mldb();
db.exists(function(result) {
  console.log("DB exists?: " + result.exists);
});
```

Links: [REST API]()

- - - -
<a name="mldb.fast">#</a> mldb.<b>fast</b>(callback_opt)

Specifies that all subsequent requests should execute in fast (parallel) mode. Only applies to utility functions that perform multiple REST calls.

__Not yet implemented__

```javascript
var db = new mldb();
db.fast(function (result) {
  var jsonArr = [{title: "first"},{title: "second"}];
  var uriArr = ["/docs/1","/docs/2"];
  db.saveAll(jsonArr,uriArr,function(result) {
    console.log("All documents added in parallel");
  });
});
```

- - - -
<a name="mldb.get">#</a> mldb.<b>get</b>(docuri,options_opt,callback_opt)

Fetches the document at the specified URI. options_opt may be a JSON object containing the key transform which is passed as the transform parameter to the /v1/documents REST endpoint.

```javascript
var db = new mldb();
db.get("/docs/1", function(result) {
  console.log("Doc JSON content: " + JSON.stringify(result.doc));
});
```

Links: [REST API](https://docs.marklogic.com/REST/GET/v1/documents)

- - - -
<a name="mldb.ingestcsv">#</a> mldb.<b>ingestcsv</b>(csvdata,docid_opt,callback_opt)

Ingests a CSV file, chunking if necessary. This function is FAST parallelisation aware.

__Not yet implemented__

Links: [FAST mode](#mldb.fast)

- - - -
<a name="mldb.keyvalue">#</a> mldb.<b>keyvalue</b>(key,value,keytype_opt,callback_opt)

Performs a simple key-value search. Useful if you want a list of documents (typically JSON) with keys that match a particular value. Useful if you have, for example, categories.

```javascript
var db = new mldb(); // default options
  
// add three docs to the collection
var col = {collection: "kvcol"};
var uris = ["/kv/1","/kv/2","/kv/3"];
db.save({name:"first whippet"},uris[0],col,function(result) {
db.save({name:"second squirrel"},uris[1],col,function(result) {
db.save({name:"third wolf"},uris[2],col,function(result) {

// search for name's value (exact match)
db.keyvalue("name","third wolf",function(result) {
  console.log("TEST: KEYVALUE results object: " + JSON.stringify(result));
})})})});
```

Links: [REST API](https://docs.marklogic.com/REST/GET/v1/keyvalue)

- - - -
<a name="mldb.list">#</a> mldb.<b>list</b>(directory,callback_opt)

Returns all documents as a search api result set within a particular directory.

```javascript
var db = new mldb();
var col = {collection: "testcol"};
var uris = ["/dir/1","/dir/2","/dir/3"];
db.save({name:"first"},uris[0],col,function(result) {
db.save({name:"second"},uris[1],col,function(result) {
db.save({name:"third"},uris[2],col,function(result) {

// get docs in directory
db.list("/dir",function(result) {
  console.log("TEST: list() results object: " + JSON.stringify(result));
})})})});
```

Links: [REST API](http://docs.marklogic.com/REST/GET/v1/search)

- - - -
<a name="mldb.merge">#</a> mldb.<b>merge</b>(json,docuri,callback_opt)

Utility method. Merges the specified JSON with the document at the specified URI. Currently performs a get followed by a save.

```javascript
var db = new mldb();
var col = {collection: "mergecol"};
var uris = ["/merge/1"];
var json1 = {name: "first whippet"};
var json2 = {weight: "120lbs"};
db.save(json1,uris[0],col,function(result) {

// merge the weight into the same document as name 
db.merge(json2,uris[0],function(result) {
db.get(uris[0],function(result) {
  console.log("TEST: MERGE: merged doc: " + JSON.stringify(result.doc));
})})});
```

Links: [mldb.get](#mldb.get) | [mldb.save](#mldb.save)

- - - -
<a name="mldb.metadata">#</a> mldb.<b>metadata</b>(docuri,callback_opt)

Returns all of a document's metadata. Includes all properties, collections, permissions, quality. Uses same mechanism as get().

```javascript
var db = new mldb(); // default options
var uri = "/meta/1";
db.save({from: "test", to: "all", body: "wibble"},uri, {collection: "metatest"},function(result) {
// now fetch it's metadata (properties, collections, permissions)
db.metadata(uri, function(result) {
  console.log("TEST: METADATA: " + JSON.stringify(result));
})});
```

Links: [REST API](https://docs.marklogic.com/REST/GET/v1/documents)

- - - -
<a name="mldb.rollback">#</a> mldb.<b>rollback</b>(callback)

Abandons a currently open transaction.

```javascript
var db = new mldb(); // default options
  
db.begin(function(result) {
var txid = result.txid;

// now create doc
var uri = "/trans/rollback/5";
var json = {title: "Transaction commit test doc"};
db.save(json,uri,function(result) {
      
// now abandon transaction
db.rollback(function(result) {
      
// see if the document doesn't exist (i.e. the transaction has been abandoned)
db.get(uri, function(result) {
  console.log("Document exists?: " + !result.inError);
})})})});
```

Links: [REST API](http://docs.marklogic.com/REST/POST/v1/transactions/*)

- - - -
<a name="mldb.save">#</a> mldb.<b>save</b>(json,docuri_opt,props_opt,callback_opt)

Saves or updates a document. If no URI is specified, one is generated for you by using JavaScript's random number generator. Currently the props_opt JSON object only supports the collection parameter, and you can only specify one collection. This is in line with the REST API document POST call.

__See [get()](#mldb.get) above__

Links: [REST API](https://docs.marklogic.com/REST/PUT/v1/documents)

- - - -
<a name="mldb.saveAll">#</a> mldb.<b>saveAll</b>(doc_array,uri_array_opt,callback_opt)

Helper method to save a set of documents in a single call. Actually performs multiple REST API calls. Is FAST parallelisation aware.

__See [fast()](#mldb.fast) above__

Links: [FAST mode](#mldb.fast)

- - - - 
<a name="mldb.saveSearchOptions">#</a> mldb.<b>saveSearchOptions</b>(name,searchoptions,callback_opt)

Persists a search options JSON object with the specified name. This can be referred to in any of the search methods (the options_opt variable) to control the results of a search operation.

Links:  [REST API](https://docs.marklogic.com/REST/PUT/v1/config/query/*) 

- - - -
<a name="mldb.search">#</a> mldb.<b>search</b>(query_opt,options_opt,start_opt,sprops_opt,callback)

Performs a free text search using the default built in grammar of MarkLogic. Returns a search result set. start_opt is a numeric containing the first id (1 based) of the first document in order to return as part of the result set (page). sprops_opt is a JSON object containing either a directory or collection parameter, or both, to be passed as parameters to the /v1/search REST endpoint.

```javascript
var db = new mldb(); // default options
  
// add three docs to the collection
var col = {collection: "searchcol"};
var uris = ["/search/1","/search/2","/search/3"];
db.save({name:"first whippet"},uris[0],col,function(result) {
db.save({name:"second squirrel"},uris[1],col,function(result) {
db.save({name:"third wolf"},uris[2],col,function(result) {
        
// search
db.search("squirrel",function(result) {
  console.log("TEST: SEARCH results object: " + JSON.stringify(result));
})})})});
```

Links: [REST API](http://docs.marklogic.com/REST/GET/v1/search) | [Search Grammar](http://docs.marklogic.com/guide/search-dev/search-api#id_41745)

- - - -
<a name="mldb.searchCollection">#</a> mldb.<b>searchCollection</b>(collection_opt,query_opt,options_opt,callback)

Performs a free text search using the default built in grammar of MarkLogic. Restricts results to the given collection(s). Returns a search result set. Collection is a comma delimited string.

```javascript
var db = new mldb(); // default options
  
// add three docs to the collection
var col = {collection: "searchcol"};
var uris = ["/search/1","/search/2","/search/3"];
db.save({name:"first whippet"},uris[0],col,function(result) {
db.save({name:"second squirrel"},uris[1],col,function(result) {
db.save({name:"third wolf"},uris[2],col,function(result) {
        
// search
db.searchCollection("searchcol","squirrel",function(result) {
  console.log("TEST: SEARCH results object: " + JSON.stringify(result));
})})})});
```

Links: [REST API](http://docs.marklogic.com/REST/GET/v1/search) | [Search Grammar](http://docs.marklogic.com/guide/search-dev/search-api#id_41745)

- - - -
<a name="mldb.setLogger">#</a> mldb.<b>setLogger</b>()

Sets the Winston Logger used by this database driver.

```javascript

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.Console();
  ],
  exceptionHandlers: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/test.log' })
  ]
});

var db = new mldb();
db.setLogger(logger);

db.save({name: "test json"},"/logger/1"); // now look at the console or logs/test.log
```

- - - -
<a name="mldb.structuredSearch">#</a> mldb.<b>structuredSearch</b>(query_opt,options_opt,callback)

Performs a structured search using the REST API.

```javascript
var db = new mldb(); // default options
  
// add three docs to the collection
var col = {collection: "ssearchcol"};
var query = {"query":
  {"term-query":
    {"text":
      ["rhino"]
    }
  }
};
var uris = ["/ssearch/1","/ssearch/2","/ssearch/3"];
db.save({name:"first elephant"},uris[0],col,function(result) {
db.save({name:"second rhino"},uris[1],col,function(result) {
db.save({name:"third penguin"},uris[2],col,function(result) {
        
// get docs in collection
db.structuredSearch(query,function(result) {
  console.log("TEST: STRUCTUREDSEARCH results object: " + JSON.stringify(result));
})})})});
```

Links: [REST API](http://docs.marklogic.com/REST/GET/v1/search) | [Structured Search](http://docs.marklogic.com/guide/search-dev/search-api#id_53458)

- - - -
<a name="mldb.subscribe">#</a> mldb.<b>subscribe</b>(nodeurl,lat,lon,radiusmiles,callback_opt)

Uses Adam Fowler's (Me!) subscribe custom REST API resource to subscribe a node (RESTful web service URL) to a geospatial search. Uses the Alerting Framework to send matching documents - as they arrive - to the nodeurl REST endpoint provided.

__Not yet implemented__

- - - -
<a name="mldb.ubsubscribe">#</a> mldb.<b>unsubscribe</b>(nodeurl,callback_opt)

Unsubscribes a nodeurl from all alerts. Uses Adam Fowler's (Me!) custom subscribe REST API resource and the Alerting framework.

__Not yet implemented__

- - - -
<a name="mldb.values">#</a> mldb.<b>values</b>(query,tuplesname,optionsname,callback_opt)

Calls the /v1/values endpoint in order to lookup 2-way range index co-occurences (tested) or lexicon values (untested). Requires search options to have been previously saved. The specified tuple name must exist within those search options.

```javascript
var db = new mldb(); // default options
var query = {
  query: {
    "collection-query": {
      "uri": ["movies"]
    }
  }
};
db.values(query,"movie-year-tuple","movie-search-options",function(result) {
  db.logger.debug("Movies Year Co-occurence JSON: " + stringify(result.doc));
});
```

Links: [REST API](http://docs.marklogic.com/REST/GET/v1/values/*) 

- - - -
