(function() {
/**
 * Holds Angular.js directives for re-using MLJS widgets.
 */

angular.module('mljs', [])
  .factory('searchContext', function() {
    console.log("MA: searchcontext factory function called");
    var db = new mljs();
    var ctx = db.createSearchContext();
    return ctx;
  })

  .directive('searchbar', ['$searchContext',function($searchContext) {
    console.log("MA: searchbar directive called");

    function link(scope, element, attrs) {

      console.log("MA: searchbar directive link function called");

      var wgt = new com.marklogic.widgets.searchbar(element);
      // TODO other widget configuration

      // register widget
      $searchContext.register(wgt); // equivalent of searchContext.register(wgt);
    }

    return {
      link: link
    };
  }])

  .directive('searchresults', ['$searchContext',function($searchContext) {
    console.log("MA: searchresults directive called");

    function link(scope, element, attrs) {
      console.log("MA: searchresults directive link function called");

      var wgt = new com.marklogic.widgets.searchresults(element);
      // TODO other widget configuration
      // register widget
      $searchContext.register(wgt); // equivalent of searchContext.register(wgt);
    }

    return {
      link: link
    };
  }])

  ;
})();
