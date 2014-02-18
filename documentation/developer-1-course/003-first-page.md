# Your first MLJS powered page

Let's get started quick! We need a few things to get started in an application:-

- A content database
- A Web Server
- A REST API Server
- An application deployed to this server
- A HTML page shell
- A JavaScript page initialisation script
- Data for the application

Let's go create these things in turn

## A Web Server, REST Server, and database

It's possible to use MLJS within a MarkLogic HTTP REST App Server. The easiest way to get started is
to use a MarkLogic sponsored tool called the Roxy Deployer. This enables you to issue a few commands
and end up with a working application.

We'll create a pure REST Server and test database for our content. To do this, follow the instructions
on the following video:-

WARNING: When it says 'app-type=hybrid' replace with 'app-type=rest' - we won't need XQuery support in 
our web application!

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


      <div class="header" arcsize="5 5 0 0">
      
Remove all the content within it. Replace with this:-

<a href='index.html'>Home</a>

Now find:-

<script type="text/javascript" src="/js/mljstest/page-mljstest-search.js"></script>

And alter the URL to be /js/page-index.js . This is a common pattern I use. Every HTML
page has a corresponding JavaScript page with the same base name (index) at the end.
This JavaScript initialises the dynamic MLJS widgets on a page.

Now all this element:-

  <div id="search-page" class="search-page">Search page content goes here</div>
  
To instead be like this:-


   <div class='container_12' id='errors'></div>

   <div class='container_12 searchpage-inner'>
    <div id='search-facets' class='grid_4 searchpage-facets'> </div> 
    <div id='search-main' class='grid_8 searchpage-main'>
      <div id='search-bar' class='searchpage-bar'></div>
      <div id="speed" class="">speed</div>
      <div id='search-error' class='searchpage-error'></div>
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


Save the file.

## A JavaScript page initialisation script

Create a folder called 'js' under the 'src' folder. In here copy the entire ./mljsrest/src/js/mljs folder 
from the GitHub repo.

Go find ./samples/006-widget-page.js from the MLJS GitHub repo. Copy this code in to a new ./src/js/page-index.js file.

Edit this file. You can see all the stages with example code. If in your projects you need a totally blank page, copy
the samples/007-blank-page.js file.

This file shows the steps you need to take to have a full MLJS page working.

Alter the page

## Application Data

