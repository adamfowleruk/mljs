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

<div xmlns="http://www.w3.org/1999/xhtml" class="mldbtest movies">

<link rel="stylesheet" type="text/css" href="/css/mljs/widgets.css" />
<script type="text/javascript" src="/js/mljs/mljs.js"></script>
<script type="text/javascript" src="/js/mljs/mljs-xhr2.js"></script>

<script type="text/javascript" src="/js/mljs/widgets.js"></script>
<script type="text/javascript" src="/js/mljs/widget-cooccurence.js"></script>
<script type="text/javascript" src="/js/mljs/widget-search.js"></script>
<script type="text/javascript" src="/js/mljstest/angular.js"></script>
<script type="text/javascript" src="/js/mljs/mljs-angular.js"></script>

<script type="text/javascript" src="/js/mljstest/page-mljstest-movies.js"></script>
<div id='appwrapper' ng-app="myApp" ng-controller="SampleCtrl">  
  
     <div class="container_12">  
      <div id="cs-hint" class="grid_12">Hint: Click on one of the widget's values to contribute this term to the underlying structured query. 
        Note: Each widget can only contribute 1 value - thus clicking a second value in the same widget changes it's query term, rather than
        adding an additional query term. (Click 'Comedy' then 'Sean Astin' in the actor vs genre widget for an example.)
      </div>
     </div>
     <div class="container_12">  
      <div id="errors" mljs-error = "" class="grid_12"></div>
      <span id="searchContext" mljs-search-context="" optionsName="actor-genre-year" mljs="mljs" options="ob" init-func="initContext(widget)" ></span>
        
     </div>
     <div class="container_12"> 
      <div id="coag" mljs-cooccurence="" errorListener = "errors" contextIds="searchContext" 
         class="grid_6">coag</div>
      <div id="coay" mljs-cooccurence="" errorListener = "errors" contextIds="searchContext"  class="grid_6">coay</div>
     </div>
     <div class="container_12"> 
      <div id="coagy" mljs-cooccurence="" errorListener = "errors" contextIds="searchContext" init-func="initcoagy(widget)" class="grid_12">coagy</div>
     </div>
    </div>
</div>