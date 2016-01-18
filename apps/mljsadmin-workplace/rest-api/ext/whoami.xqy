xquery version "1.0-ml";

module namespace ext = "http://marklogic.com/rest-api/resource/whoami";

declare namespace roxy = "http://marklogic.com/roxy";

import module namespace json = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";

(: 
 : To add parameters to the functions, specify them in the params annotations. 
 : Example
 :   declare %roxy:params("uri=xs:string", "priority=xs:int") ext:get(...)
 : This means that the get function will take two parameters, a string and an int.
 :)

(:
 :)
declare function ext:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{
  (:)
  map:put($context, "output-types", "application/xml"),
  xdmp:set-response-code(200, "OK"),
  document { "GET called on the ext service extension" } :)
  
  let $xml := <user><name>{xdmp:get-current-user()}</name>
    <roles>
    {
      let $roleids := xdmp:get-current-roles()
      let $rolename :=
        xdmp:eval('xquery version "1.0-ml";import module "http://marklogic.com/xdmp/security" at "/MarkLogic/security.xqy";declare namespace my="http://marklogic.com/rest/whoami"; 
       declare variable $my:roleids as xs:unsignedLong* external;sec:get-role-names($my:roleids)',
        (fn:QName("http://marklogic.com/rest/whoami","roleids"),$roleids),
        <options xmlns="xdmp:eval"><database>{xdmp:security-database()}</database></options>)
      return
        for $r in $rolename/text()
        return 
          <role>{$r}</role>
    }
    </roles>
    </user>
  
  return
    xdmp:set-response-code(200, "OK"),
    document {
      if ("application/json" = map:get($context,"output-type")) then

        let $c := json:config("custom") , 
        $cx := map:put( $c, "text-value", "label" ),
        $cx := map:put( $c , "camel-case", fn:false() )
        return 
          (
            map:put($context, "output-types", "application/json"),
            json:transform-to-json($xml,$c)
          )
      else
        (
          map:put($context, "output-types", "application/xml"),
          $xml
        )
    }
};
