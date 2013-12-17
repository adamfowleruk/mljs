[Back to All Tutorials list](tutorial-all.html)
# All about Context objects

Context objects are used to bridge the gap between web widgets / Node JS objects and the underlying MLJS remote API calls. They are useful as brokers
when multiple objects need to respond to related events. An example is a search bar executing a search, and the facet, pager, sort and results widgets
all needing to be updated (if registered with the context, and present on the webpage).

Below are a list of context object's currently available:-

| Context Object | Description |
| --- | --- |
| searchcontext | Content Search Context. Stitches together anything that generates search calls (default grammar text or structured search), or relies on these operations' results. Supports queries against the search endpoint and (Lexicon/Cooccurence) values endpoint. |
| semanticcontext | Sparql Semantic Search Context. Links anything that executes Sparql, either to generate a list of subjects returned, facts about a particular subject, or all facts returned from generic sparql |
| documentcontext | Document information / editing context. Allows single document operations such as fetching all of a document's properties, updating a property, of fetching all of a document's facet values. |

These contexts are typically the ones that execute MLJS calls - the widgets themselves do not generally do this. This is because contexts may pull together multiple pieces of information to do their work. For example, the search context supports the ability for multiple widgets to contribute a structured query term each. The context then stitches these together in an and-query before executing.

There are other objects that help prepare UI widgets, inform contexts, or used to generate configuration for contexts. These are contexts in their own right. What makes them different is that they never execute any MLJS Core calls to the REST API themselves - they just hold configuration. Here is a list:-

| Helper Object | Description |
| --- | --- | 
| query | Query Builder. Call a function to generate a query term. Use JavaScript method chaining to stitch together multiple terms in a single and or or query. |
| options | Query Options Builder. Chain function calls together to add constraints. Automatically adds sort definitions and facet calculations for the constraints. Convenience method to avoid writing your own search option JSON configuration, which is buggy to do manually. |
| tripleconfig | Describe an ontology, it's entities, predicates (entity-entity relationships) and properties (entity-intrinsic values). Used typically to draw a UI that generates SPARQL. Used by semantic context rather than held independently by widget objects. |
| sparqlbuilder | Call methods to create a SPARQL query without needing to know SPARQL syntax. Early days on this at the moment, very little functionality. |

- - - -

[Back to All Tutorials list](tutorial-all.html)