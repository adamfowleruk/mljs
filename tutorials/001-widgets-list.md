[Back to All Tutorials list](tutorial-all.html)
# What Widgets are available?

Below is a complete list and description of what web widgets are available:-

| Widget names | Widget file | Description |
| --- | --- | --- |
| searchpage | widget-search.js | Links together the search bar, pager, sort, facets, and results widgets in a single page. Convenience widget. |
| searchbar | widget-search.js | Provides a search input bar supporting the default grammar, including a search button |
| searchresults | widget-search.js | Draws the results of a search. Support for snippeting, generic XML, JSON and plain text documents with no configuration. |
| searchfacets | widget-search.js | Displays facets returned from a search, clickable to affect search results, support for showing top 5, 10 or all values returned. Auto hides facets with no values. |
| searchpager | widget-search.js | Shows 'returned 1 to 10 of 55' results, previous, next, first and last pages links. |
| searchsort | widget-search.js | Drop down to select sort order defined in search options |
| cooccurence | widget-cooccurence.js | 2 way co-occurence widget. Uses MarkLogic Search co-occurence computed on the server |
| highcharts | widget-highcharts.js | Renders JSON and XML document content or facet information as charts using the built in HighCharts library | Tested Line, bar, stacked bar, pie, column, stacked column charts |
| kratu | widget-kratu.js | Uses the Google Kratu web widget to render JSON document content, or queryFacts() triple store results as a table. Great for exploring JSON data. |
| markings | widget-markings.js | Used to render XHTML documents and assign document and paragraph level security. (Paragraph level requires custom XQuery rendering for all searches and document fetch requests.) Also can have triple suggestion turned on - if it sees two XML elements with particular names, it will suggest triples based on them being in the same paragraph. E.g. 'Adam lives in Sheffield'. It'll then save the document with permissions changes, and save the triples in a graph linked back to this document. |
| create | widget-docbuilder.js | Generic table based form generator. Currently only supports an Upload widget, update permissions drop down, and read permissions drop down for the uploaded document. |
| sparqlbar | widget-triples.js | Intuitive GUI for building Sparql queries. Includes auto suggest for properties, unlimited levels of querying, and less than/greater than support for numeric properties. |
| sparqlresults | widget-triples.js | Lists subjects and fetches their type and common name from the triple store for display in a list. Doesn't yet support paging. |
| entityfacts | widget-triples.js | Lists all facts about a particular subject. Supports navigation by clicking on a related entity, and it loads facts about that entity. Also supports populating a content search results panel by updating a content search context by providing a structured search listing document URIs that result from a provided SPARQL query. E.g. show documents that inferred these triples (See markings widget, above.) |
| rdb2rdf | widget-rdb2rdf | Uses the rdb2rdf custom REST API extension and an MLSAM web service endpoint to perform an RDBMS ingest in to the triple store. Uses the W3C rdb2rdf specification's direct mapping from Sep 2012. |
| collectionuris | widget-collections.js | Lists the collection URIS underneath a given URI path |
| dlscollections | widget-dls.js | Requires custom DLS REST Extension. Lists all DLS collections. Custom DLS property required. |
| dlscollection | widget-dls.js | Requires custom DLS REST Extension. List all document members of a DLS collection |
| dlsrules | widget-dls.js | Requires custom DLS REST Extension. Lists all DLS rules defined. |
| dlsruleinfo | widget-dls.js | Requires custom DLS REST Extension. Shows the DLS rule properties for a given rule |


Example widgets not meant for generic re-use, but useful for learning how to extend MLJS using your own widgets:-

| Widget names | Widget file | Description |
| --- | --- | --- |
| docsemlink | widget-docsemlink.js | Example widget that responds to content results and performs a lookup of related SPARQL information. In an example app this populates a Kratu table with triple information on entities mentioned within claims documents. |


- - - -

[Back to All Tutorials list](tutorial-all.html)