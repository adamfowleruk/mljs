[Back to All Tutorials list](tutorial-all.html)
# How Search Widgets work

The following diagram explains the main code workflow for a search app.

![Search Widgets](./images/mljs-diagrams.003.png "Search Widgets")

As you can see a search context object instance is used to bind widgets together. No widget knows of the existence
of another one - the developer merely calls the register method on search context to bind a new widget to the
search context.

The register() function is a convenience such that the application developer doesn't need to know what events
and actions are supported by each widget instance in order to use them. It is required that all widgets adhere
to the same naming convention for event listeners and actions. This convention is how the searchcontext object
can introspect each widget to determine how it can be used.

In the above example both the search bar and results widgets have a setContext() method and an updateResults()
event listener method. These are discovered by the searchcontext.register() function and called as appropriate.

## Register function

This function introspects the given object to see if it can receive events or allows certain listeners to be
added to it. The Search Context then registers itself to the appropriate add*Listener methods, and adds
functional wrappers to register the given class as a receiver of the Search Context's own events. The search
context also tells the object about itself, allowing direct function calls on the search context instance.

Thus when a user clicks a column of a High Chart, the chart calls contributeFacet on the search context. This
causes a new query to be sent to MarkLogic. The results of that query are then sent to all registered widgets,
including the highcharts object itself.

The register function is a convenience method so that application developers don't need to understand the
intricacies of event passing for search between objects and the search context. There is nothing stopping
application developers registering their own callback functions on the search context for event handling
directly, though.

## Endpoints

The search context's main job is to take inputs from a variety of sources, create a query, submit it to
MarkLogic, and distribute the result. There are two REST API endpoints that accept these text or structured
queries. One is /v1/search for free text and structured query, giving a results list (page). The other
is /v1/values which returns lexicon values, and allows for co-occurence results to be retreived (via
tuples configured in search options).

By default you will want to use /v1/search to query across documents in MarkLogic. This is the default in
the search context also. When using the co-occurence widget or lexicon lookups though you need to run
against the values endpoint. Calling valuesEndpoint() on a search context instance makes this happen.
The search context will then raise updateValues() callbacks on registered widgets.

## Text versus structured query

In many human driven scenarios a 'google like' text box is used allowing a query to be entered. This is
free text with a few extra options, such as using AND and OR for boolean logic, () parantheses to surround
complex query patterns, - for a negation operator, and animal:cat for restricting terms to named
constraints.

This is supported in the search context by using doSimpleQuery(). MarkLogic parses the text using it's
grammar and executes the query.

In some circumstances, however, a computer programme may be generating the query. This is typical on
dashboard pages or where multiple widgets affect different parts of a query. E.g. a map with a 
selectable area controls a geospatial constraint. This is not easily done in a free text grammar.

For these situations, the search context provides doStructuredQuery() and contributeStructuredQuery()
methods. The first method replaces the entire query and executes this against MarkLogic. The second
method allows several components to affect different parts of the query. The search context updates
just the part of the query contributed by this widget, and then produces an and-query of this plus
the other unchanged query terms, and executes this against MarkLogic.

## Search results format

MarkLogic search supports results in either a JSON or XML wrapper. The search context is independant
of these, but defaults to json. Call the setFormat("json|xml") method on the search context to select
this.

If using JSON as a wrapper, but the document results are XML (RAW mode assumed), then this will be 
exposed as a JSON text string in the search results. Use the db.textToXml() method to convert this
to an XMLDocument instance. 

This is useful for if you want to execute XPath over the content within the browser.



- - - -

[Back to All Tutorials list](tutorial-all.html)