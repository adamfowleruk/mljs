xquery version "1.0-ml";

module namespace ext = "http://marklogic.com/rest-api/resource/workplace";

declare namespace roxy = "http://marklogic.com/roxy";


(:
 : Exports all workplace pages as a single XML file in the current content database
 :)
declare
%roxy:params("")
function ext:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{


  map:put($context, "output-types", "text/xml"),
  xdmp:set-response-code(200, "OK"),

     document {
      <workplace>
       <pages>
        {
          for $page in fn:collection("/config/workplace/page")/node()
          return
           <page uri="{$page/fn:base-uri(.)}">{$page}</page>
        }
       </pages>
      </workplace>
    }
};

(:
 : Uploads workplace pages, complimenting those that already exist
 :)
declare
%roxy:params("")
function ext:post(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()*
{
let $_ := xdmp:log($input)
return
  (
    for $page in $input/workplace/pages/page
    return
      xdmp:document-insert(xs:string($page/@uri),$page/node(),xdmp:default-permissions(),("mljsInternalData","mljsWorkplacePages","/config/workplace/page",xdmp:default-collections()))
  )
  ,
  map:put($context, "output-types", "application/json"),
  xdmp:set-response-code(200, "OK"),
  document { "PUT called on workplace configuration" }
};
