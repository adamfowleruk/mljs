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

<div xmlns="http://www.w3.org/1999/xhtml" class="mldbtest error">

<link rel="stylesheet" type="text/css" href="/css/mljs/widgets.css" />
<script type="text/javascript" src="/js/mljs/mljs.js"></script>
<script type="text/javascript" src="/js/mljs/mljs-xhr2.js"></script>

<script type="text/javascript" src="/js/mljs/widgets.js"></script>

<script type="text/javascript" src="/js/mljstest/page-mljstest-error.js"></script>

 Just the error message itself, around a string:-
 <div id="error-basic">Basic</div>
 <hr />
 A brief summary, around an MLJS communication error:-
 <div id="error-summary">Summary</div>
 <hr />
 A brief summary with the first line of the error, around an MLJS communication error:-
 <div id="error-pointer">Pointer</div>
 <hr />
 Full details available, around an MLJS communication error:-
 <div id="error-details">Details</div>
 <hr />
 Handling of missing extension error:-
 <div id="error-extension">Details</div>
 <hr />
 Handling of non MLJS JavaScript errors:-
 <div id="error-js">JS Details</div>
 <hr />
 A 'default' text only, dumb handling of errors (not an MLJS widget):-
 <div id="error">Old format Errors here:-<br/> 
 </div>
</div>