HgVis
=====

HgVis is a tool to help visualize Mercurial's commits.
It's really an excuse for me to learn some d3js, JavaScript, a little of node, and just have fun!

## What can it do
As for now it can visualize
- commits per day
- commits per dev per day

![HgVis](https://raw.githubusercontent.com/ngzhian/hgvis/master/screens/hgvis.png "HgVis looks like this!")
![HgVis](https://raw.githubusercontent.com/ngzhian/hgvis/master/screens/commits-per-dev-per-day.png "Visualize commits per developer per day")

In this repo is a `hglog` file which as the commit history of my school project, this allows you to peek at how things look like without much trouble.

## How to run it
You need `node` installed, it depends on `express` and `d3-line-chart`, a library written by yours truly to allow users to quickly plot line charts.

1. `git clone https://github.com/ngzhian/hgvis.git`
2. `npm install`
3. `npm start`
4. navigate to `localhost:3000`

Just replace `hglog` with your own log file from Mercurial, using `hg log > hglog`

## How it works
Things are extremely volatile because I'm still getting a feel of how to do things

1. `server.js` is a simple web server that can respond to GET requests on `/` and `/:file`.
 - `'/'` serves a simple index page. On this page the user can input the name of the log file, and select visualizations to view.
 - `:file` is taken to be the log file that contains the output of `hg log`. This file is then read and processed, then returned to the client as a json.

2. Processing of the log file is done by `hgvis.js`
 - since the output of `hg log` has well-defined format, what it does is basically just look at the lines and read them into `Commit` objects
 - An array of `Commit` objects is then returned, sorted by date in ascending order.

3. The client (webpage) receives a json respones from the server, and all d3 processing and drawing is done on `client.js`. Nothing fancy there now, just bar charts with colours and axis. I hope to make more meaningful kinds of visualizations in the future.

4. client.js uses aggregator.js to do splitting of data and aggregation of data. Details can be found in the files.

## What's planned
- further breakdown for each and every developer
- commits for each hour of the day
	- this may be interested in seeing which hours of the day committers are most active
- changes in lines of code per commit

## Wanna help?
Any form of help is appreciated, the code smells so bad now I'll probably merge any pull requests. But if anyone can guide me on d3/js it would be awesome! Thanks!

## License
MIT
