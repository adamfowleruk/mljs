xquery version "1.0-ml";

module namespace sr = "http://marklogic.com/rest-api/resource/subscribe";

import module namespace ss = "http://marklogic.com/search/subscribe" at "/app/models/lib-search-subscribe.xqy";
import module namespace alert="http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";

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
  let $querytype := (map:get($params,"querytype"),"basic")[1]
  let $create := (map:get($params,"create"),"both")[1]

  return (xdmp:set-response-code(200,"OK"),document {  <ss:result>{
    (if ("both" = $create or "search" = $create) then
      (: create saved search :)
      if ("basic" = $querytype) then
        ss:save-search(ss:create-basic-search(map:get($params,"query")),map:get($params,"searchname"))
      else if ("geonear" = $querytype) then
        ss:save-search(ss:create-geo-near-search(map:get($params,"namespace"),map:get($params,"elementparent"),map:get($params,"lonname"),map:get($params,"latname"),
          map:get($params,"lat"),map:get($params,"lon"),map:get($params,"radiusmiles")),map:get($params,"searchname"))
      else if ("collection" = $querytype) then
        ss:save-search(ss:create-collection-search(map:get($params,"collection")),map:get($params,"searchname"))
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
        ss:save-subscribe-search(ss:create-basic-search(map:get($params,"query")),map:get($params,"searchname"),map:get($params,"notificationurl"),(),())
      else if ("geonear" = $querytype) then
        ss:save-subscribe-search(ss:create-geo-near-search(map:get($params,"namespace"),map:get($params,"elementparent"),map:get($params,"lonname"),map:get($params,"latname"),
          map:get($params,"lat"),map:get($params,"lon"),map:get($params,"radiusmiles")),map:get($params,"searchname"),map:get($params,"notificationurl"),(),())
      else if ("collection" = $querytype) then
        ss:save-subscribe-search(ss:create-collection-search(map:get($params,"collection")),map:get($params,"searchname"),map:get($params,"notificationurl"),(),())
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
  (xdmp:set-response-code(200,"OK"),document { <ss:result>{ss:subscribe(map:get($params,"searchname"),map:get($params,"notificationurl"),(),())}</ss:result>})
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
