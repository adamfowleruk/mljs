# Semantics

An exciting new area of MarkLogic 7 is the internal provision of an Enterprise class triple store. MLJS has had
widgets to expose this functionality since the Early Access programme in May 2013. In this lesson you'll
build a query page with clickable results. You'll also make a click on one widget redraw a graph explorer widget
to show the selected Subject's facts.

- The semantic context and triple config objects
- Loading semantic facts with MLJS
- A basic semantic search page
- Exploring subjects
- Configuring your own ontology
- Extension exercise

## The semantic context and triple config objects

The search context object helps link widgets together around the same content search. Semantic context does the same
for semantic (sparql) queries. Likewise, the tripleconfig object helps define the ontology used and how subjects
relate to one another.

I've also started creating a sparql query builder object. This is in the very early stages though so I'm not
covering it in this class - we'll instead use the visual sparql query builder which is what most people will
need to use anyway.

Triple config at the moment has chainable methods to define classes of semantic Subjects, their RDF types, facts
they may have, and potential relationships between them and other objects. This class is used mainly by visual 
widgets so they can provide human readable names to classes and relationships, and extract the 'name' field (if such
a thing exists) for a Subject. 

This means you don't always have to show a complex IRI string for the Subject name. Basically
it makes working with ontologies much more user friendly and intuitive.

## Loading semantic facts with MLJS

First though you'll need some facts. Copy the content of samples/010-load-facts.js in to /src/js/page-loadfacts.js, and
create a HTML page called loadfacts.html that references it.

Now have a look inside your loadfacts JavaScript code.

You'll notice this tries to load a named graph using the W3C graph store protocol support of MLJS Core. If the named
graph does not exist (i.e. the method errors) then the graph is created with the specified facts. Actually three
named graphs are created.

You'll notice also that the saveGraph methods takes arrays of MLJS' own helper JSON format. This is to make getting
used to using ontologies simple for everyone. In future I'll also provide methods for importing facts from RDF and
other formats.

Save and deploy these files, and visit the loadfacts.html page to load the facts in to your content database.

Now visit /v1/graphs/things in your browser to see the default OOTB mechanism provided by MarkLogic to browse through
subjects. Useful for a small amount of facts, but not that user friendly. Let's improve on that.

## A basic semantic search page

Create yourself a new page called semantics.html with a page-semantics.js file. Ensure they are linked as usual.

Now use the code below to provide an area for querying and viewing the results of the triple store:-

```
  <div id="errors"></div>
  <div id="query"></div>
  <div id="results"></div>
  <div id="explorer"></div>
```

Copy the following JavaScript in to your JS file:-

```javascript
  window.onload = function() {
    var db = new mljs();
    db.logger.setLogLevel("debug");
    
    var error = new com.marklogic.widgets.error("errors");
    
    try {
    
      var semctx = db.createSemanticContext();
      
      var tc = semctx.getConfiguration(); // get triple config object
      tc.addTest(); // now done via semantic config builder functions
     
      var tripResults = new com.marklogic.widgets.sparqlresults("results");
      semctx.register(tripResults);
      
      var trip = new com.marklogic.widgets.sparqlbar("query");
      semctx.register(trip);
  
    } catch (err) {
      error.show(err.message);
    }
  };
```

You'll need to include the widget-triples and widget-explore JS files in your HTML.

Now save and deploy this page and code. Note that you can select some objects that exist in the drop downs. This
is because MLJS by default ships with support for some internal and test ontologies.

Execute a search to see a list of subjects and human readable class and instance names be shown. A good starting place
is to just return all Person subjects.

## Exploring subjects

Add the following code to your JS page file after the last semctx.register line:-

```javascript

      var explorer = new com.marklogic.widgets.graphexplorer("explorer");
      tripResults.iriHandler(function(iri) {explorer.drawSubject(iri,null,1,1)});
```

This code instructs the graph explorer to show the details for the result clicked in the sparql results list.

Save, deploy and retest the page.

You'll notice the Subject in the results list is navigable now, and that the graph explorer shows the facts and related subjects.

## Configuring your own ontology

The triple config objects comes with many methods with which to configure your own ontology. Examples of how to use these can be
found in the mljs.js file. 

To view relevant sections, go to the Core API documentation. Select the tripleconfig class. Now click on one of 
addFoaf, addFoafPlaces, addMarkLogic, addMovies, addPlaces functions. Under each is a link to the mljs.js file that shows
the relevant code. 

Read the code sections to understand what each method call does. Below is a summary table:-

|tripleconfig function|Affect|
|---|---|
|rdftype|The first method to call when defining a new Subject RDF type. The IRI and instance 'common name' field to use for this type.|
|title|The human readable name of this RDF type (class)|
|prefix|The default prefix for SPARQL for this RDF type|
|pattern|For creating new instances in MLJS, the pattern to follow. Note the #VALUE# macro. This value isn't used yet.|
|from|Specifies another Subject RDF Type that already exists that links to this Type, with the predicate (or predicate array) denoting the relationship IRI|
|to|Another Subject that this one can link to. Opposite of from above.|
|predicate|Creates a Predicate configuration. NOT chainable with the other methods above - it returns an inner/helper class.|
|predicate.title|Specifies a human readable name for the predicate|
|include|Called on the tripleconfig object. Instructs tripleconfig to include ALL configuration for the specified Subject defined via rdftype above.|

## Extension exercise

Use a test loading page and mljs.saveGraph to save a set of your own triples that don't use any of the existing RDF Types.

Now reconfigure the test page's tripleconfig object to support your ontology.

- - - -

[Course Home Page](tutorial-dev1-001-overview.html) | 
[Next - 8. Lunch](tutorial-dev1-008-lunch.html)
