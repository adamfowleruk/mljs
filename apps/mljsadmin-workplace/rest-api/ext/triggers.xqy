xquery version "1.0-ml";

module namespace ext = "http://marklogic.com/rest-api/resource/triggers";

declare namespace roxy = "http://marklogic.com/roxy";
declare namespace my="http://marklogic.com/triggers";

import module namespace json6 = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
import module namespace trgr="http://marklogic.com/xdmp/triggers" at "/MarkLogic/triggers.xqy";
import module namespace admin = "http://marklogic.com/xdmp/admin" at "/MarkLogic/admin.xqy" ;


(: TODO GET method to support listing all triggers and info, or fetching just one triggers info :)

(:
Creates a new trigger instance with the specific JSON parameters

{
  event: ["create","update"], name: "mytrigger", "comment": "Some comment",
  scope: {type:"directory|collection",uri: "/some/uri", depth: "1|infinity"},
  module: {database: "my-modules-db", folder: "/app/models", file: "myfile.xqy"},
  triggersdatabase: "Triggers",
  precommit: true|false
}
NOTE: ONE event only - else you'll get a CONCURRENT UPDATE EXCEPTION
:)

declare function ext:put(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()? {




  (: get config params :)
  let $l := xdmp:log("PUT /v1/resources/triggers CALLED")
  let $l := xdmp:log($params)
  let $l := xdmp:log("Content doc")
  let $l := xdmp:log($input)
        let $config := json6:config("custom")
        let $cx := map:put( $config, "text-value", "label" )
        let $cx := map:put( $config , "camel-case", fn:false() )
        let $cx := map:put($config, "element-prefix","params")



  let $jsonxml := <params>{json6:transform-from-json($input/text(),$config)}</params>
  let $l := xdmp:log($jsonxml)



  let $database := $jsonxml/triggersdatabase/text()

return (xdmp:set-response-code(200,"OK"),document {


  xdmp:eval(
    fn:concat(

    'xquery version "1.0-ml"; declare namespace my="http://marklogic.com/triggers";',
              'import module namespace trgr="http://marklogic.com/xdmp/triggers" at "/MarkLogic/triggers.xqy";',
'import module namespace json6 = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";',
              'declare variable $my:jsontext as xs:string external;',
'        let $config := json6:config("custom")',
'        let $cx := map:put( $config, "text-value", "label" )',
'        let $cx := map:put( $config , "camel-case", fn:false() )',
'        let $cx := map:put($config, "element-prefix","params")',
'  let $jsonxml := <params>{json6:transform-from-json($my:jsontext,$config)}</params>',
'  let $l := xdmp:log($jsonxml)',
'return trgr:create-trigger($jsonxml/name/text(),$jsonxml/comment/text(),',
'  trgr:trigger-data-event(',
'    if ("directory" = $jsonxml/scope/type) then',
'      trgr:directory-scope($jsonxml/scope/uri/text(),$jsonxml/scope/depth/text())',
'    else',
'       trgr:collection-scope(($jsonxml/scope/uri/text())) ',
'    ,',
'    trgr:document-content(($jsonxml/event/text())), (: SINGLE MODE ONLY - ELSE YOU GET DUPLICATE UPDATE EXCEPTION :) ',
'    if ("false" = $jsonxml/precommit) then',
'       trgr:post-commit()',
'    else',
'      trgr:pre-commit()',
'  ),',
'  trgr:trigger-module(xdmp:database($jsonxml/module/database/text()),$jsonxml/module/folder/text(),$jsonxml/module/file/text()),',
'  fn:true(), xdmp:default-permissions()',
')'




),
    (xs:QName("my:jsontext"),$input/text()),
    <options xmlns="xdmp:eval"><isolation>different-transaction</isolation><database>{xdmp:database($database)}</database></options>
  )



})



};




declare function ext:delete(
    $context as map:map,
    $params  as map:map
) as document-node()? {
  let $name := map:get($params,"triggername")
  let $database := map:get($params,"triggersdatabase")
  let $l := xdmp:log("DELETE /v1/resources/triggers CALLED")
  let $l := xdmp:log($params)
  let $l := xdmp:log($context)
  return (xdmp:set-response-code(200,"OK"),document {


  xdmp:eval(
    fn:concat('xquery version "1.0-ml"; declare namespace my="http://marklogic.com/triggers";',
              'import module namespace trgr="http://marklogic.com/xdmp/triggers" at "/MarkLogic/triggers.xqy";',
              'declare variable $my:name as xs:string external;',
              'trgr:remove-trigger($my:name)'   ),
    (xs:QName("my:name"),$name),
    <options xmlns="xdmp:eval"><isolation>different-transaction</isolation><database>{xdmp:database($database)}</database></options>
  )


   })
};








(: BELOW IS OLD TEST CODE :)



(:
declare function ext:post(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()? {
  (:
  let $name := map:get($params,"triggername")
  let $database := map:get($params,"triggersdatabase")
  :)
  let $l := xdmp:log("POST /v1/resources/triggers CALLED")
  let $l := xdmp:log($context)
  let $l := xdmp:log($params)

  let $l := xdmp:log($input)

        let $config := json6:config("custom")
        let $cx := map:put( $config, "text-value", "label" )
        let $cx := map:put( $config , "camel-case", fn:false() )
        let $cx := map:put($config, "element-prefix","params")



  let $jsonxml := <params>{json6:transform-from-json($input/text(),$config)}</params>
  let $l := xdmp:log($jsonxml)

  let $database := $jsonxml/triggersdatabase/text()
  let $name := $jsonxml/triggername/text()

  return (xdmp:set-response-code(200,"OK"),document {


  xdmp:eval(
    fn:concat('xquery version "1.0-ml"; declare namespace my="http://marklogic.com/triggers";',
              'import module namespace trgr="http://marklogic.com/xdmp/triggers" at "/MarkLogic/triggers.xqy";',
              'declare variable $my:name as xs:string external;',
              'trgr:remove-trigger($my:name)'   ),
    (xs:QName("my:name"),$name),
    <options xmlns="xdmp:eval"><isolation>different-transaction</isolation><database>{xdmp:database($database)}</database></options>
  )


   })
};



:)







(:
declare function ext:post(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()? {
  let $name := map:get($params,"triggername")
  let $database := map:get($params,"triggersdatabase")
  let $l := xdmp:log("POST /v1/resources/triggers CALLED")
  let $l := xdmp:log($params)
  let $l := xdmp:log($context)
  return (xdmp:set-response-code(200,"OK"),document {


  xdmp:eval(
    fn:concat('xquery version "1.0-ml"; declare namespace my="http://marklogic.com/triggers";',
              'import module namespace trgr="http://marklogic.com/xdmp/triggers" at "/MarkLogic/triggers.xqy";',
              'declare variable $my:name as xs:string external;',
              'trgr:remove-trigger($my:name)'   ),
    (xs:QName("my:name"),$name),
    <options xmlns="xdmp:eval"><isolation>different-transaction</isolation><database>{xdmp:database($database)}</database></options>
  )


   })
};

:)
