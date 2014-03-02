[Back to All Tutorials list](tutorial-all.html)
# Using MLJS with Angular.js

This tutorial is for Sir Dave Cassel of Vanguard. 8o) He loves Angular.js. I've not personally played around with it too
much, but I see the advantages. MLJS is specifically designed so you can plugin whatever page/controller libraries in
you want, so using MLJS and Angular together is a good fit.

This tutorial describes how MLJS' and Angular's async model differs, and how to integrate the two.

## Angular and MLJS core

MLJS Core methods all accept callback functions. This makes wrapping them with Angular Services pretty easy. It also
drastically reduces the code complexity of using Angular.js against MarkLogic's REST API within Angular services. Below
is an example adapted from Angular code form Dave:-

````javascript
this.$get = function($q, $http) {
  var db = connections[$http.cookies.somecookie]; // basically links stateless HTTP protocol, with stageful authenticate client, to DB connection. I assume this is created elsewhere - whatever the angular equivalent of getting cookie headers and parsing them is
  var service = {
    search: function() {
      var d = $q.defer();
	    db.search(“”,function(result) {
	      if (result.inError) {
	        d.reject(result.details);
	      } else {
          var res = {results: rewriteResults(result.doc.results) };
          d.resolve(res);
 	      }
      });
	    return d.promise;
    },
    getDocument: function(uri) {
      var d = $q.defer();
      db.get(uri,function(result) {
        if (result.inError) {
	        d.reject(result.details);
        } else {
          d.resolve(result.doc);
        }
      });
      return d.promise;
    },
    createDocument: function(doc, options) {
      db.save(some,params,here,function(result) {
        if (result.inError) {
	        d.reject(result.details);
        } else {
          d.resolve(result.docuri); // MLJS automatically pulls this out
        }
      });
      return d.promise;
    }
  };

  return service;
};
````

This service shows how to wrap three MLJS calls to the REST API - search, save, and get. All pretty straightforward.

## MLJS Contexts event driven architecture

The MLJS Core API also provides a higher level set of classes called Context Objects. Rather than perform a single
call these objects maintain related state between several calls to MLJS. This is generally because other classes
(or user interface widgets) that interact with a particular method may only update part of the state, and don't really
care about when or how MarkLogic calls are made.

A good example of this is a search results paging widget. It displays search results information (number of results and
pages), but only interacts with the search by switching the page number (start result number in the search API).

Also many different objects can be monitoring various aspects of the state of a Context. A facets widget may need to
redraw available facet information after a search has completed from an action in a separate wizard.

Thus the class affecting a particular aspect of state may itself not be concerned with the outcome of changing that state.
This makes Contexts a good use case for the publish/subscribe event driven model. Various state update events are built in to
MLJS Core Contexts for this purpose.

## Angular.js promise model

Angular.js uses a quite low level paradigm for asynchronous updates called promises. This is very similar to how MLJS Core
works in that a specific callback is invoked for a single, specific call. It's just the mechanism that differs. Rather than
pass a callback to the async function you instead create a promise object and defer invocation until that async function returns.

Because each promise is associated with a single request this fits well with the MLJS callback architecture, as you see in the
above service example.

## Using MLJS Contexts with Angular.js

MLJS Context objects are generally useful because they maintain overall state across calls. This is sometimes useful to
expose within Angular.js services themselves rather than using a low level API.

The problem is, a fully event driven architecture is a poor match to the promise invocation model. Normally in an EDA there
is no link maintained between the original caller of a function on a context and the event that is eventually fired after
a call to the REST API.

In order to support promises in Context objects, therefore, a way to link service invocations to specific responses is needed.
A feature I've added to Contexts is that where if a particular call is superseded, a late arriving result for the original call
is dropped.

This occurs if, for example, you do a search in MLJS with a map view. Information is displayed. You may zoom in two or three times
before settling on the view you want results rendering in. Unfortunately, each zoom click generates a search in MarkLogic.
Potentially (and indeed normally), these could be returned in a different order to which they were called, leading to misleading
results being shown.

The Search Context now has a request ID tracking capability to prevent this from happening. This means and ID is associated with
every MLJS async call against MarkLogic.

I have also provided a searchcontext.promise(promiseObject) method which returns an interface abstraction of a search context that
is promise aware. This uses the above callback-or-drop functionality to ensure the correct promise is invoked on receiving
responses from MarkLogic.

To use this use code similar to the following:-

````javascript
this.$get = function($q, $http) {
  var db = connections[$http.cookies.somecookie]; // basically links stateless HTTP protocol, with stageful authenticate client, to DB connection. I assume this is created elsewhere - whatever the angular equivalent of getting cookie headers and parsing them is
  var sc = db.createSearchContext();
  
  var service = {
    search: function() {
      var d = $q.defer();
      sc.promise(d).doSimpleQuery(""); // async event driven call. NOTE: MUST be called on the result from sc.promise() NOT on sc itself.
	    return d.promise;
    }
  };
};
````

- - - -

[Back to All Tutorials list](tutorial-all.html)