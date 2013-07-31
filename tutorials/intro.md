[Back to All Tutorials list](tutorial-all.html)
# MLJS Introduction

MLJS is a JavaScript wrapper around the MarkLogic REST API in MarkLogic server versions 6 & 7. MLJS consists of
a core API defined in mljs.js, a set of communication and security wrappers, and some browser widgets. The
complete set of functionality can be seen in the following diagram.

![alt text](./images/mljs-diagams.002.png "MLJS API")

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