'use strict';

// Electronのモジュール
const electron = require("electron");

// アプリケーションをコントロールするモジュール
const app = electron.app;

// ウィンドウを作成するモジュール
const BrowserWindow = electron.BrowserWindow;

// メインウィンドウはGCされないようにグローバル宣言
let mainWindow;
//let subWindow;

// 全てのウィンドウが閉じたら終了
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// Electronの初期化完了後に実行
app.on('ready', function() {
	
  // メイン画面の表示。ウィンドウの幅、高さを指定できる
  mainWindow = new BrowserWindow({width: 1024, height: 768, x:0, y:0});
  // デバッグ時
  // mainWindow.toggleDevTools();
  mainWindow.loadURL('file://' + __dirname + '/round/03_7o3x/board.html');

  // メイン画面の表示。ウィンドウの幅、高さを指定できる
  //subWindow = new BrowserWindow({width: 1024, height: 768, x:1368, y:0, name:"view"});
  // デバッグ時
  // subWindow.toggleDevTools();
  //subWindow.loadURL('file://' + __dirname + '/board.html?view=true');
  
  // ウィンドウが閉じられたらアプリも終了
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
