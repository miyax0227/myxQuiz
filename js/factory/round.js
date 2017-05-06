'use strict';

var appName = "myxQuiz";
var app = angular.module(appName);

/*******************************************************************************
 * round - ラウンド特有のクイズのルール・画面操作の設定
 ******************************************************************************/
app.factory('round', [
	'qCommon',
	'rule',
	function(qCommon, rule) {

	  var round = {};
	  var win = qCommon.win;
	  var lose = qCommon.lose;
	  round.calc = calc;
	  round.actions = rule.actions;
	  round.global_actions = rule.global_actions;
	  round.items = rule.items;
	  round.head = rule.head;

	  function judgement(players, header, property) {
		return rule.judgement(players, header, property);
	  }

	  function calc(players, items, property) {
		angular.forEach(items.filter(function(item) {
		  return item.hasOwnProperty('order');
		}), function(record, i) {
		  var calcPlayers = [];
		  angular.forEach(players, function(player, i) {
			calcPlayers.push(player);
		  });
		  calcPlayers.sort(qCommon.playerSortOn(record.order, true, players))
			  .map(function(player, i) {
				player[record.key] = i;
			  });

		});

		rule.calc(players, items, property);
	  }
	  /*************************************************************************
	   * actions - プレイヤー毎に設定する操作の設定
	   ************************************************************************/
	  Array.prototype.push
		  .apply(round.actions,
			  [
				  /*************************************************************
				   * 強制勝抜(プレーオフ時)
				   ************************************************************/
				  {
					name : "",
					css : "action_win",
					button_css : "btn btn-primary btn-sm",
					enable0 : function(player, players, header) {
					  return ([ "normal", "wait", "absent" ]
						  .indexOf(player.status) >= 0 && header.playoff);
					},
					action0 : function(player, players, header) {
					  qCommon.win(player, players);
					  header.qCount++;
					}
				  },
				  /*************************************************************
				   * 強制失格(プレーオフ時)
				   ************************************************************/
				  {
					name : "",
					css : "action_lose",
					button_css : "btn btn-danger btn_sm",
					enable0 : function(player, players, header) {
					  return ([ "normal", "wait", "absent" ]
						  .indexOf(player.status) >= 0 && header.playoff);
					},
					action0 : function(player, players, header) {
					  lose(player, players);
					  header.qCount++;
					}
				  },
				  /*************************************************************
				   * 強制待機(プレーオフ時)
				   ************************************************************/
				  {
					name : "",
					css : "action_wait",
					button_css : "btn btn-warning btn_sm",
					enable0 : function(player, players, header) {
					  return ([ "normal", "wait", "absent" ]
						  .indexOf(player.status) >= 0 && header.playoff);
					},
					action0 : function(player, players, header) {
					  player.status = "wait";
					  header.qCount++;
					}
				  } ]);

	  /*************************************************************************
	   * global_actions - 全体に対する操作の設定
	   ************************************************************************/
	  Array.prototype.push.apply(round.global_actions, [
	  /*************************************************************************
	   * 表示
	   ************************************************************************/
	  {
		name : "view",
		button_css : "btn btn-danger",
		enable : function(scope) {
		  return true;
		},
		action : function(scope) {
		  qCommon.openWindow(scope.windowSize);
		}
	  },
	  /*************************************************************************
	   * 編集
	   ************************************************************************/
	  {
		name : "edit",
		button_css : "btn btn-danger",
		enable : function(scope) {
		  return true;
		},
		action : function(scope) {
		  qCommon.editCurrent(scope);
		}
	  },
	  /*************************************************************************
	   * アンドゥ
	   ************************************************************************/
	  {
		name : "undo",
		button_css : "btn btn-danger",
		enable : function(scope) {
		  return (scope.history.length >= 2);
		},
		action : function(scope) {
		  if (scope.history.length > 0) {
			// redo用の配列に現在の状態を退避
			scope.redoHistory.push(angular.copy(scope.history.pop()));
			// 履歴から最新の状態を取得
			var hist = scope.history[scope.history.length - 1];
			// 状態を更新
			qCommon.refreshCurrent(hist, scope);
		  }
		}
	  },
	  /*************************************************************************
	   * リドゥ
	   ************************************************************************/
	  {
		name : "redo",
		button_css : "btn btn-danger",
		enable : function(scope) {
		  return (scope.redoHistory.length > 0);
		},
		action : function(scope) {
		  if (scope.redoHistory.length > 0) {
			// redo用の配列から最新の状態を取得
			var hist = scope.redoHistory.pop();
			// 状態を更新
			qCommon.refreshCurrent(hist, scope);
			// 履歴に現在の状態を退避
			scope.history.push(angular.copy(scope.current));
			scope.currentPage = scope.history.length;
		  }
		}
	  } ]);
	  /*
	   * , ここから↓は工事中 { name : "normal", button_css : "btn btn-warning", enable :
	   * function() { return (header.playoff); }, action : function() {
	   * header.playoff = false; players.filter(function(player) { return
	   * (player.status == "wait"); }).map(function(player) { player.status =
	   * "normal"; calc(); }); } }, { name : "playoff", button_css : "btn
	   * btn-warning", enable : function() { return (!header.playoff); }, action :
	   * function() { header.playoff = true; calc(); } }, { name : "position",
	   * button_css : "btn btn-info", enable : function() { return
	   * (header.orderMode != "position"); }, action : function() {
	   * header.orderMode = "position"; } }, { name : "priority", button_css :
	   * "btn btn-info", enable : function() { return (header.orderMode !=
	   * "priority"); }, action : function() { header.orderMode = "priority"; } }, {
	   * name : "judge-upper", button_css : "btn btn-danger", enable :
	   * function() { return (!header.playoff); }, action : function() { var
	   * priority = "priority"; var borderPlayers = []; var keyPriority =
	   * Math.min.apply(null, players.filter(function(player) { return
	   * (["normal", "wait", "absent"].indexOf(player.status) >= 0);
	   * }).map(function(player) { return player[priority]; })); if (keyPriority
	   * === null) { return; } var keyPriorityPlayer =
	   * players.filter(function(player) { return (player[priority] ==
	   * keyPriority); })[0]; borderPlayers = players.filter(function(player) {
	   * return (["normal", "wait", "absent"].indexOf(player.status) >= 0);
	   * }).filter(function(player) { return
	   * (qCommon.playerSortOn($scope.items.filter(function(item) { return
	   * (item.key == priority); })[0].order,false,$scope)(keyPriorityPlayer,
	   * player) == 0); }); if (borderPlayers.length == 1) {
	   * win(borderPlayers[0]); qCommon.createHist($scope); } else if
	   * (borderPlayers.length >= 2) { players.filter(function(player) { return
	   * (["normal", "wait", "absent"].indexOf(player.status) >= 0);
	   * }).map(function(player) { if (borderPlayers.indexOf(player) < 0) {
	   * player.status = "wait"; } }); header.playoff = true;
	   * qCommon.createHist($scope); } } }, { name : "judge-lower", button_css :
	   * "btn btn-danger", enable : function() { return (!header.playoff); },
	   * action : function() { var priority = "priority"; var borderPlayers =
	   * []; var keyPriority = Math.max.apply(null,
	   * players.filter(function(player) { return (["normal", "wait",
	   * "absent"].indexOf(player.status) >= 0); }).map(function(player) {
	   * return player[priority]; })); if (keyPriority === null) { return; } var
	   * keyPriorityPlayer = players.filter(function(player) { return
	   * (player[priority] == keyPriority); })[0]; borderPlayers =
	   * players.filter(function(player) { return (["normal", "wait",
	   * "absent"].indexOf(player.status) >= 0); }).filter(function(player) {
	   * return (qCommon.playerSortOn($scope.items.filter(function(item) {
	   * return (item.key == priority);
	   * })[0].order,false,$scope)(keyPriorityPlayer, player) == 0); }); if
	   * (borderPlayers.length == 1) { lose(borderPlayers[0]);
	   * qCommon.createHist($scope); } else if (borderPlayers.length >= 2) {
	   * players.filter(function(player) { return (["normal", "wait",
	   * "absent"].indexOf(player.status) >= 0); }).map(function(player) { if
	   * (borderPlayers.indexOf(player) < 0) { player.status = "wait"; } });
	   * header.playoff = true; qCommon.createHist($scope); } } }
	   */

	  /*************************************************************************
	   * actions - プレイヤー毎に設定する操作の設定(ラッピング)
	   ************************************************************************/
	  round.actions
		  .map(function(action) {
			action.enable = function(player, scope) {
			  return action.enable0(player, scope.current.players,
				  scope.current.header, scope.property);
			};
			action.action = function(player, scope) {
			  action.action0(player, scope.current.players,
				  scope.current.header, scope.property);
			  // 再計算
			  calc(scope.current.players, scope.items, scope.property);
			  // 勝抜・敗退判定
			  judgement(scope.current.players, scope.current.header,
				  scope.property);
			  // 再計算
			  calc(scope.current.players, scope.items, scope.property);
			  // 履歴作成
			  qCommon.createHist(scope);
			};
		  });

	  /*************************************************************************
	   * global_actions - 全体に対する操作の設定(ラッピング)
	   ************************************************************************/
	  round.global_actions.map(function(global_action) {
		if (angular.isUndefined(global_action.enable)) {
		  global_action.enable = function(scope) {
			return global_action.enable0(scope.current.players,
				scope.current.header, scope.property);
		  };
		}
		if (angular.isUndefined(global_action.action)) {
		  global_action.action = function(scope) {
			global_action.action0(scope.current.players, scope.current.header,
				scope.property);
			// 再計算
			calc(scope.current.players, scope.items, scope.property);
			// 勝抜・敗退判定
			judgement(scope.current.players, scope.current.header,
				scope.property);
			// 再計算
			calc(scope.current.players, scope.items, scope.property);
			// 履歴作成
			qCommon.createHist(scope);
		  };
		}
	  });

	  return round;
	} ]);
