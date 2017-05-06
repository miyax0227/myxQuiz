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
app

.config([ "$locationProvider", function($locationProvider) {
  $locationProvider.html5Mode({
	enabled : true,
	requireBase : false
  });
} ])

.directive('players', function() {
  return {
	restrict : 'A',
	transclude:true,
	templateUrl : '../../template/players.html'
  }
})

.directive('globalActions', function() {
  return {
	restrict : 'A',
	transclude:false,
	templateUrl : '../../template/global_actions.html'
  }
})

.directive('scoreboard', function() {
  return {
	restrict : 'A',
	transclude:true,
	templateUrl : '../../template/scoreboard.html'
  }
})

.controller(
	'main',
	[
		'$scope',
		'$q',
		'fileResource',
		'qCommon',
		'round',
		function($scope, $q, fileResource, qCommon, round) {

		  /* getPlayerCSS - プレイヤーの位置情報CSS */
		  $scope.getPlayerCSS = qCommon.getPlayerCSS;
		  /* getItemCSS - 伸縮が必要なアイテムのCSS */
		  $scope.getItemCSS = qCommon.getItemCSS;
		  /* getRankColorCSS - 値により背景色が変わるアイテムのCSS */
		  $scope.getRankColorCSS = qCommon.getRankColorCSS;
		  /* viewMode - 表示モードの判定 */
		  $scope.viewMode = qCommon.viewMode;
		  /* openWIndow - 表示用ウィンドウの表示 */
		  $scope.openWindow = qCommon.openWindow;
		  /* addPlayer - プレイヤー追加 */
		  $scope.addPlayer = function(index) {
			qCommon.addPlayer(index, $scope);
		  };
		  /* removePlayer - プレイヤー削除 */
		  $scope.removePlayer = function(index) {
			qCommon.removePlayer(index, $scope);
		  };
		  /* historyChanged - 特定の履歴を現在の状態に反映する */
		  $scope.historyChanged = function(index) {
			qCommon.refreshCurrent(history[index], $scope);
		  };
		  /* calc - 再計算関数 */
		  $scope.calc = function() {
			round.calc($scope.current.players, $scope.items, $scope.property);
		  };

		  /*********************************************************************
		   * 読み込み対象のファイルを全て読み込み終えたら実行される処理（事実上のメイン処理）
		   ********************************************************************/
		  $q.all(fileResource.map(function(resource) {
			return resource.query().$promise;
		  })).then(
			  function(strs) {
				// すべてのPromiseオブジェクトが取得できたら実行される

				// items生成
				$scope.items = strs[2];
				Array.prototype.push.apply($scope.items, round.items);
				// defaultHeader生成
				$scope.defaultHeader = strs[0];
				Array.prototype.push.apply($scope.defaultHeader, round.head);

				qCommon.saveToStorage($scope, qCommon.viewMode());
				if (!qCommon.viewMode()) {
				  var initCurrent = {};
				  initCurrent.header = qCommon
					  .getDefaultHeader($scope.defaultHeader);
				  initCurrent.players = strs[3];
				  qCommon.refreshCurrent(initCurrent, $scope);
				}

				// プロパティ
				$scope.property = qCommon.getDefaultHeader(strs[1]);
				// 履歴
				$scope.history = [];
				// redo用の履歴
				$scope.redoHistory = [];

				/* action - playerに紐づく操作 */
				$scope.actions = round.actions;
				/* global_action - 全体的な操作 */
				$scope.global_actions = round.global_actions;
				/* 関数のラッピング(player範囲) */
				$scope.func_player_scope = function(func, player) {
				  return func(player, $scope);
				};
				/* 関数のラッピング(全体) */
				$scope.func_scope = function(func) {
				  return func($scope);
				};

				// 従属変数の再計算
				$scope.calc();
				// 履歴が無い場合、現在の得点状況を追加
				if ($scope.history.length == 0) {
				  qCommon.createHist($scope);
				}
			  });

		} ]);
