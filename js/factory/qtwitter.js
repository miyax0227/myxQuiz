'use strict';

var appName = "myxQuizTwitter";
var app = angular.module(appName);

/*******************************************************************************
 * qTwitter - Twitter関連処理をまとめたService
 * 
 * @class
 * @name qTwitter
 ******************************************************************************/
app.service('qTwitter', [ '$twitterApi', '$interval', '$filter',
	function($twitterApi, $interval, $filter) {

	  const
	  fs = require('fs');
	  const
	  dir = __dirname + '/twitter';
	  const
	  dir_backup = __dirname + '/twitter/backup';
	  const
	  TWEET_CHAR_COUNT = 140;

	  var accountNum = 0;
	  var qTwitter = {};
	  var history = [];

	  // twitter.jsonからアカウント情報をを取得
	  var twitterProperty = JSON.parse(fs.readFileSync(__dirname + '/json/twitter.json', 'utf-8'));
	  qTwitter.accounts = twitterProperty.accounts;

	  // Tweetの履歴
	  qTwitter.history = history;

	  // 選択中のアカウント番号
	  qTwitter.accountNum = accountNum;

	  // 手動ツイート投稿
	  qTwitter.newTweetSubmit = newTweetSubmit;

	  // アカウント番号設定
	  qTwitter.setAccountNum = setAccountNum;
	  setAccountNum(0);

	  // ツイートの削除
	  qTwitter.deleteTweet = deleteTweet;

	  // ツイートの削除
	  qTwitter.replySubmit = replySubmit;

	  // 1秒置きにファイル監視
	  var t = $interval(function() {
		var file;
		try {
		  // ディレクトリ内の指定の拡張子のファイルのうち、ソートして最初のファイルを取得
		  file = fs.readdirSync(dir).filter(function(file) {
			return fs.statSync(dir + "/" + file).isFile() && file.match(/\.(txt|png)$/i);
		  }).sort()[0];

		} catch (e) {
		  console.log(e);
		}

		// ファイルが存在する場合
		if (file != undefined) {
		  // ファイルのフルパスを取得
		  var filePath = dir + "/" + file;
		  // 退避先ファイルパスを生成
		  var backupFilePath = dir_backup + "/" + dateString() + "_" + file;

		  // 文字ツイート用ファイル拡張子の場合
		  if (file.match(/\.txt$/i)) {
			// ファイル内容読込
			var tweet = fs.readFileSync(filePath, 'utf-8');
			// ファイル退避
			fs.renameSync(filePath, backupFilePath);

			// ツイート内容がNULL等ではない場合
			if (tweet != null && tweet != undefined && tweet != "") {
			  // ツイートは140文字で切る
			  tweet = tweet.substring(0, TWEET_CHAR_COUNT);

			  // ツイートを投稿
			  $twitterApi.postStatusUpdate(tweet).then(function(data) {
				// 成功時
				addSuccessHistory(data);

			  }, function(error) {
				// 失敗時
				addFailHistory(error);
			  });
			}

			// 画像投稿用拡張子の場合
		  } else {
			// 画像ファイルをbase64形式に変換して読み込み
			var img = fs.readFileSync(filePath, 'base64');
			var media = new Buffer(img).toString();
			// ファイル退避
			fs.renameSync(filePath, backupFilePath);

			// 画像ファイルが正常な場合
			if (media != null && media != undefined && media != "") {

			  // 画像を投稿
			  $twitterApi.postMedia(media).then(function(data) {
				// 成功時、更にツイートを投稿
				$twitterApi.postStatusUpdate("", {
				  media_ids : data.media_id_string
				}).then(function(data) {
				  // 成功時
				  addSuccessHistory(data);

				}, function(error) {
				  // 失敗時
				  addFailHistory(error);
				});

			  }, function(error) {
				// 失敗時
				addFailHistory(error);
			  });
			}
		  }

		}

	  }, 1000);

	  /*************************************************************************
	   * 成功時の履歴生成
	   * 
	   * @memberOf qTwitter
	   * @return object data - TwitterAPIのレスポンスボディ
	   ************************************************************************/
	  function addSuccessHistory(data) {
		console.log(data);
		var obj = {
		  id : data.id_str,
		  owner : data.user.screen_name,
		  date : $filter('date')(new Date(data.created_at), 'yyyy-MM-dd HH:mm:ss'),
		  tweet : data.text,
		  removable : true
		};

		history.unshift(obj);
	  }

	  /*************************************************************************
	   * 失敗時の履歴生成
	   * 
	   * @memberOf qTwitter
	   * @return object data - TwitterAPIのレスポンスボディ
	   ************************************************************************/
	  function addFailHistory(data) {
		var obj = {
		  owner : null,
		  date : null,
		  tweet : data.errors[0].code + " - " + data.errors[0].message,
		  removable : false
		};

		history.unshift(obj);
	  }

	  /*************************************************************************
	   * 新しいツイート用ファイルの生成
	   * 
	   * @memberOf qTwitter
	   * @return string tweet - ツイート内容
	   ************************************************************************/
	  function newTweetSubmit(tweet) {
		var filePath = dir + "/" + dateString() + ".txt";
		fs.writeFile(filePath, tweet);
	  }

	  /*************************************************************************
	   * 新しいツイート用ファイルの生成
	   * 
	   * @memberOf qTwitter
	   * @return string tweet - ツイート内容
	   ************************************************************************/
	  function replySubmit(tweet, id) {
		// ツイートは140文字で切る
		tweet = tweet.substring(0, TWEET_CHAR_COUNT);

		// ツイートを投稿
		$twitterApi.postStatusUpdate(tweet, {
		  in_reply_to_status_id : id
		}).then(function(data) {
		  // 成功時
		  addSuccessHistory(data);

		}, function(error) {
		  // 失敗時
		  addFailHistory(error);
		});
	  }

	  /*************************************************************************
	   * ツイートの削除
	   * 
	   * @memberOf qTwitter
	   * @param string id - 削除するツイートのid
	   * @return string tweet - ツイート内容
	   ************************************************************************/
	  function deleteTweet(id) {
		// ツイートを投稿
		$twitterApi.postStatusDestroy(id).then(function(data) {
		  // 成功時
		}, function(error) {
		  // 失敗時
		});

	  }

	  /*************************************************************************
	   * システム日時文字列の取得
	   * 
	   * @memberOf qTwitter
	   * @return string dateString - 日付を示す文字列
	   ************************************************************************/
	  function dateString() {
		return $filter('date')(new Date(), 'yyyyMMddHHmmss');
	  }

	  /*************************************************************************
	   * アカウント番号設定
	   * 
	   * @memberOf qTwitter
	   * @param integer num - アカウント番号
	   ************************************************************************/
	  function setAccountNum(num) {
		// configure
		var consumerKey = qTwitter.accounts[accountNum].consumerKey;
		var consumerSecret = qTwitter.accounts[accountNum].consumerSecret;
		var accessToken = qTwitter.accounts[accountNum].accessToken;
		var accessTokenSecret = qTwitter.accounts[accountNum].accessTokenSecret;

		$twitterApi.configure(consumerKey, consumerSecret, {
		  oauth_token : accessToken,
		  oauth_token_secret : accessTokenSecret
		});
	  }

	  return qTwitter;

	} ]);
