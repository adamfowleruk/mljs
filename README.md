# A MarkLogic 6+ REST API wrapper in JavaScript for NodeJS

This library provides a convenient JavaScript wrapper for common operations on MarkLogic V6's REST API. It abstracts authentication and common search settings to make it intuitive for a non MarkLogician to get started rapidly with MarkLogic.

Design principles
 - Don't require MarkLogic specific knowledge to get started
 - Use sensible defaults throughout (E.g. use GUIDs and time for doc ids, sensible search options)
 - Be fully event oriented (for non blocking IO), unlike other DB's NodeJS modules
 
Targets for V 0.2 (Dec 2012) in descending order of importance
 - DONE abstract authentication (digest and basic) 
 - TESTING support creation of database and rest api on the fly
 - N/A sensible to/from json settings (Default on &format=json on server)
 - DONE provide document save, get, update
 - STARTED add ACID transaction support across calls to the db
 - provide access to document properties fragment
 - TESTING basic searching (aka search:search), with facets
 - heavily document ALL quick start examples, with task orientated alternatives, and link back to REST docs on website
 - STARTED handle errors elegantly
 - allow binding of XML to jQuery table (for example)
 - allow binding of JSON to jQuery table (for example)
 - TESTING support simple json structured query and nesting
 - support simple aggregations of query results
 - support arbitrary XPath for searches (if possible)
 - allow upload and use of XSLT for result transform

For more information [See the wiki.](/adamfowleruk/mldb/wiki)

Targets for 0.4 (Feb 2012)
 - Support SSL
 - SSL with Basic
 - SSL with Digest
 - Basic + Digest non SSL
 - SSL Basic + Digest
 - no auth (default user)
 - SSL no auth (default user)
 
Targets for 0.6 (Apr 2012)
 - Lazy loading on search results (E.g. when requesting page 2 result 3 (result 13), make http request for re-search transparent)
 - Easy geospatial search
 
Targets for 0.8 (Jun 2012)
