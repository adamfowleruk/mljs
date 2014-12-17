xquery version "1.0-ml";

module namespace sr = "http://marklogic.com/rest-api/resource/subscribe";

import module namespace ss = "http://marklogic.com/search/subscribe" at "/ext/app/models/lib-search-subscribe.xqy";
import module namespace alert="http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";
import module namespace json6 = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";

(:
 : Fetch saved search information
 :
 : ?return=user (default) -> Fetch all saved searches for this user
 : ?return=shared -> Fetch all shared searches
 : ?return=all -> Fetch all current user and shared searches
 : ?return=active -> Fetch all active alerts for this user
 : ?return=inactive -> Fetch all saved searches that do not have corresponding alerts for this user
 :
 :)
declare function sr:get(
    $context as map:map,
    $params  as map:map
) as document-node()* {
  let $ret := (map:get($params,"return"),"user")[1]

  return (xdmp:set-response-code(200,"OK"),document { <ss:result>{
    if ("user" = $ret) then
      ss:get-saved-searches()
    else if ("shared" = $ret) then
      ss:get-shared-searches()
    else if ("all" = $ret) then
      (ss:get-saved-searches(),ss:get-shared-searches())
    else if ("active" = $ret) then
      (: TODO :)
      <ss:unsupported-operation name="get-active"/>
    else if ("inactive" = $ret) then
      (: TODO :)
      <ss:unsupported-operation name="get-inactive"/>
    else (: ERROR :)
      <ss:unsupported-operation name="get-unknown-{$ret}"/>
    }</ss:result>
  })
};

(:
 : Create a saved search or alert
 :
 : ?create=alert -> NA done via POST - create an alert from a saved search
 : ?create=search -> save a search
 : ?create=both (default) -> create saved search then alert
 : ?notificationurl= -> send alerts to this REST URL
 : ?searchname= -> saved search name
 : ?shared=true -> create as a shared search
 : ?querytype=basic(default)|geonear|collection|fromuri -> what type of search to create. NB fromuri will copy any search already in the DB
 : ?query= -> text query for search:search in basic query type
 : ?radiusmiles -> radius from point in geonear query type
 : ?lat= -> latitude in WGS84 decimal in geonear query type
 : ?lon= -> longitude in WGS84 decimal in geonear query type
 : ?collection= -> collection uri for collection query type
 : ?searchdocuri= -> URI of the existing search document for uri query type
 : ?namespace= -> namespace of the element to use for geospatial index resolution
 : ?geoindextype=elementattribute(default)|elementpair|elementsequence -> how the geospatial index is constructed
 : ?elementparent= -> element name to use for geospatial index resolution
 : ?lonname= -> longitude attribute name for geospatial index resolution
 : ?latname= -> latitude attribute name for geospatial index resolution
 :)
