
angular.module('myApp', ["mljs-angular"])
		.controller('SampleCtrl',function($scope) {
			$scope.mljs = new mljs()
			
			$scope.radius=22;
			$scope.addressbarProps = {
				radius : 20,
				radiusMeasure : 'miles'
			}
			var errors = document.getElementById("errors").widget;
			var ob = $scope.mljs.createOptions();
			ob.defaultCollation("http://marklogic.com/collation").rangeConstraint(
					"stars", "stars", null, "xs:int", null)
					.geoElementPairConstraint("location", "location",
							"http://marklogic.com/xdmp/json/basic", "lat",
							"http://marklogic.com/xdmp/json/basic", "lon",
							"http://marklogic.com/xdmp/json/basic", null,
							[ "units=miles", "coordinate-system=wgs84" ]);
			$scope.ob = ob
			$scope.initOpenLayers = function(widget) {
				var ol = widget;
				ol.addArcGISOnline();
				ol.addAllBing();
				ol.setGeoSelectionConstraint("location");
				ol.go(51.5112139, -0.1198244, 13); // lat, lon, zoom level (openlayers level)
				ol.setHeatmapGranularity(ol.LOW);
				var context = widget.context ? widget.context[0] : null
				if (context) {
					ol.addSeries("Attractions", context, "location.lat",
							"location.lon", undefined, undefined, undefined,
							"location"); // draw features for search results on configured search context
				}
				var sc = document.getElementById("searchContext").widget;

				var qb = $scope.mljs.createQuery();
				var dynLocation = qb.dynamic(qb.geoElementPairRadius("location",
						"http://marklogic.com/xdmp/json/basic", "lat",
						"http://marklogic.com/xdmp/json/basic", "lon",
						"http://marklogic.com/xdmp/json/basic", 51.5112139,
						-0.1198244, 20, "miles", "reciprocal")); // includes initial position

				// WARNING: ALTHOUGH THIS WILL WORK ON V6, THE RANGE INDEX EFFECT ON RELEVANCY SCORE WONT BE APPLIED UNLESS YOU RUN ON V7

				$scope.byDistance = function() {
					qb = $scope.mljs.createQuery(); // clear it out rather than alter
					qb.query(qb.and([ qb.collection("attractions"), dynLocation({
						latitude : 51.5112139,
						longitude : -0.1198244,
						radius : 20,
						units : "miles",
						"score-function" : "reciprocal"
					}) // TODO drive from the map's current center location
					// could add other dynamic query function calls, or static clauses, here
					]));
					return qb.toJson();
				};
				$scope.byRating = function() {
					qb = $scope.mljs.createQuery(); // clear it out rather than alter
					qb.query(qb.and([
							qb.collection("attractions"),
							qb.range("stars", 0, "GT", [ "score-function=linear",
									"slope-factor=10" ]), dynLocation({
								latitude : 51.5112139,
								longitude : -0.1198244,
								radius : 20,
								units : "miles",
								"score-function" : "zero"
							}) // Still include this to limit geography of results
					// NB in this query, instead of the above we could just use a georadius query
					// could add other dynamic query function calls, or static clauses, here
					]));
					return qb.toJson();
				};

				// initialise display with default query - NB in reality this would occur from detecting user's browser's location or a manual address search
				sc.contributeStructuredQuery("selection", $scope.byDistance()); // This would normally be called elsewhere. E.g. when the map changes centered position, or a different 'address' is entered

				// create a structured query selection widget with title "Calculate relevancy by:" and values "Nearest First" and "Best Rating First"

				return "Open Layers Initialized!!"

			};
			$scope.initSelection = function(widget) {
				widget.setModeContributeStructured();

				widget.addQuery("Nearest First", $scope.byDistance);
				widget.addQuery("Best Rating First", $scope.byRating);
				var geocontext = document.getElementById("geoContext").widget;
				var sc = document.getElementById("searchContext").widget;

				var qb = $scope.mljs.createQuery();

				geocontext.inform(sc, "locale", "location").home(
						qb.circleDef(51.5112139, -0.1198244, 20));

			};

		});


