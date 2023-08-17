/**
 *  駅すぱあと Web サービス
 *  範囲探索パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *  
 *  Version:2017-11-15
 *  
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiRange = function (pObject, config) {
    // Webサービスの設定
    var apiURL = "http://api.ekispert.jp/";

    // GETパラメータからキーの設定
    var key;
    var scripts = document.getElementsByTagName("script");
    var imagePath;
    for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i];
        imagePath = s.src.substring(0, s.src.indexOf("expGuiRange\.js"));
        if (s.src && s.src.match(/expGuiRange\.js(\?.*)?/)) {
            var params = s.src.replace(/.+\?/, '');
            params = params.split("&");
            for (var j = 0; j < params.length; j++) {
                var tmp = params[j].split("=");
                if (tmp[0] == "key") {
                    key = decodeURIComponent(tmp[1]);
                }
            }
            break;
        }
    }

    // 変数郡
    var stationList = new Array();
    var baseStationList = new Array();
    var httpObj;
    // 設定
    var transferCount;
    var callbackFunction; // コールバック関数の設定

    /**
     * 駅名の検索
     */
    function searchStation(station, upperLimit, callback) {
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        var url = apiURL + "v1/json/search/range?key=" + key;
        if (isNaN(station)) {
            // 駅名での指定
            url += "&name=" + encodeURIComponent(station);
        } else {
            // 駅コードでの指定
            url += "&code=" + station;
        }
        url += "&upperLimit=" + upperLimit;
        // 乗り換え回数上限
        if (typeof transferCount != 'undefined') {
            url += "&transferCount=" + transferCount;
        }
        // コールバック
        callbackFunction = callback;
        // 駅リスト初期化
        stationList = new Array();
        // リクエスト
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            httpObj = new XDomainRequest();
            httpObj.onload = function () {
                JSON_object = JSON.parse(httpObj.responseText);
                splitStation(JSON_object);
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
                    splitStation(JSON_object);
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
     * 駅名の検索
     */
    function searchMultipleStation(station, upperMinute, callback) {
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        var url = apiURL + "v1/json/search/multipleRange?key=" + key;
        url += "&baseList=" + arrayURIComponent(station.split(":")).join(":");
        url += "&upperMinute=" + upperMinute;
        // 乗り換え回数上限
        if (typeof transferCount != 'undefined') {
            url += "&upperTransferCount=" + transferCount;
        }
        // コールバック
        callbackFunction = callback;
        // 駅リスト初期化
        stationList = new Array();
        // リクエスト
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            httpObj = new XDomainRequest();
            httpObj.onload = function () {
                JSON_object = JSON.parse(httpObj.responseText);
                splitStation(JSON_object);
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
                    splitStation(JSON_object);
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
     * 配列をURLエンコードする
     */
    function arrayURIComponent(arr) {
        var ret = new Array();
        for (var i = 0; i < arr.length; i++) {
            ret.push(encodeURIComponent(arr[i]));
        }
        return ret;
    }

    /**
     * JSONを解析してリストをセット
     */
    function splitStation(pointObject) {
        if (typeof pointObject.ResultSet.Point == 'undefined') {
            // 失敗
            if (typeof callbackFunction == 'function') {
                callbackFunction(false);
            }
        } else {
            // 範囲探索の結果を取得
            if (typeof pointObject.ResultSet.Point.length == 'undefined') {
                stationList.push(pointObject.ResultSet.Point);
            } else {
                for (var i = 0; i < pointObject.ResultSet.Point.length; i++) {
                    stationList.push(pointObject.ResultSet.Point[i]);
                }
            }
            // ベースとなる駅のリスト取得
            if (typeof pointObject.ResultSet.Base != 'undefined') {
                if (typeof pointObject.ResultSet.Base.length == 'undefined') {
                    baseStationList.push(pointObject.ResultSet.Base);
                } else {
                    for (var i = 0; i < pointObject.ResultSet.Base.length; i++) {
                        baseStationList.push(pointObject.ResultSet.Base[i]);
                    }
                }
            }
            if (typeof callbackFunction == 'function') {
                callbackFunction(true);
            }
        }
    }

    /**
     * 駅データのオブジェクトを作成
     */
    function createStationObject(stationObj) {
        var tmp_station = new Object();
        tmp_station.name = stationObj.Station.Name;
        tmp_station.code = stationObj.Station.code;
        if (typeof stationObj.Station.Type.text != 'undefined') {
            if (typeof stationObj.Station.Type.detail != 'undefined') {
                tmp_station.type = stationObj.Station.Type.text;
                if (typeof stationObj.Station.Type.detail != 'undefined') {
                    tmp_station.type_detail = stationObj.Station.Type.text + "." + stationObj.Station.Type.detail;
                }
            } else {
                tmp_station.type = stationObj.Station.Type.text;
            }
        } else {
            tmp_station.type = stationObj.Station.Type;
        }
        tmp_station.kenCode = stationObj.Prefecture.code;
        if (typeof stationObj.Minute != 'undefined') {
            tmp_station.minute = Number(stationObj.Minute);
        }
        if (typeof stationObj.TransferCount != 'undefined') {
            tmp_station.transferCount = Number(stationObj.TransferCount);
        }
        if (typeof stationObj.Cost != 'undefined') {
            if (typeof stationObj.Cost.length == 'undefined') {
                tmp_station.baseStation = baseStationList[parseInt(stationObj.Cost.baseIndex) - 1].Point.Station.Name;
                tmp_station.minute = Number(stationObj.Cost.Minute);
                tmp_station.transferCount = Number(stationObj.Cost.TransferCount);
            } else {
                var tmp_baseStationList = new Array();
                var tmp_minuteList = new Array();
                var tmp_transferCountList = new Array();
                for (var i = 0; i < stationObj.Cost.length; i++) {
                    tmp_baseStationList.push(baseStationList[parseInt(stationObj.Cost[i].baseIndex) - 1].Point.Station.Name);
                    tmp_minuteList.push(Number(stationObj.Cost[i].Minute));
                    tmp_transferCountList.push(Number(stationObj.Cost[i].TransferCount));
                }
                tmp_station.baseStation = tmp_baseStationList.join(",");
                tmp_station.minute = tmp_minuteList.join(",");
                tmp_station.transferCount = tmp_transferCountList.join(",");
            }
        }
        return tmp_station;
    }

    /**
     * 駅一覧の取得
     */
    function getStationList() {
        var tmpStationName = new Array();
        for (var i = 0; i < stationList.length; i++) {
            tmpStationName.push(stationList[i].Station.Name);
        }
        return tmpStationName.join(",");
    }

    /**
     * 時間から地点オブジェクトを取得
     */
    function getPointObject(name) {
        for (var i = 0; i < stationList.length; i++) {
            if (stationList[i].Station.Name == name) {
                return createStationObject(stationList[i]);
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
        } else if (name == "transferCount") {
            transferCount = value;
        } else if (name == "upperTransferCount") {
            transferCount = value;
        } else if (String(name).toLowerCase() == String("ssl").toLowerCase()) {
            if (String(value).toLowerCase() == "true" || String(value).toLowerCase() == "enable" || String(value).toLowerCase() == "enabled") {
                apiURL = apiURL.replace('http://', 'https://');
            } else {
                apiURL = apiURL.replace('https://', 'http://');
            }
        }
    }

    // 外部参照可能な関数リスト
    this.searchStation = searchStation;
    this.searchMultipleStation = searchMultipleStation;
    this.getStationList = getStationList;
    this.getPointObject = getPointObject;
    this.setConfigure = setConfigure;

    // 定数リスト
    this.TDFK_HOKKAIDO = 1;
    this.TDFK_AOMORI = 2;
    this.TDFK_IWATE = 3;
    this.TDFK_MIYAGI = 4;
    this.TDFK_AKITA = 5;
    this.TDFK_YAMAGATA = 6;
    this.TDFK_FUKUSHIMA = 7;
    this.TDFK_IBARAKI = 8;
    this.TDFK_TOCHIGI = 9;
    this.TDFK_GUNMA = 10;
    this.TDFK_SAITAMA = 11;
    this.TDFK_CHIBA = 12;
    this.TDFK_TOKYO = 13;
    this.TDFK_KANAGAWA = 14;
    this.TDFK_NIIGATA = 15;
    this.TDFK_TOYAMA = 16;
    this.TDFK_ISHIKAWA = 17;
    this.TDFK_FUKUI = 18;
    this.TDFK_YAMANASHI = 19;
    this.TDFK_NAGANO = 20;
    this.TDFK_GIFU = 21;
    this.TDFK_SHIZUOKA = 22;
    this.TDFK_AICHI = 23;
    this.TDFK_MIE = 24;
    this.TDFK_SHIGA = 25;
    this.TDFK_KYOTO = 26;
    this.TDFK_OSAKA = 27;
    this.TDFK_HYOGO = 28;
    this.TDFK_NARA = 29;
    this.TDFK_WAKAYAMA = 30;
    this.TDFK_TOTTORI = 31;
    this.TDFK_SHIMANE = 32;
    this.TDFK_OKAYAMA = 33;
    this.TDFK_HIROSHIMA = 34;
    this.TDFK_YAMAGUCHI = 35;
    this.TDFK_TOKUSHIMA = 36;
    this.TDFK_KAGAWA = 37;
    this.TDFK_EHIME = 38;
    this.TDFK_KOCHI = 39;
    this.TDFK_FUKUOKA = 40;
    this.TDFK_SAGA = 41;
    this.TDFK_NAGASAKI = 42;
    this.TDFK_KUMAMOTO = 43;
    this.TDFK_OITA = 44;
    this.TDFK_MIYAZAKI = 45;
    this.TDFK_KAGOSHIMA = 46;
    this.TDFK_OKINAWA = 47;
};
