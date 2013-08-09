# Development feature planning

## Upcoming releases

Targets for 0.8 (Jul 2013)
 - DONE Core+Widgets: Create search context object, and make search widgets responsible for registering themselves with it. Refactor search execution code in to here. (Required for Sort widget)
 - DONE Widgets: Support multiple values for save facet in facet widget and searchbar/context
 - DONE Widgets: Charts widget to support aggregations via search options (facet values)
 - DONE Widgets: Script to install latest MLJS in to an existing Roxy project
 - DONE Samples: ml-config.xml to include range indexes required for sample application
 - IN PROGRESS Widgets: Search widgets, and overarching search page widget UI layer over mljs in browser, including custom result rendering plugins (search bar, facets, results, paging, sorting)
  - IN PROGRESS Widgets: Sorting widget actions
  - IN PROGRESS Widgets: More... all... links in facets -> BUG always updating last facet, not the correct facet
  - BUG: Pagination no longer refreshes search results shown
  - DONE BUG: Hitting enter in search bar executes search
  - DONE BUG: one page too many in results if results are multiple of page size (i.e. 30 gives you 4 pages, not 3)
  - DONE BUG: multi word facet selection causes search to be limited to first word only (no quotes) -> query parser, not facet issue
 - DONE Core: support XML returned as well as JSON
  - DONE Search result content (XML as text within JSON results, not as XML results)
 - DONE Widgets: Update search samples to include one set of mixed XML and JSON documents
 - DONE Widgets: File upload (single)
 - DONE Core: Search Options Builder
 - DONE Browser: XMLHttpRequest (xhr) binding
 - DONE Browser: XmlHttpRequest2 (xhr2) binding
 - DONE Tests: Updated mldbwebtest project to be more obvious, and include content initialisation on main page
 - IN PROGRESS Widgets: Search results rendering default processor
  - DONE Browser: Move SVG rendering code in to default search results renderer from animals sample
  - DONE Widgets: Get snippeting mode working
  - DONE Test: Snippet search mode test page
  - TEST xhtml documents
  - DONE generic xml document (//title, //summary, //description, //synopsis, or first 2 elements, or xml snippet)
  - DONE generic JSON document tree fallback
  - BUG (Product 6.0-2): plain text documents - text content not escaped properly
 - DONE Tests: Test samples for xml content 
  - DONE hurt-bat svg in animals search test
 - DONE Docs: Architecture of widgets and MLJS for developers -> Issue with MLJS gh-pages docs rebuild process, not linked properly
 - DONE Integrate error widget on each demo page
 - DONE Add button to allow force reload on main page
 - DONE Index detection and reporting on main page
 - DONE Tests: Refactor to use alternate testing framework
 - DONE Core: Return and add binary documents
 - DONE Core: Return and add plain text documents
 - DONE EA 1 support
  - DONE TEST Add/delete/modify/replace named graphs
  - DONE IN PROGRESS Interactive SPARQL query builder and result handler (including paging, linking to document search, restrict by collection, other document search criteria)
 - DONE Get collections starting with a URI (values query helper method)
 - DONE Rename all to MLJS form mldb
  
Floating as and when
 - Widgets: Document properties and view widget
 - IN PROGRESS REST extensions
  - DONE DLS declare document as a record
  - DLS list all documents in a record collection
  - DONE DLS list all DLS collections
  - DLS list all retention rules
  - DLS get document history
  - DLS get document version
  - DLS add retention rule
  - Browser: DLS add retention rule widget
  - DONE Browser: DLS declare search results as record widget
  
Documentation priorities
 - Tutorial: Deploying the mldbwebtest roxy project (video + text)
 
Targets for 1.0 (Aug 2013)
 - All: Windows batch file versions of developer required (non build related) bash scripts, including mljsme
 - Core: Extra query builder options (all constraints supported by options, plus sorting)
 - Sample: Sample triples, linked content, working sparql query builder
 - Widgets: Geospatial facets show in maps, and not in facets widget
 - Widgets: Facet support for buckets, sliders
 - Widgets: Facet hierarchies in browser sidebar
 - Widgets: Support facet hierarchies
 - Widgets: D3.js network diagram
 - Widgets: Charts widget to support extraction of XML info via XPath
 - Widgets: XML/JSON document creation-by-example (via HTML form generator)
 - Widgets: Support array children in aggregations for graphs
 - Widgets: Lazy loading on search results (E.g. when requesting page 2 result 3 (result 13), make http request for re-search transparent) - Also for graphing when all search results need loading
 - Easy geospatial search
 - Widgets: searchresults: Adding action bar support, with plugins for each button (applicable() and render() functions) - E.g. Download, View, Generate PDF, Delete, Properties 
 - Widgets: Google maps (via OpenLayers?)
 - Support all search functions not currently provided in query builder
 - Complete support for /v1/values REST function (auto complete etc)
 - NodeJS: Support SSL
 - NodeJS: SSL with Basic
 - NodeJS: SSL with Digest
 - NodeJS: Basic + Digest non SSL
 - NodeJS: SSL Basic + Digest
 - NodeJS: SSL no auth (default user)
 - NodeJS: Support 'anyauth' option, much like curl (i.e. auth method auto detection)
 - Support current functionality against MarkLogic V7
 - New V7 functionality
  - Dynamic search options (Try this in search context, catch error if on V6 and fall back to original mode)
  - Alerting
 - Widgets: Support for using widgets in non ML 6 REST webapps, and embedding widgets remotely, via W3C CORS support (i.e. secure cross site scripting support)
 - Widgets: Navigable charts / co-occurence - clicking sets facet value

Targets for 1.2 (Oct 2013)
 - Widget: Situational awareness and search renderer app (from BF sim)
 - Widget: Table - allow binding of JSON search results to jQuery table (for example)
 - Widget: Table - allow binding of XML search results to jQuery table (for example)
 - Widget: Tree - browse JSON/XML documents in search results as a tree
 - Widget: Timeline (point in time and start / stop dates)
 - Widget: Rose - direction (N, S etc) and time (12 and 24 hour) - arbitrary categories
 - Widgets: File upload (multiple)
 - Widgets: (multi) Upload progress bar
 - TEST Browser: prototype.js binding
 
Targets for 1.4 (Dec 2013)
 - More support for server management (namespaces, indexes, service extensions, update REST instance configuration, XSLT transform management)
 - Widgets: Administration widgets (mainly aimed at pre-sales developers, not sysadmins)
 - CSV and TSV utilities
 - support arbitrary XPath for searches (if possible)
 - allow upload and use of XSLT for result transform

Not applicable / dropped / postponed targets
 - N/A sensible to/from json settings (Default on &format=json on server)
 - N/A documented on WIKI - Generate JavaScript API docs and publish somewhere browseable on the web
 - N/A Support nested cts:search (if possible)
 - N/A (We use JSON EXCLUSIVELY for configuration, XML only appears in errors and search result content) - Samples for XML use, equivalent to some of the existing JSON samples (not exhaustive)
 - Widgets: Abstract enough to plug in Version 5 REST Wrapper results, as required (Corona?)
 - NodeJS: Provide REST API proxy within NodeJS wrapper
 - Browser: Support REST API proxy within general javascript and nodejs javascript code
 - NA generic xml document tree fallback
 
## Past Releases

Targets for V 0.2 (Dec 2012) in descending order of importance
 - DONE abstract authentication (digest and basic) 
 - DONE support creation of database and rest api on the fly
 - DONE provide document save, get, update
 - DONE access all documents within a directory (mljs.list)
 - DONE access all documents within a collection (mljs.collect)
 - DONE add ACID transaction support across calls to the db
 - DONE provide access to document properties fragment (all metadata)
 - DONE basic searching (aka search:search), with facets
 - DONE heavily document ALL quick start examples, with task orientated alternatives, and link back to REST docs on website
 - DONE handle errors elegantly
 - DONE support simple json structured query
 - DONE generic do function to invoke any REST API functionality I've not created a comprehensive helper method for
 - DONE Complete testing of all core functionality

For more information [See the wiki.](/adamfowleruk/mljs/wiki)

Targets for 0.4 (Feb 2013)
 - DONE Utility function to save many docs in one go. (TODO: make transaction and fast aware)
 - TEST Create a saved search with a name (default grammar, collection, geospatial proximity) (NB uses REST API Extension from myself)
 - TEST subscribe/unsubscribe to saved searches (NB uses REST API Extension from myself)
 - TEST no auth (default user)
 
Targets for 0.6 (Apr 2013) - for MarkLogic World 2013
 - DONE Browser: Execute mljs from within general JavaScript, not just NodeJS (requires many wrappers, refactoring, extra tests)
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
 