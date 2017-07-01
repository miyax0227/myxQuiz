'use strict';

var appName = "myxQuizMain";
var app = angular.module(appName);

/*******************************************************************************
 * qCommon - クイズのルールに依存しない共通関数をまとめたservice
 * 
 * @class
 * @name qCommon
 ******************************************************************************/
app

.service('qCommon', [ '$uibModal', '$localStorage', '$interval', '$location', '$window', '$filter',
	function($uibModal, $localStorage, $interval, $location, $window, $filter) {

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
	  qCommonService.addQCount = addQCount;
	  qCommonService.getDisplayValue = getDisplayValue;
	  qCommonService.setMotion = setMotion;
	  qCommonService.keyDown = keyDown;
	  qCommonService.getHistoryFileName = getHistoryFileName;
	  qCommonService.initPlayers = initPlayers;
	  qCommonService.getTimer = getTimer;
	  qCommonService.timerStart = timerStart;
	  qCommonService.victoryName = victoryName;
	  qCommonService.changePlayer = changePlayer;
	  qCommonService.filterPlayer = filterPlayer;
	  qCommonService.setPlayer = setPlayer;
	  qCommonService.clearPlayer = clearPlayer;
	  qCommonService.sortPlayer = sortPlayer;
	  qCommonService.playoffoff = playoffoff;
	  qCommonService.editTweet = editTweet;
	  return qCommonService;

	  /*************************************************************************
	   * ログ文字列を生成する
	   * 
	   * @memberOf qCommon
	   * @param {Object} scope - $scope
	   ************************************************************************/
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

	  /*************************************************************************
	   * 履歴を作成する
	   * 
	   * @memberOf qCommon
	   * @param {object} scope - $scope
	   ************************************************************************/
	  function createHist(scope) {
		// ツイート内容編集
		var tweet = constructTweet(scope, scope.current.header.tweets);
		// tweets初期化
		scope.current.header.tweets = [];
		
		// historyの末尾にcurrentのコピーを追加
		scope.history.push(angular.copy(scope.current));
		// currentPageをhistoryの末尾に設定
		scope.currentPage = scope.history.length;
		// redoHistoryを初期化
		scope.redoHistory = [];

		try {
		  var fs = require('fs');
		  // ログ出力
		  fs.writeFile(getHistoryFileName(), angular.toJson(scope.current));
		  // ツイート出力
		  fs.writeFile(getTweetFileName(), tweet);

		} catch (e) {
		  console.log('fs is not supported.');
		}
	  }
	  
	  /*************************************************************************
	   * ツイート内容を最終的に編集する
	   * 
	   * @memberOf qCommon
	   * @param {Object} scope - $scope
	   * @param {array} tweets - 連携したいツイート（リスト形式）
	   * @return {string} 編集したツイート内容
	   ************************************************************************/
	  function constructTweet(scope, tweets) {
		function dateString() {
		  return $filter('date')(new Date(), 'HH:mm:ss');
		}

		var tweet = "";
		tweet += scope.property.tweetCupTitle || "";
		tweet += scope.property.tweetRoundTitle || "";
		tweet += "\n";
		tweet += tweets.join("\n");
		tweet += "\n";
		tweet += " - " + dateString();
		
		return tweet;
		
	  }
	  
	  /*************************************************************************
	   * playerを追加する
	   * 
	   * @memberOf qCommon
	   * @param {number} index - 追加する位置
	   * @param {Object} scope - $scope
	   ************************************************************************/
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

	  /*************************************************************************
	   * playerを勝抜処理する
	   * 
	   * @memberOf qCommon
	   * @param {Object} player - 勝ち抜けたプレイヤー
	   * @param {Object} players - players
	   ************************************************************************/
	  function win(player, players, header, property) {
		/* rank算出 */
		var rank = players.filter(function(item) {
		  return (item.status == 'win');
		}).length + 1;
		player.rank = rank;
		/* status */
		player.status = "win";
		/* 休みを消す */
		player.absent = 0;
		/* tweet */
		editTweet(header.tweets, property.tweet["win"], player, false);
	  }

	  /*************************************************************************
	   * playerを失格処理する
	   * 
	   * @memberOf qCommon
	   * @param {Object} player - 勝ち抜けたプレイヤー
	   * @param {Object} players - players
	   ************************************************************************/
	  function lose(player, players, header, property) {
		/* rank算出 */
		var rank = players.filter(function(item) {
		  return (item.status != 'lose');
		}).length;
		player.rank = rank;
		/* status */
		player.status = "lose";
		/* 休みを消す */
		player.absent = 0;
		/* tweet */
		editTweet(header.tweets, property.tweet["lose"], player, false);

	  }

	  /*************************************************************************
	   * playerを削除する
	   * 
	   * @memberOf qCommon
	   * @param {number} index - 削除する位置
	   * @param {Object} scope - $scope
	   ************************************************************************/
	  function removePlayer(index, scope) {
		// players内のindexで指定した位置のplayerを削除
		scope.current.players.splice(index, 1);
		// 再計算
		scope.calc();
	  }

	  /*************************************************************************
	   * 値の置換をする
	   * 
	   * @memberof qCommon
	   * @param {string,number} a - 元の文字列/数値
	   * @param {Array. <string,number>} alter - (置換前文字列/数値, 置換後文字列/数値)*n
	   *            [,elseの場合の文字列/数値]
	   * @return {string,number} 置換後の文字列/数値
	   ************************************************************************/
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

	  /*************************************************************************
	   * playerのソート用関数
	   * 
	   * @memberOf qCommon
	   * @param {object[]} order - key:比較対象属性名 order:昇順(asc)/降順(desc)
	   *            alter:置換文字列
	   * @param {boolean} position - 比較結果が同等の場合、初期位置で比較を行うか
	   * @param {object} scope - $scope
	   * @return {function} 評価関数
	   ************************************************************************/
	  function playerSortOn(order, position, players) {
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

	  /*************************************************************************
	   * 現在の状態を履歴に反映する（undo,redoで使用）
	   * 
	   * @memberOf qCommon
	   * @param {object} hist - 反映したい1履歴
	   * @param {object} scope - $scope
	   ************************************************************************/
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
			angular.forEach(scope.current.players[i], function(value, key) {
			  delete scope.current.players[i][key];
			});
			angular.forEach(hist.players[i], function(value, key) {
			  scope.current.players[i][key] = value;
			});
		  });
		}
	  }

	  /*************************************************************************
	   * 得点の編集画面を表示する
	   * 
	   * @memberOf qCommon
	   * @param {object} scope - $scope
	   ************************************************************************/
	  function editCurrent(scope) {
		scope.workKeyDown = false;
		var modal = $uibModal.open({
		  templateUrl : "../../template/modal.html",
		  scope : scope,
		  controller : "modal"
		});

		modal.result.then(function() {
		  // 従属変数の再計算
		  scope.calc();
		  createHist(scope);
		  scope.workKeyDown = true;
		}, function() {
		  // 従属変数の再計算a
		  scope.calc();
		  createHist(scope);
		  scope.workKeyDown = true;
		})
	  }

	  /*************************************************************************
	   * localStorageに保存する
	   * 
	   * @memberOf qCommon
	   * @param {object} scope - $scope
	   * @param {boolean} viewMode - 表示モード
	   ************************************************************************/
	  function saveToStorage(scope, viewMode) {
		var defaultObj = {};
		defaultObj[getRoundName()] = {
		  header : {},
		  players : [],
		  timer : {}
		};

		scope.$storage = $localStorage.$default(defaultObj);
		scope.current = {};
		scope.current.header = scope.$storage[getRoundName()].header;
		scope.current.players = scope.$storage[getRoundName()].players;
		scope.timer = {};
		scope.timer = scope.$storage[getRoundName()].timer;

		if (viewMode) {
		  // localStorage内ではdate型を扱えないので変換
		  if (scope.timer['destination'] != null) {
			scope.timer['destination'] = new Date(scope.timer['destination']);
		  }
		  if (scope.timer['restTime'] != null) {
			scope.timer['restTime'] = new Date(scope.timer['restTime']);
		  }

		  angular.element($window).bind('storage', function(event) {
			var hist = $localStorage.$default(defaultObj);
			refreshCurrent(hist[getRoundName()], scope);
			scope.timer = scope.$storage[getRoundName()].timer;

			// localStorage内ではdate型を扱えないので変換
			if (scope.timer['destination'] != null) {
			  scope.timer['destination'] = new Date(scope.timer['destination']);
			}
			if (scope.timer['restTime'] != null) {
			  scope.timer['restTime'] = new Date(scope.timer['restTime']);
			}
		  });
		}
	  }

	  /*************************************************************************
	   * URLパラメータから表示モードかどうか判定する
	   * 
	   * @memberOf qCommon
	   * @return {boolean} 表示モードの場合はtrue, それ以外はfalse
	   ************************************************************************/
	  function viewMode() {
		return $location.search()["view"] == "true";
	  }

	  /*************************************************************************
	   * パスからラウンド名を取得する
	   * 
	   * @memberOf qCommon
	   * @return {string} ラウンド名
	   ************************************************************************/
	  function getRoundName() {
		var pathArray = $location.path().split("/");
		return pathArray[pathArray.length - 2];
	  }

	  /*************************************************************************
	   * サブウィンドウを開く
	   * 
	   * @memberOf qCommon
	   * @param {object} windowSize - windowSize
	   ************************************************************************/
	  function openWindow(windowSize) {
		var parameter = "";
		parameter += 'width=' + windowSize.width;
		parameter += ',height=' + windowSize.height;
		parameter += ',left=' + windowSize.left;
		parameter += ',top=' + windowSize.top;
		parameter += ',frame=no'

		$window.open('board.html?view=true', getRoundName() + ' - view', parameter);
	  }

	  /*************************************************************************
	   * ウィンドウサイズ変更を検知する関数
	   * 
	   * @memberOf qCommon
	   * @param {object} scope - scope
	   ************************************************************************/
	  function resizeWindow(scope) {
		angular.element($window).bind('resize', function(event) {
		  adjustWindow(scope);
		});

	  }

	  /*************************************************************************
	   * ウィンドウサイズ変更に追従してzoomを変更する関数
	   * 
	   * @memberOf qCommon
	   * @param {object} scope - scope
	   ************************************************************************/
	  function adjustWindow(scope) {
		var widthRatio = $window.innerWidth / scope.windowSize.width;
		var heightRatio = $window.innerHeight / scope.windowSize.height;
		document.body.style.zoom = Math.min(widthRatio, heightRatio);
	  }

	  /*************************************************************************
	   * header.jsonに記載されたデフォルトのheaderを取得する
	   * 
	   * @memberOf qCommon
	   * @param {object} header.jsonをパースした状態のオブジェクト
	   * @return {object} ヘッダ情報
	   ************************************************************************/
	  function getDefaultHeader(headerObj) {
		var header = {};
		headerObj.map(function(record) {
		  header[record.key] = record.value;
		});
		return header;
	  }

	  /*************************************************************************
	   * playerの表示位置を示すCSSを取得する
	   * 
	   * @memberOf qCommon
	   * @param [Array] players 全プレイヤー情報
	   * @param {object} player プレイヤー
	   * @return {object} CSSオブジェクト
	   ************************************************************************/
	  function getPlayerCSS(players, player, windowSize) {
		var leftBorder = 0;
		var rightBorder = windowSize.width;
		var playersWidth = rightBorder - leftBorder;
		var count = players.length;
		var position = player["position"];

		var playerLeft = leftBorder + playersWidth / count * (position + 0.5);
		var playerTop = windowSize.height / 2;

		return {
		  position : 'absolute',
		  left : playerLeft + 'px',
		  top : playerTop + 'px',
		  'z-index' : player["position"] - players.length
		};
	  }

	  /*************************************************************************
	   * 伸縮が必要なアイテムのCSS情報を取得する
	   * 
	   * @memberOf qCommon
	   * @param {object} item アイテム情報
	   * @param {object} length 文字列長
	   * @return {object} CSSオブジェクト
	   ************************************************************************/
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

	  /*************************************************************************
	   * 値により背景色が変わるアイテムのCSS情報を取得する（主に予選順位用）
	   * 
	   * @memberOf qCommon
	   * @param {object} item アイテム情報
	   * @param {object} rank 順位
	   * @return {object} CSSオブジェクト
	   ************************************************************************/
	  function getRankColorCSS(item, rank) {
		if (item.hasOwnProperty('rankColor')) {
		  return {
			'backgroundColor' : 'rgb(' + item.rankColor.filter(function(element) {
			  return element.maxRank >= rank
			})[0].color + ')'
		  };
		}
		return null;
	  }

	  /*************************************************************************
	   * 表示用の値を取得する
	   * 
	   * @memberOf qCommon
	   * @param {object} item item.json等に定義された表示方法
	   * @param {number/string} value 本当の値
	   * @return {string} 表示用の値
	   ************************************************************************/
	  function getDisplayValue(item, value) {
		// nullやゼロの場合表示しない指定がされており、実際の値がnullやゼロの場合
		if (item.hasOwnProperty('invisibleWhenZeroOrNull') && (value == 0 || value == null)) {
		  return "";

		  // 文字の繰り返しが指定されている場合
		} else if (item.hasOwnProperty('repeatChar')) {
		  if (parseInt(value) == null || value == null || value == undefined) {
			value = 0;
		  }
		  return Array(parseInt(value) + 1).join(item.repeatChar);

		  // 普通の場合
		} else {
		  var prefix = "";
		  var suffix = "";
		  if (item.hasOwnProperty('prefix')) {
			prefix = item.prefix;
		  }
		  if (item.hasOwnProperty('suffix')) {
			suffix = item.suffix;
		  }
		  // suffixに'th'が指定されている場合は、valueに応じてst,nd,rdに変換
		  if (suffix == 'th') {
			if ([ 1, 21, 31, 41, 51, 61, 71, 81, 91 ].indexOf(value % 100) >= 0) {
			  suffix = 'st';
			} else if ([ 2, 22, 32, 42, 52, 62, 72, 82, 92 ].indexOf(value % 100) >= 0) {
			  suffix = 'nd';
			} else if ([ 3, 23, 33, 43, 53, 63, 73, 83, 93 ].indexOf(value % 100) >= 0) {
			  suffix = 'rd';
			}
		  }

		  return prefix + value + suffix;
		}
	  }

	  /*************************************************************************
	   * 問題数を進める
	   * 
	   * @memberOf qCommon
	   * @param {object} players プレイヤー情報
	   * @param {object} header ヘッダ情報
	   ************************************************************************/
	  function addQCount(players, header, property) {
		// 問題数を進める
		header.qCount++;
		// 休みの人の対応
		angular.forEach(players, function(player) {
		  if (player.status == "preabsent") {
			player.status = "absent";
		  } else if (player.status == "absent") {
			if (player.absent >= 2) {
			  player.absent--;
			} else {
			  player.absent = 0;
			  player.status = "normal";
			  editTweet(header.tweets, property.tweet["comeback"], player, false);
			}
		  }
		});
	  }

	  /*************************************************************************
	   * モーションを設定する(アニメーションさせるため、motionとmotion2に交互に設定する)
	   * 
	   * @memberOf qCommon
	   * @param {object} player 設定先プレイヤー
	   * @param {object} motion 設定したいmotion
	   ************************************************************************/
	  function setMotion(player, motion) {
		if (player.motion == "") {
		  player.motion = motion;
		  player.motion2 = "";
		} else {
		  player.motion = "";
		  player.motion2 = motion;
		}
	  }

	  /*************************************************************************
	   * keydownイベントのハンドラ
	   * 
	   * @memberOf qCommon
	   * @param {object} scope $scope
	   * @param {object} event $event
	   ************************************************************************/
	  function keyDown(scope, event) {
		// キー押下が有効な場合
		if (scope.workKeyDown) {
		  var key = "";
		  // viewModeの場合は処理終了
		  if (viewMode()) {
			return;
		  }

		  // keyCodeリストにない場合は処理終了
		  if (!scope.keyCode.hasOwnProperty(event.which)) {
			return;
		  }
		  key = scope.keyCode[event.which];
		  // Shiftが同時押しされている場合
		  if (event.shiftKey) {
			key = "S+" + key;
		  }
		  // Ctrlが同時押しされている場合
		  if (event.ctrlKey) {
			key = "C+" + key;
		  }
		  // Altが同時押しされている場合
		  if (event.altKey) {
			key = "A+" + key;
		  }

		  // playerに対する操作
		  // 合致する配列がある場合
		  angular.forEach(scope.keyArray, function(keyArray, keyArrayName) {
			if (keyArray.indexOf(key) >= 0) {
			  var index = keyArray.indexOf(key);

			  // actionsの中に合致するkeyArrayNameがある場合
			  angular.forEach(scope.actions, function(action) {
				if (action.keyArray == keyArrayName) {

				  // playersの中に一致するkeyIndexのplayerがいる場合
				  angular.forEach(scope.current.players, function(player) {
					if (player.keyIndex == index) {
					  // そのplayerのactionが行える状態の場合
					  if (action.enable(player, scope)) {
						// そのplayerのactionを実行
						action.action(player, scope);
					  }
					}
				  })
				}
			  })
			}
		  });

		  // global_actionの操作
		  // global_actionの中に合致するkeyboardがある場合
		  angular.forEach(scope.global_actions, function(action) {
			if (action.keyboard == key) {
			  // そのglobal_actionが行える状態の場合
			  if (action.enable(scope)) {
				// そのglobal_actionを実行
				action.action(scope);
			  }
			}
		  });
		}
	  }

	  /*************************************************************************
	   * 履歴ファイル名の取得
	   * 
	   * @memberOf qCommon
	   * @return {string} 履歴ファイル名
	   ************************************************************************/
	  function getHistoryFileName() {
		return __dirname + '/../../history/current/' + getRoundName() + '.json';
	  }

	  /*************************************************************************
	   * ツイートファイル名の取得
	   * 
	   * @memberOf qCommon
	   * @return {string} ツイートファイル名
	   ************************************************************************/
	  function getTweetFileName() {
		function dateString() {
		  return $filter('date')(new Date(), 'yyyyMMddHHmmss');
		}

		return __dirname + '/../../twitter/' + dateString() + "_" + getRoundName() + '.txt';
	  }

	  /*************************************************************************
	   * プレイヤー情報の補完・初期化
	   * 
	   * @memberOf qCommon
	   * @param {array} players - プレイヤー情報
	   * @param {array} items - アイテム情報
	   * @return {array} 不足していたアイテム情報が付加されたプレイヤー情報
	   ************************************************************************/
	  function initPlayers(players, items) {
		var toPlayers = angular.copy(players);
		angular.forEach(toPlayers, function(player) {
		  angular.forEach(items, function(item) {
			if (!player.hasOwnProperty(item.key) && item.hasOwnProperty('value')) {
			  player[item.key] = item.value;
			}
		  });
		});
		return toPlayers;
	  }

	  /*************************************************************************
	   * タイマー表示
	   * 
	   * @memberOf qCommon
	   * @param {object} scope - $scope
	   * @return {string} timer - 表示用タイマー文字列
	   ************************************************************************/
	  function getTimer(scope) {
		function timerFormat(millisec) {
		  if (millisec >= 60000) {
			// 1分以上の場合、m:ss形式
			return $filter('date')(new Date(millisec), 'm:ss');
		  } else {
			// 1分未満の場合、s.s形式
			return $filter('date')(new Date(millisec), 's.sss').slice(0, -2);
		  }
		}

		if (scope.timer.working) {
		  if (scope.timer.destination == null) {
			// タイマー動作中、目標時刻無しの場合、残り時間を表示
			return timerFormat(scope.timer.restTime);
		  } else {
			if (scope.timer.destination.getTime() - (new Date()).getTime() > 0) {
			  // タイマー動作中、目標時刻有り、現在が目標時刻より前の場合、差分を計算して表示
			  return timerFormat(scope.timer.destination.getTime() - (new Date()).getTime());
			} else {
			  // タイマー動作中、目標時刻有り、現在が目標時刻以降の場合、0秒を表示
			  return timerFormat(0);
			}
		  }
		} else {
		  if (scope.timerRestTime == null) {
			// タイマー停止、残り時間が無い場合、初期時間を表示
			return timerFormat(scope.timer.defaultTime * 1000);
		  } else {
			// タイマー停止、残り時間がある場合、残り時間を表示
			return timerFormat(scope.timer.restTime);
		  }
		}
	  }

	  /*************************************************************************
	   * タイマー表示用タイマー
	   * 
	   * @memberOf qCommon
	   ************************************************************************/
	  function timerStart(scope) {
		var t;
		t = $interval(function() {
		  scope.timerDisplay = getTimer(scope);
		}, 100)
	  }

	  /*************************************************************************
	   * 優勝者名の設定
	   * 
	   * @memberOf qCommon
	   * @param {object} scope - $scope
	   ************************************************************************/
	  function victoryName(scope) {
		if (scope.current.players.filter(function(player) {
		  return player.rank == 1;
		}).length == 1) {
		  return scope.current.players.filter(function(player) {
			return player.rank == 1;
		  })[0].name;
		} else {
		  return null;
		}
	  }

	  /*************************************************************************
	   * プレイヤー変更用のモーダルウィンドウを表示
	   * 
	   * @memberOf qCommon
	   * @param {object} scope - $scope
	   * @param {object} player - 変更したいプレイヤー
	   ************************************************************************/
	  function changePlayer(scope, player) {
		angular.forEach(scope.nameList, function(participant) {
		  participant.filtered = false;
		});

		var modal = $uibModal.open({
		  templateUrl : "../../template/selectPlayer.html",
		  scope : scope,
		  controller : "modal"
		});

		modal.result.then(function() {
		  angular.forEach(scope.selectPlayer, function(value, key) {
			player[key] = value;
		  });
		}, function() {
		})

	  }

	  /*************************************************************************
	   * 参加者フィルタ
	   * 
	   * @memberOf qCommon
	   * @param {object} nameList - 参加者リスト
	   * @param {object} selectPlayer - 検索条件
	   ************************************************************************/
	  function filterPlayer(nameList, selectPlayer) {
		var count = 0;
		var onlyOneParticipant = {};

		angular.forEach(nameList, function(participant) {
		  participant.filtered = false;

		  angular.forEach(selectPlayer, function(value, attribute) {
			if (value != "" && value != null) {
			  var value2 = participant[attribute];

			  if (value2 == null || value2.indexOf(value) == -1) {
				participant.filtered = true;
			  }
			}
		  });

		  if (!participant.filtered) {
			count++;
			onlyOneParticipant = participant;
		  }
		});

		// もし一人に絞れた場合は、selectPlayerに設定
		if (count == 1) {
		  angular.forEach(selectPlayer, function(value, attribute) {
			selectPlayer[attribute] = onlyOneParticipant[attribute];
		  });
		}

	  }

	  /*************************************************************************
	   * プレイヤー選択
	   * 
	   * @memberOf qCommon
	   * @param {object} participant - 参加者(一人)
	   * @param {object} selectPlayer - 検索条件
	   ************************************************************************/
	  function setPlayer(participant, selectPlayer) {
		angular.forEach(selectPlayer, function(value, key) {
		  selectPlayer[key] = participant[key];
		})
	  }

	  /*************************************************************************
	   * プレイヤー検索条件クリア
	   * 
	   * @memberOf qCommon
	   * @param {object} selectPlayer - 検索条件
	   ************************************************************************/
	  function clearPlayer(selectPlayer) {
		angular.forEach(selectPlayer, function(value, key) {
		  selectPlayer[key] = "";
		})
	  }

	  /*************************************************************************
	   * 参加者並び替え
	   * 
	   * @memberOf qCommon
	   * @param {object} selectPlayer - 検索条件
	   ************************************************************************/
	  function sortPlayer(nameList, attribute, order, style) {
		nameList.sort(function(a, b) {
		  var aa;
		  var bb;

		  if (!a.hasOwnProperty(attribute)) {
			return 1;
		  }

		  if (!b.hasOwnProperty(attribute)) {
			return -1;
		  }

		  if (style == "number") {
			aa = Number(a[attribute]);
			bb = Number(b[attribute]);
		  } else {
			aa = a[attribute];
			bb = b[attribute];
		  }

		  if (aa < bb) {
			if (order) {
			  return -1;
			} else {
			  return 1;
			}
		  } else if (aa > bb) {
			if (order) {
			  return 1;
			} else {
			  return -1;
			}
		  } else {
			return 0;
		  }
		});
	  }

	  /*************************************************************************
	   * プレーオフ終了
	   * 
	   * @memberOf qCommon
	   * @param {object} scope - $scope
	   ************************************************************************/
	  function playoffoff(players, header) {
		// プレーオフ終了
		header.playoff = false;

		// 待機状態のプレイヤーを通常状態に戻す
		angular.forEach(players, function(player) {
		  if (player.status == "wait") {
			player.status = "normal";
		  }
		})
	  }

	  /*************************************************************************
	   * ツイート編集
	   * 
	   * @memberOf qCommon
	   * @param {array} tweets - 追加先のツイートリスト
	   * @param {string} tweet - ツイートのひな型
	   * @param {object} obj - ツイートの主体となるプレイヤーまたはプレイヤーリストまたはヘッダ情報
	   * @param {boolean} top - ツイートリストの先頭に追加する場合はtrue, 末尾に追加する場合はfalse
	   ************************************************************************/
	  function editTweet(tweets, tweet, obj, top) {
		// objが指定されていない場合は空オブジェクトを補完
		if (obj == null) {
		  obj = {};
		}

		// topが指定されていない場合はfalse扱いにする
		if (top == null) {
		  top = false;
		}

		// tweet内にある埋め込み文字を置換
		angular.forEach(obj, function(value, key) {
		  var reg = new RegExp("\\$\\{" + key + "\\}", "g");
		  tweet = tweet.replace(reg, value);
		})

		// tweetsに追加
		if (top) {
		  tweets.unshift(tweet);
		} else {
		  tweets.push(tweet);
		}

	  }

	} ]);
