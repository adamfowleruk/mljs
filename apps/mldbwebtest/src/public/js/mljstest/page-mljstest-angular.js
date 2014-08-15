
// ANGULAR MODULE EXTENSIONS MUST BE EXTERNAL TO ONLOAD FUNCTION

  // controller
  /*
  var controller = function MyController($scope) {
    this.scope = $scope;
    $scope.results = 0;

    console.log("Angular: MyController CALLED");

  };
  controller.prototype.updateResults = function(results) {
    console.log("Angular: updateResults CALLED");
    var time = 0;
                if (undefined != results.metrics) {
                  time = results.metrics["total-time"]; // Value like: PT1.064535S - it's marklogic, so assumes it's never in minutes (because MarkLogic rocks!)
                  time = time.substring(2,time.length - 1);
                }
    this.scope.results = time;
  };
  */

  // extend angular
  angular.module('myApp', ["mljs"])
    // directives are like creating widgets - TODO need to wrap this and externalise somehow...
    .directive('metrics', function() {
        var link = function(scope, element, attrs, model) {
            console.log("Angular: LINK CALLED");
            var render = function(){
                console.log("Angular: RENDER CALLED");
                var time = model.$modelValue;
                element.html("<div>Search completed in " + time + " seconds</div>");
            };
            scope.$watch(attrs['ngModel'], render);
            render();
        };
        return {
            restrict: 'E',
            require: 'ngModel',
            link: link
        }
    })
    /*

    .service("mySearchContext",function(searchContext) {
      var db = new mljs();
      var ob = db.createOptions();
      ob.defaultCollation("http://marklogic.com/collation/en") // you may not need this if using the default collation throughout
        .collectionConstraint() // default constraint name of 'collection'
        .rangeConstraint("Animal","animal",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"]) // constraint name defaults to that of the range element name
        .rangeConstraint("Family","family",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-frequency"]) // constraint name defaults to that of the range element name
        .rangeConstraint("Actor","actor",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-frequency"])
        .rangeConstraint("Year","year",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
        .rangeConstraint("City","city",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
        .rangeConstraint("Month","month",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
        .rangeConstraint("DateReceived","datereceived","http://marklogic.com/ns/dt","xs:date",null,true,null,null,"Received At")
        //constraint_name_opt,name_or_key,ns_opt,type_opt,collation_opt,facet_opt,facet_options_opt,fragmentScope_opt,annotation_opt
        .annotate("DateReceived","Received On")
        .returnMetrics();
      var dateBuckets = ob.buckets("DateReceived");
      dateBuckets.bucket("2013-01-01","2013-01-31","jan2013","Jan 2013")
                 .bucket("2013-02-01","2013-02-28","feb2013","Feb 2013")
                 .bucket("2013-03-01","2013-03-31","mar2013","Mar 2013");

      // add facet value names for cities - just an example. Better example SOME/weirdValue -> "Nice Display Name"
      ob.setFacetValueStrings("City",{
        Derby: "City of Derby", London: "City of London"
      });
      //var options = ob.toJson();

      //var bar = new com.marklogic.widgets.searchbar("searchbar");
      //var results = new com.marklogic.widgets.searchresults("searchresults");


      // link search context to angular's model

      var ctx = db.createSearchContext();

      ctx.setOptions("mljstest-page-angular-options",ob);

      return ctx;
    })
    */
    .controller('SampleCtrl',function($scope) {
      //$scope.mljs = "wibble";

        var db = new mljs();
        var ob = db.createOptions();
        ob.defaultCollation("http://marklogic.com/collation/en") // you may not need this if using the default collation throughout
          .collectionConstraint() // default constraint name of 'collection'
          .rangeConstraint("Animal","animal",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"]) // constraint name defaults to that of the range element name
          .rangeConstraint("Family","family",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-frequency"]) // constraint name defaults to that of the range element name
          .rangeConstraint("Actor","actor",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-frequency"])
          .rangeConstraint("Year","year",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
          .rangeConstraint("City","city",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
          .rangeConstraint("Month","month",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
          .rangeConstraint("DateReceived","datereceived","http://marklogic.com/ns/dt","xs:date",null,true,null,null,"Received At")
          //constraint_name_opt,name_or_key,ns_opt,type_opt,collation_opt,facet_opt,facet_options_opt,fragmentScope_opt,annotation_opt
          .annotate("DateReceived","Received On")
          .returnMetrics();
        var dateBuckets = ob.buckets("DateReceived");
        dateBuckets.bucket("2013-01-01","2013-01-31","jan2013","Jan 2013")
                   .bucket("2013-02-01","2013-02-28","feb2013","Feb 2013")
                   .bucket("2013-03-01","2013-03-31","mar2013","Mar 2013");

        // add facet value names for cities - just an example. Better example SOME/weirdValue -> "Nice Display Name"
        ob.setFacetValueStrings("City",{
          Derby: "City of Derby", London: "City of London"
        });
        //var options = ob.toJson();

        //var bar = new com.marklogic.widgets.searchbar("searchbar");
        //var results = new com.marklogic.widgets.searchresults("searchresults");


        // link search context to angular's model

        var ctx = db.createSearchContext();

        ctx.setOptions("mljstest-page-angular-options",ob);

        //ctx.register(bar);
        $scope.primaryModel = {
          searchContext: ctx
        }; // other contexts within this too

        // doing the above registers all widgets to the contexts too

        ctx.doSimpleQuery(); // uses search context
    });
