xquery version "1.0-ml";

module namespace ext = "http://marklogic.com/rest-api/resource/dls";

import module namespace dls = "http://marklogic.com/xdmp/dls" 
		  at "/MarkLogic/dls.xqy";
		  
declare namespace prop="http://marklogic.com/xdmp/property";

declare namespace roxy = "http://marklogic.com/roxy";

(: 
 : To add parameters to the functions, specify them in the params annotations. 
 : Example
 :   declare %roxy:params("uri=xs:string", "priority=xs:int") ext:get(...)
 : This means that the get function will take two parameters, a string and an int.
 :)

(:
 : Fetch either the DLS document information (uri) or list of DLS managed documents(collection). If neither specified, returns list of all dls collections
 :)
declare 
%roxy:params("uri=xs:string", "collection=xs:string")
function ext:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{
  (: dls is-managed for uri :)
  map:put($context, "output-types", "application/json"),
  xdmp:set-response-code(200, "OK"),
  if (fn:empty(map:get($params,"uri")) and fn:empty(map:get($params,"collection"))) then
    (: list all DLS collections :)
    document { fn:concat('{"collections": [',
      fn:concat(for $val at $pos in fn:distinct-values(xdmp:collection-properties()/prop:properties/dls:version/dls:annotation/dls:collection/text()) (: works too if annotation is xml only :)
      return
        fn:concat(
          (if ($pos gt 1) then "," else (),
          fn:concat('"',$val,'"'))
        ))
    , ']}') }
  else if (map:contains($params,"collection")) then
    (: List all docs in the collection :)
    document {fn:concat('{"uris": [', 
    for $val at $pos in
      cts:search(fn:collection(),
        cts:and-query((
          dls:documents-query(),
          cts:properties-query(cts:element-value-query(xs:QName("dls:collection"),map:get($params,"collection")))
        ))
      )/fn:base-uri(.)
      return 
        fn:concat(
          (if ($pos gt 1) then "," else (),
          fn:concat('"',$val,'"'))
        )
    ,"] }") }
  else
    (: is the specified doc managed? :)
    document { fn:concat('{"is-managed": "',fn:string(dls:document-is-managed(map:get($params,"uri"))), '"}') }
};

(:
 :)
declare 
%roxy:params("uri=xs:string", "collection=xs:string")
function ext:put(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()?
{
  (: dls manage for uri :)
  map:put($context, "output-types", "application/json"),
  xdmp:log(fn:concat("DECLARING DOCUMENT URI: ", map:get($params,"uri"))),
  xdmp:set-response-code(200, "OK"),
  document { 
    (:if (dls:document-is-managed(map:get($params,"uri"))) then
      fn:concat("{'is-managed': true}") 
    else:)
      (dls:document-manage(map:get($params,"uri"),fn:false(),<dls:collection>{map:get($params,"collection")}</dls:collection>),
      fn:concat('{"is-managed": true}') )
  }
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
  (: TODO dls unmanage for uri :)
  map:put($context, "output-types", "application/json"),
  xdmp:set-response-code(200, "OK"),
  document {
    (:if (dls:document-is-managed(map:get($params,"uri"))) then:)
      (dls:document-unmanage(map:get($params,"uri"),fn:false(),fn:true()),
      fn:concat('{"is-managed": false}') )
    (:else
      fn:concat("{'is-managed': false}") :)
  }
};
