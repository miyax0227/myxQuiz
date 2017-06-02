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

.controller('index', [ '$scope', 'qFile', function($scope, qFile) {
  $scope.tableHead = [];
  $scope.tableContent = [];
  $scope.rounds = qFile.rounds;
  $scope.initialize = qFile.initialize;
  $scope.openNameList = function() {
	qFile.openNameList($scope);
	console.log($scope.tableHead);
	console.log($scope.tableContent);
  }
  $scope.saveJsonFile = function(){
	qFile.saveJsonFile($scope);
  }
  $scope.cancelJsonFile = function(){
	qFile.cancelJsonFile($scope);
  }

} ]);
