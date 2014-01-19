[Back to All Tutorials list](tutorial-all.html)
# Custom SearchContext endpoints

A custom search context endpoint allows you to invoke your own REST API extension rather than the default /v1/search or /v1/values endpoints.

Your handler function will need to look like the below:-

```javascript
var myfunc = function(searchcontext,textQuery,structuredQuery,optionsName,startIndex,additionalSearchProperties) {
  // The below shows the ‘loading’ images on your widgets, letting them know new results / facets are pending
  searchcontext.resultsPublisher.publish(true);
  searchcontext.facetsPublisher.publish(true);
  
  var options = {
    path: “/my/custom/endpoint/url”,
    method: “PUT”,
    contentType: “application/json"
  };
  mljs.defaultconnection.do(options,CONTENT,function(result) {
    if (result.inError) {
      // oh dear - do something in addition to the below
      searchcontext.resultsPublisher.publish(false);
      searchcontext.facetsPublisher.publish(false);
    } else {
      // do anything here with the results you need to
      searchcontext.resultsPublisher.publish(result.doc.sourceResults);
      searchcontext.facetsPublisher.publish(result.doc.sourceResults.facets);
    }
  });
};
```

Note that CONTENT is null if the HTTP method is GET, but a value otherwise. MLJS handles conversion, so if you want to pass the structuredQuery JSON in the PUT, then replace CONTENT above with structuredQuery. If you’re just using the searchbar widget though you’ll probably get away with GET and null for method and CONTENT, respectively.

I’ve assumed that your JSON response has a ’sourceResults’ element that wraps the search response object. Hopefully you get the idea.

Now register your function:-

```javascript
var db = new mljs();
var ctx = db.createSearchContext();
ctx.customEndpoint(myfunc);
```

You can now link your context to widgets as normal.

- - - -

[Back to All Tutorials list](tutorial-all.html)