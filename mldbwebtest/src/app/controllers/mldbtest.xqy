xquery version "1.0-ml";

module namespace c = "http://marklogic.com/roxy/controller/mldbtest";

(: the controller helper library provides methods to control which view and template get rendered :)
import module namespace ch = "http://marklogic.com/roxy/controller-helper" at "/roxy/lib/controller-helper.xqy";

(: The request library provides awesome helper methods to abstract get-request-field :)
import module namespace req = "http://marklogic.com/roxy/request" at "/roxy/lib/request.xqy";

declare option xdmp:mapping "false";


declare function c:search() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "This is a test page title"),
  ch:use-view((), "xml"),
  ch:use-layout("one-column","html"))

};

declare function c:charts() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "This is a test page title"),
  ch:use-view((), "xml"),
  ch:use-layout("one-column","html"))

};

declare function c:chartsearch() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "This is a test page title"),
  ch:use-view((), "xml"),
  ch:use-layout("one-column","html"))

};

declare function c:movies() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "This is a test page title"),
  ch:use-view((), "xml"),
  ch:use-layout("one-column","html"))

};

declare function c:kratu() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "This is a test page title"),
  ch:use-view((), "xml"),
  ch:use-layout("one-column","html"))

};

declare function c:error() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "This is a test page title"),
  ch:use-view((), "xml"),
  ch:use-layout("one-column","html"))

};

declare function c:docbuilder() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "This is a test page title"),
  ch:use-view((), "xml"),
  ch:use-layout("one-column","html"))

};

declare function c:upload() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "This is a test page title"),
  ch:use-view((), "xml"),
  ch:use-layout("one-column","html"))

};

declare function c:collectionuris() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "This is a test page title"),
  ch:use-view((), "xml"),
  ch:use-layout("one-column","html"))

};

declare function c:sparqlbar() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "This is a test page title"),
  ch:use-view((), "xml"),
  ch:use-layout("one-column","html"))

};

declare function c:main() as item()*
{
  (
  ch:add-value("message", "This is a test message."),
  ch:add-value("title", "This is a test page title"),
  ch:use-view((), "xml"),
  ch:use-layout("one-column","html"))

};
