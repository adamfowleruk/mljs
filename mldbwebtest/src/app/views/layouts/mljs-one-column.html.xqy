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
    
    <!-- START MLJS INCLUDES. NB YOU SHOULD DO THIS PER PAGE, NOT ON LAYOUT. ONLY HERE FOR CONVENIENCE. -->
    
<link rel="stylesheet" type="text/css" href="/css/mljs/widgets.css" />
<script type="text/javascript" src="/js/mljs/mljs.js"></script>
<script type="text/javascript" src="/js/mljs/mljs-xhr2.js"></script>

<script type="text/javascript" src="/js/highcharts.js"></script> <!-- dependency -->

<script type="text/javascript" src="/js/mljs/widgets.js"></script>
<script type="text/javascript" src="/js/mljs/widget-collections.js"></script>
<script type="text/javascript" src="/js/mljs/widget-cooccurence.js"></script>
<script type="text/javascript" src="/js/mljs/widget-dls.js"></script>
<script type="text/javascript" src="/js/mljs/widget-docbuilder.js"></script>
<script type="text/javascript" src="/js/mljs/widget-documents.js"></script>
<script type="text/javascript" src="/js/mljs/widget-explore.js"></script>
<script type="text/javascript" src="/js/mljs/widget-highcharts.js"></script>
<!-- <script type="text/javascript" src="/js/mljs/widget-ingest.js"></script> not yet -->
<script type="text/javascript" src="/js/mljs/widget-kratu.js"></script>
<script type="text/javascript" src="/js/mljs/widget-markings.js"></script>
<script type="text/javascript" src="/js/mljs/widget-profile.js"></script>
<script type="text/javascript" src="/js/mljs/widget-rdb2rdf.js"></script>
<script type="text/javascript" src="/js/mljs/widget-search.js"></script>
<script type="text/javascript" src="/js/mljs/widget-triples.js"></script>
<script type="text/javascript" src="/js/mljs/widget-workplace.js"></script>
    
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