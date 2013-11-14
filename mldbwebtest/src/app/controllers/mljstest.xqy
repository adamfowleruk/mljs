xquery version "1.0-ml";

module namespace c = "http://marklogic.com/roxy/controller/mljstest";

(: the controller helper library provides methods to control which view and template get rendered :)
import module namespace ch = "http://marklogic.com/roxy/controller-helper" at "/roxy/lib/controller-helper.xqy";

(: The request library provides awesome helper methods to abstract get-request-field :)
import module namespace req = "http://marklogic.com/roxy/request" at "/roxy/lib/request.xqy";

declare option xdmp:mapping "false";


declare function c:search() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "Search"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))

};

declare function c:charts() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "HighCharts"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))

};

declare function c:chartsearch() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "HighCharts and Search"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))

};

declare function c:movies() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "Cooccurence"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))

};

declare function c:kratu() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "Google Kratu"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))

};

declare function c:error() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "Error widget test"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))

};

declare function c:docbuilder() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "Document Builder"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))

};

declare function c:upload() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "Upload"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))

};

declare function c:collectionuris() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "Collection URIs"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))

};

declare function c:sparqlbar() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "Semantics"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))

};

declare function c:main() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "MLJS data loading"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))

};

declare function c:snippets() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "Snippets"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))

};

declare function c:docview() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "Document Viewer"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))

};

declare function c:explorer() as item()*
{
  (
  ch:add-value("message", "MLJS Explorer Widget."),
  ch:add-value("title", "Explorer"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))

};

declare function c:workplace() as item()*
{
  (
  ch:add-value("message", "MLJS Workplace Search Sample."),
  ch:add-value("title", "Workplace"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))
};

declare function c:rdb2rdf() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "RDB2RDF Import Wizard"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))
};

declare function c:openlayers() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "OpenLayers mapping widget"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))
};

declare function c:workplaceadmin() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "Workplace Admin"),
  ch:use-view((), "xml"),
  ch:use-layout("mljs-one-column-test","html"))
};
