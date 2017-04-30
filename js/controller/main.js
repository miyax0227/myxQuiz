'use strict';

var appName = "myxQuiz";
var app = angular.module(appName);

/*******************************************************************************
 * main - メインコントローラ
 * 
 * @class
 * @name main
 * @memberOf angular-5o2x.js.controller
 ******************************************************************************/
app.controller('main',
	[
		'$scope',
		'$q',
		'fileResource',
		'qCommon',
		'round',
		'$window',
		function($scope, $q, fileResource, qCommon, round, $window) {

		  /*********************************************************************
		   * header.jsonに記載されたデフォルトのheaderを取得する
		   * 
		   * @return {object} ヘッダ情報
		   ********************************************************************/
		  function getDefaultHeader() {
			var header = {};
			$scope.defaultHeader.map(function(record) {
			  header[record.key] = record.value;
			});
			return header;
		  }

		  /*********************************************************************
		   * rule.jsonに記載されたデフォルトのruleを取得する
		   * 
		   * @return {object} ルール情報
		   ********************************************************************/
		  function getDefaultRule() {
			var rule = {};
			$scope.defaultRule.map(function(record) {
			  rule[record.key] = record.value;
			});
			return rule;
		  }

		  /*********************************************************************
		   * playerを追加する
		   * 
		   * @param {number}
		   *            index - 追加する位置
		   ********************************************************************/
		  $scope.addPlayer = function(index) {
			qCommon.addPlayer(index, $scope);
			// 従属変数の再計算
			round.calc($scope.current.players, $scope.items);
		  };

		  /*********************************************************************
		   * playerを削除する
		   * 
		   * @param {number}
		   *            index - 削除する位置
		   ********************************************************************/
		  $scope.removePlayer = function(index) {
			qCommon.removePlayer(index, $scope);
			// 従属変数の再計算
			round.calc($scope.current.players, $scope.items);
		  };

		  /*********************************************************************
		   * 特定の履歴を指定して、現在の状態に反映する
		   * 
		   * @param {number}
		   *            index - 指定する履歴位置
		   ********************************************************************/
		  $scope.historyChanged = function(index) {
			var hist = history[index];
			qCommon.refreshCurrent(hist, $scope);
		  };

		  $scope.calc = function() {
			round.calc($scope.current.players, $scope.items);
		  };

		  $scope.getPlayerCSS = function(players, player) {
			var leftBorder = 0;
			var rightBorder = 800;
			var playerWidth = 50;

			var playerLeft = leftBorder + (rightBorder - leftBorder)
				/ (players.length) * (player["position"] + 0.5) - playerWidth
				* 0.5;
			var playerTop = 100;

			return {
			  position : 'absolute',
			  left : playerLeft + 'px',
			  top : playerTop + 'px',
			  'z-index' : player["position"] - players.length
			};
		  };

		  $scope.getItemCSS = function(item, length) {
			if (item.hasOwnProperty('vtrans')) {
			  return {
				'transform' : 'scale(1,' + (item.vtrans / length) + ')',
				'transform-origin' : 'inherit'
			  };
			}
			if (item.hasOwnProperty('htrans')) {
			  return {
				'transform' : 'scale(' + (item.htrans / length) + ',1)',
				'transform-origin' : 'inherit'
			  };
			}
			return null;
		  };

		  $scope.openWindow = function() {
			$window.open('board.html');
		  }
		  /*********************************************************************
		   * 読み込み対象のファイルを全て読み込み終えたら実行される処理（事実上のメイン処理）
		   ********************************************************************/
		  $q.all(fileResource.map(function(resource) {
			return resource.query().$promise;
		  })).then(function(strs) {
			// すべてのPromiseオブジェクトが取得できたら実行される
			$scope.defaultHeader = strs[0];
			$scope.defaultRule = strs[1];
			$scope.items = strs[2];
			$scope.current = {};
			$scope.current.header = getDefaultHeader();
			$scope.current.players = strs[3];

			// 履歴
			$scope.history = [];
			// ルール
			$scope.rule = getDefaultRule();
			// redo用の履歴
			$scope.redoHistory = [];

			// action - playerに紐づく操作
			$scope.actions = round.actions;
			// global_action - 全体的な操作
			$scope.global_actions = round.global_actions;

			// 関数のラッピング
			$scope.func_player_scope = function(func, player) {
			  return func(player, $scope);
			};
			$scope.func_scope = function(func) {
			  return func($scope);
			};

			// 従属変数の再計算
			round.calc($scope.current.players, $scope.items);
			// 履歴が無い場合、現在の得点状況を追加
			if (history.length == 0) {
			  qCommon.createHist($scope);
			}
		  });

		} ]);
