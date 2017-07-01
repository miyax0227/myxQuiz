'use strict';

var appName = "myxQuizIndex";
var app = angular.module(appName);

/*******************************************************************************
 * qFile - ファイル操作系の処理をまとめたservice
 * 
 * @class
 * @name qFile
 ******************************************************************************/
app.service('qFile', [ '$window', '$interval', '$filter', function($window, $interval, $filter) {
  const
  fs = require('fs');
  const
  dir = __dirname + '/round';
  const
  remote = require('electron').remote;
  const
  Dialog = remote.dialog;
  const
  browserWindow = remote.BrowserWindow;
  const
  xlsx = require('xlsx');
  const
  shell = require('electron').shell;

  // excel.jsonからウィンドウサイズを取得
  var excelProperty = JSON.parse(fs.readFileSync(__dirname + '/json/excel.json', 'utf-8'));

  // window.jsonからウィンドウサイズを取得
  var windowData = JSON.parse(fs.readFileSync(__dirname + '/json/window.json', 'utf-8'));
  var windowParameter = "";
  windowParameter += 'width=' + windowData[2].width;
  windowParameter += ',height=' + windowData[2].height;
  windowParameter += ",left=" + windowData[2].left;
  windowParameter += ",top=" + windowData[2].top;

  var twitterWindowParameter = "";
  twitterWindowParameter += 'width=' + windowData[3].width;
  twitterWindowParameter += ',height=' + windowData[3].height;
  twitterWindowParameter += ",left=" + windowData[3].left;
  twitterWindowParameter += ",top=" + windowData[3].top;

  // roundsを設定
  var rounds = [];
  fs.readdirSync(dir).forEach(function(file) {
	// fileがファイルではない場合（＝ディレクトリの場合）
	if (!fs.statSync(dir + "/" + file).isFile()) {
	  var round = {
		// name - ラウンド名
		name : file,

		// historyFile - 履歴ファイルのフルパス
		historyFile : __dirname + '/history/current/' + file + '.json',

		// qCount - 問目
		qCount : null,

		// initializable - 初期化可能か
		initializable : false,

		// click - ラウンド目クリック時の処理（ウィンドウオープン）
		click : function() {
		  $window.open("./round/" + file + "/board.html", file + " - control", windowParameter);
		},

		// initialize - 初期化クリック時の処理
		initialize : function() {
		  var oldFile = __dirname + '/history/current/' + file + '.json';
		  var newFile = __dirname + '/history/current/' + file + '_' + dateString() + '.json';
		  fs.renameSync(oldFile, newFile);
		}
	  };

	  rounds.push(round);
	}
  });

  // 毎秒ファイル状態を確認
  var t = $interval(function() {
	angular.forEach(rounds, function(round) {
	  try {
		var data = JSON.parse(fs.readFileSync(round.historyFile, 'utf-8'));
		round.qCount = data.header.qCount;
		round.initializable = true;
	  } catch (e) {
		round.qCount = null;
		round.initializable = false;
	  }
	});
  }, 1000);

  function initialize() {
	var oldFile = __dirname + '/history/current';
	var newFile = __dirname + '/history/' + dateString();
	fs.renameSync(oldFile, newFile);
	fs.mkdirSync(oldFile);
  }

  function openNameList(scope) {
	Dialog.showOpenDialog(null, {
	  properties : [ 'openFile' ],
	  title : 'ファイルを開く',
	  defaultPath : '.',
	  filters : [ {
		name : 'Excelファイル',
		extensions : [ 'xlsx', 'xls', 'xlsm' ]
	  } ]
	}, function(fileNames) {
	  var nameList = [];
	  var nameListColumn = [];

	  var workbook = xlsx.readFile(fileNames[0], {
		password : excelProperty.password
	  });
	  var worksheet = workbook.Sheets[excelProperty.sheetName];

	  // 指定したセルのテキストを取得する関数
	  function getTextByCell(row, column) {
		var cell = worksheet[xlsx.utils.encode_cell({
		  r : row,
		  c : column
		})];
		if (cell != null) {
		  return cell.w;
		} else {
		  return null;
		}

	  }

	  // セルの範囲
	  var range = worksheet['!ref'];
	  var rangeVal = xlsx.utils.decode_range(range);

	  for (var c = rangeVal.s.c; c <= rangeVal.e.c; c++) {
		var text = getTextByCell(rangeVal.s.r, c);
		if (text != null && text != "") {
		  nameListColumn.push(getTextByCell(rangeVal.s.r, c));
		}
	  }

	  for (var r = rangeVal.s.r + 1; r <= rangeVal.e.r; r++) {
		var player = {};

		for (var c = rangeVal.s.c; c <= rangeVal.e.c; c++) {
		  var title = getTextByCell(rangeVal.s.r, c);
		  var text = getTextByCell(r, c);

		  if (title != null && title != "" && text != null && text != "") {
			player[title] = text;
		  }
		}

		nameList.push(player);
	  }
	  console.log(nameListColumn, nameList);
	  scope.tableHead = nameListColumn;
	  scope.tableContent = nameList;
	  scope.tableTitle = "nameList";
	  scope.tableFilename = __dirname + "/history/current/nameList.json";
	});
  }

  function saveJsonFile(scope) {
	try {
	  fs.statSync(scope.tableFilename);
	  var oldFile = scope.tableFilename;
	  var newFile = scope.tableFilename.replace(/\.json/, "_" + dateString() + ".json");
	  fs.renameSync(oldFile, newFile);
	} catch (e) {

	}

	fs.writeFileSync(scope.tableFilename, JSON.stringify(scope.tableContent));
	cancelJsonFile(scope);
  }

  function cancelJsonFile(scope) {
	scope.tableHead = null;
	scope.tableContent = null;
	scope.tableTitle = null;
	scope.tableFilename = null;
  }

  function dateString() {
	return $filter('date')(new Date(), 'yyyyMMddHHmmss');
  }

  function twitterWindowOpen() {
	$window.open("./twitter.html", "Twitter", twitterWindowParameter);
  }
  
  function openFolder(){
	shell.openItem(__dirname);
  }

  var qFile = {};
  qFile.rounds = rounds;
  qFile.initialize = initialize;
  qFile.openNameList = openNameList;
  qFile.saveJsonFile = saveJsonFile;
  qFile.cancelJsonFile = cancelJsonFile;
  qFile.twitterWindowOpen = twitterWindowOpen;
  qFile.openFolder = openFolder;
  return qFile;
} ]);
