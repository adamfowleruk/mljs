xquery version "1.0-ml";

module namespace ext = "http://marklogic.com/rest-api/resource/dlsrules";
import module namespace json = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
declare namespace roxy = "http://marklogic.com/roxy";

import module namespace dls = "http://marklogic.com/xdmp/dls" 
		  at "/MarkLogic/dls.xqy";
		  
(: 
 : To add parameters to the functions, specify them in the params annotations. 
 : Example
 :   declare %roxy:params("uri=xs:string", "priority=xs:int") ext:get(...)
 : This means that the get function will take two parameters, a string and an int.
 :)

(:
 :)
declare 
%roxy:params("")
function ext:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{
  map:put($context, "output-types", "application/json"),
  xdmp:set-response-code(200, "OK"), 
  
    let $config := json:config("custom") 
    let  $cx := map:put( $config, "text-value", "label" )
    let  $cx := map:put( $config , "camel-case", fn:true() )
    return
  if (fn:exists(map:get($params,"rulename"))) then
    document {fn:concat(json:transform-to-json(dls:retention-rules(map:get($params,"rulename")), $config))}
  else (
    let $rules := dls:retention-rules("*") (: all rules :)
    return document { 
      fn:concat('{"rules":[',
        (for $rule at $idx in $rules
        return
          fn:concat(json:transform-to-json($rule, $config),
            if ($idx lt fn:count($rules)) then "," else ()
          )
        ),']}'
      )
    } )
};

(:
 :)
declare 
%roxy:params("")
function ext:put(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()?
{
  map:put($context, "output-types", "application/json"),
  xdmp:set-response-code(200, "OK"),
  document { "PUT called on the ext service extension" }
};

(:
 :)
declare 
%roxy:params("")
function ext:post(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()*
{
  map:put($context, "output-types", "application/json"),
  xdmp:set-response-code(200, "OK"),
  document { "POST called on the ext service extension" }
};

(:
 :)
declare 
%roxy:params("")
function ext:delete(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()?
) as document-node()?
{
  map:put($context, "output-types", "application/json"),
  xdmp:set-response-code(200, "OK"),
  document { "DELETE called on the ext service extension" }
};
