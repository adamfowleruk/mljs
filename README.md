# A MarkLogic 6+ REST API wrapper in JavaScript for NodeJS

This library provides a convenient JavaScript wrapper for common operations on MarkLogic V6's REST API. It abstracts authentication and common search settings to make it intuitive for a non MarkLogician to get started rapidly with MarkLogic.

Further information
 - Install with `npm install mldb`
 - Read the [API documentation](https://github.com/adamfowleruk/mldb/wiki/Api)
 - And the rest of the [WIKI](https://github.com/adamfowleruk/mldb/wiki)
 - And perhaps the [design principles document](https://github.com/adamfowleruk/mldb/wiki/Design)

Targets for V 0.2 (Dec 2012) in descending order of importance
 - DONE abstract authentication (digest and basic) 
 - DONE support creation of database and rest api on the fly
 - DONE provide document save, get, update
 - DONE access all documents within a directory (mldb.list)
 - DONE access all documents within a collection (mldb.collect)
 - DONE add ACID transaction support across calls to the db
 - DONE provide access to document properties fragment (all metadata)
 - DONE basic searching (aka search:search), with facets
 - DONE heavily document ALL quick start examples, with task orientated alternatives, and link back to REST docs on website
 - DONE handle errors elegantly
 - DONE support simple json structured query
 - DONE generic do function to invoke any REST API functionality I've not created a comprehensive helper method for
 - DONE Complete testing of all core functionality

For more information [See the wiki.](/adamfowleruk/mldb/wiki)

Targets for 0.4 (Feb 2013)
 - STARTED Utility function to save many docs in one go. (TODO: make transaction and fast aware)
 - TEST Create a saved search with a name (default grammar, collection, geospatial proximity) (NB uses REST API Extension from myself)
 - TEST subscribe/unsubscribe to saved searches (NB uses REST API Extension from myself)
 - Support all search options not currently provided
 - Support SSL
 - SSL with Basic
 - SSL with Digest
 - Basic + Digest non SSL
 - SSL Basic + Digest
 - TESTING no auth (default user)
 - SSL no auth (default user)
 - Support 'anyauth' option, much like curl
 - support simple aggregations of query results
 - support arbitrary XPath for searches (if possible)
 - support XML returned as well as JSON
 - allow upload and use of XSLT for result transform
 - Pretty print utility for errors in JSON and XML
 - Samples for XML use, equivalent to some of the existing JSON samples (not exhaustive)
 
Targets for 0.6 (Apr 2013)
 - Lazy loading on search results (E.g. when requesting page 2 result 3 (result 13), make http request for re-search transparent)
 - Easy geospatial search
 - Support nested cts:search (if possible)
 
Targets for 0.8 (Jun 2013)
 - Execute mldb from within general JavaScript, not just NodeJS (requires many wrappers, refactoring, extra tests)
 - allow binding of JSON to jQuery table (for example)
 - allow binding of XML to jQuery table (for example)
 - basic demonstration sample for graph based on MarkLogic data
 - Provide REST API proxy within NodeJS wrapper
 - Support REST API proxy within general javascript and nodejs javascript code

Targets for 1.0 (Aug 2013)
 - Support current functionality against MarkLogic V7

Not applicable / dropped / postponed targets
 - N/A sensible to/from json settings (Default on &format=json on server)
 - N/A documented on WIKI - Generate JavaScript API docs and publish somewhere browseable on the web