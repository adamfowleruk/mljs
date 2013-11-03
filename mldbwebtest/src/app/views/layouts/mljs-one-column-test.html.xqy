(:
Copyright 2012 MarkLogic Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
:)
xquery version "1.0-ml";

import module namespace vh = "http://marklogic.com/roxy/view-helper" at "/roxy/lib/view-helper.xqy";

import module namespace uv = "http://www.marklogic.com/roxy/user-view" at "/app/views/helpers/user-lib.xqy";

declare variable $view as item()* := vh:get("view");
declare variable $title as xs:string? := vh:get("title");
declare variable $username as xs:string? := vh:get("username");
declare variable $q as xs:string? := vh:get("q");

'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">',
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{$title}</title>
    <link href="/css/themes/ui-lightness/jquery-ui.css" type="text/css" rel="stylesheet"/>
    <link href="/css/bootstrap-roxy.css" rel="stylesheet"/>
    <link href="/css/one-column.less" type="text/css" rel="stylesheet/less"/>
    <link href="/css/app.less" type="text/css" rel="stylesheet/less"/>
    
    <link href="/css/960/reset.css" type="text/css" rel="stylesheet"/>
    <link href="/css/960/960.css" type="text/css" rel="stylesheet"/>
    
    <script src="/js/lib/less-1.3.0.min.js" type='text/javascript'></script>
    <script src="/js/lib/jquery-1.7.1.min.js" type='text/javascript'></script>
    <script src="/js/lib/jquery-ui-1.8.18.min.js" type='text/javascript'></script>
    <script src="/js/two-column.js" type='text/javascript'></script>
    <script src="/js/app.js" type='text/javascript'></script>
    
    
    <!-- START MLJS INCLUDES. NNB THESE ARE PER PAGE ON THE MLJSTEST CONTROLLER, AS THEY SHOULD BE IN A PRODUCTION APP -->
    <!-- Not Applicable -->
    <!-- END MLJS INCLUDES -->
    
    { vh:get("additional-js") }
  </head>
  <body>
    <div class="home" id="home">
      <a class="text" href="/" title="Home">MLJS Samples Application</a>
    </div>
    {
      uv:build-user($username, fn:concat("/user/profile?user=", $username), "/user/login", "/user/register", "/user/logout")
    }
    <div class="canvas">
      <div class="header" arcsize="5 5 0 0">
        V6+: 
        <a href="/mljstest/search">Search</a> | 
        <a href="/mljstest/snippets">Search with Snippets</a> | 
        <a href="/mljstest/charts">Charts</a> | 
        <a href="/mljstest/chartsearch">Chart + Search</a> | 
        <a href="/mljstest/movies">Co-occurence</a> | 
        <a href="/mljstest/error">Error</a> | 
        <a href="/mljstest/kratu">Kratu</a>  |
        <a href="/mljstest/upload">Upload</a> |
        <a href="/mljstest/docview">View Doc</a> 
        <br/>
      V7+:
        <a href="/mljstest/docbuilder">Document Builder</a> | 
        <a href="/mljstest/sparqlbar">Semantic (SPARQL) Search</a> | 
        <a href="/mljstest/explorer">Explorer</a> 
        <br/>
      REST Extensions:  
        <a href="/mljstest/rdb2rdf">RDB2RDF</a> 
        <br/>
      In Development:  
        <a href="/mljstest/workplace">Workplace</a> | 
        <a href="/mljstest/collectionuris">Collection URIs</a> |
        <a href="/mljstest/openlayers">Maps</a>
      </div>
      
      <div class="content">
        { $view }
      </div>
      <div class="footer" arcsize="0 0 5 5"><span class="copyright">&copy; 2012, MarkLogic Corporation, All Rights Reserved.</span>
        <a href="/page/help">My Application Help</a>
        <span class="pipe"> </span>
        <a href="/page/contact">Contact Us</a>
        <span class="pipe"> </span>
        <a href="/page/terms">Terms of Use</a>
      </div>
    </div>
  </body>
</html>