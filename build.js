const packager = require("electron-packager");
// 毎回オプションを書き直すのは面倒くさいのでpackage.jsonから引っ張ってくる
const package = require("./package.json");

packager({
    name: package["name"],
    dir: ".",// ソースフォルダのパス
    out: "C:/Users/USER/Desktop/",// 出力先フォルダのパス
    //icon: "./source/icon.ico",// アイコンのパス
    platform: "win32",
    arch: "x64",
    version: "1.4.1",// Electronのバージョン
    overwrite: true,// 上書き
    asar: false,// asarパッケージ化
    "app-version": package["version"],// アプリバージョン
    "app-copyright": "Copyright (C) 2016 "+package["author"]+".",// コピーライト
    
    "version-string": {// Windowsのみのオプション
        CompanyName: "totoraj.net",
        FileDescription: package["name"],
        OriginalFilename: package["name"]+".exe",
        ProductName: package["name"],
        InternalName: package["name"]
    }
    
}, function (err, appPaths) {// 完了時のコールバック
    if (err) console.log(err);
    console.log("Done: " + appPaths);
});