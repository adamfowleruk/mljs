xquery version "1.0-ml";

module namespace ss = "http://marklogic.com/search/subscribe";

import module namespace alert="http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";

declare namespace my="http://marklogic.com/alerts";

import module namespace search = "http://marklogic.com/appservices/search"
    at "/MarkLogic/appservices/search/search.xqy";





(: Specific example methods for creating the search object to be saved :)

declare function ss:create-collection-search($collection as xs:string)  {
  cts:collection-query($collection)
};

(: Default search grammar :)
declare function ss:create-basic-search($query as xs:string)  {
  search:parse($query)
};

(: same as from lib-adhoc-alerts.xqy - lon/lat/radius :)
declare function ss:create-geo-near-search($ns as xs:string,$elname as xs:string, $latattr as xs:string,$lonattr as xs:string,
    $lat as xs:double,$lon as xs:double, $radiusmiles as xs:double)  {
  cts:element-geospatial-query(fn:QName($ns,$elname),cts:circle($radiusmiles, cts:point($lat, $lon)))
};








(: Search persisting functions :)

declare function ss:save-search($searchdoc, $searchname as xs:string) as xs:string {
  (: use current user on app server :)
  let $search-uri-user := fn:concat("/config/search/",xdmp:get-current-user(),"/",$searchname,".xml")
  let $l := xdmp:log($search-uri-user)
  let $result := xdmp:document-insert($search-uri-user,
    element ss:saved-search {
      attribute name {$searchname},
      attribute uri {$search-uri-user},
      $searchdoc
    }
    ,xdmp:default-permissions(),
    (xdmp:default-collections(),"saved-search")
  )
  return $search-uri-user
};

declare function ss:save-shared-search($searchdoc, $searchname as xs:string) as xs:string {
  let $search-uri-shared := fn:concat("/config/search/shared/",$searchname,".xml")
  let $result := xdmp:document-insert($search-uri-shared,
    element ss:saved-search {
      attribute name {$searchname},
      attribute uri {$search-uri-shared},
      $searchdoc
    }
    ,xdmp:default-permissions(),
    (xdmp:default-collections(),"saved-search")
  )
  return $search-uri-shared
};

declare function ss:get-saved-searches() {
  cts:search(fn:collection("saved-search"),cts:directory-query(fn:concat("/config/search/",xdmp:get-current-user(),"/"),"1"))/ss:saved-search
};

declare function ss:get-shared-searches() {
  cts:search(fn:collection("saved-search"),cts:directory-query("/config/search/shared/","1"))/ss:saved-search
};

declare function ss:delete-search($searchname) {
  let $search-uri-user := fn:concat("/config/search/",xdmp:get-current-user(),"/",$searchname,".xml")
  return xdmp:document-delete($search-uri-user)
};

declare function ss:delete-shared-search($searchname) {
  let $search-uri-shared := fn:concat("/config/search/shared/",$searchname,".xml")
  return xdmp:document-delete($search-uri-shared)
};





(: Utility functions :)

declare function ss:unsubscribe-and-delete-shared-search($searchname,$notificationurl) {
  (ss:unsubscribe($searchname,$notificationurl),ss:delete-shared-search($searchname))
};

declare function ss:unsubscribe-and-delete-search($searchname,$notificationurl) {
  (ss:unsubscribe($searchname,$notificationurl),ss:delete-search($searchname))
};

declare function ss:save-subscribe-search($searchdoc as cts:query,$searchname as xs:string,$notificationurl as xs:string,$alert-detail as xs:string?,$content-type as xs:string?) {
  (: use current user on app server :)
  ( xdmp:eval(
      fn:concat('xquery version "1.0-ml"; declare namespace my="http://marklogic.com/alerts"; import module namespace ah = "http://marklogic.com/search/subscribe" at "/modules/lib-search-subscribe.xqy";',
                'declare variable $my:searchdoc as cts:query external;declare variable $my:searchname as xs:string external;',
                'ah:do-save($my:searchdoc,$my:searchname)'),
      (xs:QName("my:searchdoc"),$searchdoc,xs:QName("my:searchname"),$searchname),
      <options xmlns="xdmp:eval"><isolation>different-transaction</isolation></options>
    )
    ,ss:do-subscribe-check($notificationurl,$searchname,$alert-detail,$content-type)
  )
};

(: call the following from eval - different-transaction :)
declare function ss:do-save($searchdoc as cts:query,$searchname as xs:string) {
  xdmp:document-insert(fn:concat("/config/search/",xdmp:get-current-user(),"/",$searchname,".xml"),
    (:element ss:saved-search {
      attribute name {$searchname},
      (:attribute uri {$search-uri-user},:)
      $searchdoc
    }:) document {$searchdoc} (: why not just this search doc? :)
    ,xdmp:default-permissions(),
    (xdmp:default-collections(),"saved-search") )
};




