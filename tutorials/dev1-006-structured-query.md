# Structured Query

So far we've used text based queries using the default MarkLogic grammar. These can be extended (or replace) by using
structured queries. These are similar in scope and complexity as using the cts:*-query functions in XQuery.

- When to use structured query
- Query builder
- Create a structured query based dashboard page
- Extension exercise

## When to use structured query

Structured query is particularly useful when the query is hardcoded in the page, or when you have multiple
complex widgets contributing query terms to the same search. A good example of this is a map view that
may contribute a query term for a selected area, but not totally replace the query in it's entirety.

It should be noted that as of MarkLogic 7 you can blend a structured query, with a text query, whilst
submitting search options at the same time. This is called Combined Query and is used automatically by MLJS
should Version 7 be detected. There's also a method to force MLJS to assume a version 7 server with this
support.

## Query Builder

I've started to include a query builder object in MLJS. This is mostly complete and should make using
structured query as simple as using options builder. The function chaining method used is somewhat
different to options builder because queries can have many nested terms.

Below is an example of a structured query used to power a dashboard page:-

```javascript
  var tempscolumn = new com.marklogic.widgets.highcharts("tempstackedcolumn");
  tempscolumn.addErrorListener(error.updateError);
  tempscolumn.setSeriesSources("city","month","reading.temp");
  tempscolumn.column({stacking: 'normal',dataLabels: {enabled: true,color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'}})
             .stackLabels({enabled: true,style: {fontWeight: 'bold',color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'}})
             .title("Stacked Column: City temperature means").subtitle("Degrees C").yTitle("C");
  
  var qb = db.createQuery();
  qb.query(
    qb.and([
      qb.collection("testdata"),
      qb.collection("temperatures")
    ])
  );
  
  var context = db.createSearchContext();
  context.setOptions(optionsName,ob);
  context.register(tempscolumn);
  
  var query = qb.toJson();
  context.doStructuredQuery(query);
```

Note the last line that takes the query builder and renders the final search criteria as MarkLogic REST API compatible JSON.

This sample also shows how to integrate HighCharts in to a demo. Note the use of function chaining to provide helper methods to configure
the often illegible HighCharts configuration JSON.

This simple query is an and() query that uses two collection queries to only use temperature and testdata collection data. This sample is
from the mldbwebtest and mljsrest applications used to test MLJS browser widgets.

## Create a structured query based dashboard page

Create a new HTML file with the same default template called dashboard.html. Create a blank page JS file too called page-dashboard.js.
Remember to include the JS file in your new HTML file.

Whilst you're at it, add some HTML to each page so you can navigate between index, load, and dashboard pages.

Alter the above code to create a column chart over the test data. Feel free to change to a Pie chart if you're feeling adventurous!

Don't forget to call ctx.register(mychart) for your chart object too so it receives data.

Try adding a word query or range constraint query to your structured query. See the Core API Documentation for all query functions
supported by the query builder.

## Extension exercise

Add 4 charts to a page - using TWO or more separate search context objects. Restrict each using structured query to a different
data collection. (I'm assuming you've been consistently fast and added your own data in the 'first page' extension exercise earlier!)

Congrats, you're now a proficient MarkLogic MLJS content application builder!

Now for the cool stuff...

- - - -

[Course Home Page](tutorial-dev1-001-overview.html) | 
[Next - 7. Semantics](tutorial-dev1-007-semantics.html)
