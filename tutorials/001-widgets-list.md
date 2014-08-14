[Back to All Tutorials list](tutorial-all.html)
# What Widgets are available?

There are 23 production widgets, 6 in testing or proof of concept widgets, and 11 administrative widgets.

Below is a complete list and description of what web widgets are available:-

| Widget names | Widget file | Description |
| --- | --- | --- |
| address | widget-address.js | Google address lookup. Useful for create a search term from a point and radius based on placename. |
| docheadviewer | widget-documents.js | Views the contents of a XHTML document's head meta tags. |
| docproperties | widget.documents.js | Shows a list of MarkLogic metadata properties of a document. Allows editing. |
| docviewer | widget-documents.js | Renders the content of an XHTML document (just inside the body tag) |
| searchpage | widget-search.js | Links together the search bar, pager, sort, facets, and results widgets in a single page. Convenience widget. |
| searchbar | widget-search.js | Provides a search input bar supporting the default grammar, including a search button |
| searchresults | widget-search.js | Draws the results of a search. Support for snippeting, generic XML, JSON and plain text documents with no configuration. |
| searchmetrics | widget-search.js | Example tutorial widget to show search speed information |
| searchfacets | widget-search.js | Displays facets returned from a search, clickable to affect search results, support for showing top 5, 10 or all values returned. Auto hides facets with no values. |
| searchpager | widget-search.js | Shows 'returned 1 to 10 of 55' results, previous, next, first and last pages links. |
| searchselection | widget-search.js | Allows selection of one of several configured structured searches. Useful for contributing range relevance terms to a search |
| searchsort | widget-search.js | Drop down to select sort order defined in search options |
| cooccurence | widget-cooccurence.js | 2 way co-occurence widget. Uses MarkLogic Search co-occurence computed on the server |
| highcharts | widget-highcharts.js | Renders JSON and XML document content or facet information as charts using the built in HighCharts library. Tested Line, bar, stacked bar, pie, column, stacked column charts |
| openlayers | widget-openlayers.js | An OpenLayers 2 map rendering linked to search results. Can show heatmaps and allows creation of geospatial query terms. |
| tagcloud | widget-tagcloud.js | Shows a tag cloud based on a single set of facet values. |
| kratu | widget-kratu.js | Uses the Google Kratu web widget to render JSON document content, or queryFacts() triple store results as a table. Great for exploring JSON data. |
| markings | widget-markings.js | Used to render XHTML documents and assign document and paragraph level security. (Paragraph level requires custom XQuery rendering for all searches and document fetch requests.) Also can have triple suggestion turned on - if it sees two XML elements with particular names, it will suggest triples based on them being in the same paragraph. E.g. 'Adam lives in Sheffield'. It'll then save the document with permissions changes, and save the triples in a graph linked back to this document. |
| create | widget-docbuilder.js | Generic table based form generator. Currently supports an Upload widget, update permissions drop down, and read permissions drop down for the uploaded document. Also allows creation or editing of XML doc using a template and XPath field definitions. |
| sparqlbar | widget-triples.js | Intuitive GUI for building Sparql queries. Includes auto suggest for properties, unlimited levels of querying, and less than/greater than support for numeric properties. |
| sparqlresults | widget-triples.js | Lists subjects and fetches their type and common name from the triple store for display in a list. Doesn't yet support paging. |
| graphexplorer | widget-explore.js | Allows exploration of data through a semantic graph. Also for MarkLogic Document subjects, loads facet information related to them. |
| entityfacts | widget-triples.js | Lists all facts about a particular subject, or those linked to subjects mentioned in a MarkLogic Document (infobox). Supports navigation by clicking on a related entity, and it loads facts about that entity. Also supports populating a content search results panel by updating a content search context by providing a structured search listing document URIs that result from a provided SPARQL query. E.g. show documents that inferred these triples (See markings widget, above.) |


The below are in testing, not ready for prime time, widgets:-

| Widget names | Widget file | Description |
| --- | --- | --- |
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


There are also other internal widgets used for Workplace configuration. These are not intended for public consumption, but may be useful for examplecode:-

| Widget names | Widget file | Description |
| --- | --- | --- |
| workplace | widget-workplace.js | Loads a workplace page configuration and renders all widgets within it |
| workplaceadmin | widget-workplace.js | Performs editing of a workplace page via drag and drop |
| thinthick | widget-workplace.js | Layout widget with two columns, left one thinner |
| thickthin | widget-workplace.js | Layout widget with two columns, right one thinner |
| column | widget-workplace.js | Layout widget with a single full width column |
| orderedconfig | widget-workpalce.js | New config widget showing multiple configwrapper widgets in order. Will eventually replace most buggy workplace widget drag/drop code. |
| dropzone | widget-workplace.js | Acts as a dropzone for other UI elements. Fires events. Used for widget drag drop |
| configwrapper | widget-workplace.js | Wraps a JSON object given a specific configuration description. Generically applicable and used throughout workplace |
| actioncreator | widget-workplace.js | Allows selection of an actionable class and function to add to an order list of actions (via orderedconfig) |
| workplacenavbar | widget-workplace.js | Shows all available workplace pages within a horizontal nav bar widget. Bootstrap required. |
| workplacepagelist | widget-workplace.js | Lists and allows creation/deletion of workplace pages within an application |


- - - -

[Back to All Tutorials list](tutorial-all.html)
