/**
 *  駅すぱあと Web サービス
 *  経路探索パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *
 *  Version:2018-06-06
 *
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiCourseLight = function (pObject, config) {
    // Webサービスの設定
    var apiURL = "http://api.ekispert.jp/";

    // GETパラメータからキーの設定
    var key;
    var scripts = document.getElementsByTagName("script");
    var imagePath;
    for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i];
        imagePath = s.src.substring(0, s.src.indexOf("expGuiCourseLight\.js"));

        if (s.src && s.src.match(/expGuiCourseLight\.js(\?.*)?/)) {
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
    var searchObj; // 探索条件のオブジェクト
    var resultObj; // 探索結果のリクエストオブジェクト
    var result; // 探索結果オブジェクト
    var callbackFunction; // コールバック関数の設定

    /**
    * 探索実行
    */
    function search(searchObject, callback) {
        if (typeof searchObject == "string") {
            // 探索オブジェクトを生成
            searchObj = createSearchInterface();
            // パラメータを解析
            var tmpParamList = searchObject.split('&');
            for (var i = 0; i < tmpParamList.length; i++) {
                var tmpParam = tmpParamList[i].split('=');
                if (tmpParam.length == 2) {
                    switch (tmpParam[0].toLowerCase()) {
                        case "from":
                            searchObj.setFrom(tmpParam[1]);
                            break;
                        case "to":
                            searchObj.setTo(tmpParam[1]);
                            break;
                        case "via":
                            searchObj.setVia(tmpParam[1]);
                            break;
                        case "date":
                            searchObj.setDate(tmpParam[1]);
                            break;
                        case "time":
                            searchObj.setTime(tmpParam[1]);
                            break;
                        case "searchtype":
                            searchObj.setSearchType(tmpParam[1]);
                            break;
                        case "plane":
                            searchObj.setPlane(tmpParam[1]);
                            break;
                        case "shinkansen":
                            searchObj.setShinkansen(tmpParam[1]);
                            break;
                        case "limitedExpress":
                            searchObj.setLimitedExpress(tmpParam[1]);
                            break;
                        case "bus":
                            searchObj.setBus(tmpParam[1]);
                            break;
                    }
                }
            }
        } else {
            // 探索オブジェクトを指定
            searchObj = searchObject;
        }
        // 探索オブジェクトを文字列に変換
        var searchWord = "";
        if (typeof searchObj.getFrom() != 'undefined') {
            searchWord += "&from=" + encodeURIComponent(searchObj.getFrom());
        }
        if (typeof searchObj.getTo() != 'undefined') {
            searchWord += "&to=" + encodeURIComponent(searchObj.getTo());
        }
        if (typeof searchObj.getVia() != 'undefined') {
            searchWord += "&via=" + encodeURIComponent(searchObj.getVia());
        }
        if (typeof searchObj.getDate() != 'undefined') {
            searchWord += "&date=" + searchObj.getDate();
        }
        if (typeof searchObj.getTime() != 'undefined') {
            searchWord += "&time=" + searchObj.getTime();
        }
        if (typeof searchObj.getSearchType() != 'undefined') {
            searchWord += "&searchType=" + searchObj.getSearchType();
        }
        if (typeof searchObj.getPlane() != 'undefined') {
            searchWord += "&plane=" + searchObj.getPlane();
        }
        if (typeof searchObj.getShinkansen() != 'undefined') {
            searchWord += "&shinkansen=" + searchObj.getShinkansen();
        }
        if (typeof searchObj.getLimitedExpress() != 'undefined') {
            searchWord += "&limitedExpress=" + searchObj.getLimitedExpress();
        }
        if (typeof searchObj.getBus() != 'undefined') {
            searchWord += "&bus=" + searchObj.getBus();
        }
        // 探索文字列の生成
        var url = apiURL + "v1/json/search/course/light?key=" + key + searchWord;
        // コールバック関数の設定
        callbackFunction = callback;
        //探索実行中はキャンセル
        if (typeof resultObj != 'undefined') {
            resultObj.abort();
        }
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            resultObj = new XDomainRequest();
            resultObj.onload = function () {
                // OK時の処理
                JSON_object = JSON.parse(resultObj.responseText);
                setWebUrl(JSON_object);
            };
            resultObj.onerror = function () {
                // エラー時の処理
                if (typeof callbackFunction == 'function') {
                    callbackFunction(false);
                }
            };
        } else {
            resultObj = new XMLHttpRequest();
            resultObj.onreadystatechange = function () {
                var done = 4, ok = 200;
                if (resultObj.readyState == done && resultObj.status == ok) {
                    // OK時の処理
                    JSON_object = JSON.parse(resultObj.responseText);
                    setWebUrl(JSON_object);
                } else if (resultObj.readyState == done && resultObj.status != ok) {
                    // エラー時の処理
                    if (typeof callbackFunction == 'function') {
                        callbackFunction(false);
                    }
                }
            };
        }
        resultObj.open("GET", url, true);
        resultObj.send(null);
    }

    /**
    * JSONを解析して結果を出力
    */
    function setWebUrl(requestObject) {
        result = requestObject;
        if (typeof result.ResultSet.ResourceURI == 'undefined') {
            // 失敗
            if (typeof callbackFunction == 'function') {
                callbackFunction(false);
            }
        } else {
            // 成功
            if (typeof callbackFunction == 'function') {
                callbackFunction(true);
            }
        }
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

    /**
    * 探索オブジェクトのインターフェースを返す
    */
    function createSearchInterface() {
        return new searchInterface();
    };

    /**
    * 探索インターフェースオブジェクト
    */
    function searchInterface() {
        // データリスト
        var from;
        var to;
        var via;
        var date;
        var time;
        var searchType;
        var plane;
        var shinkansen;
        var limitedExpress;
        var bus;
        // 関数リスト
        // from設定
        function setFrom(value) { from = value; };
        function getFrom() { return from; };
        this.setFrom = setFrom;
        this.getFrom = getFrom;
        // to設定
        function setTo(value) { to = value; };
        function getTo() { return to; };
        this.setTo = setTo;
        this.getTo = getTo;
        // via設定
        function setVia(value) { via = value; };
        function getVia() { return via; };
        this.setVia = setVia;
        this.getVia = getVia;
        // Date設定
        function setDate(value) { date = value; };
        function getDate() { return date; };
        this.setDate = setDate;
        this.getDate = getDate;
        // Time設定
        function setTime(value) { time = value; };
        function getTime() { return time; };
        this.setTime = setTime;
        this.getTime = getTime;
        // SearchType設定
        function setSearchType(value) { searchType = value; };
        function getSearchType() { return searchType; };
        this.setSearchType = setSearchType;
        this.getSearchType = getSearchType;
        // plane設定
        function setPlane(value) { plane = value; };
        function getPlane() { return plane; };
        this.setPlane = setPlane;
        this.getPlane = getPlane;
        // shinkansen設定
        function setShinkansen(value) { shinkansen = value; };
        function getShinkansen() { return shinkansen; };
        this.setShinkansen = setShinkansen;
        this.getShinkansen = getShinkansen;
        // limitedExpress設定
        function setLimitedExpress(value) { limitedExpress = value; };
        function getLimitedExpress() { return limitedExpress; };
        this.setLimitedExpress = setLimitedExpress;
        this.getLimitedExpress = getLimitedExpress;
        // bus設定
        function setBus(value) { bus = value; };
        function getBus() { return bus; };
        this.setBus = setBus;
        this.getBus = getBus;
    };

    /**
    * 駅すぱあと for webのURLを取得
    */
    function getResourceURI() {
        if (typeof result != 'undefined') {
            return result.ResultSet.ResourceURI;
        } else {
            return;
        }
    }

    // 外部参照可能な関数リスト
    this.search = search;
    this.createSearchInterface = createSearchInterface;
    this.setConfigure = setConfigure;
    this.getResourceURI = getResourceURI;

    // 定数リスト
    this.SEARCHTYPE_DEPARTURE = "departure";
    this.SEARCHTYPE_ARRIVAL = "arrival";
    this.SEARCHTYPE_FIRSTTRAIN = "firstTrain";
    this.SEARCHTYPE_LASTTRAIN = "lastTrain";
    this.SEARCHTYPE_PLAIN = "plain";
};
