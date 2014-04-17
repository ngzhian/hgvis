/*
  An Aggregator aggregates a list of data points.
  It counts the number of data points in each category.
  The category is determined by calling a function with each data point,
  this function is passed in to the by(fn) method.
  The API of aggregator is fluent,
  	var agg = new Aggregator();
  	var results = agg.aggregate(list).by(key_function)
	results is then a list of objects, objects have the following structure
		{
			by: key_function(data_point),
			count: x<int>
			children: []
		}
	where 'by' has the value of the key_function applied to a data point in the list,
	count is the number of occurences of that particular category,
	and children contains the actual data points that are aggregateed
	into this particular category
*/
function Aggregator() {
	var _original;
}

Aggregator.prototype.aggregate = function(list) {
	this._original = list;
	return this;
}

/*
	Does the aggregation of the list of data points.
	Internally it first transforms the list into a dictionary,
	with the keys being the category, obtained by calling getKey(x)
	on each data point.
	The value of each key is a dictionary containing the count, as well as
	a list of data points making up this category.
	  {
			'key': {
				'count' : 1
				'children': []
			}
	  }
  This is then flattened into an array of objects, which has the structure
	  {
			'by': category,
			'count': x <int>,
			'children': []
	  }
*/
Aggregator.prototype.by = function(getKey) {
  var agg = {}, aggBy, arr = [];
  this._original.forEach(function(value, index, array) {
    aggBy = getKey(value);
    agg[aggBy] = agg[aggBy] || {'count': 0, 'children': []};
    agg[aggBy].count++;
    agg[aggBy].children.push(value);
  });
  for (aggBy in agg) {
    arr.push({
    	'by': aggBy,
    	'count': agg[aggBy].count,
    	'children': agg[aggBy].children
    });
  }
  return arr;
}
