angular.module('myApp', ["mljs-angular"])
		.controller(
				'SampleCtrl',
				function($scope) {
					$scope.mljs = new mljs()
					var ob = $scope.mljs.createOptions();
					ob.defaultCollation("http://marklogic.com/collation/en") // you may not need this if using the default
																								// collation throughout
					.collectionConstraint() // default constraint name of 'collection'
					.rangeConstraint("Animal", "animal", ob.JSON, "xs:string",
							"http://marklogic.com/collation/", true, [ "item-order" ]) // constraint name defaults to that of
																											// the range element name
					.rangeConstraint("Family", "family", ob.JSON, "xs:string",
							"http://marklogic.com/collation/", true,
							[ "item-frequency" ]) // constraint name defaults to that of the range element name
					.rangeConstraint("Actor", "actor", ob.JSON, "xs:string",
							"http://marklogic.com/collation/", true,
							[ "item-frequency" ]).rangeConstraint("Year", "year",
							ob.JSON, "xs:string", "http://marklogic.com/collation/",
							true, [ "item-order" ]).rangeConstraint("City", "city",
							ob.JSON, "xs:string", "http://marklogic.com/collation/",
							true, [ "item-order" ]).rangeConstraint("Month", "month",
							ob.JSON, "xs:string", "http://marklogic.com/collation/",
							true, [ "item-order" ]).rangeConstraint("Title", "title",
							"http://www.w3.org/1999/xhtml", "xs:string",
							"http://marklogic.com/collation/", true, [ "item-order" ])
							.rangeConstraint("Heading", "h1",
									"http://www.w3.org/1999/xhtml", "xs:string",
									"http://marklogic.com/collation/", true,
									[ "item-order" ])
							// .rangeConstraint("Summary","summary","","xs:string","http://marklogic.com/collation/",true,["item-order"])
							.rangeConstraint("DateReceived", "datereceived",
									"http://marklogic.com/ns/dt", "xs:date", null, true,
									null, null, "Received At")
							// constraint_name_opt,name_or_key,ns_opt,type_opt,collation_opt,facet_opt,facet_options_opt,fragmentScope_opt,annotation_opt
							.annotate("DateReceived", "Received On")
							.extractConstraintMetadata("Animal")
							// .extractConstraintMetadata("extract")
							.extractElementMetadata("title",
									"http://www.w3.org/1999/xhtml")
							.extractConstraintMetadata("Year")
							.extractConstraintMetadata("DateReceived");
					var dateBuckets = ob.buckets("DateReceived");
					dateBuckets.bucket("2013-01-01", "2013-01-31", "jan2013",
							"Jan 2013").bucket("2013-02-01", "2013-02-28", "feb2013",
							"Feb 2013").bucket("2013-03-01", "2013-03-31", "mar2013",
							"Mar 2013");

					// add facet value names for cities - just an example. Better example SOME/weirdValue -> "Nice Display
					// Name"
					ob.setFacetValueStrings("City", {
						Derby : "City of Derby",
						London : "City of London"
					});
					$scope.ob = ob
					$scope.initSearch=function(widget){
						widget.context[0].doSimpleQuery();
					}
				});