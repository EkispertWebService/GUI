/**
 *  駅すぱあと Web サービス
 *  ランドマークパーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *  
 *  Version:2016-06-20
 *  
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiLandmark = function (pObject, config) {
    // Webサービスの設定

    var apiURL = "http://api.ekispert.jp/";
    // GETパラメータからキーの設定
    var key;
    var scripts = document.getElementsByTagName("script");
    var imagePath;
    for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i];
        imagePath = s.src.substring(0, s.src.indexOf("expGuiLandmark\.js"));
        if (s.src && s.src.match(/expGuiLandmark\.js(\?.*)?/)) {
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
    var httpObj;
    var callbackFunction; // コールバック関数の設定
    var serializeData;

    /**
    * 地点の生成
    */
    function createLandmark(landmarkObject, callBack) {
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        var url = apiURL + "v1/json/toolbox/course/point?key=" + key;
        callbackFunction = callBack;
        if (typeof landmarkObject.getParam() != 'undefined') {
            url += "&" + landmarkObject.getParam();
        } else {
            callbackFunction(false);
            return;
        }
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            httpObj = new XDomainRequest();
            httpObj.onload = function () {
                JSON_object = JSON.parse(httpObj.responseText);
                setLandmarkData(JSON_object);
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
                    setLandmarkData(JSON_object);
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
    * ランドマーク情報を返却
    */
    function setLandmarkData(json) {
        var tmp_point = json;
        if (typeof tmp_point.ResultSet.Point == 'undefined') {
            // 失敗
            if (typeof callbackFunction == 'function') {
                callbackFunction(false);
            }
        } else {
            serializeData = tmp_point.ResultSet.Point.SerializeData;
            // 成功
            if (typeof callbackFunction == 'function') {
                callbackFunction(true);
            }
        }
    }

    /**
    * 地点インターフェースの生成
    */
    function createLandmarkInterface(name) {
        return new landmarkInterface(name);
    }

    /**
    * 地点インターフェース
    */
    function landmarkInterface(tmp_name) {
        // 変数リスト
        var name = tmp_name;
        var stationList = new Array();
        // 関数リスト
        // name設定
        function setName(value) { name = value; };
        function getName() { return name; };
        this.setName = setName;
        this.getName = getName;
        // 駅の追加
        function addStation(obj) {
            if (stationList.length == 5) { return false; }
            var checkStation = "";
            for (var i = 0; i < stationList.length; i++) {
                if (stationList[i].getStation() == obj.getStation()) {
                    // 同じ駅は指定できない
                    return false;
                }
                checkStation += stationList[i].getStation();
            }
            // 以前追加した駅がコードであるかどうかをチェック
            if (checkStation != "") {
                if (isNaN(checkStation) != isNaN(obj.getStation())) {
                    return false;
                }
            }
            stationList.push(obj);
            return true;
        };
        this.addStation = addStation;
        // 駅の削除
        function removeStation(obj) {
            for (var i = 0; i < stationList.length; i++) {
                if (typeof obj == 'object') {
                    if (stationList[i].getStation() == obj.getStation()) {
                        stationList.splice(i, 1);
                        return true;
                    }
                } else {
                    if (stationList[i].getStation() == obj) {
                        stationList.splice(i, 1);
                        return true;
                    }
                }
            }
            return false;
        };
        this.removeStation = removeStation;
        // パラメータ作成
        function getParam() {
            var url = "";
            if (typeof name != 'undefined') {
                url += "name=" + encodeURIComponent(name);
            } else {
                return;
            }
            // 最寄り駅の設定
            if (stationList.length == 0) { return; }
            var tmpStationCode = "";
            var tmpStation = "";
            var tmpTime = "";
            var tmpFare = "";
            var tmpTraffic = "";
            var tmpDistance = "";
            var tmpTeiki1 = "";
            var tmpTeiki3 = "";
            var tmpTeiki6 = "";
            for (var i = 0; i < stationList.length; i++) {
                if (typeof stationList[i] != 'undefined') {
                    if (tmpStation != "") {
                        tmpStation += ":";
                        tmpTime += ":";
                        tmpFare += ":";
                        tmpTraffic += ":";
                        tmpDistance += ":";
                        tmpTeiki1 += ":";
                        tmpTeiki3 += ":";
                        tmpTeiki6 += ":";
                    }
                    if (typeof stationList[i].getStation() != 'undefined') {
                        tmpStation += encodeURIComponent(stationList[i].getStation());
                    }
                    if (typeof stationList[i].getTime() != 'undefined') {
                        tmpTime += stationList[i].getTime();
                    }
                    if (typeof stationList[i].getFare() != 'undefined') {
                        tmpFare += stationList[i].getFare();
                    }
                    if (typeof stationList[i].getTraffic() != 'undefined') {
                        tmpTraffic += encodeURIComponent(stationList[i].getTraffic());
                    }
                    if (typeof stationList[i].getDistance() != 'undefined') {
                        tmpDistance += stationList[i].getDistance();
                    }
                    if (typeof stationList[i].getTeiki1() != 'undefined') {
                        tmpTeiki1 += stationList[i].getTeiki1();
                    }
                    if (typeof stationList[i].getTeiki3() != 'undefined') {
                        tmpTeiki3 += stationList[i].getTeiki3();
                    }
                    if (typeof stationList[i].getTeiki6() != 'undefined') {
                        tmpTeiki6 += stationList[i].getTeiki6();
                    }
                }
            }
            if (tmpStation.replace(/:/g, "") == "") {
                return;
            } else if (isNaN(tmpStation.replace(/:/g, ""))) {
                // 駅名
                url += "&station=" + tmpStation;
            } else {
                // 駅コード
                url += "&stationCode=" + tmpStation;
            }
            // パラメータの生成
            if (tmpTime.replace(/:/g, "") != "") {
                url += "&time=" + tmpTime;
            }
            if (tmpFare.replace(/:/g, "") != "") {
                url += "&fare=" + tmpFare;
            }
            if (tmpTraffic.replace(/:/g, "") != "") {
                url += "&traffic=" + tmpTraffic;
            }
            if (tmpDistance.replace(/:/g, "") != "") {
                url += "&distance=" + tmpDistance;
            }
            if (tmpTeiki1.replace(/:/g, "") != "") {
                url += "&teiki1=" + tmpTeiki1;
            }
            if (tmpTeiki3.replace(/:/g, "") != "") {
                url += "&teiki3=" + tmpTeiki3;
            }
            if (tmpTeiki6.replace(/:/g, "") != "") {
                url += "&teiki6=" + tmpTeiki6;
            }
            return url;
        }
        this.getParam = getParam;
    }

    /**
    * 駅インターフェースの生成
    */
    function createLandmarkStationInterface(station) {
        return new landmarkStationInterface(station);
    }

    /**
    * 駅インターフェース
    */
    function landmarkStationInterface(tmp_station) {
        // 変数リスト
        var station = tmp_station;
        var time;
        var fare;
        var traffic;
        var distance;
        var teiki1;
        var teiki3;
        var teiki6;
        // 関数リスト
        // station設定
        function getStation() { return station; };
        this.getStation = getStation;
        // time設定
        function setTime(value) { time = value; };
        function getTime() { return time; };
        this.setTime = setTime;
        this.getTime = getTime;
        // fare設定
        function setFare(value) { fare = value; };
        function getFare() { return fare; };
        this.setFare = setFare;
        this.getFare = getFare;
        // traffic設定
        function setTraffic(value) { traffic = value; };
        function getTraffic() { return traffic; };
        this.setTraffic = setTraffic;
        this.getTraffic = getTraffic;
        // distance設定
        function setDistance(value) { distance = value; };
        function getDistance() { return distance; };
        this.setDistance = setDistance;
        this.getDistance = getDistance;
        // teiki1設定
        function setTeiki1(value) { teiki1 = value; };
        function getTeiki1() { return teiki1; };
        this.setTeiki1 = setTeiki1;
        this.getTeiki1 = getTeiki1;
        // teiki3設定
        function setTeiki3(value) { teiki3 = value; };
        function getTeiki3() { return teiki3; };
        this.setTeiki3 = setTeiki3;
        this.getTeiki3 = getTeiki3;
        // teiki6設定
        function setTeiki6(value) { teiki6 = value; };
        function getTeiki6() { return teiki6; };
        this.setTeiki6 = setTeiki6;
        this.getTeiki6 = getTeiki6;
    }

    /**
    * 地点のシリアライズデータを取得
    */
    function getSerializeData() {
        if (typeof serializeData != 'undefined') {
            return serializeData;
        } else {
            return;
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

    // 外部参照可能な関数リスト
    this.createLandmark = createLandmark;
    this.createLandmarkInterface = createLandmarkInterface;
    this.createLandmarkStationInterface = createLandmarkStationInterface;
    this.getSerializeData = getSerializeData;
    this.setConfigure = setConfigure;
};