(: subscription methods :)

declare function ss:subscribe($searchname as xs:string,$notificationurl as xs:string,$alert-detail as xs:string?,$content-type as xs:string?) as xs:boolean {
  ss:do-subscribe-check($notificationurl,$searchname,$alert-detail,$content-type)
};

declare function ss:unsubscribe($searchname,$notificationurl) as xs:boolean {
  (: NB supports multiple notification URLs. i.e. multiple UIs on same DB for same user :)
  ss:do-unsubscribe($notificationurl,$searchname)
};







(: internal functions - not to be called by anything outside of this module :)

(: This function intended to be called within a REST server - i.e. known DB
 : Alert detail can be 'full' or 'snippet' which means either the full doc within the alert info container, or just the snippet information within the alert info container.
 :)
declare function ss:do-subscribe-check($notificationurl as xs:string,$searchname as xs:string,$alert-detail as xs:string?,$content-type as xs:string?) as xs:boolean {
  ss:do-subscribe($notificationurl,"/modules/alert-generic-messaging.xqy",($alert-detail,"full")[1],($content-type,"application/json")[1],$searchname,"generic-alert-domain","rest-sitaware-modules",
    cts:query((fn:doc(fn:concat("/config/search/",xdmp:get-current-user(),"/",$searchname,".xml"))/element(),fn:doc(fn:concat("/config/search/shared/",$searchname,".xml"))/element())[1] )
  )
};

declare function ss:do-add-action-rule($alert-name as xs:string,$notificationurl as xs:string,$alert-module as xs:string?,$alert-detail as xs:string,$content-type as xs:string,$searchname as xs:string,$cpf-domain as xs:string,$dbname as xs:string,$searchdoc as cts:query?) as xs:boolean {

  let $e2 := xdmp:eval(
    fn:concat('xquery version "1.0-ml"; declare namespace my="http://marklogic.com/alerts"; import module namespace ah = "http://marklogic.com/search/subscribe" at "/modules/lib-search-subscribe.xqy";',
              'declare variable $my:alert-name as xs:string external;declare variable $my:alert-module as xs:string external;declare variable $my:dbname as xs:string external;',
              'ah:create-action($my:alert-name,$my:alert-module,$my:dbname)'),
    (xs:QName("my:alert-name"),$alert-name,xs:QName("my:alert-module"),$alert-module,xs:QName("my:dbname"),$dbname),
    <options xmlns="xdmp:eval"><isolation>different-transaction</isolation></options>
  )
  let $e3 := xdmp:eval(
    fn:concat('xquery version "1.0-ml"; declare namespace my="http://marklogic.com/alerts"; import module namespace ah = "http://marklogic.com/search/subscribe" at "/modules/lib-search-subscribe.xqy";',
              'declare variable $my:alert-name as xs:string external;declare variable $my:alert-detail as xs:string external;declare variable $my:content-type as xs:string external;',
              'declare variable $my:notificationurl as xs:string external;declare variable $my:searchname as xs:string external;declare variable $my:searchdoc as cts:query external;',
              'ah:create-rule($my:alert-name,$my:alert-detail,$my:content-type,$my:notificationurl,$my:searchname,$my:searchdoc)'),
    (xs:QName("my:alert-name"),$alert-name,xs:QName("my:alert-detail"),$alert-detail,xs:QName("my:content-type"),$content-type,xs:QName("my:notificationurl"),$notificationurl,
     xs:QName("my:searchname"),$searchname,xs:QName("my:searchdoc"),$searchdoc),
    <options xmlns="xdmp:eval"><isolation>different-transaction</isolation></options>
  )
  return fn:true()
};

declare function ss:do-subscribe($notificationurl as xs:string,$alert-module as xs:string?,$alert-detail as xs:string,$content-type as xs:string,$searchname as xs:string,$cpf-domain as xs:string,$dbname as xs:string,$searchdoc as cts:query?) as xs:boolean {
  let $alert-name := xdmp:eval(
    fn:concat('xquery version "1.0-ml"; declare namespace my="http://marklogic.com/alerts"; import module namespace ah = "http://marklogic.com/search/subscribe" at "/modules/lib-search-subscribe.xqy";',
              'declare variable $my:notificationurl as xs:string external;declare variable $my:searchname as xs:string external;',
              'ah:create-config($my:notificationurl,$my:searchname)'),
    (xs:QName("my:notificationurl"),$notificationurl,xs:QName("my:searchname"),$searchname),
    <options xmlns="xdmp:eval"><isolation>different-transaction</isolation></options>
  )
  let $e2 := ss:do-add-action-rule($alert-name,$notificationurl ,$alert-module,$alert-detail,$content-type,$searchname,$cpf-domain,$dbname,$searchdoc)
  let $e4 := xdmp:eval(
    fn:concat('xquery version "1.0-ml"; declare namespace my="http://marklogic.com/alerts"; import module namespace ah = "http://marklogic.com/search/subscribe" at "/modules/lib-search-subscribe.xqy";',
              'declare variable $my:alert-name as xs:string external;declare variable $my:cpf-domain as xs:string external;',
              'ah:cpf-enable($my:alert-name,$my:cpf-domain)'),
    (xs:QName("my:alert-name"),$alert-name,xs:QName("my:cpf-domain"),$cpf-domain),
    <options xmlns="xdmp:eval"><isolation>different-transaction</isolation></options>
  )
  let $log := xdmp:log(fn:concat("SUBSCRIBE LOGS: ",$alert-name,$e2,$e4))
  return fn:true()
};

