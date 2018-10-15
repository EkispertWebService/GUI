/**
 *  駅すぱあと Web サービス
 *  路線情報パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *  
 *  Version:2016-06-20
 *  
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiRail = function (pObject, config) {
    // Webサービスの設定
    var apiURL = "http://api.ekispert.jp/";

    // GETパラメータからキーの設定
    var key;
    var scripts = document.getElementsByTagName("script");
    var imagePath;
    for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i];
        imagePath = s.src.substring(0, s.src.indexOf("expGuiRail\.js"));
        if (s.src && s.src.match(/expGuiRail\.js(\?.*)?/)) {
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
    var corporationList = new Array();
    var railList = new Array();
    var stationList = new Array();
    var railDirection;
    var httpObj;
    var tmpUrl;
    var limit = 100; //一度に取得するデータの上限
    // 設定
    var type;
    var prefectureCode;
    var callbackFunction; // コールバック関数の設定

    /**
    * 会社の検索
    */
    function searchCorporation(param1, param2) {
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        var url = apiURL + "v1/json/corporation?key=" + key;
        if (typeof prefectureCode != 'undefined') {
            url += "&prefectureCode=" + prefectureCode;
        }
        if (typeof type != 'undefined') {
            url += "&type=" + type;
        }
        if (typeof param1 == 'undefined') {
            callbackFunction = undefined;
        } else if (typeof param2 == 'undefined') {
            if (typeof param1 == 'function') {
                callbackFunction = param1;
            } else {
                // コールバックなし
                url += "&corporationName=" + encodeURIComponent(param1);
                callbackFunction = undefined;
            }
        } else {
            url += "&corporationName=" + encodeURIComponent(param1);
            callbackFunction = param2;
        }
        corporationList = new Array();
        tmpUrl = url;
        request(tmpUrl, setCorporationList);
    }

    /**
    * 指定されたURLをコールする関数
    */
    function request(url, callBack) {
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            httpObj = new XDomainRequest();
            httpObj.onload = function () {
                JSON_object = JSON.parse(httpObj.responseText);
                callBack(JSON_object);
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
                    callBack(JSON_object);
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
    * 会社一覧を解析
    */
    function setCorporationList(json) {
        var tmp_corporationList = json;
        if (typeof tmp_corporationList.ResultSet.Corporation == 'undefined') {
            // 失敗
            if (typeof callbackFunction == 'function') {
                callbackFunction(false);
            }
        } else if (typeof tmp_corporationList.ResultSet.Corporation.length == 'undefined') {
            corporationList.push(getCorporationObject(tmp_corporationList.ResultSet.Corporation));
            // 成功
            if (typeof callbackFunction == 'function') {
                callbackFunction(true);
            }
        } else {
            for (var i = 0; i < tmp_corporationList.ResultSet.Corporation.length; i++) {
                corporationList.push(getCorporationObject(tmp_corporationList.ResultSet.Corporation[i]));
            }
            // 終わっていない場合はループする
            if (parseInt(tmp_corporationList.ResultSet.max) > (parseInt(tmp_corporationList.ResultSet.offset) + tmp_corporationList.ResultSet.Corporation.length)) {
                var offset = parseInt(tmp_corporationList.ResultSet.offset) + limit;
                request(tmpUrl + "&offset=" + offset, setCorporationList);
            } else {
                // 成功
                if (typeof callbackFunction == 'function') {
                    callbackFunction(true);
                }
            }
        }
    }

    /**
    * 会社データのオブジェクトを作成
    */
    function getCorporationObject(corpObj) {
        var tmp_corporation = new Object();
        tmp_corporation.name = corpObj.Name;
        tmp_corporation.type = corpObj.Type;
        return tmp_corporation;
    }

    /**
    * 会社一覧の取得
    */
    function getCorporationList() {
        var tmpCorporationList = new Array();
        for (var i = 0; i < corporationList.length; i++) {
            tmpCorporationList.push(corporationList[i].name);
        }
        return tmpCorporationList.join(",");
    }

    /**
    * 路線の検索
    */
    function searchRail(param1, param2) {
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        var url = apiURL + "v1/json/rail?key=" + key;
        if (typeof prefectureCode != 'undefined') {
            url += "&prefectureCode=" + prefectureCode;
        }
        if (typeof param1 == 'undefined') {
            callbackFunction = undefined;
        } else if (typeof param2 == 'undefined') {
            if (typeof param1 == 'function') {
                callbackFunction = param1;
            } else {
                // コールバックなし
                url += "&corporationName=" + encodeURIComponent(param1);
                callbackFunction = undefined;
            }
        } else {
            url += "&corporationName=" + encodeURIComponent(param1);
            callbackFunction = param2;
        }
        railList = new Array();
        tmpUrl = url;
        request(tmpUrl, setRailList);
    }

    /**
    * 旧路線名の検索
    */
    function getRailOldName(oldName, callback) {
        var url = apiURL + "v1/json/rail?key=" + key;
        // 駅名
        url += "&oldName=" + encodeURIComponent(oldName);
        callbackFunction = callback;
        railList = new Array();
        tmpUrl = url;
        // 通信
        request(tmpUrl, setRailList);
    }

    /**
    * 路線一覧の解析
    */
    function setRailList(json) {
        var tmp_railList = json;
        if (typeof tmp_railList.ResultSet.Line == 'undefined') {
            // 失敗
            if (typeof callbackFunction == 'function') {
                callbackFunction(false);
            }
        } else if (typeof tmp_railList.ResultSet.Line.length == 'undefined') {
            railList.push(getRailObject(tmp_railList.ResultSet.Line));
            // 成功
            if (typeof callbackFunction == 'function') {
                callbackFunction(true);
            }
        } else {
            for (var i = 0; i < tmp_railList.ResultSet.Line.length; i++) {
                railList.push(getRailObject(tmp_railList.ResultSet.Line[i]));
            }
            // 終わっていない場合はループする
            if (parseInt(tmp_railList.ResultSet.max) > (parseInt(tmp_railList.ResultSet.offset) + tmp_railList.ResultSet.Line.length)) {
                var offset = parseInt(tmp_railList.ResultSet.offset) + limit;
                request(tmpUrl + "&offset=" + offset, setRailList);
            } else {
                // 成功
                if (typeof callbackFunction == 'function') {
                    callbackFunction(true);
                }
            }
        }
    }

    /**
    * 路線オブジェクトの作成
    */
    function getRailObject(railObj) {
        var tmp_rail = new Object();
        tmp_rail.name = railObj.Name;
        if (typeof railObj.Type != 'undefined') {
            if (typeof railObj.Type.text != 'undefined') {
                if (typeof railObj.Type.detail != 'undefined') {
                    tmp_rail.type = railObj.Type.text;
                    if (typeof railObj.Type.detail != 'undefined') {
                        tmp_rail.type_detail = railObj.Type.text + "." + railObj.Type.detail;
                    }
                } else {
                    tmp_rail.type = railObj.Type.text;
                }
            } else {
                tmp_rail.type = railObj.Type;
            }
        }
        tmp_rail.color = railObj.Color;
        return tmp_rail;
    }

    /**
    * 路線一覧の取得
    */
    function getRailList() {
        var tmpRailList = new Array();
        for (var i = 0; i < railList.length; i++) {
            tmpRailList.push(railList[i].name);
        }
        return tmpRailList.join(",");
    }

    /**
    * 駅の検索
    */
    function searchStation(railName, direction, callBack) {
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        var url = apiURL + "v1/json/station?key=" + key;
        if (typeof prefectureCode != 'undefined') {
            url += "&prefectureCode=" + prefectureCode;
        }
        url += "&railName=" + encodeURIComponent(railName);
        url += "&direction=" + direction;
        railDirection = direction;
        callbackFunction = callBack;
        stationList = new Array();
        tmpUrl = url;
        request(tmpUrl, setStationList);
    }

    /**
    * 駅一覧の解析
    */
    function setStationList(json) {
        var tmp_stationList = json;
        if (typeof tmp_stationList.ResultSet.Point == 'undefined') {
            // 失敗
            if (typeof callbackFunction == 'function') {
                callbackFunction(false);
            }
        } else if (typeof tmp_stationList.ResultSet.Point.length == 'undefined') {
            stationList.push(getStationObject(tmp_stationList.ResultSet.Point));
            // 成功
            if (typeof callbackFunction == 'function') {
                callbackFunction(true);
            }
        } else {
            for (var i = 0; i < tmp_stationList.ResultSet.Point.length; i++) {
                stationList.push(getStationObject(tmp_stationList.ResultSet.Point[i]));
            }
            // 終わっていない場合はループする
            if (parseInt(tmp_stationList.ResultSet.max) > (parseInt(tmp_stationList.ResultSet.offset) + tmp_stationList.ResultSet.Point.length)) {
                var offset = parseInt(tmp_stationList.ResultSet.offset) + limit;
                request(tmpUrl + "&offset=" + offset, setStationList);
            } else {
                // 成功
                if (typeof callbackFunction == 'function') {
                    callbackFunction(true);
                }
            }
        }
    }

    /**
    * 駅データオブジェクトの作成
    */
    function getStationObject(stationObj) {
        var tmp_station = new Object();
        tmp_station.name = stationObj.Station.Name;
        tmp_station.code = stationObj.Station.code;
        tmp_station.yomi = stationObj.Station.Yomi;
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
        if (typeof stationObj.getOff != 'undefined') {
            tmp_station.getOff = (stationObj.getOff == "True") ? true : false;
        }
        if (typeof stationObj.onRoute != 'undefined') {
            tmp_station.onRoute = (stationObj.onRoute == "True") ? true : false;
        }
        if (typeof stationObj.onRouteEdge != 'undefined') {
            tmp_station.onRouteEdge = (stationObj.onRouteEdge == "True") ? true : false;
        }
        if (typeof stationObj.GeoPoint != 'undefined') {
            // 緯度
            tmp_station.lati = stationObj.GeoPoint.lati;
            tmp_station.lati_d = stationObj.GeoPoint.lati_d;
            // 経度
            tmp_station.longi = stationObj.GeoPoint.longi;
            tmp_station.longi_d = stationObj.GeoPoint.longi_d;
            // gcs
            tmp_station.gcs = stationObj.GeoPoint.gcs;
        }
        //県コード
        if (typeof stationObj.Prefecture != 'undefined') {
            tmp_station.kenCode = parseInt(stationObj.Prefecture.code);
        }
        return tmp_station;
    }

    /**
    * 駅情報の取得
    */
    function getPointObject(name) {
        for (var i = 0; i < stationList.length; i++) {
            if (stationList[i].name == name) {
                function clone(obj) {
                    var f = function () { };
                    f.prototype = obj;
                    return new f;
                }
                return clone(stationList[i]);
            }
        }
    }

    /**
    * 駅リストの取得
    */
    function getStationList() {
        var tmpStationList = new Array();
        for (var i = 0; i < stationList.length; i++) {
            tmpStationList.push(stationList[i].name);
        }
        return tmpStationList.join(",");
    }

    /**
    * 駅一覧に設定された方向の取得
    */
    function getDirection() {
        if (typeof railDirection == 'undefined') {
            return this.DIRECTION_NONE;
        } else {
            return railDirection;
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
        } else if (name == "type") {
            if (typeof value == "object") {
                type = value.join(":");
            } else {
                type = value;
            }
        } else if (name == "prefectureCode") {
            if (typeof value == "object") {
                prefectureCode = value.join(":");
            } else {
                prefectureCode = value;
            }
        } else if (String(name).toLowerCase() == String("ssl").toLowerCase()) {
            if (String(value).toLowerCase() == "true" || String(value).toLowerCase() == "enable" || String(value).toLowerCase() == "enabled") {
                apiURL = apiURL.replace('http://', 'https://');
            } else {
                apiURL = apiURL.replace('https://', 'http://');
            }
        }
    }

    // 外部参照可能な関数リスト
    this.searchCorporation = searchCorporation;
    this.getCorporationList = getCorporationList;
    this.searchRail = searchRail;
    this.getRailList = getRailList;
    this.getRailOldName = getRailOldName;
    this.searchStation = searchStation;
    this.getStationList = getStationList;
    this.getPointObject = getPointObject;
    this.getDirection = getDirection;
    this.setConfigure = setConfigure;

    // 定数リスト
    this.DIRECTION_UP = "up";
    this.DIRECTION_DOWN = "down";
    this.DIRECTION_NONE = "none";
    this.TYPE_TRAIN = "train";
    this.TYPE_PLANE = "plane";
    this.TYPE_SHIP = "ship";
    this.TYPE_BUS = "bus";
    this.TYPE_WALK = "walk";
    this.TYPE_STRANGE = "strange";
    this.TYPE_BUS_LOCAL = "bus.local";
    this.TYPE_BUS_CONNECTION = "bus.connection";
    this.TYPE_BUS_HIGHWAY = "bus.highway";
    this.TYPE_BUS_MIDNIGHT = "bus.midnight";
    this.TYPE_TRAIN_LIMITEDEXPRESS = "train.limitedExpress";
    this.TYPE_TRAIN_SHINKANSEN = "train.shinkansen";
    this.TYPE_TRAIN_SLEEPERTRAIN = "train.sleeperTrain";
    this.TYPE_TRAIN_LINER = "train.liner";
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
