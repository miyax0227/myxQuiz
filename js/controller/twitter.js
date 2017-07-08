'use strict';

var appName = "myxQuizTwitter";
var app = angular.module(appName, [ "ui.bootstrap", "ngTwitter" ]);

/*******************************************************************************
 * index - indexコントローラ
 * 
 * @class
 * @name main
 * @memberOf angular-5o2x.js.controller
 ******************************************************************************/
app

.controller('twitter', [ '$scope', 'qTwitter', function($scope, qTwitter) {
  $scope.accounts = qTwitter.accounts;
  $scope.history = qTwitter.history;
  $scope.accountNum = qTwitter.accountNum;

  $scope.setAccountNum = function(num) {
	$scope.accountNum = num;
	qTwitter.setAccountNum(num);
  }

  $scope.newTweetSubmit = function() {
	qTwitter.newTweetSubmit($scope.newTweet);
	$scope.newTweet = "";
  }

  $scope.replySubmit = function() {
	qTwitter.replySubmit($scope.newTweet, $scope.tweetId);
	$scope.newTweet = "";
	$scope.tweetId = null;
  }

  $scope.deleteTweet = function(obj) {
	qTwitter.deleteTweet(obj.id);
	obj.id = null;
  }

  $scope.setTweetId = function(id) {
	$scope.tweetId = id;
  }

} ]);

