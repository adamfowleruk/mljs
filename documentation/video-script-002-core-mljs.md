
Aim: To introduce the core API to those who may only know of the Widget API. To explain concepts like the searchcontext, and rest call wrappers, and why you should use the Core API rather than jQuery AJAX wrappers themselves.

[webinar title slide]
This video introduces the Core API, its features and facilities. This is part of the Mastering MLJS series of bite sized, sub 5 minute webinars.

[Core & Browser API Slide]
The Core API is easy to overlook in our rush to create amazing web applications with the MLJS Widget API. The Core API though is responsible for all communication between all MLJS applications and MarkLogic server. 

[Core API functions slide]
MLJS comprises a set of low level rest api wrappers, and a set of context objects to co-ordinate common scenarios between subsequent calls, such as those operations to do with performing a search or altering search criteria.

[Back to Core & Browser API Slide]
MLJS Core wraps AJAX calls itself. This provides a consistent interface whether using REST on Node.js or in the browser, and abstracts out authentication mechanisms and special message handling - such as MarkLogic error states, or HTTP response headers with special meanings (like the Location: header with a doc uri when creating a document).

[Open docs for GET /v1/search]
Lets look at a single REST endpoint. We're interested in GET /v1/search. This has a variety of functionality you may wish to use. Some of the configuration for this functionality can be very complex. 

[Show structured query example - from where?]
MLJS also provides a Structured Query Builder helper object to make creating complex queries much simpler - you don't have to know the internal JSON configuration syntax to perform a structured query in MLJS. All this makes using the search API fast and free of bugs.

[Show search functions on slide]
MLJS provides several wrappers for this single REST endpoint to simplify the application developers workload. 

There are several wrappers for the GET /v1/search endpoint:-
 - collect() to return all documents in a collection
 - list() to return all documents underneath a URI / folder
 - search() allows for default grammar text based queries
 - searchCollection() as for search, but restricts results by collection
 - structuredSearch() provide a JSON structured query object (created using the query builder)

[Highlight helper objects on same slide]
MLJS provides a simple interface for JavaScript programmers without forcing them to understand internal JSON configuration object syntax. Three helper objects are provided to assist developers in creating sophisticated query configurations.

These are:-
 - options builder - from db.createOptions(), to easily create constraints, sort and facet configuration
 - (structured) query builder - from db.createQuery(), to create and, or, range, geospatial, word and other structured queries
 - semantic triple config - from db.createTripleConfig(), to define an ontology for use in the semantic query widgets, or semantic context

[Show web docs of options object]
These objects maintain a query configuration but none of them directly call MLJS Core functions that perform actions on MarkLogic server's REST API. They hold configuration only to ease the application developers workload.

[Show test save-get-delete, and web page version]
An application developer can use MLJS Core directly from within Node.js or a web page. Here we see an example in Node.js and the browser for saving a document, then fetching it, and returning it's content. Note that both sets of code are exactly the same. The only difference is how the returned information is displayed to the user.

Alternatively, and more normally, one of the context objects are used rather than calling MLJS Core communication methods directly. This is useful where several parts of your application alter individual parts of a query's configuration. Examples include sorting, facet selections, and the current results page number being explored.

[Show search context calls slide]
A Search Context will maintain some state between calls. A Context will also introspect objects during registration to determine what events they emit, and what events they listen for. The Context object links all interdependant widgets or objects together. Thus when a facet is selected in one widget, the query is altered, resubmitted, and then all widgets listening for search result responses are updated with the same search content, at the same time.

There are no limits to the number of searchcontexts in each web page or Node.js application. Thus it is possible to execute several different queries in parallel, or create dashboard pages that report over different aspects of the information within a MarkLogic database.

[show do() test]
MLJS core also provides a generic do() method. This can be used to take advantage of the MLJS wrapper when calling your own rest extensions, or when calling REST endpoints I have not yet wrapped with a function in MLJS.

[Show core API docs main page]
MLJS core also includes a variety of other functionality, including utility functions to convert between text, xml and json, and logging support. For details on those, read the Core API documentation on GitHub Pages.

[webinar title slide]
Hopefully this short webinar has introduced you to the core functionality, concepts and benefits of the MLJS Core API. Feel free to use this within your browser and Node.js application directly, or use one of the many context objects to co-ordinate complex MarkLogic information operations.

Please keep tuned for more bite sized, sub 5 minute webinars in this Mastering MLJS series.

04:21
