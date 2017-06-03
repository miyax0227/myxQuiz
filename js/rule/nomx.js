'use strict';

var appName = "myxQuiz";
var app = angular.module(appName);

/*******************************************************************************
 * rule - ラウンド特有のクイズのルール・画面操作の設定
 ******************************************************************************/
app.factory('rule', [ 'qCommon', function(qCommon) {

  var rule = {};
  var win = qCommon.win;
  var lose = qCommon.lose;
  var setMotion = qCommon.setMotion;
  var addQCount = qCommon.addQCount;

  rule.judgement = judgement;
  rule.calc = calc;

  /*****************************************************************************
   * header - ルール固有のヘッダ
   ****************************************************************************/
  rule.head = [ {
	key : "mode",
	value : "position",
	style : "string"
  } ];

  /*****************************************************************************
   * items - ルール固有のアイテム
   ****************************************************************************/
  rule.items = [ {
	key : "o",
	value : 0,
	style : "number",
	css : "o"
  }, {
	key : "x",
	value : 0,
	style : "number",
	css : "x",
	invisibleWhenZeroOrNull : true
  }, {
	key : "position",
	order : []
  }, {
	key : "priority",
	order : [ {
	  key : "status",
	  order : "desc",
	  alter : [ "win", 1, 0 ]
	}, {
	  key : "o",
	  order : "desc"
	}, {
	  key : "x",
	  order : "asc"
	} ]
  } ];

  /*****************************************************************************
   * actions - プレイヤー毎に設定する操作の設定
   ****************************************************************************/
  rule.actions = [
  /*****************************************************************************
   * 正解時
   ****************************************************************************/
  {
	name : "○",
	css : "action_o",
	button_css : "btn btn-primary btn-lg",
	keyArray : "k1",
	enable0 : function(player, players, header, property) {
	  return (player.status == "normal" && !header.playoff);
	},
	action0 : function(player, players, header, property) {
	  setMotion(player, "o");
	  player.o++;
	  addQCount(players, header);
	}
  },
  /*****************************************************************************
   * 誤答時
   ****************************************************************************/
  {
	name : "×",
	css : "action_x",
	button_css : "btn btn-danger btn-lg",
	keyArray : "k2",
	enable0 : function(player, players, header) {
	  return (player.status == "normal" && !header.playoff);
	},
	action0 : function(player, players, header, property) {
	  setMotion(player, "x");
	  player.x++;
	  if (property.penalty > 0) {
		player.absent = property.penalty;
		player.status = "preabsent";
	  }
	  addQCount(players, header);
	}
  } ];

  /*****************************************************************************
   * global_actions - 全体に対する操作の設定
   ****************************************************************************/
  rule.global_actions = [
  /*****************************************************************************
   * スルー
   ****************************************************************************/
  {
	name : "thru",
	button_css : "btn btn-default",
	group : "rule",
	keyboard : "Space",
	enable0 : function(players, header) {
	  return true;
	},
	action0 : function(players, header) {
	  addQCount(players, header);
	}
  } ];

  /*****************************************************************************
   * judgement - 操作終了時等の勝敗判定
   * 
   * @param {Array} players - players
   * @param {Object} header - header
   * @param {Object} property - property
   ****************************************************************************/
  function judgement(players, header, property) {
	angular.forEach(players.filter(function(item) {
	  /* rankがない人に限定 */
	  return (item.rank == 0);
	}), function(player, i) {
	  /* win条件 */
	  if (player.o >= property.winningPoint) {

		win(player, players);
		player.o = property.winningPoint;
	  }
	  /* lose条件 */
	  if (player.x >= property.losingPoint) {
		lose(player, players);
		player.x = property.losingPoint;
	  }
	});
  }

  /*****************************************************************************
   * calc - 従属変数の計算をする
   * 
   * @param {Array} players - players
   * @param {Object} items - items
   ****************************************************************************/
  function calc(players, header, items, property) {
	angular.forEach(players, function(player, index) {
	  if (player.name == "") {
		player.name = property.defaultName;
	  }
	  // キーボード入力時の配列の紐付け ローリング等の特殊形式でない場合はこのままでOK
	  player.keyIndex = index;
	});
  }

  return rule;
} ]);
