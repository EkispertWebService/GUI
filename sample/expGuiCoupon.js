/**
 *  駅すぱあと Web サービス
 *  回数券情報パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *  
 *  Version:2016-06-20
 *  
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiCoupon = function (pObject, config) {
    // Webサービスの設定
    var apiURL = "http://api.ekispert.jp/";

    // GETパラメータからキーの設定
    var key;
    var scripts = document.getElementsByTagName("script");
    var imagePath;
    for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i];
        imagePath = s.src.substring(0, s.src.indexOf("expGuiCoupon\.js"));
        if (s.src && s.src.match(/expGuiCoupon\.js(\?.*)?/)) {
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
    var couponList = new Array();
    var couponDetailList = new Object();
    var httpObj;
    // 設定
    var callbackFunction; // コールバック関数の設定

    /**
    * 回数券の検索
    */
    function searchCoupon(param1, param2) {
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        var url = apiURL + "v1/json/coupon/list?key=" + key;
        if (typeof param1 == 'undefined') {
            callbackFunction = undefined;
        } else if (typeof param2 == 'undefined') {
            if (typeof param1 == 'function') {
                callbackFunction = param1;
            } else {
                // コールバックなし
                url += "&name=" + encodeURIComponent(param1);
                callbackFunction = undefined;
            }
        } else {
            url += "&name=" + encodeURIComponent(param1);
            callbackFunction = param2;
        }
        couponList = new Array();
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            httpObj = new XDomainRequest();
            httpObj.onload = function () {
                JSON_object = JSON.parse(httpObj.responseText);
                setCoupon(JSON_object);
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
                    setCoupon(JSON_object);
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
    * 回数券一覧を解析
    */
    function setCoupon(json) {
        var tmp_couponList = json;
        if (typeof tmp_couponList.ResultSet.Coupon == 'undefined') {
            // 失敗
            if (typeof callbackFunction == 'function') {
                callbackFunction(false);
            }
        } else if (typeof tmp_couponList.ResultSet.Coupon.length == 'undefined') {
            couponList.push(tmp_couponList.ResultSet.Coupon.Name);
            // 成功
            if (typeof callbackFunction == 'function') {
                callbackFunction(true);
            }
        } else {
            for (var i = 0; i < tmp_couponList.ResultSet.Coupon.length; i++) {
                couponList.push(tmp_couponList.ResultSet.Coupon[i].Name);
            }
            // 成功
            if (typeof callbackFunction == 'function') {
                callbackFunction(true);
            }
        }
    }

    /**
    * 回数券の一覧を取得
    */
    function getCouponList() {
        return couponList.join(",");
    }

    /**
    * 回数券情報の詳細を取得
    */
    function searchCouponDetail(name, callback) {
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        var url = apiURL + "v1/json/coupon/detail?key=" + key;
        url += "&name=" + encodeURIComponent(name);
        callbackFunction = callback;
        couponDetailList = new Array();
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            httpObj = new XDomainRequest();
            httpObj.onload = function () {
                JSON_object = JSON.parse(httpObj.responseText);
                setCouponDetail(JSON_object);
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
                    setCouponDetail(JSON_object);
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
    * 探索結果を利用して回数券を取得
    */
    function searchCourseCoupon(serializeData, callback) {
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        var url = apiURL + "v1/json/coupon/detail?key=" + key;
        url += "&serializeData=" + serializeData;
        callbackFunction = callback;
        couponDetailList = new Array();
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            httpObj = new XDomainRequest();
            httpObj.onload = function () {
                JSON_object = JSON.parse(httpObj.responseText);
                setCouponDetail(JSON_object);
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
                    setCouponDetail(JSON_object);
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
    * 回数券の詳細情報
    */
    function setCouponDetail(json) {
        var tmp_couponDetail = json;
        if (typeof tmp_couponDetail.ResultSet.Coupon == 'undefined') {
            // 失敗
            if (typeof callbackFunction == 'function') {
                callbackFunction(false);
            }
        } else if (typeof tmp_couponDetail.ResultSet.Coupon.length == 'undefined') {
            couponDetailList.push(setCouponObject(tmp_couponDetail.ResultSet.Coupon));
            // 成功
            if (typeof callbackFunction == 'function') {
                callbackFunction(true);
            }
        } else {
            for (var i = 0; i < tmp_couponDetail.ResultSet.Coupon.length; i++) {
                couponDetailList.push(setCouponObject(tmp_couponDetail.ResultSet.Coupon[i]));
            }
            // 成功
            if (typeof callbackFunction == 'function') {
                callbackFunction(true);
            }
        }
    }

    /**
    * 回数券オブジェクトの作成
    */
    function setCouponObject(couponObject) {
        var tmp_coupon = new Object();
        tmp_coupon.name = couponObject.Name;
        if (typeof couponObject.Detail != 'undefined') {
            // 回数券詳細
            tmp_coupon.count = couponObject.Detail.Count;
            tmp_coupon.validPeriod = couponObject.Detail.ValidPeriod;
            tmp_coupon.direction = couponObject.Detail.Direction;
            tmp_coupon.price = couponObject.Detail.Price.Amount;
        }
        return tmp_coupon;
    }

    /**
    * 回数券の詳細一覧取得
    */
    function getCouponDetailList() {
        var buffer = "";
        for (var i = 0; i < couponDetailList.length; i++) {
            if (i != 0) { buffer += ","; }
            buffer += couponDetailList[i].name;
        }
        return buffer;
    }

    /**
    * 回数券情報の取得
    */
    function getCouponObject(name) {
        for (var i = 0; i < couponDetailList.length; i++) {
            if (couponDetailList[i].name == name) {
                function clone(obj) {
                    var f = function () { };
                    f.prototype = obj;
                    return new f;
                }
                return clone(couponDetailList[i]);
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

    // 外部参照可能な関数リスト
    this.searchCoupon = searchCoupon;
    this.getCouponList = getCouponList;
    this.searchCouponDetail = searchCouponDetail;
    this.getCouponDetailList = getCouponDetailList;
    this.getCouponObject = getCouponObject;
    this.searchCourseCoupon = searchCourseCoupon;
    this.setConfigure = setConfigure;

    // 定数リスト
    this.DIRECTION_BOTH = "Both";
    this.DIRECTION_DEFINE = "Define";
};
