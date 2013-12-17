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

<div xmlns="http://www.w3.org/1999/xhtml" class="mljstest workplace">

<link rel="stylesheet" type="text/css" href="/css/mljs/widgets.css" />
<link rel="stylesheet" type="text/css" href="/css/mljs/modal.css" />
<script type="text/javascript" src="/js/lib/jquery-1.7.1.min.js"></script>
<script type="text/javascript" src="/js/mljs/mljs.js"></script>
<script type="text/javascript" src="/js/mljs/mljs-xhr2.js"></script>

<script type="text/javascript" src="/js/highcharts.js"></script>
<script type="text/javascript" src="/js/mljs/widgets.js"></script>

<script type="text/javascript" src="/js/mljs/widget-search.js"></script>
<script type="text/javascript" src="/js/mljs/widget-workplace.js"></script>
<script type="text/javascript" src="/js/mljs/widget-highcharts.js"></script>
<script type="text/javascript" src="/js/mljstest/page-mljstest-workplaceadmin.js"></script>
  
  <div id="intro" class="">This is a full screen workplace admin widget test page.</div>
  <div id="errors" class=""></div>
  <div id="workplaceadmin">workplace admin</div>
  
</div>