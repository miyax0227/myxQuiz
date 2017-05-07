'use strict';

// Electronのモジュール
const
electron = require("electron");

// アプリケーションをコントロールするモジュール
const
app = electron.app;

// ウィンドウを作成するモジュール
const
BrowserWindow = electron.BrowserWindow;

// メインウィンドウはGCされないようにグローバル宣言
let
mainWindow;

// 全てのウィンドウが閉じたら終了
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
	app.quit();
  }
});

// Electronの初期化完了後に実行
app.on('ready', function() {
  var fs = require('fs');
  var data = JSON.parse(fs.readFileSync(__dirname + '/json/window.json', 'utf-8'));

  // メイン画面の表示。ウィンドウの幅、高さを指定できる
  mainWindow = new BrowserWindow({
	width : data[1].width,
	height : data[1].height,
	x : data[1].left,
	y : data[1].top
  });

  mainWindow.loadURL(__dirname + '/index.html');
  // ウィンドウが閉じられたらアプリも終了
  mainWindow.on('closed', function() {
	mainWindow = null;

  });

});
