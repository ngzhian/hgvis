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
    graphPerDayPerDev();
    // graphcommitsPerDay();
    // graphcommitsPerDev();
  })
  .fail(function (jqxhr, textStatus, error) {
    alert(textStatus);
    $("#load").attr('value', 'try again...');
  });
}

var graphcommitsPerDay = function() {
  var commits = commitsPerDay();
  var lc = new LineChart();
  var x_parse = d3.time.format("%d/%m/%Y").parse;
  new LineChart().using(x_parse).for([{name: 'per day', values: commits}]).plot();
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

var graphPerDayPerDev = function() {
  var commits = hgvis_commits;
  var commits_per_dev = new Splitter().split(commits).by(function(c) {
    return c.authorName;
  });
  var series = {};
  commits_per_dev.forEach(function(dev) {
    var agg = new Aggregator().aggregate(dev.values).by(function(c) {
      var date = new Date(c.date);
      return [date.getDate(), date.getMonth()+1, date.getFullYear()].join("/");
    });
    agg.forEach(function(a) {
      a.x = a.by;
      a.y = a.count;
    });
    series[dev.by] = agg;
  });

  var arr = [];
  for (serie in series) {
    arr.push({name: serie, values: series[serie]});
  }

  arr.forEach(function(a) {
    console.log(a.values); 
  });

  var data = {
    name: 'custom',
    values: [{x: "12/04/2014", y: 2}, {x: "13/04/2014", y : 4}, {x:"15/04/2014", y: 3}]
  };
  var lc = new LineChart({
    x_parse: d3.time.format("%d/%m/%Y").parse,
    x_scale: d3.time.scale(),
    all_series: arr
  });
  lc.plot();
}
