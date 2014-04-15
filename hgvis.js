var fs = require('fs');

function readLog(filename) {
	try {
		return fs.readFileSync(filename, {encoding: 'ucs2'});
	} catch (err) {
		return undefined;
	}
}

function listToCommits(list) {
	var commits = [];
	for (var i = 0; i < list.length; i++) {
		var line = list[i].trim();
		var commit;
		if (line.indexOf("changeset:") == 0 ) {
			commit = new Commit();
			commit.setChangeset(line.substr("changeset:".length).trim());
		} else if (line.indexOf("user:") == 0) {
			commit.setUser(line.substr("user:".length).trim());
		} else if (line.indexOf("date:") == 0) {
			commit.setDate(line.substr("date:".length).trim());
		} else if (line.length == 0) {
			if (commit != undefined) {
				commits.push(commit);
			}
		}
	}
	if (commit != undefined) {
		commits.push(commit);
	}
	return commits;
}

function Commit() {
	var changeset;
	var id;
	var author;
	var authorName;
	var authorEmail;
	var date;
}

Commit.prototype.setChangeset = function(changeset) {
	this.changeset = changeset;
};


Commit.prototype.setUser = function(author) {
	this.author = author;
	var splits = author.split("<");
	if (splits.length > 1 ) {
		this.authorEmail = splits[1].trim();
	}
	this.authorName = splits[0].trim();
};

Commit.prototype.setDate = function(dateString) {
	this.date = new Date(dateString);
}

var monthToInt = function(month) {
	switch(month) {
		case "Jan": return 0;
		case "Feb": return 1;
		case "Mar": return 2;
		case "Apr": return 3;
		case "May": return 4;
		case "Jun": return 5;
		case "Jul": return 6;
		case "Aug": return 7;
		case "Sep": return 8;
		case "Oct": return 9;
		case "Nov": return 10;
		case "Dec": return 11;
	}
}

Commit.prototype.toString = function() {
	return this.changeset + " " + this.author + " " + this.date;
}

exports.getCommits = function(filename) {
	filename = filename || 'hglogsmall';
	var data = readLog(filename);
	if (data == undefined) {
		return undefined;
	}
	var list = data.toString().split("\n");
	var commits = listToCommits(list);
  var sortedCommits = commits.sort(
    function(fst, snd) {
      return fst.date.getTime() - snd.date.getTime();
    }
    );
	return sortedCommits;
}