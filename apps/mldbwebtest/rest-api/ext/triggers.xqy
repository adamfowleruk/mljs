xquery version "1.0-ml";

module namespace ext = "http://marklogic.com/rest-api/resource/triggers";

declare namespace roxy = "http://marklogic.com/roxy";
declare namespace my="http://marklogic.com/triggers";

import module namespace json6 = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
import module namespace trgr="http://marklogic.com/xdmp/triggers" at "/MarkLogic/triggers.xqy";
import module namespace pkg = "http://marklogic.com/manage/package" at "/MarkLogic/manage/package/package.xqy";
import module namespace admin = "http://marklogic.com/xdmp/admin" at "/MarkLogic/admin.xqy" ;

declare namespace rapi = "http://marklogic.com/rest-api";
declare namespace p = "http://marklogic.com/manage/package/databases";
declare namespace l = "local";

(:



   let $config := admin:get-configuration()
   return
   admin:save-configuration-without-restart(admin:database-set-triggers-database($config,
                           xdmp:database("obisie-content") , xdmp:database("Triggers")))
:)


declare private function ext:invoke($function as function() as item()*,$dbname as xs:string) {
  xdmp:invoke-function($function,
    <options xmlns="xdmp:eval">
      <database>{xdmp:database($dbname)}</database>
      <transaction-mode>query</transaction-mode>
      <isolation>different-transaction</isolation>
    </options>
  )
};

declare private function ext:trigger-names($dbname as xs:string,$mdb as xs:string) {
  ext:invoke(function() {
    let $mdbid := xdmp:database($mdb)
    return xs:string((fn:collection("http://marklogic.com/xdmp/triggers")/trgr:trigger[./trgr:module/trgr:database = $mdbid]/trgr:trigger-name))
  },$dbname)
};

declare private function ext:trigger-info($dbname as xs:string,$triggername as xs:string) {
  ext:invoke(function() {
    trgr:get-trigger($triggername)
  },$dbname)
};

