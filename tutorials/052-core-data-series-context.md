[Back to All Tutorials list](tutorial-all.html)
# The Data Series Context

In many application you may be collecting data from a variety of places. Rather than operate on the low level of data
you instead wish to combine data to provide the concept of series, axes and values.

Consider an application where there is a dashboard page. You could have a single search context feed a single chart.
You could have multiple charts on one page. What about if the data all had the same axes, or topic, or categories?
You may wish to process the data then combine it on the same chart, with aligned data categories and series.

This is what the data series context is for. By providing a set of sources (e.g. search contexts, semantic contexts)
and configuring data joins and transforms, you can overlay disparate data about the same subject on a single chart.

Uses include multiple 'pins' in a map, a third dimension in a table (category), or series in a chart.

This method is different from making the same chart listen to multiple search contexts (for example) and using the raw
data. This is because some data may identify a subject as 'Adam Fowler' in a content facet, whereas a semantic search
may identify the same subject as 'http://somesite.com/Person/AdamFowler'. Thus processing of the content before display
is required to 'join' information about the same subject together.

## How does it work?

The Data Series Context can act as a chained context. This means a searchcontext's updateResults method would attempt
to call the updateResults method on the Data Series Context. The Data Series Context in turn uses the function's caller
field and compares it against a list of observed contexts.

The Data Series Context then processes the data as required in order to 'join' data together. Once stitched together,
the data series context calls the updateDataSeries() method on its listeners. Typically these are visual widgets
that are configured to display data series information.

## Example work through

Lets say you have done a content search of a set of city information documents. These contain the city name and their
population. You may have raw content results of the below:-


| City | Population |
| --- | --- |
| Derby | 55000 |
| Chesterfield | 30000 |
| Scunthorpe | 58000 |

This has an identity field of City and a single data field of Population.

You may then want to join this with information from a semantic search for city information to show the below:-

| City | County | Country | Population |
| --- | --- | --- | --- |
| Derby | Derbyshire | England | 55000 |
| Chesterfield | Derbyshire | England | 30000 |
| Scunthorpe | Lincolnshire | England | 58000 |

In this example the identity is in an rdfs:label property, and there are two additional data fields for County and
Country.

Configuring a data series context to be chained to a search context and semantic context will allow this data to be
joined together and displayed in a table.

You may then have additional information with temperature reading data. These could be a set of documents with the
below data:-

| City | Date | High | Low |
| --- | --- | --- | --- |
| Derby | 2014-01-01 | 5 | -1 |
| Derby | 2014-06-20 | 27 | 18 |
| Chesterfield | 2014-05-03 | 27 | 23 |

By performing a co-occurence process against City and mean average high and mean average low temperatures, you can
join this information to the above to provide a holistic view of English cities and their summary data. This requires
a second search context set up to execute a co-occurence against the /v1/values endpoint.

## Second example

Alternatively, the data could be sparse - with each data series having nothing to do with each other. This is often the
case for markers on maps. Here there are unlikely any common points, but they each need processing and showing
differently.

Perhaps a series on schools has a different marker to one on roads. Roads in turn may have many points that need
joining together in to a single feature rather than a single point. Thus they are shown as a line rather than a marker.
Perhaps again a complaint document has a marker with a document icon.

Each of these series may be shown or hidden in their entirety within the display map widget itself.

The Data Series Context's job in this case is to extract the lon and lat point, apply any transforms
(WGS84 to EPSG900913) necessary, set the marker icon, and decide on the shape/geometry to use.

## Real world charts examples

See the excel file mljs-data-series.xlsx for worked examples of how the data series context should work.
