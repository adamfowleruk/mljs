# MLJS Search Options

Now you're going to create your own MLJS widget! Shock horror. Fear ye not, 'tis easy. Follow the below.

- About search options
- Some often used options
- Buckets
- Modify your application
- Extension exercise

## About search options

The Options Builder in MLJS abstracts all the nasty JSON and XML formatting traditionally associated with
search option configuration in MLJS. Functions are provided to configure constraints easily for a variety
of situations - whether JSON or XML constraints.

These functions all return a reference to the same search options builder object. This allow function
chaining, keeping code neater (as you saw in the first example).

These constraints functions also make assumptions. Many of them will auto named your constraint to the same
name as the element the constraint is for. They will also make a guess of the human readable version of
this name using camel case and underscores as word delimiters.

The coolest feature MLJS provides though is to automatically set up sorting (both ascending and descending)
for constraints that you define, and enabling all constraints as facets. You can disable this by passing in
an option to each constraint creation method, but they are on by default. Afterall why would you configure them
if you didn't want to use them?

Some option builder methods do return objects other than the options builder itself. These are the bucketing
functions. This is because they return utility objects that make defining individual buckets easier. More
on this later though.

## Some often used options

Below is a table of common options used with the MarkLogic REST API that you should be aware of:-

|Method|Usage Notes|
|---|---|
|collectionConstraint()|Defines a collection constraint with name 'collection'|
|additionalQuery(string)|An additional, XML form, query to restrict all results by|
|forest(id)|Restrict to a single forest|
|fragmentScope(string)|Specify the fragment scope to use. Defaults to document. Can also be 'properties'|
|returnFacets|Instructs MarkLogic to return facet information with results|
|returnMetrics|Instructs MarkLogic to return search speed information with results|
|returnValues|Instructs MarkLogic to return values (E.g. co-occurences) with results. Only applies to /v1/values never  /v1/search|
|defaultNamespace|The default namespace to apply to element constraints where not specified. Defaults to JSON namespace|
|defaultCollation|Changes the default collation to use for constraints where not specified. Defaults to same as MarkLogic server default (http://marklogic.com/collation)|
|extractConstraintMetadata|Returns extracted constraint (element, attribute, json key, path, etc.) values from the document. Very useful to minimise data returned by MarkLogic|
|rangeConstraint|Create a range constraint on an XML element|
|jsonRangeConstraint|Create a range constraint on a JSON key-value pair (calls rangeConstraint internally - it's a helper function)|
|annotate|Specifies the human readable string to use for the specified constraint. Obeyed by MLJS visualisation widgets.|
|buckets|Creates and returns a fixed buckets helper object|
|computedBuckets|Creates and returns a computed buckets helper object|
|geoElementPairConstraint|Creates a geospatial constraint for later use by a structured query, for geo queries to reference. Not usually returned as facet information.|

A lot of the above constraint functions have obvious alternatives, like pathRangeConstraint and geoElemAttrPairConstraint. Read the full MLJS
core API docs for a full list. The above options are often used though.

## Buckets

There are two methods to adding buckets - fixed and calculated. They pretty much work the same. Below are two examples:-

Fixed buckets:-

```javascript
  var dateBuckets = ob.buckets("DateReceived");
  dateBuckets.bucket("2013-01-01","2013-01-31","jan2013","Jan 2013")
             .bucket("2013-02-01","2013-02-28","feb2013","Feb 2013")
             .bucket("2013-03-01","2013-03-31","mar2013","Mar 2013");
``` 

Computed Buckets:-

TODO

## Modify your application

Add the above fixed buckets code (not calculated) to your application at the end of the search options section.

Save, deploy and retest your code.

Now go read the API docs for buckets() and computedBuckets() to ensure you are familiar with how to use them during this course.

## Extension exercise

As you did in your first page extension exercise, add bucket constraints for your own data. Alternatively, use the annotate() method to
customise the titles of your facets returned from a search.

You can give human readable names to facet values, just just titles. Use code like the following to provide human readable
values to information returned by your searches:-
     
```javascript   
  // add facet value names for cities - just an example. Better example SOME/weirdValue -> "Nice Display Name"
  ob.setFacetValueStrings("City",{
    Derby: "City of Derby", London: "City of London"
  });
```
  
The first parameter is the constraint name, the second is a JSON object with value-title pairs.

- - - -

[Course Home Page](tutorial-dev1-001-overview.html) | 
[Next - 6. Structured Query](tutorial-dev1-006-structured-query.html)