declare function ext:get(
    $context as map:map,
    $params  as map:map
) as document-node()* {
  let $l := xdmp:log("GET /v1/resources/triggers CALLED")
  let $l := xdmp:log($params)

  let $preftype := if ("application/xml" = map:get($context,"accept-types")) then "application/xml" else "application/json"

  (: Get database configuration :)
  let $mdb := xdmp:database-name(xdmp:modules-database())
  let $config := pkg:database-configuration(xdmp:database-name(xdmp:database()))
  (: Get name of triggers DB :)
  let $trdbname := xs:string($config/p:config/p:links/p:triggers-database)
  (: Query this DB for all trigger names :)
  let $trfunc := ext:trigger-names($trdbname,$mdb)
  (: Fetch each triggers configuration :)
  let $out :=
  <summary> {
    for $triggername in $trfunc
    let $triggerconf := ext:trigger-info($trdbname,$triggername)
    (: Fetch each trigger module from the speified module DB :)
    (: let $trfile := xs:string($triggerconf/trgr:module/trgr:root) || "/" || xs:string($triggerconf/trgr:module/trgr:path) :)
    let $summary :=
      (<triggers>
        <name>{$triggername}</name><comment>{xs:string($triggerconf/trgr:description)}</comment>
        <event>{xs:string($triggerconf/trgr:data-event/trgr:document-content/trgr:update-kind)}</event>
        {if (fn:exists($triggerconf/trgr:data-event/trgr:directory-scope)) then
          <scope>
            <type>directory</type>
            <uri>{xs:string($triggerconf/trgr:data-event/trgr:directory-scope/trgr:uri)}</uri>
            <depth>{xs:string($triggerconf/trgr:data-event/trgr:directory-scope/trgr:depth)}</depth>
          </scope>
        else
          <scope>
            <type>collection</type>
            <uri>{xs:string($triggerconf/trgr:data-event/trgr:collection-scope/trgr:uri)}</uri>
          </scope>
        }
        <module>
          <database>{$mdb}</database>
          <folder>{xs:string($triggerconf/trgr:module/trgr:root)}</folder>
          <file>{xs:string($triggerconf/trgr:module/trgr:path)}</file>
        </module>
        <precommit>{if ("post-commit" = $triggerconf/trgr:data-event/trgr:when) then "false" else "true"}</precommit>
        <triggersdatabase>{$trdbname}</triggersdatabase>
      </triggers>
      )
      return $summary
    }</summary>
    (:
    {
      "name":"isys","comment":"ISys trigger","event": ["create"],
      "scope": {"type":"directory","uri":"/originals/","depth": "infinity"},
      "module": {"database": "meddevices-modules", "folder": "/app/models", "file": "trigger-isys-preserve.xqy"},
      "precommit": false, "triggersdatabase": "TriggersMedDevices"
    },
    :)
    return
(xdmp:set-response-code(200,"OK"),
          if ("application/xml" = $preftype) then
            document {<triggers>{for $trig in $out/triggers return <trigger>{$trig/*}</trigger>}</triggers>}
          else
            let $config := json6:config("custom")
            let $cx := map:put($config, "text-value", "label" )
            let $cx := map:put($config,"array-element-names",("triggers"))
            let $cx := map:put($config,"json-children","triggers")
            let $cx := map:put($config , "camel-case", fn:true() )
            return
              json6:transform-to-json($out, $config)


  )
};


(:
Creates a new trigger instance with the specific JSON parameters

{
  event: ["create","update"], name: "mytrigger", "comment": "Some comment",
  scope: {type:"directory|collection",uri: "/some/uri", depth: "1|infinity"},
  module: {database: "my-modules-db", folder: "/app/models", file: "myfile.xqy"},
  triggersdatabase: "Triggers",
  precommit: true|false
}
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



  let $jsonxml := <params>{json6:transform-from-json($input,$config)}</params>
  (:
  let $l := xdmp:log($jsonxml)
  :)


  let $database := $jsonxml/triggersdatabase/text()

  let $output := map:map()

let $_ :=

try {

  let $resp :=

    xdmp:eval(
      fn:concat(

      'xquery version "1.0-ml"; declare namespace my="http://marklogic.com/triggers";',
                'import module namespace trgr="http://marklogic.com/xdmp/triggers" at "/MarkLogic/triggers.xqy";',
  'import module namespace json6 = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";',
                'declare variable $my:jsontext external;',
  '        let $config := json6:config("custom")',
  '        let $cx := map:put( $config, "text-value", "label" )',
  '        let $cx := map:put( $config , "camel-case", fn:false() )',
  '        let $cx := map:put($config, "element-prefix","params")',
  '  let $jsonxml := <params>{json6:transform-from-json($my:jsontext,$config)}</params>',
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
      (xs:QName("my:jsontext"),$input),
      <options xmlns="xdmp:eval"><isolation>different-transaction</isolation><database>{xdmp:database($database)}</database></options>
    )



  return

(map:put($output,"code",200),map:put($output,"message","OK"),map:put($output,"document",

  $resp



) )


} catch ($exc) {
  fn:error((),"RESTAPI-SRVEXERR",
    (400, "Bad Request",
     $exc/error:format-string))
     (:)
  (xdmp:log("Exception caught"),xdmp:log($exc),map:put($output,"code",500),map:put($output,"message",
    "INTERNAL SERVER ERROR"), map:put($output,"document",
    $exc
  ) )
  :)
}


let $_ := xdmp:log("RESULT")
let $_ := xdmp:log($output)

return
(
  xdmp:set-response-code(
    map:get($output,"code")
    ,
    map:get($output,"message")
  )
  ,
  document { map:get($output,"document") }
)

};



(:
declare function
%rapi:transaction-mode("update")
ext:post(
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
