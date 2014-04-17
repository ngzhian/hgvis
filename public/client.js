$(document).ready(function(){
  $("#load").click(loadCommit);           
  $("#byDay").click(graphcommitsPerDay);
  $("#byWeek").click(graphByWeek);
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
  })
  .fail(function (jqxhr, textStatus, error) {
    alert(textStatus);
    $("#load").attr('value', 'try again...');
  });
}

var lineChartAggregateOverDate = function(data, dateFmt) {
  var margin = {top: 20, right: 20, bottom: 30, left: 50},
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

  var parseDate = dateFmt.parse;

  var x = d3.time.scale()
  .range([0, width]);

  var y = d3.scale.linear()
  .range([height, 0]);

  var line = d3.svg.line()
  .x(function(d) { return x(d.x); })
  .y(function(d) { return y(d.agg); });

  var svg = d3.select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  data.forEach(function(d) {
    d.x = parseDate(d.date);
    d.y = +d.agg;
  });

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

var graphcommitsPerDay = function() {
  var commits = commitsPerDay();
  commits.forEach(function(c) {
    c.date = c.x;
    delete c.x;
    c.agg = c.y;
    delete c.y;
  });
  lineChartAggregateOverDate(commits, d3.time.format("%d/%m/%Y"));

  graph2dLine(commitsPerDay(), function(d) {
    return d.x
  }, function(d) {
    return d.y;
  });
  graph2dDiscrete(commitsPerDay(), function(d) {
    return d.x;
  }, function(d) {
    return d.y;
  });
}

var graphcommitsPerDev = function() {
  graph2dDiscrete(commitsPerDev(), function(d) {
    return d.x;
  }, function(d) {
    return d.y;
  });
}

var graphByWeek = function() {
  graph2dDiscrete(byWeek(), function(d) {
    return d.date;
  }, function(d) {
    return d.freq;
  });
}

// Commit c => [c] -> (c -> x) -> (c -> y) -> [(x,y)]
var aggregateOnX = function(cs, getX, getY) {
  var agg = {}, aggBy, arr = [];
  cs.forEach(function(v, i, a) {
    aggBy = getX(v);
    agg[aggBy] = agg[aggBy] || 0;
    agg[aggBy]++;
  });
  for (aggBy in agg) {
    arr.push({ 'x': aggBy, 'y': agg[aggBy]});
  }
  return arr;
}

var commitsPerDay = function() {
 return aggregateOnX(window.hgvis_commits,
  function(c) {
    var date = new Date(c.date);
    return [date.getDate(), date.getMonth()+1, date.getFullYear()].join("/");
  });
}

var commitsPerDev = function() {
 return aggregateOnX(window.hgvis_commits,
  function(c) {
    return c.authorName;
  });
}

var byWeek = function() {
  if (window.hgvis_commits == undefined) {
    error('commits not loaded, click load all!');
    return;
  }
  var commits = window.hgvis_commits;

  // separate commits by day
  var commitsByWeek = {};
  var base = new Date(commits[0].date).getTime();

  function getWeekNum(commit) {
    var ms = new Date(commit.date).getTime();
    return Math.floor((ms - base) / (1000 * 60 * 60 * 24 * 7));
  }

  commits.map(function(commit) {
    var weekNum = getWeekNum(commit);
    if (commitsByWeek[weekNum] == undefined) {
      commitsByWeek[weekNum] = 0;
    } else {
      commitsByWeek[weekNum]++;
    }
  });

  // put commits into an array
  var commitsArr = [];
  for (var week in commitsByWeek) {
    var obj = {};
    obj.date = week;
    obj.freq = commitsByWeek[week];
    commitsArr.push(obj);
  }
  return commitsArr;
}

var error = function(msg) {
  console.log(msg);
  $('#loading').html(msg);
};

function graph2dLine(data, getX, getY) {
  var margin = {top: 20, right: 30, bottom: 20, left: 60},
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;
  bar_width = 40;

  var x = d3.scale.ordinal().rangeRoundBands([0, data.length * bar_width], .1);
  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis().scale(x).orient("bottom");
  var yAxis = d3.svg.axis().scale(y).orient("left");

  x.domain(data.map(function(d) { return getX(d); }));
  y.domain([0, d3.max(data, function(d) { return getY(d); })]);

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
  .attr("font-size", ".6em");

  svg.append("g").attr("class", "y axis")
  .call(yAxis)
  .append("text")
  .attr("transform", "rotate(90)")
  .attr("y", 50)
  .attr("x", height/2)
  .style("text-anchor", "end")
  .text("the Y");

  var line = d3.svg.line()
  .x(function(d) { return x(getX(d)); })
  .y(function(d) { return y(getY(d)); });

  svg.append("path")
  .datum(data)
  .attr("class", "line")
  .attr("d", line);

  // svg.selectAll(".bar").data(data)
  // .enter().append("rect")
  // .attr("class", "bar")
  // .attr("x", function(d) { return x(getX(d)); })
  // .attr("width", x.rangeBand())
  // .attr("y", function(d) { return y(getY(d)); })
  // .attr("id", function(d) { return d; })
  // .attr("height", function(d) { return height - y(getY(d)); })
  // .on("mouseover", function() {
  // })
  // .on("mouseout", function() { d3.select(this).classed('hover', false); });
}

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
  y.domain([0, d3.max(data, function(d) { return getY(d); })]);

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
  .text("the X");

  svg.append("g").attr("class", "y axis")
  .call(yAxis)
  .append("text")
  .attr("transform", "rotate(90)")
  .attr("y", 50)
  .attr("x", height/2)
  .style("text-anchor", "end")
  .text("the Y");

  svg.selectAll(".bar").data(data)
  .enter().append("rect")
  .attr("class", "bar")
  .attr("x", function(d) { return x(getX(d)); })
  .attr("width", x.rangeBand())
  .attr("y", function(d) { return y(getY(d)); })
  .attr("id", function(d) { return d; })
  .attr("height", function(d) { return height - y(getY(d)); })
  .on("mouseover", function() {
  })
  .on("mouseout", function() { d3.select(this).classed('hover', false); });
}