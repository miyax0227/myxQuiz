'use strict';

/**********************************************************************
 * app - Angularモジュール本体
 **********************************************************************/
var appName = "myxQuiz";
var app = angular.module(appName, ["ngStorage", "ui.bootstrap", "ngAnimate", "ngResource"]);

/**********************************************************************
 * fileResource - 全てのjsonファイルの読込の同期をとるためのfactory
 **********************************************************************/
app.factory('fileResource', function($resource) {
  //読み込むjsonファイルを列挙
  return [
  //header.json - 履歴情報のうち、playerに依らない全体的な情報の定義
  $resource('./json/header.json')
  //rule.json - クイズのルールの中で、可変な値の設定
  , $resource('./json/rule.json')
  //item.json - プレイヤーの属性の定義
  , $resource('./json/item.json')
  ];
});
