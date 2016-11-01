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

<div xmlns="http://www.w3.org/1999/xhtml" class="mljstest angular">
<link rel="stylesheet" type="text/css" href="/css/mljs/widgets.css" />
<link rel="stylesheet" type="text/css" href="/css/mljs/widget-search.css" />
<script type="text/javascript" src="/js/mljs/mljs.js"></script>
<script type="text/javascript" src="/js/mljs/mljs-xhr2.js"></script>
<script type="text/javascript" src="/js/mljstest/angular.js"></script>
<script type="text/javascript" src="/js/mljs/mljs-angular.js"></script>
<script type="text/javascript" src="/js/mljs/widgets.js"></script>
<script type="text/javascript" src="/js/mljs/widget-search.js"></script>

<script type="text/javascript" src="/js/mljstest/page-mljstest-angular.js"></script>
  
  
    <div id='appwrapper' ng-app="myApp" ng-controller="SampleCtrl">  
         <div class="container_12">  
                <span id="searchContext" mljs-search-context="" optionsName="mljstest-page-search-options" mljs="mljs" options="ob"></span>
                <div id="searchBar" mljs-search-bar="" class="grid_12"  contextIds="searchContext"></div>
                <div id="searchFacets" mljs-search-facets="" class="grid_4" contextIds="searchContext"></div>
                <div id="searchResults" mljs-search-results="" class="grid_8" contextIds="searchContext"></div>
                <div id="sorter" mljs-search-sort ="" contextIds="searchContext" class="grid_12"></div>
                <div id="pager" mljs-search-pager = "" contextIds="searchContext" class="grid_12"></div>
                <div id="metrics" mljs-search-metrics = "" contextIds="searchContext" class="grid_12" init-func="initSearch(widget)"></div>
         </div>       
    </div>
 
</div>