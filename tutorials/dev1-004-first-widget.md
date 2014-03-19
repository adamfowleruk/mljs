# First MLJS Widget

Now you're going to create your own MLJS widget! Shock horror. Fear ye not, 'tis easy. Follow the below.

- Create a blank widget JS file
- Add your widget initialisation code
- Respond to context events
- Use in your application
- Extension exercise

## Create a blank widget file

Go grab the code from samples/009-blank-widget.js and copy it in to a new file, src/js/mljs/widget-training.js .

Inspect the code. 

Note the global variable declarations at the top. These lines are necessary in all widget files. This is to ensure that
no matter which files are or are not included from the MLJS widget code, or what order they are included in, they all work
together. This also means you don't have to include all widget files just to use a single widget.

Next is a definition of a JavaScript function. Note that JavaScript doesn't have the concept of a Class Definition object.
A class is simply a function that returns a JavaScript object. It may initialise that object and call 'instance' prototype
methods upon it. 

The syntax may look weird, but you'll get used to it. For now just remember that 'constructor' functions return 'this',
and configure 'this'. The constructor function DOES NOT have .prototype. in it's definition, but ALL 'instance' functions do.

Note now the instance function trainingmetrics.prototype.updateResults(); This operates on data passed to it by a search context.
It also accesses object state stored on the 'this' object. More on this later. (No pun intended...)

## Add your widget initialisation code

You first need to initialise the widget in it's constructor function. Do this by taking the parent HTML div id (container variable)
and store it in this object. Also created a search context (just incase the user forgets to register this class, so we don't error).
Then updateResults() in order to initialise the HTML view (if applicable - some widgets may not need this.).

```javascript
  this.container = container;
  this.ctx = mljs.defaultconnection.createSearchContext();
  
  this.updateResults(false); // show 'blank' results
```
  
## Respond to context events

We now need to take the search results and display just the metrics line from them. You do this by altering the updateResults() function.

Copy this code in to your class:-

```javascript
  var str = "";
  
  // results can be true, false or a JSON REST API results object
  if ("boolean" == typeof(results)) {
    if (results) {
      // refreshing search results, show loading icon
      str += com.marklogic.widgets.bits.loading(this.container + "-loading");
    } else {
      // search failed - show nothing
      // Alternatively: str += com.marklogic.widgets.bits.failure(this.container + "-failure");
    }
  } else {
    // create html output
    if (undefined != results.metrics) {
      var time = results.metrics["total-time"]; // Value like: PT1.064535S - it's marklogic, so assumes it's never in minutes (because MarkLogic rocks!)
      var time = time.substring(2,time.length - 1);
      str += "Search completed in " + time + " seconds"; // TODO VALIDATE THIS LINE
    } else {
      // show nothing, rather than useless message
      mljs.defaultconnection.logger.debug("trainingmetrics.updateResults: Results REST API JSON doesn't contain search metrics. Did you set up the search options correctly?");
    }
  }
  
  // send output to webpage DOM (do not make multiple edits to the DOM - it's slower)
  document.getElementById(this.container).innerHTML = str;
```

This code is a little more cumbersome than you may think, but that's because I've used some MLJS best practice in here. An internal mechanism for
search contexts that are mid update (i.e. a REST API search function has been called, but no results have been returned yet) is that updateResults
can be called with 'true' or 'false' boolean values as well as the JSON results object.

This is to allow widgets to draw a spinning 'updating' feedback or take other holding actions until results are returned. A value of 'true' means that
we're waiting on results. A value of 'false' means there was an error executing the search, so we should hide the spinning symbol and inform the user
that results cannot be drawn (the error event is handled elsewhere, by an error widget normally, so we don't display the error in this training widget).

Note the generic MLJS widgets API helper function for showing loading and failure information. 

The guts of the function occur at the end, taking the total-time field (if present) form the JSON results, reformatting it, and showing in the screen.

This is a general pattern that can be applied for all JSON data returned by all context objects.

## Use in your application

Now we need to link it to your application. To do this simply change:-

```javascript
var searchmetrics = new com.marklogic.widgets.searchmetrics("speed");
```

And replace with:-

```javascript
var searchmetrics = new com.marklogic.widgets.trainingmetrics("speed");
```

Also add in your HTML file an include for your new file:-

```
   <script type="text/javascript" src="/js/mljs/widget-training.js"></script>
```

Now save, deploy and run your app. You'll notice the output is uncannily the same as before!

Go inspect the last 20 lines of /src/js/mljs/widget-search.js to find out why! Whilst there, search for the following
and see how they expand on this mechanism:-

searchsort = function

searchpager = function

## Extension exercise

Install the Firebug extension in Firefox, enable it, enable the Net tab information, and re-run the above page.

Now inspect the results from POST /v1/search in the Net tab. Have a look at the JSON returned data.

You'll see all the information returned from search results. You can modify what is returned by changing the
search options. Have a look at the API docs to see what extra information you can return in search results.

If you have time, alter your widget to show that information too.

- - - -

[Course Home Page](tutorial-dev1-001-overview.html) | 
[Next - 5. Search Options](tutorial-dev1-005-search-options.html)