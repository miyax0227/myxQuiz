'use strict';

var appName = "myxQuiz";
var app = angular.module(appName);

/*******************************************************************************
 * qCommon - クイズのルールに依存しない共通関数をまとめたservice
 * @class
 * @name qCommon
 ******************************************************************************/
app.service('qCommon', [ '$modal', function($modal) {

  var qCommonService = {};

  /*****************************************************************************
   * ログ文字列を生成する
   * @param {Object} scope $scope
   ****************************************************************************/
  qCommonService.getLog = function(scope) {
	var logArray = [];
	var header = scope.current.header;
	var players = scope.current.players;

	angular.forEach(scope.defaultHeader, function(record, i) {
	  logArray.push(header[record.key]);
	});

	angular.forEach(players, function(player, i) {
	  angular.forEach(scope.items, function(record, j) {
		logArray.push(player[record.key]);
	  });
	});

	return logArray.join(',');
  };

  /*****************************************************************************
   * 履歴を作成する
   * @param {Object} scope - $scope
   ****************************************************************************/
  qCommonService.createHist = function(scope) {
	// historyの末尾にcurrentのコピーを追加
	scope.history.push(angular.copy(scope.current));
	// currentPageをhistoryの末尾に設定
	scope.currentPage = scope.history.length;
	// redoHistoryを初期化
	scope.redoHistory = [];
	// ログ出力
	var fs = require('fs');
	fs.appendFile('test.txt', qCommonService.getLog(scope) + "\n");
	fs.writeFile('current.json', angular.toJson(scope.current));
  };

  /*****************************************************************************
   * playerを追加する
   * @param {number} index - 追加する位置
   * @param {Object} scope - $scope
   ****************************************************************************/
  qCommonService.addPlayer = function(index, scope) {
	var player = {};
	// playerにitemの初期値を設定
	angular.forEach(scope.items, function(record, i) {
	  player[record.key] = record.value;
	});
	// players内のindexで指定した位置にplayerを追加
	scope.current.players.splice(index, 0, player);
  };

  /*****************************************************************************
   * playerを勝抜処理する
   * @param {Object} player - 勝ち抜けたプレイヤー
   * @param {Object} players - players
   ****************************************************************************/
  qCommonService.win = function(player, players) {
	/* rank算出 */
	var rank = players.filter(function(item) {
	  return (item.status == 'win');
	}).length + 1;
	player.rank = rank;
	/* status */
	player.status = "win";
  };

  /*****************************************************************************
   * playerを失格処理する
   * @param {Object} player - 勝ち抜けたプレイヤー
   * @param {Object} players - players
   ****************************************************************************/
  qCommonService.lose = function(player, players) {
	/* rank算出 */
	var rank = players.filter(function(item) {
	  return (item.status != 'lose');
	}).length;
	player.rank = rank;
	/* status */
	player.status = "lose";
  };

  /*****************************************************************************
   * playerを削除する
   * @param {number} index - 削除する位置
   * @param {Object} scope - $scope
   ****************************************************************************/
  qCommonService.removePlayer = function(index, scope) {
	// players内のindexで指定した位置のplayerを削除
	scope.current.players.splice(index, 1);
  };

  /*****************************************************************************
   * 値の置換をする
   * @param {string,number} a - 元の文字列/数値
   * @param {Array. <string,number>} alter - (置換前文字列/数値, 置換後文字列/数値)*n
   *            [,elseの場合の文字列/数値]
   * @return {string,number} 置換後の文字列/数値
   ****************************************************************************/
  qCommonService.decode = function(a, alter) {
	// alterをalterCopyに退避
	var alterCopy = angular.copy(alter);
	// alterCopy内で、aに合致する奇数番目の要素が出るまで繰り返し
	while (alterCopy.length > 0) {
	  // 奇数番目の要素を取得
	  var b = alterCopy.shift();
	  // 要素数が奇数個のalterCopyの末尾まで来た場合,elseとして末尾の要素を返却
	  if (alterCopy.length == 0) {
		return b;
	  }
	  // 偶数番目の要素を取得
	  var c = alterCopy.shift();
	  // aが奇数番目の要素と合致する場合、偶数番目の要素を返却
	  if (a == b) {
		return c;
	  }
	}
	// 要素数が偶数個のalterCopyの末尾まで来て合致する奇数番目の要素が無い場合、aのまま返却
	return a;
  };

  /*****************************************************************************
   * playerのソート用関数
   * @param {Array. <object>} order - key:比較対象属性名 order:昇順(asc)/降順(desc)
   *            alter:置換文字列
   * @param {boolean} position - 比較結果が同等の場合、初期位置で比較を行うか
   * @param {object} scope - $scope
   * @return {function} 評価関数
   ****************************************************************************/
  qCommonService.playerSortOn = function(order, position, players) {
	return function(a, b) {
	  // ループ内のコンテキスト、flgは返却予定値(-1/0/1)
	  var context = {
		flg : 0
	  };
	  // orderの先頭から順にaとbのそれぞれの要素を指定して比較
	  angular.forEach(order, function(record, i) {
		// 返却予定値が0（同値）の場合のみ比較
		if (this.flg == 0) {
		  var aComp = a[record.key];
		  var bComp = b[record.key];
		  // alterが設定されている場合、decodeで値を置換
		  if (record.hasOwnProperty('alter')) {
			aComp = qCommonService.decode(aComp, record.alter);
			bComp = qCommonService.decode(bComp, record.alter);
		  }
		  // 降順（desc）の場合
		  if (record.hasOwnProperty('order') && record.order == 'desc') {
			if (aComp < bComp) {
			  this.flg = 1;
			} else if (aComp > bComp) {
			  this.flg = -1;
			}
			// 昇順の場合
		  } else {
			if (aComp < bComp) {
			  this.flg = -1;
			} else if (aComp > bComp) {
			  this.flg = 1;
			}
		  }
		}
	  }, context);
	  // 返却予定値が0以外の場合、ここで返却
	  if (context.flg != 0) {
		return context.flg;
	  }
	  // 初期位置による比較を考慮しない場合、ここで0を返却
	  if (!position) {
		return 0;
	  }
	  // 初期位置による比較結果を返却
	  var aComp = players.indexOf(a);
	  var bComp = players.indexOf(b);
	  if (aComp < bComp) {
		return -1;
	  } else if (aComp > bComp) {
		return 1;
	  }
	  return 0;
	};
  };

  /*****************************************************************************
   * 現在の状態を履歴に反映する（undo,redoで使用）
   * @param {object} hist - 反映したい1履歴
   * @param {object} scope - $scope
   ****************************************************************************/
  qCommonService.refreshCurrent = function(hist, scope) {
	// headerの中身を入替
	angular.forEach(scope.current.header, function(value, key) {
	  delete scope.current.header[key];
	});
	angular.forEach(hist.header, function(value, key) {
	  scope.current.header[key] = value;
	});
	// プレイヤーの中身を入替
	// 現在の状態から人数が変わる場合、ポインタ入替
	if (scope.current.players.length != hist.players.length) {
	  scope.current.players.splice(0, scope.current.players.length);
	  angular.forEach(hist.players, function(record, i) {
		scope.current.players.push(angular.copy(record));
	  });
	  // 現在の状態から人数が変わらない場合、ポインタ保持して内容を入替
	} else {
	  angular.forEach(hist.players, function(record, i) {
		angular.forEach(scope.current.players[i], function(value, key) {
		  delete scope.current.players[i][key];
		});
		angular.forEach(hist.players[i], function(value, key) {
		  scope.current.players[i][key] = value;
		});
	  });
	}
  };

  /*****************************************************************************
   * 得点の編集画面を表示する
   * @param {object} scope - $scope
   ****************************************************************************/
  qCommonService.editCurrent = function(scope) {
	var modal = $modal.open({
	  templateUrl : "modal.html",
	  scope : scope
	});
	modal.result.then(function() {
	  // 従属変数の再計算
	  scope.calc();
	  qCommonService.createHist(scope);
	}, function() {
	  // 従属変数の再計算
	  scope.calc();
	  qCommonService.createHist(scope);
	})
  }

  return qCommonService;
} ]);
