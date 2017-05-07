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

.controller('index', [ '$scope', '$window', function($scope, $window) {
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
		click : function() {
		  $window.open("./round/" + file + "/board.html", file +" - control", parameter);

		}
	  });
	}
  })
} ]);
