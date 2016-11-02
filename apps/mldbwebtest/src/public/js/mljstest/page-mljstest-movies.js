angular.module('myApp', [ "mljs-angular" ]).controller(
		'SampleCtrl',
		function($scope) {
			var db = new mljs(); // calls default configure
			db.logger.setLogLevel("debug");

			db.forceVersion("6.0.2"); // disabled combined query
			$scope.mljs = db
			var error = document.getElementById("errors").widget;
			var ob = db.createOptions();
			  ob.tuples("actor-genre","actor","genre"); // first is tuple name. defaults to string, json namespace
			  ob.jsonRangeConstraint("actor",["item-frequency"])
			    .jsonRangeConstraint("year",["item-order"])
			    .jsonRangeConstraint("genre",["item-order"]);
			  ob.tuples("actor-year","actor","year"); // first is tuple name. defaults to string, json namespace
			  ob.tuples("actor-genre-year","actor","genre","year");
			  
			  // FOLLOWING MUST BE HERE TO RECEIVE ANY CO-OCCURENCE RESULTS! Disabled by default
			  ob.returnValues(true).returnResults(false).returnFacets(false);
			  $scope.ob = ob
			$scope.initContext= function(widget){
				  widget.valuesEndpoint("actor-genre","actor-year","actor-genre-year");
			}
			$scope.initcoagy= function(widget){

				try {
					  					  
					  var coag = document.getElementById("coag").widget;
					  coag.title = "Actor vs. Movie Genre";
					  coag.displayTuple("actor-genre");
					  coag.setTupleConstraints(["actor","genre"]);
					  
					  var coay = document.getElementById("coay").widget;
					  coay.title = "Actor vs. Movie Year";
					  coay.displayTuple("actor-year");
					  coay.setTupleConstraints(["actor","year"]);
					  
					  var coagy = widget;
					  coagy.title = "Actor vs. Genre vs. Year";
					  coagy.displayTuple("actor-genre-year");
					  coagy.setTupleConstraints(["actor","genre","year"]);
					  
					  var qb = db.createQuery();
					  var colQuery = qb.collection("movies");
					  
					  // SEARCH CONTEXT METHOD
					  
					  var sc1 = widget.context[0];
					  sc1.valuesEndpoint("actor-genre","actor-year","actor-genre-year");
					  
					  sc1.contributeStructuredQuery("base",colQuery);

					  
					  } catch (err) {
						 var error = document.getElementById("errors").widget
					    error.show(err.message);
					  }
			}
		});