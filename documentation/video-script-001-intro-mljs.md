
Aim: To provide a whistle stop intro to get people hooked on what MLJS is for, and what can be achieved with it.

This video aims to show the core concepts and benefits of the MLJS API. This is part of the mastering MLJS series of bite sized, sub 5 minute webinars.

MLJS is designed to provide two things - A Core API that provides easy to use MarkLogic Server functionality, and a Browser Widget API that uses the Core API to render user interface widgets.

The Core API can be used from within a server-side Node.js process, or within a browser as part of an MLJS driven web application.

You can build a variety of applications with MLJS, using combinations of the functionality of MarkLogic it exposes.

In this example you see six widgets on a page interacting within a single Search Context. The widgets affect various aspects of the query, with each widgets' input being reflected by the query changing, being executed against MarkLogic, and in turn updating the UI.

MLJS aims to expose a large amount of MarkLogic functionality to the application developer, and ultimately the end user. Searching, sorting, faceted navigation, visualisations as charts, geospatial queries, co-occurence of elements within results, and semantic queries and exploration can all be accomplished within an MLJS application.

MLJS aims to provide a level of functionality beyond that of application builder, providing a mid-level API that is pluggable and extensible by javascript developers for emerging application scenarios.

Widgets can be used in any combination, allowing you to create interesting interfaces like this chart and search-bar page, or this graph powered dashboard.

State is maintained amongst widgets by using Context objects. There currently exists a content Search Context, Semantic Search context, and single Document context. These do not act as full 'page controllers' in the classic MVC sense, but rather co-ordinate state about a particular class of operation, like content search for example, amongst a set of widgets. 

A page controller can be constructed that uses these Contexts individually or in combination in order to provide the required application user interface.

A page consists of placeholder HTML, and a small amount of javascript plumbing in a page controller. This sets up the widgets, any query options, and contexts to link widgets together. This example also shows the default search query being executed on page load to provide initial content to the user.

Hopefully this video has provided a short, whistle stop tour of MLJS and what it can be used to create. Please keep tuned for more bite sized, sub 5 minute webinars in this Mastering MLJS series.

3 min 15
