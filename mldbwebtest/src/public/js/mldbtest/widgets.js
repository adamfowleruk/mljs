

com = window.com || {};
com.marklogic = window.com.marklogic || {};

/**
 * Provides objects for generic event publish-subscribe workflows
 */

com.marklogic.events = {};

// EVENT

com.marklogic.events.Event = function(type,data) {
  this.type = type;
  this.data = data;
};

// PUBLISHER

com.marklogic.events.Publisher = function() {
  this.listeners = new Array();
};

com.marklogic.events.Publisher.prototype.subscribe = function(listener) {
  this.listeners.push(listener);
};

com.marklogic.events.Publisher.prototype.unsubscribe = function(listener) {
  var newArr = new Array();
  for (var i = 0;i < this.listeners.length;i++) {
    if (listener != this.listeners[i]) {
      newArr.push(this.listeners[i]);
    }
  }
  this.listeners = newArr;
};


com.marklogic.events.Publisher.prototype.publish = function(event) {
  for (var i = 0;i < this.listeners.length;i++) {
    this.listeners[i](event);
  }
};




// generic useful functions (not namespaced)

function bubbleSort(a,jsonPath)
{
    var swapped;
    do {
        swapped = false;
        for (var i=0; i < a.length-1; i++) {
	  var leftValue = 0;
	  var rightValue = 0;
	  if (typeof a[i] == "object" && undefined != jsonPath) {
	    leftValue = jsonExtractValue(a[i],jsonPath);
	  } else {
	    leftValue = a[i];
	  }
	  if (typeof a[i+1] == "object" && undefined != jsonPath) {
	    rightValue = jsonExtractValue(a[i+1],jsonPath);
	  } else {
	    rightValue = a[i+1];
	  }
            if (leftValue < rightValue) {
                var temp = a[i];
                a[i] = a[i+1];
                a[i+1] = temp;
                swapped = true;
            }
        }
    } while (swapped);
}




function msort(array, begin, end, comparisonValue)
{
	var size=end-begin;
	if(size<2) return;

	var begin_right=begin+Math.floor(size/2);

	msort(array, begin, begin_right, comparisonValue);
	msort(array, begin_right, end, comparisonValue);
	//merge_inplace(array, begin, begin_right, end, comparisonValue);
	array = merge_sort(array,function(left,right) {
	  var leftValue = 0;
	  var rightValue = 0;
	  if (typeof left == "object" && undefined != comparisonValue) {
	    leftValue = jsonExtractValue(left,comparisonValue);
	  } else {
	    leftValue = left;
	  }
	  if (typeof right == "object" && undefined != comparisonValue) {
	    rightValue = jsonExtractValue(right,comparisonValue);
	  } else {
	    rightValue = right;
	  }
	  leftValue = 1 * leftValue;
	  rightValue = 1 * rightValue; // numeric conversion - read from JSON as string TODO check for errors (e.g. actually a string)
    console.log("msort_inline_function-sort(): left value: " + leftValue + ", rightValue: " + rightValue);
	  if (leftValue == rightValue) {
	    console.log("returning 0");
	    return 0;
	  } else {
	    if (leftValue < rightValue) {
	      console.log("returning -1");
	      return -1;
	    } else if (rightValue < leftValue ){
	      console.log("returning 1");
	      return 1;
	    } else {
	      console.log("Typeof leftValue: " + (typeof leftValue));
	      console.log("Typeof rightValue: " + (typeof rightValue));
	      return -2;
	    }
	  }
	});
}

function merge_sort_inplace(array,comparison)
{
	msort(array, 0, array.length,comparison);
}

function merge_inplace(array, begin, begin_right, end, comparisonValue)
{
  console.log("merge_inplace(): array: " + JSON.stringify({array: array}));
  var leftValue, rightValue;
	for(;begin < begin_right; ++begin) {
	  leftValue = 0;
	  rightValue = 0;
	  if (typeof array[begin] == "object" && undefined != comparisonValue) {
	    leftValue = jsonExtractValue(array[begin],comparisonValue);
	  } else {
	    leftValue = array[begin];
	  }
	  if (typeof array[begin_right] == "object" && undefined != comparisonValue) {
	    rightValue = jsonExtractValue(array[begin_right],comparisonValue);
	  } else {
	    rightValue = array[begin_right];
	  }
    console.log("merge_inplace(): left value: " + leftValue + ", rightValue: " + rightValue);
	  
		if(leftValue < rightValue) {
			var v=array[begin];
			array[begin]=array[begin_right];
			insert(array, begin_right, end, v);
		}
	}
  console.log("merge_inplace(): array NOW: " + JSON.stringify({array: array}));
}

function merge_sort(array,comparison)
{
	if(array.length < 2)
		return array;
	var middle = Math.ceil(array.length/2);
	return merge(merge_sort(array.slice(0,middle),comparison),
			merge_sort(array.slice(middle),comparison),
			comparison);
}

function merge(left,right,comparison)
{
	var result = new Array();
	while((left.length > 0) && (right.length > 0))
	{
		if(comparison(left[0],right[0]) <= 0)
			result.push(left.shift());
		else
			result.push(right.shift());
	}
	while(left.length > 0)
		result.push(left.shift());
	while(right.length > 0)
		result.push(right.shift());
	return result;
}

function insert(array, begin, end, v)
{
	while(begin+1<end && array[begin+1]<v) {
		array.swap(begin, begin+1);
		++begin;
	}
	array[begin]=v;
}


function jsonExtractValue(json,namePath) {
  var paths = namePath.split(".");
  var obj = json;
  for (var i = 0;undefined != obj && i < paths.length;i++) {
    obj = obj[paths[i]]; // TODO handle documents with multiple result container elements (arrays of results within same doc)
  }
  //mldb.defaultconnection.logger.debug("jsonExtractValue(): Returning value: " + obj);
  return obj;
};


// EXTRA ARRAY FUNCTIONS

if (undefined == Array.prototype.swap) {
  Array.prototype.swap=function(a, b)
  {
	  var tmp=this[a];
	  this[a]=this[b];
	  this[b]=tmp;
  };
}

// TODO remove the below and replace with sensible default / check
if (undefined == Array.prototype.contains) {
  Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
      if (this[i] === obj) {
        return true;
      }
    }
    return false;
  };
}

Array.prototype.position = function(value) {
  for (var i = 0;i < this.length;i++) {
    if (this[i] == value) {
      return i;
    }
  }
  return -1;
};
