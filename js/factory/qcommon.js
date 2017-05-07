'use strict';

var appName = "myxQuiz";
var app = angular.module(appName);

/*******************************************************************************
 * qCommon - クイズのルールに依存しない共通関数をまとめたservice
 * 
 * @class
 * @name qCommon
 ******************************************************************************/
app
	.service(
		'qCommon',
		[
			'$modal',
			'$localStorage',
			'$interval',
			'$location',
			'$window',
			function($modal, $localStorage, $interval, $location, $window) {

			  var qCommonService = {};
			  qCommonService.createHist = createHist;
			  qCommonService.addPlayer = addPlayer;
			  qCommonService.removePlayer = removePlayer;
			  qCommonService.win = win;
			  qCommonService.lose = lose;
			  qCommonService.decode = decode;
			  qCommonService.playerSortOn = playerSortOn;
			  qCommonService.refreshCurrent = refreshCurrent;
			  qCommonService.editCurrent = editCurrent;
			  qCommonService.saveToStorage = saveToStorage;
			  qCommonService.viewMode = viewMode;
			  qCommonService.openWindow = openWindow;
			  qCommonService.getDefaultHeader = getDefaultHeader;
			  qCommonService.getPlayerCSS = getPlayerCSS;
			  qCommonService.getItemCSS = getItemCSS;
			  qCommonService.getRankColorCSS = getRankColorCSS;
			  qCommonService.resizeWindow = resizeWindow;
			  qCommonService.adjustWindow = adjustWindow;
			  return qCommonService;

			  /*****************************************************************
			   * ログ文字列を生成する
			   * 
			   * @memberOf qCommon
			   * @param {Object} scope - $scope
			   ****************************************************************/
			  function getLog(scope) {
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
			  }

			  /*****************************************************************
			   * 履歴を作成する
			   * 
			   * @memberOf qCommon
			   * @param {Object} scope - $scope
			   ****************************************************************/
			  function createHist(scope) {
				// historyの末尾にcurrentのコピーを追加
				scope.history.push(angular.copy(scope.current));
				// currentPageをhistoryの末尾に設定
				scope.currentPage = scope.history.length;
				// redoHistoryを初期化
				scope.redoHistory = [];
				// ログ出力
				try {
				  var fs = require('fs');
				  fs.appendFile(__dirname + '/test.txt', getLog(scope) + "\n");
				  fs.writeFile(__dirname + '/current.json', angular
					  .toJson(scope.current));
				} catch (e) {
				  console.log('fs is not supported.');
				}
			  }

			  /*****************************************************************
			   * playerを追加する
			   * 
			   * @memberOf qCommon
			   * @param {number} index - 追加する位置
			   * @param {Object} scope - $scope
			   ****************************************************************/
			  function addPlayer(index, scope) {
				var player = {};
				// playerにitemの初期値を設定
				angular.forEach(scope.items, function(record, i) {
				  player[record.key] = record.value;
				});
				// players内のindexで指定した位置にplayerを追加
				scope.current.players.splice(index, 0, player);
				// 再計算
				scope.calc();
			  }

			  /*****************************************************************
			   * playerを勝抜処理する
			   * 
			   * @memberOf qCommon
			   * @param {Object} player - 勝ち抜けたプレイヤー
			   * @param {Object} players - players
			   ****************************************************************/
			  function win(player, players) {
				/* rank算出 */
				var rank = players.filter(function(item) {
				  return (item.status == 'win');
				}).length + 1;
				player.rank = rank;
				/* status */
				player.status = "win";
			  }

			  /*****************************************************************
			   * playerを失格処理する
			   * 
			   * @memberOf qCommon
			   * @param {Object} player - 勝ち抜けたプレイヤー
			   * @param {Object} players - players
			   ****************************************************************/
			  function lose(player, players) {
				/* rank算出 */
				var rank = players.filter(function(item) {
				  return (item.status != 'lose');
				}).length;
				player.rank = rank;
				/* status */
				player.status = "lose";
			  }

			  /*****************************************************************
			   * playerを削除する
			   * 
			   * @memberOf qCommon
			   * @param {number} index - 削除する位置
			   * @param {Object} scope - $scope
			   ****************************************************************/
			  function removePlayer(index, scope) {
				// players内のindexで指定した位置のplayerを削除
				scope.current.players.splice(index, 1);
				// 再計算
				scope.calc();
			  }

			  /*****************************************************************
			   * 値の置換をする
			   * 
			   * @memberof qCommon
			   * @param {string,number} a - 元の文字列/数値
			   * @param {Array. <string,number>} alter - (置換前文字列/数値,
			   *            置換後文字列/数値)*n [,elseの場合の文字列/数値]
			   * @return {string,number} 置換後の文字列/数値
			   ****************************************************************/
			  function decode(a, alter) {
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
			  }

			  /*****************************************************************
			   * playerのソート用関数
			   * 
			   * @memberOf qCommon
			   * @param {Array. <object>} order - key:比較対象属性名
			   *            order:昇順(asc)/降順(desc) alter:置換文字列
			   * @param {boolean} position - 比較結果が同等の場合、初期位置で比較を行うか
			   * @param {object} scope - $scope
			   * @return {function} 評価関数
			   ****************************************************************/
			  function playerSortOn(order, position, players) {
				return function(a, b) {
				  // ループ内のコンテキスト、flgは返却予定値(-1/0/1)
				  var context = {
					flg : 0
				  };
				  // orderの先頭から順にaとbのそれぞれの要素を指定して比較
				  angular
					  .forEach(
						  order,
						  function(record, i) {
							// 返却予定値が0（同値）の場合のみ比較
							if (this.flg == 0) {
							  var aComp = a[record.key];
							  var bComp = b[record.key];
							  // alterが設定されている場合、decodeで値を置換
							  if (record.hasOwnProperty('alter')) {
								aComp = decode(aComp, record.alter);
								bComp = decode(bComp, record.alter);
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
			  }

			  /*****************************************************************
			   * 現在の状態を履歴に反映する（undo,redoで使用）
			   * 
			   * @memberOf qCommon
			   * @param {object} hist - 反映したい1履歴
			   * @param {object} scope - $scope
			   ****************************************************************/
			  function refreshCurrent(hist, scope) {
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
					angular.forEach(scope.current.players[i], function(value,
						key) {
					  delete scope.current.players[i][key];
					});
					angular.forEach(hist.players[i], function(value, key) {
					  scope.current.players[i][key] = value;
					});
				  });
				}
			  }

			  /*****************************************************************
			   * 得点の編集画面を表示する
			   * 
			   * @memberOf qCommon
			   * @param {object} scope - $scope
			   ****************************************************************/
			  function editCurrent(scope) {
				var modal = $modal.open({
				  templateUrl : "../../template/modal.html",
				  scope : scope
				});
				modal.result.then(function() {
				  // 従属変数の再計算
				  scope.calc();
				  createHist(scope);
				}, function() {
				  // 従属変数の再計算a
				  scope.calc();
				  createHist(scope);
				})
			  }

			  /*****************************************************************
			   * localStorageに保存する
			   * 
			   * @memberOf qCommon
			   * @param {object} scope - $scope
			   * @param {boolean} viewMode - 表示モード
			   ****************************************************************/
			  function saveToStorage(scope, viewMode) {
				console.log(getRoundName());
				var defaultObj = {};
				defaultObj[getRoundName()] = {
				  header : {},
				  players : []
				};

				scope.$storage = $localStorage.$default(defaultObj);

				scope.current = scope.$storage[getRoundName()];

				if (viewMode) {
				  var t;
				  t = $interval(function() {
					var hist = $localStorage.$default(defaultObj);
					refreshCurrent(hist[getRoundName()], scope);
				  }, 100)
				}
			  }

			  /*****************************************************************
			   * URLパラメータから表示モードかどうか判定する
			   * 
			   * @memberOf qCommon
			   * @return {boolean} 表示モードの場合はtrue, それ以外はfalse
			   ****************************************************************/
			  function viewMode() {
				return $location.search()["view"] == "true";
			  }

			  /*****************************************************************
			   * パスからラウンド名を取得する
			   * 
			   * @memberOf qCommon
			   * @return {string} ラウンド名
			   ****************************************************************/
			  function getRoundName() {
				var pathArray = $location.path().split("/");
				return pathArray[pathArray.length - 2];
			  }

			  /*****************************************************************
			   * サブウィンドウを開く
			   * 
			   * @memberOf qCommon
			   * @param {object} windowSize - windowSize
			   ****************************************************************/
			  function openWindow(windowSize) {
				var parameter = "";
				parameter += 'width=' + windowSize.width;
				parameter += ',height=' + windowSize.height;
				parameter += ',left=' + windowSize.left;
				parameter += ',top=' + windowSize.top;
				parameter += ',frame=no'

				$window.open('board.html?view=true',
					getRoundName() + ' - view', parameter);
			  }

			  /*****************************************************************
			   * ウィンドウサイズ変更を検知する関数
			   * 
			   * @memberOf qCommon
			   * @param {object} scope - scope
			   ****************************************************************/
			  function resizeWindow(scope) {
				/*
				 * angular.element($window).bind( 'resize',adjustWindow(scope));
				 */
			  }

			  /*****************************************************************
			   * ウィンドウサイズ変更に追従してzoomを変更する関数
			   * 
			   * @memberOf qCommon
			   * @param {object} scope - scope
			   ****************************************************************/
			  function adjustWindow(scope) {
				document.body.style.zoom = Math.min(
					$window.innerWidth / scope.windowSize.width,
					$window.innerHeight / scope.windowSize.height);
			  }

			  /*****************************************************************
			   * header.jsonに記載されたデフォルトのheaderを取得する
			   * 
			   * @memberOf qCommon
			   * @param {object} header.jsonをパースした状態のオブジェクト
			   * @return {object} ヘッダ情報
			   ****************************************************************/
			  function getDefaultHeader(headerObj) {
				var header = {};
				headerObj.map(function(record) {
				  header[record.key] = record.value;
				});
				return header;
			  }

			  /*****************************************************************
			   * playerの表示位置を示すCSSを取得する
			   * 
			   * @memberOf qCommon
			   * @param [Array] players 全プレイヤー情報
			   * @param {object} player プレイヤー
			   * @return {object} CSSオブジェクト
			   ****************************************************************/
			  function getPlayerCSS(players, player, windowSize) {
				var leftBorder = 0;
				var rightBorder = windowSize.width;

				var playerLeft = leftBorder + (rightBorder - leftBorder) / (players.length) * (player["position"] + 0.5);
				var playerTop = windowSize.height / 2;

				return {
				  position : 'absolute',
				  left : playerLeft + 'px',
				  top : playerTop + 'px',
				  'z-index' : player["position"] - players.length
				};
			  }

			  /*****************************************************************
			   * 伸縮が必要なアイテムのCSS情報を取得する
			   * 
			   * @memberOf qCommon
			   * @param {object} item アイテム情報
			   * @param {object} length 文字列長
			   * @return {object} CSSオブジェクト
			   ****************************************************************/
			  function getItemCSS(item, length) {
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
			  }

			  /*****************************************************************
			   * 値により背景色が変わるアイテムのCSS情報を取得する（主に予選順位用）
			   * 
			   * @memberOf qCommon
			   * @param {object} item アイテム情報
			   * @param {object} rank 順位
			   * @return {object} CSSオブジェクト
			   ****************************************************************/
			  function getRankColorCSS(item, rank) {
				if (item.hasOwnProperty('rankColor')) {
				  return {
					'backgroundColor' : 'rgb(' + item.rankColor
						.filter(function(element) {
						  return element.maxRank >= rank
						})[0].color + ')'
				  };
				}
				return null;
			  }

			} ]);
