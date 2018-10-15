/**
 *  駅すぱあと Web サービス
 *  バージョン情報パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *  
 *  Version:2016-06-20
 *  
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiVersion = function (pObject, config) {
    // Webサービスの設定
    var apiURL = "http://api.ekispert.jp/";

    // GETパラメータからキーの設定
    var key;
    var scripts = document.getElementsByTagName("script");
    var imagePath;
    for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i];
        imagePath = s.src.substring(0, s.src.indexOf("expGuiVersion\.js"));
        if (s.src && s.src.match(/expGuiVersion\.js(\?.*)?/)) {
            var params = s.src.replace(/.+\?/, '');
            params = params.split("&");
            for (var j = 0; j < params.length; j++) {
                var tmp = params[j].split("=");
                if (tmp[0] == "key") {
                    key = unescape(tmp[1]);
                }
            }
            break;
        }
    }

    // 変数郡
    var versionObj;
    var httpObj;
    // 設定
    var callbackFunction; // コールバック関数の設定

    /**
    * データバージョンの取得
    */
    function getVersion(callback) {
        var url = apiURL + "v1/json/dataversion?key=" + key;
        callbackFunction = callback;
        versionObj = new Object();
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        // 通信
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            httpObj = new XDomainRequest();
            httpObj.onload = function () {
                JSON_object = JSON.parse(httpObj.responseText);
                setVersion(JSON_object);
            };
            httpObj.onerror = function () {
                // エラー時の処理
                if (typeof callbackFunction == 'function') {
                    callbackFunction(false);
                }
            };
        } else {
            httpObj = new XMLHttpRequest();
            httpObj.onreadystatechange = function () {
                var done = 4, ok = 200;
                if (httpObj.readyState == done && httpObj.status == ok) {
                    JSON_object = JSON.parse(httpObj.responseText);
                    setVersion(JSON_object);
                } else if (httpObj.readyState == done && httpObj.status != ok) {
                    // エラー時の処理
                    if (typeof callbackFunction == 'function') {
                        callbackFunction(false);
                    }
                }
            };
        }
        httpObj.open("GET", url, true);
        httpObj.send(null);
    }

    /**
    * バージョン情報の解析
    */
    function setVersion(json) {
        var tmp_version = json;
        if (typeof tmp_version.ResultSet.Version == 'undefined') {
            // 失敗
            if (typeof callbackFunction == 'function') {
                callbackFunction(false);
            }
        } else {
            versionObj = tmp_version.ResultSet;
            // 成功
            if (typeof callbackFunction == 'function') {
                callbackFunction(true);
            }
        }
    }

    /**
    * APIバージョン
    */
    function getApiVersion() {
        if (typeof versionObj != 'undefined') {
            return versionObj.apiVersion;
        }
        return;
    }

    /**
    * エンジンバージョン
    */
    function getEngineVersion() {
        if (typeof versionObj != 'undefined') {
            return versionObj.engineVersion;
        }
        return;
    }

    /**
    * バージョンリスト
    */
    function getVersionList() {
        var versionList = new Array();
        if (typeof versionObj != 'undefined') {
            for (var i = 0; i < versionObj.Version.length; i++) {
                versionList.push(setVersionObject(versionObj.Version[i]));
            }
        }
        return versionList;
    }

    /**
    *バージョンオブジェクトの作成
    */
    function setVersionObject(ver) {
        var tmp_version = new Object();
        tmp_version.caption = ver.caption;
        if (ver.createType == "Date") {
            tmp_version.version = ver.create.substr(0, 4) + "/" + ver.create.substr(4, 2) + "/" + ver.create.substr(6, 2);
        } else if (ver.createType == "Edition") {
            tmp_version.version = ver.create.substr(0, 4) + "/" + ver.create.substr(4, 2) + " 第" + parseInt(ver.create.substr(6, 2), 10) + "版";
        } else if (ver.createType == "HideDay") {
            tmp_version.version = ver.create.substr(0, 4) + "/" + ver.create.substr(4, 2);
        }
        if (typeof tmp_version.version != 'undefined') {
            if (typeof ver.createComment != 'undefined') {
                if (ver.createComment.indexOf("!") == 0) {
                    tmp_version.version += " " + ver.createComment.substr(1);
                } else if (ver.createComment == "Now") {
                    tmp_version.version += " 現在";
                }
            }
        }
        if (typeof ver.rangeCaption != 'undefined') {
            tmp_version.rangeCaption = ver.rangeCaption;
        }
        if (typeof ver.rangeFrom != 'undefined') {
            tmp_version.rangeFrom = ver.rangeFrom.substr(0, 4) + "/" + ver.rangeFrom.substr(4, 2) + "/" + ver.rangeFrom.substr(6, 2);
        }
        if (typeof ver.rangeTo != 'undefined') {
            tmp_version.rangeTo = ver.rangeTo.substr(0, 4) + "/" + ver.rangeTo.substr(4, 2) + "/" + ver.rangeTo.substr(6, 2);
        }
        return tmp_version;
    }

    /**
    * 権利団体の名称を取得
    * ※現在はid=2のみ対応
    */
    function getCompanyName(id) {
        var versionList = new Array();
        if (typeof versionObj != 'undefined') {
            if (versionObj.Copyrights.companyId == String(id)) {
                return versionObj.Copyrights.company;
            }
        }
        return;
    }

    /**
    * 著作権を取得
    * ※現在はid=2のみ対応
    */
    function getCopyrights(id) {
        var versionList = new Array();
        if (typeof versionObj != 'undefined') {
            if (versionObj.Copyrights.companyId == String(id)) {
                return versionObj.Copyrights.text;
            }
        }
        return;
    }

    /**
    * 環境設定
    */
    function setConfigure(name, value) {
        if (name.toLowerCase() == String("apiURL").toLowerCase()) {
            apiURL = value;
        } else if (name.toLowerCase() == String("key").toLowerCase()) {
            key = value;
        } else if (String(name).toLowerCase() == String("ssl").toLowerCase()) {
            if (String(value).toLowerCase() == "true" || String(value).toLowerCase() == "enable" || String(value).toLowerCase() == "enabled") {
                apiURL = apiURL.replace('http://', 'https://');
            } else {
                apiURL = apiURL.replace('https://', 'http://');
            }
        }
    }

    // 外部参照可能な関数リスト
    this.getVersion = getVersion;
    this.getApiVersion = getApiVersion;
    this.getEngineVersion = getEngineVersion;
    this.getVersionList = getVersionList;
    this.getCompanyName = getCompanyName;
    this.getCopyrights = getCopyrights;
    this.setConfigure = setConfigure;
};
