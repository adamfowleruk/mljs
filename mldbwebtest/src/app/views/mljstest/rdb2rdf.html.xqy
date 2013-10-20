xquery version "1.0-ml";

import module namespace vh = "http://marklogic.com/roxy/view-helper" at "/roxy/lib/view-helper.xqy";

declare option xdmp:mapping "false";

(: use the vh:required method to force a variable to be passed. it will throw an error
 : if the variable is not provided by the controller :)
(:
  declare variable $title as xs:string := vh:required("title");
    or
  let $title as xs:string := vh:required("title");
:)

(: grab optional data :)
(:
  declare variable $stuff := vh:get("stuff");
    or
  let $stuff := vh:get("stuff")
:)

<div xmlns="http://www.w3.org/1999/xhtml" class="mldbtest rdb2rdf">

<link rel="stylesheet" type="text/css" href="/css/mljs/widgets.css" />
<link rel="stylesheet" type="text/css" href="/css/bootstrap-roxy.css" />
<script type="text/javascript" src="/js/lib/jquery-1.7.1.min.js"></script>
<script type="text/javascript" src="/js/lib/bootstrap.min.js"></script>
<script type="text/javascript" src="/js/lib/jquery.bootstrap.wizard.js"></script>
<script type="text/javascript" src="/js/mljs/mljs.js"></script>
<script type="text/javascript" src="/js/mljs/mljs-xhr2.js"></script>

<script type="text/javascript" src="/js/mljs/widgets.js"></script>

<script type="text/javascript" src="/js/mljs/widget-rdb2rdf.js"></script>
<script type="text/javascript" src="/js/mljstest/page-mljstest-rdb2rdf.js"></script>
  
  <div id="intro" class="">This page shows the RDB2RDF Import wizard. Using this wizard combined with MLSAM on a separate Tomcat server you can import entire Relational databases to the MarkLogic V7 triple store. This requires the RDB2RDF REST extension to also be installed.</div>
  <div id="errors" class=""></div>
  <div id="wizard">wizard</div>
</div>