declare function ss:do-unsubscribe($notificationurl as xs:string,$searchname as xs:string) as xs:boolean {
  let $alert-name := fn:concat("/config/alerts/",xdmp:get-current-user(),"/",$searchname,"/",$notificationurl)

  let $rr :=
    for $rule in alert:get-all-rules($alert-name,cts:collection-query($alert-name))
    return
      alert:rule-remove($alert-name,$rule/@id)

  let $l := xdmp:eval(
    fn:concat('xquery version "1.0-ml"; declare namespace my="http://marklogic.com/alerts"; import module namespace ah = "http://marklogic.com/search/subscribe" at "/modules/lib-search-subscribe.xqy";',
              'import module namespace alert="http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";',
              'declare variable $my:alert-name as xs:string external;',
              'alert:config-set-cpf-domain-names(alert:config-get($my:alert-name), ())'),
    (xs:QName("my:alert-name"),$alert-name),
    <options xmlns="xdmp:eval"><isolation>different-transaction</isolation></options>
  )(:)
  let $e1 := xdmp:eval(
    fn:concat('xquery version "1.0-ml"; declare namespace my="http://marklogic.com/alerts"; import module namespace ah = "http://marklogic.com/search/subscribe" at "/modules/lib-search-subscribe.xqy";',
              'import module namespace alert="http://marklogic.com/xdmp/alert" at "/MarkLogic/alert.xqy";',
              'declare variable $my:alert-name as xs:string external;',
              'alert:config-delete($my:alert-name)'),
    (xs:QName("my:alert-name"),$alert-name),
    <options xmlns="xdmp:eval"><isolation>different-transaction</isolation></options>
  )
  :)
  (:)
  let $d := alert:config-delete($alert-name):)
  return fn:true()
};

declare function ss:create-config($notificationurl as xs:string,$searchname as xs:string) as xs:string {
  (: add alert :)
  let $alert-name := fn:concat("/config/alerts/",xdmp:get-current-user(),"/",$searchname,"/",$notificationurl)
  let $config := alert:make-config(
        $alert-name,
        "Generic Alert Subscription",
        "Generic Alert Subscription",
          <alert:options></alert:options> )
  let $config-out := alert:config-insert($config)
  return $alert-name
};

declare function ss:create-action($alert-name as xs:string,$alert-module as xs:string,$dbname as xs:string) {
  let $action := alert:make-action(
      fn:concat($alert-name,"-action"),
      "Act on new document",
      xdmp:database($dbname),
      "/",
      $alert-module,
      <alert:options></alert:options> )
  return alert:action-insert($alert-name, $action)
};

declare function ss:create-rule($alert-name as xs:string,$alert-detail as xs:string,$content-type as xs:string,$notificationurl as xs:string,$searchname as xs:string,$searchdoc as cts:query) {
  (:
  let $searchdoc := cts:search(fn:collection("saved-search"),cts:directory-query(fn:concat("/config/search/",xdmp:get-current-user(),"/"),"1"))/ss:saved-search
  let $searchdoc := if ($searchdoc) then $searchdoc else cts:search(fn:collection("saved-search"),cts:directory-query("/config/search/shared/","1"))/ss:saved-search
  :)
  let $rule := alert:make-rule(
      fn:concat($alert-name,"-rule"),
      $notificationurl,
      0, (: equivalent to xdmp:user(xdmp:get-current-user()) :)
      $searchdoc,
      fn:concat($alert-name,"-action"),
      <alert:options>
        {
          (element notificationurl {$notificationurl},
          element searchname {$searchname},
          element detail {$alert-detail},
          element contenttype {$content-type})
        }
      </alert:options> )
  return alert:rule-insert($alert-name, $rule)
};

(: TODO add method for creating cpf domain, and enabling cpf on the database automatically - see 8001 admin code :)


declare function ss:cpf-enable($alert-name as xs:string,$cpf-domain as xs:string) {
  alert:config-insert(
    alert:config-set-cpf-domain-names(
      alert:config-get($alert-name),
      ($cpf-domain)))
};
