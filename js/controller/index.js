'use strict';

var appName = "myxQuiz";
var app = angular.module(appName);

/*******************************************************************************
 * index - indexコントローラ
 * 
 * @class
 * @name main
 * @memberOf angular-5o2x.js.controller
 ******************************************************************************/
app

.controller('index', [ '$scope', '$window', '$interval', '$filter',
	function($scope, $window, $interval, $filter) {
	  $scope.rounds = [];

	  var fs = require('fs');
	  var dir = __dirname + '/round';
	  var files = fs.readdirSync(dir);

	  var data = JSON.parse(fs.readFileSync(__dirname + '/json/window.json', 'utf-8'));

	  var parameter = "";
	  parameter += 'width=' + data[2].width;
	  parameter += ',height=' + data[2].height;
	  parameter += ",left=" + data[2].left;
	  parameter += ",top=" + data[2].top;

	  files.forEach(function(file) {
		if (!fs.statSync(dir + "/" + file).isFile()) {
		  $scope.rounds.push({
			name : file,
			historyFile : __dirname + '/history/current/' + file + '.json',
			qCount : null,
			initializable : false,
			click : function() {
			  $window.open("./round/" + file + "/board.html", file + " - control", parameter);
			},
			initialize : function() {
			  var dateString = $filter('date')(new Date(), 'yyyyMMddHHmmss');
			  var oldFile = __dirname + '/history/current/' + file + '.json';
			  var newFile = __dirname + '/history/current/' + file + '_' + dateString + '.json';
			  fs.renameSync(oldFile, newFile);
			}
		  });
		}
	  });

	  var t = $interval(function() {
		angular.forEach($scope.rounds, function(round) {
		  try {
			data = JSON.parse(fs.readFileSync(round.historyFile, 'utf-8'));
			round.qCount = data.header.qCount;
			round.initializable = true;
		  } catch (e) {
			round.qCount = null;
			round.initializable = false;
		  }
		});
	  }, 1000);

	  $scope.initialize = function() {
		var dateString = $filter('date')(new Date(), 'yyyyMMddHHmmss');
		var oldFile = __dirname + '/history/current';
		var newFile = __dirname + '/history/' + dateString;
		fs.renameSync(oldFile, newFile);
		fs.mkdirSync(oldFile);
	  }
	} ]);
