# A MarkLogic 6+ REST API wrapper in JavaScript for NodeJS

This library provides a convenient JavaScript wrapper for common operations on MarkLogic V6's REST API. It abstracts authentication and common search settings to make it intuitive for a non MarkLogician to get started rapidly with MarkLogic.

Design principles
 - Don't require MarkLogic specific knowledge to get started
 - Use sensible defaults throughout (E.g. use GUIDs and time for doc ids, sensible search options)
 - Be fully event oriented (for non blocking IO), unlike other DB's NodeJS modules
 
Targets for V 0.1 (Dec 2012) in descending order of importance
 - abstract authentication (digest and basic) (Basic DONE on HTTP)
 - support creation of database and rest api on the fly
 - sensible to/from json settings (Default on &format=json on server)
 - provide document save, get, update (DONE)
 - provide access to document properties fragment
 - basic searching (aka search:search), with facets
 - heavily document ALL quick start examples, with task orientated alternatives, and link back to REST docs on website
 - handle errors elegantly
 - allow binding of XML to jQuery table (for example)
 - allow binding of JSON to jQuery table (for example)
 - support simple json structured query and nesting
 - support simple aggregations of query results
 - support arbitrary XPath for searches (if possible)
 - allow upload and use of XSLT for result transform

For more information [See the wiki.](/adamfowleruk/mldb/wiki)