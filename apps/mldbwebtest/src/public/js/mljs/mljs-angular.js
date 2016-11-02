(function() {
/**
 * Holds Angular.js directives for re-using MLJS widgets.
 */
	var setWidgetConfiguration=function(widget,scope,attrs){
		var contextEval = scope["mljsProps"]
		if(!contextEval){
			var mljsProps=attrs["mljsprops"]
			if(mljsProps)contextEval=scope.$eval(mljsProps)
		}
		contextEval && widget.setConfiguration && widget.setConfiguration(contextEval)
	};	

	
	function MLJSWidgetFactory (widgetName) {
			var reg= function(context,widget){
				if(!widget.context){
				widget.context=[]
				}
				context.register(widget)
				widget.context.push(context)
			};
			var initErrorListener=function(widget,scope,attrs){
				var errorDivId=attrs["errorlistener"]
				if(errorDivId && widget.addErrorListener){
					var error = document.getElementById(errorDivId).widget;			  
					widget.addErrorListener(error.updateError);
				}
			};	
			var registerFunc = function(attrVal, widget, scope) {
				var context = scope.context
				if (!context) {
					var contextEval = scope.$eval(attrVal)
					if (contextEval && contextEval.length > 0) {
						angular.forEach(contextEval, function(val) {
							var contextDiv = document.getElementById(val)
							contextDiv && contextDiv.widget
									&& reg(contextDiv.widget,widget);

						})
					} else {
						var contextDiv = document.getElementById(attrVal)
						contextDiv && contextDiv.widget
								&& reg(contextDiv.widget,widget);

					}
				} else {
					if (context.length) {
						angular.forEach(context, function(val) {
							reg(val,widget);
						})
					} else
						reg(context,widget)
				}
			};
			var createWidgetFunc = function(element) {

				if (element.length >= 0)
					element = element[0]
				var widget = new com.marklogic.widgets[widgetName](element.id);
				element.widget = widget;
				return widget;
			};
			return function() {
					
				return {
					restrict : 'A',
					scope : {
						context : "=",
						mljsProps  : "=",
						initFunc: "&",
						registerFunc: "&"
					},
					link : function(scope, element_jqlite, attrs) {
						var widget = createWidgetFunc(element_jqlite)
						setWidgetConfiguration(widget,scope,attrs)
						initErrorListener(widget,scope,attrs)
						registerFunc(attrs["contextids"], widget, scope);
						scope.initFunc && scope.initFunc({widget:widget})
					
					}
				}
				
			};
			
		};
		function MLJSContextFactory (createFunctionName) {
			return function() {
					
				return {
					scope : {
						options : '=',
						mljs : "="
					},
					restrict : 'A',
					link : function(scope, element_jqlite, attrs) {
						var element = element_jqlite[0]
						element.widget = scope.mljs ? scope.mljs[createFunctionName]() : new mljs[createFunctionName]();
						var optionsName = attrs["optionsname"] ? attrs["optionsname"]
								: element.id
						optionsName	&& scope.options && element.widget.setOptions(optionsName,scope.options)
						
						setWidgetConfiguration(element.widget,scope,attrs)
						
					}
				}
				
			};
		}


angular.module('mljs-angular', [])
.directive('mljsSearchBar',  new MLJSWidgetFactory("searchbar",false))
.directive('mljsSearchResults',   new MLJSWidgetFactory("searchresults",false))
.directive('mljsSearchFacets',   new MLJSWidgetFactory("searchfacets",false)) 
.directive('mljsSearchMetrics',  new MLJSWidgetFactory("searchmetrics",false)) 
.directive('mljsSearchPager',   new MLJSWidgetFactory("searchpager",false)) 
.directive('mljsSearchSort',   new MLJSWidgetFactory("searchsort",false))
.directive('mljsError',  new MLJSWidgetFactory("error",false))
.directive('mljsOpenLayers',   new MLJSWidgetFactory("openlayers",false))
.directive('mljsSearchSelection',   new MLJSWidgetFactory("searchselection",false))
.directive('mljsAddressBar',   new MLJSWidgetFactory("addressbar",false))
.directive('mljsHighCharts',   new MLJSWidgetFactory("highcharts",false))
.directive('mljsCooccurence',   new MLJSWidgetFactory("cooccurence",false))
.directive('mljsGraphExplorer',   new MLJSWidgetFactory("graphexplorer",false))
.directive('mljsSearchContext',  new MLJSContextFactory("createSearchContext",true))
.directive('mljsGeoContext',  new MLJSContextFactory("createGeoContext",true));
})();
