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

<div xmlns="http://www.w3.org/1999/xhtml" class="mljstest dnd">

<link rel="stylesheet" type="text/css" href="/css/mljs/widgets.css" />
<script type="text/javascript" src="/js/mljs/mljs.js"></script>
<script type="text/javascript" src="/js/mljs/mljs-xhr2.js"></script>

<script type="text/javascript" src="/js/mljs/widgets.js"></script>

<script type="text/javascript" src="/js/mljstest/page-mljstest-dnd.js"></script>
  
 <div class="container_12">  
  <div id="errors" class="grid_12"></div>
 </div>
 <div class="container_12"> 
  <div class="grid_6">
    <div id="drag1" draggable="true">Draggable 1</div>
    <div id="drag2" draggable="true">Draggable 2</div>
    <div id="drag3" draggable="true">Draggable 3</div>
  </div>
  <div class="grid_6">
    <div id="dropzone">Drop Things here!!!</div>
  </div>
 </div>
 <div class="container_12">  
  <div id="logzone" class="grid_12"></div>
 </div>
</div>