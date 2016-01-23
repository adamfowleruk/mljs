xquery version "1.0-ml";

module namespace ext = "http://marklogic.com/rest-api/resource/groupby";
import module namespace json = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
declare namespace roxy = "http://marklogic.com/roxy";


import module namespace sut = "http://marklogic.com/rest-api/lib/search-util"
    at "/MarkLogic/rest-api/lib/search-util.xqy";

import module namespace search= "http://marklogic.com/appservices/search" at "/MarkLogic/appservices/search/search.xqy";



(:
 : Performs an aggregate function over co-occurrence tuples. Uses same parameters as /v1/values
 :
 :  ?aggregate=sum|variance|etc
 : AND
 :  ?name=tuple-name as specified in search options. Note uses the FIRST range specification in the search options as the one for the computed aggregate to be ran over.
 : AND
 :  ?options=searchOptionsName search options defining the tuples
 : [
 : AND
 :  (
 :    ?q
 :   OR
 :    ?structuredQuery
 :  )
 : ]
 :)
declare
%roxy:params("")
function ext:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{

  (: 1. Fetch parameters and check they are valid :)
  let $aggregate := (map:get($params,"aggregate"),"count")[1] // default to count

  (: Following from valmod:values-get :)

  let $qtext := (map:get($params,"q"),"")[1]
  let $name := map:get($params,"name")
  let $structuredQuery := sut:make-structured-query-node(map:get($params,"structuredQuery"))
  (: 2. Fetch search options document :)
  let $options := sut:options($params)


  let $sq := sut:make-structured-query($structuredQuery, $qtext, $options)

  let $spec := $options/search:tuples[@name=$name]
  let $check :=
    if (fn:empty($spec)) then
      error((), "REST-INVALIDPARAM", concat("No tuples specification named: ", $name))
    else ()

  (: end valmod code :)


  (: 3. Fetch or create range specification - from FIRST tuple range config in search options :)
  let $_ :=
    if (fn:count($spec/???) ne 3) then
      error((), "REST-INVALIDPARAM", "Must be precisely 3 range elements in a tuple config for groupby aggregation")
    else ()
  let $rangeover := $spec/???[1]
  (: TODO sanity check on range type - not a string or date :)



  (: 4. Use group-by library :)

  (: 5. Return results :)
  (: Format the same as co-occurrence results :)


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
 : Performs an aggregate function over co-occurrence tuples. Uses same parameters as /v1/values
 :
 :  ?aggregate=sum|variance|etc
 : AND
 :  (
 :    ?rangens AND ?rangeelement [AND ?rangeattribute] AND ?rangetype=int|long|etc
 :   OR
 :    ?rangeconstraint=myconstraint (fetches typing and range spec from search options)
 :  )
 : AND
 :  ?tuple=tuple-name as specified in search options
 :
 :
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
