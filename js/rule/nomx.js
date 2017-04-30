'use strict';

var appName = "myxQuiz";
var app = angular.module(appName);

/*******************************************************************************
 * rule - ラウンド特有のクイズのルール・画面操作の設定
 ******************************************************************************/
app.factory('rule', [
	'qCommon',
	function(qCommon) {

	  var rule = {};
	  var win = qCommon.win;
	  var lose = qCommon.lose;

	  /*************************************************************************
	   * judgement - 操作終了時等の勝敗判定
	   * 
	   * @param {Array} players - players
	   * @param {Object} header - header
	   ************************************************************************/
	  function judgement(players, header) {
		angular.forEach(players.filter(function(item) {
		  /* rankがない人に限定 */
		  return (item.rank == 0);
		}), function(player, i) {
		  /* win条件 */
		  if (player.o >= 7) {

			win(player, players);
			player.o = 7;
		  }
		  /* lose条件 */
		  if (player.x >= 5) {
			lose(player, players);
			player.x = 5;
		  }
		});
	  }
	  ;
	  rule.judgement = judgement;

	  /*************************************************************************
	   * calc - 従属変数の計算をする
	   * 
	   * @param {Array} players - players
	   * @param {Object} items - items
	   ************************************************************************/
	  function calc(players, items) {
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
	  }

	  rule.calc = calc;

	  /*************************************************************************
	   * actions - プレイヤー毎に設定する操作の設定
	   ************************************************************************/
	  rule.actions = [
	  /*************************************************************************
	   * 正解時
	   ************************************************************************/
	  {
		name : "o",
		css : "action_o",
		button_css : "btn btn-primary btn-sm",
		enable0 : function(player, players, header) {
		  return (player.status == "normal" && !header.playoff);
		},
		action0 : function(player, players, header) {
		  player.o++;
		  header.qCount++;

		}
	  },
	  /*************************************************************************
	   * 誤答時
	   ************************************************************************/
	  {
		name : "x",
		css : "action_x",
		button_css : "btn btn-danger btn-sm",
		enable0 : function(player, players, header) {
		  return (player.status == "normal" && !header.playoff);
		},
		action0 : function(player, players, header) {
		  player.x = player.x + 2;
		  header.qCount++;
		}
	  } ];

	  /*************************************************************************
	   * global_actions - 全体に対する操作の設定
	   ************************************************************************/
	  rule.global_actions = [
	  /*************************************************************************
	   * スルー
	   ************************************************************************/
	  {
		name : "thru",
		button_css : "btn btn-info",
		enable0 : function(players, header) {
		  return true;
		},
		action0 : function(players, header) {
		  header.qCount++;
		}
	  } ];


	  return rule;
	} ]);
