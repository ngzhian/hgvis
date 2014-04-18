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
	with the keys being the category, obtained by calling keyFn(x)
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
			'by': name_of_category,
			'count': x_int,
			'values': []
	  }
*/
Aggregator.prototype.by = function(keyFn) {
	var splt = new Splitter();
	var splits = splt.split(this._original).by(keyFn);
	splits.forEach(function(value, index, array) {
		value.count = value.values.length;
	});
  return splits;
}

/*
	Splits an array of objects into a number of categories by applying
	the keyFn to it.
	[obj1, obj2, obj3, obj4]
	-> [category1, category2]
	where each category is of the structure:
		{
			'by': name_of_category,
			'values': [arr, of, values, that, belong, to, this, category]
		}
*/
function Splitter() {
	var _original;
}

Splitter.prototype.split = function(list) {
	this._original = list;	
	return this;
}

/*
	keyFn is the function that is applied to each value in the list
	to get the the category each value will be keyed by
*/
Splitter.prototype.by = function(keyFn) {
	var splt = {}, splitBy, arr = [];
	this._original.forEach(function(value, index, array) {
		splitBy = keyFn(value);
		splt[splitBy] = splt[splitBy] || [];
		splt[splitBy].push(value);
	});
	for (splitBy in splt) {
		arr.push({ by: splitBy, values: splt[splitBy] });
	}
	return arr;
}
