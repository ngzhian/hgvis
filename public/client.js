$(document).ready(function(){
  $("#load").click(loadCommit);           
  $("#byDay").click(graphByDay);
  $("#byWeek").click(graphByWeek);
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
    graphByDay();
    graphByWeek();
  })
  .fail(function (jqxhr, textStatus, error) {
    alert(textStatus);
    $("#load").attr('value', 'try again...');
  });
}

var graphByDay = function() {
  var data = byDay();

  var margin = {top: 20, right: 30, bottom: 80, left: 60},
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;
  barWidth = 40;

  var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
  var y = d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis().scale(x).orient("bottom");
  var yAxis = d3.svg.axis().scale(y).orient("left");

  x.domain(data.map(function(d) { return d.date; }));
  y.domain([0, d3.max(data, function(d) { return d.freq; })]);

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
  .text("Days");

  svg.append("g").attr("class", "y axis")
  .call(yAxis)
  .append("text")
  .attr("transform", "rotate(90)")
  .attr("y", 50)
  .attr("x", height/2)
  .style("text-anchor", "end")
  .text("Frequency");

  svg.selectAll(".bar").data(data)
  .enter().append("rect")
  .attr("class", "bar")
  .attr("x", function(d) { return x(d.date); })
  .attr("width", x.rangeBand())
  .attr("y", function(d) { return y(d.freq); })
  .attr("height", function(d) { return height - y(d.freq); });
}

var getDMY = function(c) {
    // console.log(commit.date);
    var date = new Date(c.date);
    // console.log(date.tostring());
    return [date.getDate(), date.getMonth()+1,
    date.getFullYear()].join("/");
  };

  var byDay = function() {
    if (window.hgvis_commits == undefined) {
      error('commits not loaded, click load all!');
      return;
    }
    var commits = window.hgvis_commits;

  // separate commits by day
  var commitsByDay = {};
  commits.map(function(commit) {
    var dmy = getDMY(commit);
    if (commitsByDay[dmy] == undefined) {
      commitsByDay[dmy] = 0;
    }
    commitsByDay[dmy]++;
  });

    // put commits into an array
    var commitsArr = [];
    for (var dmy in commitsByDay) {
      var obj = {};
      obj.date = dmy;
      obj.freq = commitsByDay[dmy];
      commitsArr.push(obj);
    }
    return commitsArr;
  }

  var graphByWeek = function() {
    var data = byWeek();

    var margin = {top: 20, right: 30, bottom: 60, left: 60},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
    barWidth = 40;

    var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
    var y = d3.scale.linear().range([height, 0]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");

    x.domain(data.map(function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.freq; })]);

    var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x_axis = svg.append("g").attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")").call(xAxis);
    x_axis.selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-65)")
    .attr("font-size", ".6em");
    x_axis.append("text")
    .attr("x", width/2)
    .attr("y", 30)
    .text("Week");

    svg.append("g").attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(90)")
    .attr("y", 50)
    .attr("x", height/2)
    .style("text-anchor", "end")
    .text("Frequency");

    svg.selectAll(".bar").data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) { return x(d.date); })
    .attr("width", x.rangeBand())
    .attr("y", function(d) { return y(d.freq); })
    .attr("height", function(d) { return height - y(d.freq); });
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

  var getWeekNum = function(commit) {
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
  }