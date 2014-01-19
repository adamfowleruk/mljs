[Back to All Tutorials list](tutorial-all.html)
# REST Extensions supported by MLJS

This tutorial describes the REST extensions supported by MLJS core and their purpose

## version
Core: db.version(function(result) { console.log(result.doc.version); });

The version extension exposes the MarkLogic server version identifier so that MLJS can use the most appropriate function. This is particularly
useful if a new version makes some enhancement to existing functionality.

An example of this is in V6 search options had to be saved before issuing a query that used them. In V7 it is possible to instead submit
a combined query, with one request containing both query options and the query itself in a single call. MLJS' various search functions
check for whether the server is at V7 or not to determine the most appropriate action.

If this extension isn't installed them MLJS will silently fall back to V6 functionality. Note you may see a HTTP 500 error in your browser's
debugging console, but this is normal and trapped by MLJS.

## RDB2RDF
Core: db.samListSchema(), db.samSchemaInfo(), db.samRdb2Rdf()

RDB2RDF is a W3C standard for taking relational data and copying it in to a triple store. These extensions use the Direct Mapping of W3C's RDB2RDF
standard for this purpose. samListSchema takes a SAM (an XQuery library and Java Servlet for processing SQL against an RDBMS from MarkLogic) service
URL and lists all schema available on that connection.

samSchemaInfo gives detail about a specific schema, including table names and row counts. This is achieved through Information Schema support. Only
a subset of RDBMS support this. Please check with your RDBMS vendor.

samRdb2Rdf performs an import of a single table in a single schema, importing all rows in that table and generating appropriate RDF Subject's and facts
as appropriate. This also includes relationships (predicates) to other Subjects by introspecting the constraints (E.g. foreign key constraints)
present in the RDBMS Schema. Again this relies on Information Schema support.

## Document Library Services (DLS)
Core: db.dlsdeclare(), db.dlscollections(), db.dlscollection(), db.dlsrules, db.dlsrule()

DLS is a MarkLogic feature that allows storing multiple document versions over time. This includes support for update locks, retention schedules, and
disposition of document versions based on rules.

dlsdeclare() declares one or more URIs as 'records'. I.e. places them under DLS management. It also adds these documents to the specified named collection.

dlscollections() lists all collections that contain a dls managed document. dlscollection() lists documents within a DLS collection.

dlsrules() lists all DLS retention rules by name. dlsrule() shows the full configuration of a DLS retention rule.

## whoami
Core: db.whoami()

This function asks the MarkLogic Server what the username of the currently logged in user is. This is useful as XQuery or the web application is typically
in charge of the login process, so MLJS needs a way to determine the username of the current user. This is particularly useful for personalisation, where
search options (for example) are stored against a particular user for later usage.

## Saved searches and alerts
Core: db.saveBasicSearch(), db.saveCollectionSearch(), db.saveGeoNearSearch(), db.saveExistingSearch(), db.subscribe(), db.unsubscribe(), db.unsubscribeAndDelete()

These functions deal with persisting a structured query as a document. This is the basis of alerting in MarkLogic. These functions all assume that an action
exists on the server that will send the matching document in its entirety to a RESTful web service endpoint. This has been used to invoke a Node.js RESTful
web service which then passes this message to a HTML 5 WebSockets based web application for situational awareness. This creates a real time, responsive
alerting application. This is more effective than MarkLogic 7's alert mechanism which still requires a client web application to poll the REST API periodically.

saveBasicSearch() saves a default grammar query string as an alert, specifying like all the other functions in this section a notification url to send the
alert to via a HTTP REST POST call.

saveCollectionSearch saves an alert for all documents entering the system in a particular collection. geoNearSearch does the same for a document that contains
one or more points within a particular radius of a point. saveExistingSearch takes a URI of an existing saved search, and enables this for alerting.

subscribe and unsubscribe are generic methods that do as you would expect. unsubscribeAndDelete unsubscribes the alert, and deletes the original search document.


- - - -

[Back to All Tutorials list](tutorial-all.html)