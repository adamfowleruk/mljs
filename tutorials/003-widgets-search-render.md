[Back to All Tutorials list](tutorial-all.html)
# Search Results Rendering

The com.marklogic.widgets.searchresults widget supports pluggable rendering. This means if you know how to identify a
particular class of document and know how that should be rendered in a search results page, you can add your own
rendering support.

Out of the box is provided some default renderers. These make a best guess as to what should be used for a title or
for a summary/snippet. 

For JSON Documents, the following fields are checked for use as a title: title, then uri

For JSON Documents, the following fields are checked for use as a summary: summary, then tree representation of the JSON content

For XML Documents, the following fields are checked for use as a title: //title[1], //name[1], //h1[1], first text() element

For XML Documents, the following fields are checked for use as a summary: //summary[1], //synopsis[1], //description[1], //details[1], second text() element

For plain text Documents, the URI is used for the title and the text content used as a summary

## Custom renderers

A custom renderer is a pair of methods - matcher(result) and processor(result). These are both passed the result object.
This result object is a JSON object representing all information about this single result, including URI, score, and content (xml, json or text).

The matcher(result) function should return true if this renderer can be used to render the search result. Otherwise it must return false.

The processor(result) function must generate HTML and return this at the end of the function. Currently no dynamic javascript event handlers are
supported within the HTML output, but that may be added in future.

To add your own renderer to a searchresults widget, simply call the addProcessor(name,matcher_func,processor_func) method.

## Custom renderer examples

There are three custom renderers previously built for different demonstrations. These show a range of functionality. The first one is a simple
example to showing a JSON movie document in a summary. The next one performs similar work for an XML document. This also shows conversion
and using XPath in the browser to extract data. 

The final example shows how to use the built in post-render lazy loading callback feature
to paint additional information after search results are displayed. The example shown renders a description of a powerpoint slide's snippet content,
then uses lazy loading to draw an image linking to the PNG format image thumbnail for the slide.

- [Simple JSON movie example from page-mljstest-movies.js]()
- [Custom XML song renderer from PoC project]()
- [Advanced lazy loading in powerpoint]()

- - - -

[Back to All Tutorials list](tutorial-all.html)