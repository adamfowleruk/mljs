(function() {
/**
 * Holds Angular.js directives for re-using MLJS widgets.
 */

angular.module('mljs', [])
    .directive('searchbar', function() {
      console.log("MA: searchbar directive called");

      var searchContext = null;

      function link(scope, element, attrs,model) {

        console.log("MA: searchbar directive link function called");
        var wgt = new com.marklogic.widgets.searchbar(element[0]);

        var register = function() {
          searchContext = model.$modelValue.searchContext;
          searchContext.register(wgt);
        };
        scope.$watch(attrs['ngModel'], register);

        // TODO other widget configuration

        // register widget
        //$searchContext.register(wgt); // equivalent of searchContext.register(wgt);
      };

      return {
          restrict: 'E',
          require: 'ngModel',
        link: link
      };
    })


    .directive('searchresults', function() {
      console.log("MA: searchresults directive called");

      var searchContext = null;

      function link(scope, element, attrs, model) {
        console.log("MA: searchresults directive link function called");

        var wgt = new com.marklogic.widgets.searchresults(element[0]);

        var register = function() {
          searchContext = model.$modelValue.searchContext;
          searchContext.register(wgt);
        };
        scope.$watch(attrs['ngModel'], register);

        // TODO other widget configuration
        // register widget
        //$searchContext.register(wgt); // equivalent of searchContext.register(wgt);
      }

      return {
          restrict: 'E',
          require: 'ngModel',
        link: link
      };
    })
/*
      .factory('searchContext', function() {
        console.log("MA: searchcontext factory function called");
        var db = new mljs();
        var ctx = db.createSearchContext();
        return ctx;
      })*/

  ;
})();