declare function sr:put(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()? {
  (: get config params :)
  let $l := xdmp:log("PUT /v1/resources/subscribe CALLED")
  let $l := xdmp:log($params)
  let $l := xdmp:log("Content doc")
  let $l := xdmp:log($input)
        let $config := json6:config("custom")
        let $cx := map:put( $config, "text-value", "label" )
        let $cx := map:put( $config , "camel-case", fn:false() )
        (:
        let $cx := map:put($config, "array-element-names",(xs:QName("m:schema"),xs:QName("m:table"),xs:QName("m:column"),xs:QName("m:relationship"),xs:QName("m:docuri")))

        let $cx := map:put($config, "element-namespace","http://marklogic.com/roxy/models/rdb2rdf")
        let $cx := map:put($config, "element-namespace-prefix","m")
        :)
        let $cx := map:put($config, "element-prefix","params")

  let $jsonxml := <params>{json6:transform-from-json($input/text(),$config)}</params>
  let $l := xdmp:log($jsonxml)


  let $querytype := xs:string((map:get($params,"querytype"),$jsonxml/querytype/text(),"basic")[1])
  let $create := xs:string((map:get($params,"create"),$jsonxml/create/text(),"both")[1])
  let $l:= xdmp:log(fn:concat("querytype: ",$querytype, ", create: ",$create))

  return (xdmp:set-response-code(200,"OK"),document {  <ss:result>{
    (if ("both" = $create or "search" = $create) then
      (: create saved search :)
      if ("basic" = $querytype) then
        (
          xdmp:log("Saving search"),
          ss:save-search(
            ss:create-basic-search(
              xs:string($jsonxml/query)
            ),xs:string($jsonxml/searchname)
          )
        )
      else if ("geonear" = $querytype) then
        ss:save-search(
          ss:create-geo-near-search(
            xs:string($jsonxml/namespace),xs:string($jsonxml/elementparent),xs:string($jsonxml/lonname),xs:string($jsonxml/latname),
            xs:string($jsonxml/lat),xs:string($jsonxml/lon),xs:string($jsonxml/radiusmiles)
          ),xs:string($jsonxml/searchname)
        )
      else if ("collection" = $querytype) then
        ss:save-search(
          ss:create-collection-search(
            xs:string($jsonxml/collection)
          ),xs:string($jsonxml/searchname)
        )
      else if ("fromuri" = $querytype) then
        (: copy? :)
        <ss:unsupported-operation name="save-fromuri"/>
      else
        (: TODO error condition :)
        <ss:unsupported-operation name="save-unknown-query-type-{$querytype}"/>
    else (),
    if ("both" = $create or "alert" = $create) then
      (: enabling alerting for saved search :)
      (: create saved search :)
      if ("basic" = $querytype) then
        ss:save-subscribe-search(
          ss:create-basic-search(
            xs:string($jsonxml/query)
          ),xs:string($jsonxml/searchname),xs:string($jsonxml/notificationurl),(),()
        )
      else if ("geonear" = $querytype) then
        ss:save-subscribe-search(
          ss:create-geo-near-search(
            xs:string($jsonxml/namespace),xs:string($jsonxml/elementparent),xs:string($jsonxml/lonname),xs:string($jsonxml/latname),
            xs:string($jsonxml/lat),xs:string($jsonxml/lon),xs:string($jsonxml/radiusmiles)
          ),xs:string($jsonxml/searchname),xs:string($jsonxml/notificationurl),(),()
        )
      else if ("collection" = $querytype) then
        ss:save-subscribe-search(
          ss:create-collection-search(
            xs:string($jsonxml/collection)
          ),xs:string($jsonxml/searchname),xs:string($jsonxml/notificationurl),(),()
        )
      else if ("fromuri" = $querytype) then
        (: copy? :)
        <ss:unsupported-operation name="save-subscribe-fromuri"/>
      else
        (: TODO error condition :)
        <ss:unsupported-operation name="save-subscribe-unknown-query-type-{$querytype}"/>
    else ())
  }</ss:result>})
};

(:
 : Create an alert
 :
 : ?create=alert (default) -> create an alert from a saved search
 : ?notificationurl= -> send alerts to this REST URL
 : ?searchname= -> saved search name
 :)
declare function sr:post(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()*
) as document-node()* {
  
  let $l := xdmp:log("POST /v1/resources/subscribe CALLED")
  let $l := xdmp:log($params)
  let $l := xdmp:log("Content doc")
  let $l := xdmp:log($input)
        let $config := json6:config("custom")
        let $cx := map:put( $config, "text-value", "label" )
        let $cx := map:put( $config , "camel-case", fn:false() )
        (:
        let $cx := map:put($config, "array-element-names",(xs:QName("m:schema"),xs:QName("m:table"),xs:QName("m:column"),xs:QName("m:relationship"),xs:QName("m:docuri")))

        let $cx := map:put($config, "element-namespace","http://marklogic.com/roxy/models/rdb2rdf")
        let $cx := map:put($config, "element-namespace-prefix","m")
        :)
        let $cx := map:put($config, "element-prefix","params")

  let $jsonxml := <params>{json6:transform-from-json($input/text(),$config)}</params>
  let $l := xdmp:log($jsonxml)

  return (xdmp:set-response-code(200,"OK"),document { <ss:result>{ss:subscribe(xs:string($jsonxml/searchname),xs:string($jsonxml/notificationurl),(),())}</ss:result>})
};

(:
 : Delete a saved search or alert
 : ?delete=alert -> delete alert only (i.e. make saved search inactive)
 : ?delete=search -> delete a user or shared search
 : ?delete=both (default) -> delete saved search and alert
 : ?searchname= -> saved search name
 : ?notificationurl= -> send alerts to this REST URL
 : ?shared=false -> delete a shared search
 :)
declare function sr:delete(
    $context as map:map,
    $params  as map:map,
    $input   as document-node()?
) as document-node()? {
  let $delete := (map:get($params,"delete"),"both")[1]
   return (xdmp:set-response-code(200,"OK"),document { <ss:result>{
     (
       if ("both" = $delete) then
         ss:unsubscribe-and-delete-search(map:get($params,"searchname"),map:get($params,"notificationurl"))
       else if ("alert" = $delete) then
         ss:unsubscribe(map:get($params,"searchname"),map:get($params,"notificationurl"))
       else if ("search" = $delete) then
         if ("false" = $delete) then
           ss:delete-search(map:get($params,"searchname"))
         else
           ss:delete-shared-search(map:get($params,"searchname"))
       else
        <ss:unsupported-operation name="delete-{$delete}"/>
     )
   }</ss:result>})
};
