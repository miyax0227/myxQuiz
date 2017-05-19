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
	transclude : true,
	templateUrl : '../../template/players.html'
  }
})

.directive('globalActions', function() {
  return {
	restrict : 'A',
	transclude : false,
	templateUrl : '../../template/global_actions.html'
  }
})

.directive('scoreboard', function() {
  return {
	restrict : 'A',
	transclude : true,
	templateUrl : '../../template/scoreboard.html'
  }
})

.directive('victory', function() {
  return {
	restrict : 'A',
	transclude : true,
	templateUrl : '../../template/victory.html'
  }
})

.filter('with', function() {
  return function(array, key) {
	return array.filter(function(one) {
	  return one.hasOwnProperty(key);
	});
  };
})

.controller(
	'main',
	[ '$scope', '$q', 'fileResource', 'qCommon', 'round',
		function($scope, $q, fileResource, qCommon, round) {
		  /* Timer表示 */
		  $scope.timerDisplay = "";

		  /* keyDownイベントのハンドラ */
		  $scope.keyDown = function(event) {
			qCommon.keyDown($scope, event);
		  }
		  $scope.workKeyDown = true;

		  /* windowサイズの調整 */
		  $scope.adjustWindow = function() {
			qCommon.adjustWindow($scope);
		  }
		  /* getPlayerCSS - プレイヤーの位置情報CSS */
		  $scope.getPlayerCSS = qCommon.getPlayerCSS;

		  /* getItemCSS - 伸縮が必要なアイテムのCSS */
		  $scope.getItemCSS = qCommon.getItemCSS;

		  /* getRankColorCSS - 値により背景色が変わるアイテムのCSS */
		  $scope.getRankColorCSS = qCommon.getRankColorCSS;

		  /* viewMode - 表示モードの判定 */
		  $scope.viewMode = qCommon.viewMode;

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

		  /* getDisplayValue - 表示用の値の取得 */
		  $scope.getDisplayValue = qCommon.getDisplayValue;

		  /*********************************************************************
		   * 読み込み対象のファイルを全て読み込み終えたら実行される処理（事実上のメイン処理）
		   ********************************************************************/
		  $q.all(fileResource.map(function(resource) {
			return resource.query().$promise;
		  })).then(function(strs) {
			// すべてのPromiseオブジェクトが取得できたら実行される

			// keyboard入力の定義
			$scope.keyArray = strs[5][0];
			$scope.keyCode = strs[5][1];

			// windowサイズ
			$scope.windowSize = strs[4][0];
			qCommon.resizeWindow($scope);
			qCommon.adjustWindow($scope);

			// プロパティ
			$scope.property = qCommon.getDefaultHeader(strs[1]);
			$scope.timer = {};

			// items生成
			$scope.items = strs[2];
			// rule内に独自定義されたitemを追加
			Array.prototype.push.apply($scope.items, round.items);

			// defaultHeader生成
			$scope.defaultHeader = strs[0];
			// rule内に独自定義されたheaderを追加
			Array.prototype.push.apply($scope.defaultHeader, round.head);

			// localStorageとbind
			qCommon.saveToStorage($scope, qCommon.viewMode());
			// 操作ウィンドウ側の場合、localStorageに格納されていた値とは関係なく初期化
			if (!qCommon.viewMode()) {
			  var initCurrent = {};

			  // 履歴ファイルの存在確認
			  var fs = require('fs');
			  try {
				// ファイルが存在する場合
				initCurrent = JSON.parse(fs.readFileSync(qCommon.getHistoryFileName(), 'utf-8'));
				qCommon.refreshCurrent(initCurrent, $scope);
			  } catch (e) {
				// ファイルが存在しない場合
				// ヘッダ部分の初期化
				initCurrent.header = qCommon.getDefaultHeader($scope.defaultHeader);
				// プレイヤー部分の初期化
				initCurrent.players = qCommon.initPlayers(strs[3], $scope.items);
				qCommon.refreshCurrent(initCurrent, $scope);
			  }

			  // タイマー
			  $scope.timer['defaultTime'] = $scope.property.timer;
			  $scope.timer['working'] = false;
			  $scope.timer['visible'] = false;
			  $scope.timer['destination'] = null;
			  $scope.timer['restTime'] = null;

			}
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

			// 優勝者が決定している場合、優勝者名の設定
			$scope.victoryName = function() {
			  return qCommon.victoryName($scope);
			}

			// 履歴が無い場合、現在の得点状況を追加
			if ($scope.history.length == 0) {
			  qCommon.createHist($scope);
			}

			// タイマースタート
			qCommon.timerStart($scope);
		  });

		} ]);
