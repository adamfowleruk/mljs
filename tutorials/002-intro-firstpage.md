[Back to All Tutorials list](tutorial-all.html)
# Your first MLJS search page

This tutorial describes how to create an MLJS powered page from scratch.

## Include the relevant files on the page

You first need to ensure that all CSS and JS files are included on your page. This can be achieved using statements in your page's HEAD like the below:-

```
<link rel="stylesheet" type="text/css" href="/css/mljs/widgets.css" />
<script type="text/javascript" src="/js/mljs/mljs.js"></script>
<script type="text/javascript" src="/js/mljs/mljs-xhr2.js"></script>

<script type="text/javascript" src="/js/mljs/widgets.js"></script>
<script type="text/javascript" src="/js/mljs/widget-search.js"></script>

<script type="text/javascript" src="/js/mljstest/page-mljstest-search.js"></script>
```

The first part includes the MLJS Widgets CSS. Note also if you want to use MLJS' default layout styles then you will need to include 960.css too. 
Specifically the 12 column wide version. MLJS Widgets use those classes for laying out. If you don't want to use 960.css then you will have to
specify width and padding yourself for each widget, or override the 960.css classes for your need.

MLJS will also make use of any bootstrap classes it finds for elements like buttons or panel backgrounds. Include bootstrap (or bootstrap-roxy.css)
if you wish to use those.

The two MLJS JS includes are for MLJS Core (for the search context) and the MLJS XMLHttpRequest2 connector (to communicate with MarkLogic).

The two widgets JS files are for core widget functions and the search widgets, respectively.

The final JS include is for page initialisation. I always like to externalise this so as to not muddy the page with inline JavaScript. I use a
naming convention of page-CONTROLLER-OPERATION.js so as to keep easy track of my page JS files.

This separation is 
especially important is generating your HTML within an XQuery page, as XQuery requires every { and } character to be double escaped {{ like this }}. 
Which is a pain for code highlighting and maintenance.

## Set up the page JavaScript

You now need to initialise the page. I'll assume you may be using jQuery, so I'll use an onload handler:-

```javascript
$(document).ready(function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
    
    // DO SOMETHING WIDGETY HERE
    
  } catch (err) {
    error.show(err.message);
  }
});
```

You see here that I create an MLJS instance for server communication, and set the debug level so I can find any errors easily.

I also create an error widget. This will catch any widget errors and show them in a red box at the top of my page in a user
friendly manner.

## HTML for your widgets

You now need to ensure that somewhere in your page you have placeholders for your widgets (like 'errors' above). These are
blank HTML tags (normally div tags) where widget's have complete control over the content within them.

```
 <div class="container_12">  
  <div id="errors" class="grid_12"></div>
 </div>
 <div class="container_12">  
  <div id="mysearchbar" class="grid_12"></div>
 </div>
 <div class="container_12">  
  <div id="mysearchresults" class="grid_12"></div>
 </div>
```

Note the use of the two 960.css classes of container_12 and grid_12. These specify a 'full width' vertical layout of my widgets.

## Instantiating your widgets

You have already told your errors widget to use the html div tag called 'errors' to render within. You now need to do the same for
two search widgets, and link those widgets together using a search context object. You do this with the following:-

```javascript
    var searchbar = new com.marklogic.widgets.searchbar("mysearchbar");
    var searchresults = new com.marklogic.widgets.searchresults("mysearchresults");
    
    var ctx = db.createSearchContext();
    
    ctx.register(searchbar);
    ctx.register(searchresults);
    
    var ob = db.createOptions();
    ob.collectionConstraint() // default constraint name of 'collection' 
      .snippet(); // generate snippets rather than returning the whole document
    var options = ob.toJson();
  
    ctx.setOptions("default",options);
    ctx.addErrorListener(error.updateError);
    ctx.doSimpleQuery("",1);
```

This instructs MLJS to create two widgets, linked with a search context. The register function introspects the widgets to determine
what events they generate and consume, and links them to the search context.

The options builder is an MLJS helper object to generate JSON search options configuration without complex code. Here we create
a simple collection constraint (and facet) and specify that we want to use snippeting mode rather than return full documents.

setOptions instructs the searchcontext to use the default search options configured on the REST API instance, providing those options
in case they do not already exist.

We also register the context with the error widget in case any problems are encountered performing the search.

doSimpleQuery instructs MLJS to perform a search immediately on page load with a blank query and starting at the first returned 
document. This effectively loads (by default) the first page of documents ordered by relevancy.

You now have a working MLJS Search page! Type in any phrase to find documents on your REST API endpoint that match. 

- - - -

[Back to All Tutorials list](tutorial-all.html)