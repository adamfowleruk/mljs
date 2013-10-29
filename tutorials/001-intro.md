[Back to All Tutorials list](tutorial-all.html)
# MLJS Introduction

MLJS is a JavaScript wrapper around the MarkLogic REST API in MarkLogic server versions 6 & 7. MLJS consists of
a core API defined in mljs.js, a set of communication and security wrappers, and some browser widgets. 

## Why you should use MLJS

MLJS abstracts the dull, repetitive or difficult work associated with working with the MarkLogic REST API so that
you can concentrate on developing awesome applications. You want to spend time creating a tailored search app
for your clients, not figuring out the intricacies of HTTP Digest authentication, or the exact JSON format
search query to perform a simple search in MarkLogic.

MLJS handles all this complexity for you. The heart of the Core API is the MLJS object itself. This acts like a 
client connection object. It provides methods like save(), get(), delete() and search() that take simple parameters
and do exactly what they say.

MLJS underneath these methods is handling the exact type of REST call (GET, PUT, POST), the destination URL, query
string parameters, document to send, how to handle the response, managing any errors, and the underlying authentication.
All you need do is read a method's documentation and provide the simple parameters in order to connect to MarkLogic.
There are even administration methods to create and destroy entire REST server instances.

Above this are the context objects. These handle common situations where the calling of one method may affect several
objects 'listening' for particular actions. Consider 5 different search based widgets on a single page, all responding
to an executed search but all displaying different things - like the results, the facets, the pagination, the sorting allowed.
This is common functionality you'll want to re-use, but not write from scratch each time.

Layered over the top of this API are the Widget libraries. These provide JavaScript backed XHTML 1.0 and HTML 5 compatible
web widgets for integration in your web applications. These use the context objects usually rather than MLJS Core directly
in order to provide an interactive UI to your application. 

Example include a simple search bar using google-esque simple
search grammar, or a chart summarising facet information, or a document upload widget. You can choose to mix and match these
widgets on a particular page in order to power your application.

All this means one thing - a lot less code to write from scratch to get your application up and running. I've personally been
using MLJS to power all my demonstrations of MarkLogic since December 2012. I estimate for what would have taken me 2-3 weeks to write
in a mix of XQuery and Roxy and HTML and JavaScript now takes me on average 4 days. All through re-use and using a standard API.

Even when I have to add functionality it takes much less time - because I re-use what's there. Need to add a chart widget over the search
results? I've got a searchcontext and the event handlers and underlying functionality to do that - all I need to do is write the small
amount of code to power the chart. Easy.

***MLJS saves time, is easier to learn that the REST API itself, and provides rich functionality OOTB, ready to demo. This is why you should invest time in learning and using MLJS yourself.***

## What is provided by MLJS?

The
complete set of functionality can be seen in the following diagram.

![MLJS API](./images/mljs-diagrams.002.png "MLJS API")

As you can see above, there is a core API highlighted in red. The Green boxes are communication and security 
wrappers for Node.js. These are necessary because NodeJS does not provide Digest and Basic authentication
out of the box. There are therefore three wrappers at the moment - no authentication, basic auth, and digest
auth.

Node.js has no visual component, so really all you'll use as an application developer is the core mljs.js file.
MLJS has been designed so it can be used in the browser with no code changes. You can deploy this file along
with some in-browser specific communication wrappers. These have been provided in case the basic communication
facilities of a particular browser you need to support do not function as expected. 

The best tested browser communication wrapper, and
the default, is XHR2. This uses XMLHttpRequest2. For most browsers this is safe. This is used in preference
to the jQuery, XHR (XMLHttpRequest V1) and prototype.js libraries because it handles binary file upload more
elegantly and with less code hacks than the other wrappers.

I have also provided a set of common browser widgets that wrap MLJS. These are useful for creating applications
in the browser. Each file may contain one or more widget. The most complete file is widgets-search.js which 
provides a search bar, page navigation, sorting, facets and results widgets, and an overarching searchpage
widget that contains all of these in one handy wrapper.

Other widgets are available. For a complete visual listing please 
[visit my blog page](http://adamfowlerml.wordpress.com/2013/06/03/what-web-widgets-are-now-available-for-marklogic/) 
that lists all the default MarkLogic Visualisation Widgets as well as all those
I have created in MLJS.

- - - -

[Back to All Tutorials list](tutorial-all.html)