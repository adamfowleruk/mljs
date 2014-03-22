# Your first MLJS powered page

Let's get started quick! We need a few things to get started in an application:-

- A content database
- A Web Server
- A REST API Server
- An application deployed to this server
- A HTML page shell
- A JavaScript page initialisation script
- Data for the application
- Extension exercise

Let's go create these things in turn

## A Web Server, REST Server, and database

It's possible to use MLJS within a MarkLogic HTTP REST App Server. The easiest way to get started is
to use a MarkLogic sponsored tool called the Roxy Deployer. This enables you to issue a few commands
and end up with a working application.

We'll create a pure REST Server and test database for our content. To do this, follow the instructions
below:-

Issue the following command to create a new Roxy REST project:-

```
  ml new tutorialapp --app-type=rest --server-version=7
```

Now copy the mljsme.sh file from the MLJS github repo into your project folder. Then do:-

```
  cd tutorialapp
  chmod u+x mljsme.sh
  ./mljsme.sh -m rest
```

This will tell Roxy to create a Roxy deployer app called 'tutorialapp' which is a MarkLogic pure REST app.

The mljsme.sh file is a helper file that installs the latest stable MLJS code in to your application.

Now you need to bootstrap the app to configure it in MarkLogic:-

```
  ml local bootstrap -v
```

This sets up the necessary forests, content and modules DBs, and app servers (REST Server) required.

## An application

You can start writing your application by adding an index.html page inside the 'src' folder of your
new roxy project. You are free to use whatever layout you want. A starter page is available in
./mljsrest/src/search.html in the MLJS GitHub repository.

Deploy this app using Roxy by issuing the command ./ml local deploy modules -v

Now visit http://localhost:8040/index.html to see your first webpage

Note: An alternative method is to create your database and rest server visually using Information Studio
on http://localhost:8000/ . Once you have created a database, create a REST server instance using the
wizard. You can then deploy your REST HTML application on a separate Node.js server tier. See the
run-webserver.sh file to see how to use this lightweight, Node.js based, WebSockets alerting capable
application server.

## A HTML shell page

Let's customise this page as it doesn't do much yet. Find this line:-

```
  <div class="header" arcsize="5 5 0 0"></div>
```

Remove all the content within it. Replace with this:-

```
  <a href='index.html'>Home</a>
```

Now find:-

```
  <script type="text/javascript" src="/js/mljstest/page-mljstest-search.js"></script>
```

And alter the URL to be /js/page-index.js . This is a common pattern I use. Every HTML
page has a corresponding JavaScript page with the same base name (index) at the end.
This JavaScript initialises the dynamic MLJS widgets on a page.

Now replace this element:-

```no-highlight
  <div id="search-page" class="search-page">Search page content goes here</div>
```

With this:-

```no-highlight
   <div class='container_12' id='errors'></div>

   <div class='container_12 searchpage-inner'>
    <div id='search-facets' class='grid_4 searchpage-facets'> </div> 
    <div id='search-main' class='grid_8 searchpage-main'>
      <div id='search-bar' class='searchpage-bar'></div>
      <div id="speed" class="">speed</div>
      <div class='grid_8 searchpage-controls'>
        <div class='searchpage-controls-inner'>
          <div id='search-pager' class='grid_5 alpha searchpage-pager'></div>
          <div id='search-sort' class='grid_3 omega searchpage-sort'></div>
        </div>
      </div>
      <div id='search-results' class='grid_8 searchpage-results'></div>
      <div id='search-results-actions' class='grid_8 searchpage-results-actions'></div>
    </div>
   </div>
```

Save the file.

## A JavaScript page initialisation script

Create a folder called 'js' under the 'src' folder. In here copy the entire ./mljsrest/src/js/mljs folder 
from the GitHub repo.

Go find ./samples/007-blank-page.js from the MLJS GitHub repo. Copy this code in to a new ./src/js/page-index.js file.

Edit this file. You can see all the stages with example code. If in your projects you need a totally blank page, copy
the samples/007-blank-page.js file.

This file shows the steps you need to take to have a full MLJS page working.

Now save and deploy all files and test the application. Visit http://localhost:8040/index.html  and observe that
no error messages or JavaScript errors are shown.

You're now going to alter the page to use widgets. For each of the named div's above you need a line like the below:-

```javascript
  var searchbar = new com.marklogic.widgets.searchbar("search-bar");
```

Do this under 1. in the page file for each of the widgets and areas named below:-

|Widget class name|div id|
|---|---|
|searchbar|search-bar|
|searchfacets|search-facets|
|searchmetrics|speed|
|searchpager|search-pager|
|searchsort|search-sort|
|searchresults|search-results|

All widgets in MLJS are wholly independent. They've don't detect each others' existence on the page. This is to allow
many different searches and search results to occur on the same page - E.g. to power a dashboard view.

To link these widgets together we register them with the same MLJS context. In our case a (content) search context. First create
a search context under 2.:-

```javascript
var ctx = db.createSearchContext();
```

Then add a line like the below for each widget, also under 2.:-

```javascript
  ctx.register(searchbar);
```

This then links all the widgets together. We're almost done. We need to configure search options to power the facets, then run a
default search. (You can test the page again now if you wish, to find code errors).

To configure search options use code like the following, and place it under 3. in the file:-

```javascript
  var ob = db.createOptions();
  ob.defaultCollation("http://marklogic.com/collation/en")
      .collectionConstraint() // default constraint name of 'collection' 
      .rangeConstraint("Title","title","http://www.w3.org/1999/xhtml","xs:string","http://marklogic.com/collation/",true)
      .rangeConstraint("Heading","h1","http://www.w3.org/1999/xhtml","xs:string","http://marklogic.com/collation/",true)
      .jsonRangeConstraint("stars","xs:int")
      .rangeConstraint("DateReceived","datereceived","http://marklogic.com/ns/dt","xs:date",null,true)
      .annotate("DateReceived","Received On")
      .geoElementPairConstraint("location","location","http://marklogic.com/xdmp/json/basic",
        "lat","http://marklogic.com/xdmp/json/basic","lon","http://marklogic.com/xdmp/json/basic");
  ctx.setOptions("mysearchoptions",ob); // note we're passing the options builder object, not the JSON output of ob.toJson()
```

When the page initially loads we'd like to show the total results that exist. I.e. do a query on an empty string. 
We do this by executing the search as below. Place this code under 4. in the file:-


```javascript
  ctx.doSimpleQuery("",1);
```

Now save, deploy and test this page. You'll notice nothing happens, other then a fast search result time! This is a good thing.
We now need to add data...

## Application Data

You can add data using MLCP or Information Studio, but you can also do this in MLJS. Create a new page based on the blank page
called 'load.html' and a JS controller file called 'page-load.js' and copy and paste the code from samples/008-load-data.js in
this file. Make sure the HTML page has a div tag with id='log'.

This code shows how to load many files in to MarkLogic, in series, using MLJS. Works with JSON, text and XML files. Type detection
is done by MLJS automatically, and passed to MarkLogic.

Deploy the code. Now visit the page load.html. Note the data loading messages appearing in the log div tag.

Once completed, go visit your index.html page again.

You now have a working MLJS search page!

## Extension exercise

Find yourself ahead of the slow coaches in the class? Good! Now get some of your own data from recent MarkLogic work and add it
to the data loading script. 

Also reconfigure the search options for the page as required to show a facet for that data too.

If you're feeling adventurous, investigate the bucket() and calculateBucket() methods of option builder and use them too.

- - - -

[Course Home Page](tutorial-dev1-001-overview.html) | 
[Next - 4. First Widget](tutorial-dev1-004-first-widget.html)