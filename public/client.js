$(document).ready(function(){
  $("#load").click(loadCommit);           
  $("#byDay").click(graphcommitsPerDay);
  $("#byDev").click(graphcommitsPerDev);
  loadCommit();
});

var loadCommit = function() {
  var filename = $('#filename').val();
  console.log("loading commits from: " + filename);
  $("#load").html('loading...');
  $("#load").attr('value', 'loading... this might take a while for large data');
  $.getJSON('/load/' + filename)
  .done(function(data) {
    window.hgvis_commits = data.all;
    $("#load").attr('value', 'done!');
    graphcommitsPerDay();
    // graphcommitsPerDev();
  })
  .fail(function (jqxhr, textStatus, error) {
    alert(textStatus);
    $("#load").attr('value', 'try again...');
  });
}


var lineChartAggregateOverDate = function(data, dateFmt) {
  var lc = new LineChart();
  var x_parse = d3.time.format("%d/%m/%Y").parse;
  lc.using(x_parse, function(d) { return d; });
  lc.for([data]);
  lc.plot();
}

var graphcommitsPerDay = function() {
  var commits = commitsPerDay();
  lineChartAggregateOverDate(commits, d3.time.format("%d/%m/%Y"));
}

var graphcommitsPerDev = function() {
  graph2dDiscrete(commitsPerDev(), function(d) {
    return d.by;
  }, function(d) {
    return d.count;
  });
}

var commitsPerDay = function() {
 return new Aggregator().aggregate(window.hgvis_commits).by(
  function(c) {
    var date = new Date(c.date);
    return [date.getDate(), date.getMonth()+1, date.getFullYear()].join("/");
  });
}

var commitsPerDev = function() {
 return new Aggregator().aggregate(window.hgvis_commits).by(
  function(c) {
    return c.authorName;
  });
}

var error = function(msg) {
  console.log(msg);
  $('#loading').html(msg);
};

function graph2dDiscrete(data, getX, getY) {
  // data is an array of objects [a,b,c]
  // getx is a fn such that getx(a) gives me the xaxis values
  // gety is a fn such that gety(a) gives me the yaxis values

  var margin = {top: 20, right: 30, bottom: 80, left: 60},
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;
  bar_width = 40;

  var x = d3.scale.ordinal().rangeRoundBands([0, data.length * bar_width], .1);
  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis().scale(x).orient("bottom");
  var yAxis = d3.svg.axis().scale(y).orient("left");

  x.domain(data.map(function(d) { return getX(d); }));
  y.domain([0, d3.max(data, function(d) { return getY(d); }) + 20]);

  var svg = d3.select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var x_axis = svg.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis);
  x_axis.selectAll("text")
  .style("text-anchor", "end")
  .attr("dx", "-.8em")
  .attr("dy", ".15em")
  .attr("transform", "rotate(-65)")
  .attr("font-size", ".6em");
  x_axis.append("text")
  .attr("x", width/2)
  .attr("y", 70)
  .text("Devs");

  svg.append("g")
  .attr("class", "y axis")
  .call(yAxis)
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", -40)
  .attr("x", - height/2)
  .style("text-anchor", "end")
  .text("# commits");

  svg.selectAll(".bar").data(data)
  .enter().append("rect")
  .attr("class", "bar")
  .attr("x", function(d) { return x(getX(d)); })
  .attr("width", x.rangeBand())
  .attr("y", function(d) { return y(getY(d)); })
  .attr("id", function(d) { return d; })
  .attr("height", function(d) { return height - y(getY(d)); })
  .on("mouseenter", function(d) {
    var xPosition = d3.event.pageX + 10;
    var yPosition = d3.event.pageY;
    var tooltip = d3.select("#tooltip")
    .style("left", xPosition + "px")
    .style("top", yPosition + "px")
    tooltip.select("#title").text(d.by);
    tooltip.select("#desc").text(d.count + " commits");
    tooltip.classed("hidden", false);
  })
  .on("mouseleave", function() {
    d3.select("#tooltip").classed("hidden", true);
  });
}

/*
  LineChart only plots continuous values against time.
  It can take in multiple series.
  LineChart supports a fluent API.
    var lineChart = new LineChart();
    lineChart.using(x_parse, y_parse).for([data, another]).plot();
// lineChart = new lineChart();
// lineChart.addSeries(series1).addSeries(series2).plot();
*/

function LineChart() {
  var _series = []; 
  // default parsing function is the identity function;
  LineChart.prototype.x_parse = function(d) { return d; };
  LineChart.prototype.y_parse = function(d) { return d; };
}

/*
  This method takes in functions to parse the x and y axis values.
*/
LineChart.prototype.using = function(xParse, yParse) {
  function emptyIfUndef(fn) {
    if (fn == null || fn == undefined) {
      return function(d) { return d; };
    } 
    return fn;
  }
  this.x_parse = emptyIfUndef(xParse);
  this.y_parse = emptyIfUndef(yParse); 
  return this;
}

LineChart.prototype.for = function(data) {
  this._series = data;
  return this;
}

LineChart.prototype.addSeries = function(serie) {
  this._series.push(serie);
  return this;
}

LineChart.prototype.plot = function() {
  var margin = {top: 20, right: 20, bottom: 30, left: 50},
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

  var x = d3.time.scale().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  var svg = d3.select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  data = this._series[0];

  var xparse = this.x_parse;
  var yparse = this.y_parse;

  data.forEach(function(d) {
    d.x = xparse(d.by);
    d.y = yparse(d.count);
  });

  var line = d3.svg.line()
  .x(function(d) { return x(d.x); })
  .y(function(d) { return y(d.y); });

  x.domain(d3.extent(data, function(d) { return d.x; }));
  y.domain(d3.extent(data, function(d) { return d.y; }));

  var xAxis = d3.svg.axis()
  .scale(x)
  .orient("bottom");

  var yAxis = d3.svg.axis()
  .scale(y)
  .orient("left");

  svg.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis);

  svg.append("g")
  .attr("class", "y axis")
  .call(yAxis)
  .append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 6)
  .attr("dy", ".71em")
  .style("text-anchor", "end")
  .text("# commits");

  svg.append("path")
  .datum(data)
  .attr("class", "line")
  .attr("d", line);

  svg.selectAll(".commit-circle").data(data)
  .enter().append("g")
  .append("circle")
  .attr("class", "commit-circle")
  .attr("cx", function(d) { return x(d.x); })
  .attr("r", 15)
  .attr("cy", function(d) { return y(d.y); })
  .on("mouseenter", function(d) {
    var format = d3.time.format("%d/%m/%Y");
    var xPosition = d3.event.pageX + 10;
    var yPosition = d3.event.pageY;
    var tooltip = d3.select("#tooltip")
    .style("left", xPosition + "px")
    .style("top", yPosition + "px")
    tooltip.select("#title").text(format(d.x));
    tooltip.select("#desc").text(d.y + " commits");
    tooltip.classed("hidden", false);
  })
  .on("mouseleave", function() {
    d3.select("#tooltip").classed("hidden", true);
  });
}