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

<div xmlns="http://www.w3.org/1999/xhtml" class="mldbtest charts">

<link rel="stylesheet" type="text/css" href="/css/mljs/widgets.css" />
<script type="text/javascript" src="/js/lib/jquery-1.7.1.min.js"></script>
<script type="text/javascript" src="/js/mljs/mljs.js"></script>
<script type="text/javascript" src="/js/mljs/mljs-xhr2.js"></script>

<script type="text/javascript" src="/js/mljs/widgets.js"></script>
<script type="text/javascript" src="/js/highcharts.js"></script>
<script type="text/javascript" src="/js/mljs/widget-search.js"></script>
<script type="text/javascript" src="/js/mljs/widget-highcharts.js"></script>

<script type="text/javascript" src="/js/mljstest/angular.js"></script>
<script type="text/javascript" src="/js/mljs/mljs-angular.js"></script>

<script type="text/javascript" src="/js/mljstest/page-mljstest-charts.js"></script>

<div id='appwrapper' ng-app="myApp" ng-controller="SampleCtrl">  
   
     <div class="container_12">  
      <div id="errors"  mljs-error = "" class="grid_12"></div>
     </div>
  
     <div class="container_12">  
      <span id="searchContext" mljs-search-context="" optionsName="page-charts-tempchart" mljs="mljs" options="ob"></span>
      
      <div id="tempchart" mljs-high-charts="" class="grid_6" errorListener = "errors" contextIds="searchContext"
      mljsProps='{{"title":"Line: City temperature means", "subtitle" :"Degrees C", "yTitle" :"C"}}'>1</div>
      <div id="tempsplineline" mljs-high-charts="" class="grid_6" contextIds="searchContext">2</div>
      <div id="tempbar" mljs-high-charts="" class="grid_6" contextIds="searchContext">3</div>
      <div id="tempstackedbar" mljs-high-charts="" class="grid_6" contextIds="searchContext">4</div>
      <div id="temparea" mljs-high-charts="" class="grid_6" contextIds="searchContext">5</div>
      <div id="tempstackedarea" mljs-high-charts="" class="grid_6" contextIds="searchContext">6</div>
      <div id="tempcolumn" mljs-high-charts="" class="grid_6" contextIds="searchContext">7</div>
      <div id="tempstackedcolumn" mljs-high-charts="" class="grid_6" contextIds="searchContext" init-func="initSearch(widget)">8</div>
     </div>

</div>
</div>