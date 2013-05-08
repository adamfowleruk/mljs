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
 - DONE Utility function to save many docs in one go. (TODO: make transaction and fast aware)
 - TEST Create a saved search with a name (default grammar, collection, geospatial proximity) (NB uses REST API Extension from myself)
 - TEST subscribe/unsubscribe to saved searches (NB uses REST API Extension from myself)
 - TEST no auth (default user)
 
Targets for 0.6 (Apr 2013) - for MarkLogic World 2013
 - DONE Browser: Execute mldb from within general JavaScript, not just NodeJS (requires many wrappers, refactoring, extra tests)
 - DONE Core: search options persistence support
 - DONE Core: structured search support
 - DONE Widgets: basic demonstration samples for graphs based on MarkLogic data (Highcharts - shipped with MarkLogic)
 - DONE browser distribution building script
 - DONE Widgets: graphs to support simple aggregations of query results (mean, sum, min, max, count)
 - DONE Widgets: example for joining search bar to graphs, using different aggregations for the same results
 - DONE Widgets: Co-occurence widget 
 - DONE Core: Added values() function for lexicon and co-occurence (GET /v1/values/[name])
 - DONE Widgets: Google Kratu Analytics widget linked to MarkLogic search results
 - DONE Core: include XML -> JSON transform in JavaScript (workaround for XML snippets / raw returned in search results even with format=json enabled)
 - DONE Widgets: Pretty print utility for errors in JSON and XML (Probably requires XML -> JSON utility. Errors are always XML, unless configured on server otherwise.)
 - DONE Widgets: Update search samples to include a custom renderer for one document type
 
Targets for 0.7 (May 2013 tidy up edition) 
 - IN PROGRESS Widgets: Search widgets, and overarching search page widget UI layer over MLDB in browser, including custom result rendering plugins (search bar, facets, results, paging, sorting)
  - Sorting widget actions
  - More... all... links in facets
  - BUG: one page too many in results if results are multiple of page size (i.e. 30 gives you 4 pages, not 3)
  - BUG: multi word facet selection causes search to be limited to first word only (no quotes) -> query parser, not facet issue
 - TEST Core: support XML returned as well as JSON
 - TEST Widgets: Update search samples to include one set of mixed XML and JSON documents
 - IN PROGRESS Widgets: File upload (single and multiple)
 - TEST Core: Search Options Builder
 - IN PROGRESS Core: Structured Search Builder
 - TEST Browser: prototype.js binding
 - TEST Browser: XMLHttpRequest (xhr) binding
 - IN PROGRESS Browser: XmlHttpRequest2 (xhr2) binding
 - IN PROGRESS Docs: Samples for XML use, equivalent to some of the existing JSON samples (not exhaustive)
 - Tests: Test samples for xml content
 - TEST Core: Return and add binary documents
 - TEST Core: Return and add plain text documents
 - Widgets: (multi) Upload progress bar
 - TEST Support for binary and plain text file save/get/search
 - EA 1 support
  - TEST Add/delete/modify/replace named graphs
  - Interactive SPARQL query builder and result handler (including paging, linking to document search, restrict by collection, other document search criteria)
 - IN PROGRESS REST extensions
  - TEST DLS declare document as a record
  - DLS list all documents in a record collection
  - DLS list all DLS collections
  - DLS list all retention rules
  - DLS get document history
  - DLS get document version
  - DLS add retention rule
  - Browser: DLS add retention rule widget
  - TEST Browser: DLS declare search results as record widget
 - TEST Get collections starting with a URI (values query helper method)
 
Targets for 0.8 (Jun 2013)
 - Widgets: D3.js network diagram
 - Widgets: XML/JSON document creation-by-example (via HTML form generator)
 - Widgets: Support for using widgets in non ML 6 REST webapps, and embedding widgets remotely, via W3C CORS support (i.e. cross site support)
 - Widgets: Create search context object, and make search widgets responsible for registering themselves with it. Refactor search execution code in to here.
 - Widgets: Navigable charts / co-occurence - clicking sets facet value
 - Widgets: Abstract enough to plug in Version 5 REST Wrapper results, as required (Corona?)
 - Widgets: Support array children in aggregations for graphs
 - Browser: Lazy loading on search results (E.g. when requesting page 2 result 3 (result 13), make http request for re-search transparent) - Also for graphing when all search results need loading
 - Easy geospatial search
 - Widgets: Google maps (via OpenLayers?)
 - Support all search functions not currently provided
 - Complete support for /v1/values REST function
 - More support for server management (namespaces, indexes, service extensions, update REST instance configuration, XSLT transform management)
 - Widgets: Administration widgets (mainly aimed at pre-sales developers, not sysadmins)
 - Support nested cts:search (if possible)
 - CSV and TSV utilities
 - NodeJS: Support SSL
 - NodeJS: SSL with Basic
 - NodeJS: SSL with Digest
 - NodeJS: Basic + Digest non SSL
 - NodeJS: SSL Basic + Digest
 - NodeJS: SSL no auth (default user)
 - NodeJS: Support 'anyauth' option, much like curl (i.e. auth method auto detection)
 - support arbitrary XPath for searches (if possible)
 - allow upload and use of XSLT for result transform
 - Widget: Table - allow binding of JSON search results to jQuery table (for example)
 - Widget: Table - allow binding of XML search results to jQuery table (for example)
 - Widget: Tree - browse JSON/XML documents in search results as a tree
 - Widget: Timeline (point in time and start / stop dates)
 - Widget: Rose - direction (N, S etc) and time (12 and 24 hour) - arbitrary categories
 - NodeJS: Provide REST API proxy within NodeJS wrapper
 - Browser: Support REST API proxy within general javascript and nodejs javascript code

Targets for 1.0 (Aug 2013)
 - Support current functionality against MarkLogic V7
 - New V7 functionality (as and when required)
  - Dynamic search options
  - Alerting

Not applicable / dropped / postponed targets
 - N/A sensible to/from json settings (Default on &format=json on server)
 - N/A documented on WIKI - Generate JavaScript API docs and publish somewhere browseable on the web