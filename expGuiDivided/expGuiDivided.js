/**
 *  駅すぱあと Web サービス
 *  分割計算パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *  
 *  Version:2016-06-20
 *  
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiDivided = function (pObject, config) {
    // Webサービスの設定
    var apiURL = "http://api.ekispert.jp/";

    // GETパラメータからキーの設定
    var key;
    var scripts = document.getElementsByTagName("script");
    var imagePath;
    for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i];
        imagePath = s.src.substring(0, s.src.indexOf("expGuiDivided\.js"));
        if (s.src && s.src.match(/expGuiDivided\.js(\?.*)?/)) {
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
    var ticketList;
    var PriceType;
    var httpObj;
    // 設定
    var callbackFunction; // コールバック関数の設定

    /**
    * 定期券の分割計算
    */
    function searchTeikiDivided(serializeData, callback) {
        PriceType = "teiki";
        searchDivided(serializeData, callback);
    }

    /**
    * 定期券の分割計算
    */
    function searchFareDivided(serializeData, callback) {
        PriceType = "fare";
        searchDivided(serializeData, callback);
    }

    /**
    * 分割計算の実行
    */
    function searchDivided(serializeData, callback) {
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        var url = apiURL + "v1/json/course/" + PriceType + "/divided?key=" + key;
        url += "&serializeData=" + serializeData;
        callbackFunction = callback;
        couponDetailList = new Array();
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            httpObj = new XDomainRequest();
            httpObj.onload = function () {
                JSON_object = JSON.parse(httpObj.responseText);
                setDivided(JSON_object);
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
                    setDivided(JSON_object);
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
    * 分割計算一覧を解析
    */
    function setDivided(json) {
        ticketList = new Array();
        var tmp_dividedList = json;
        if (typeof tmp_dividedList.ResultSet.Ticket == 'undefined') {
            // 失敗
            if (typeof callbackFunction == 'function') {
                callbackFunction(false);
            }
        } else if (typeof tmp_dividedList.ResultSet.Ticket.length == 'undefined') {
            ticketList = setTicket(tmp_dividedList.ResultSet.Ticket);
            // 成功
            if (typeof callbackFunction == 'function') {
                callbackFunction(true);
            }
        } else {
            for (var i = 0; i < tmp_dividedList.ResultSet.Ticket.length; i++) {
                ticketList = ticketList.concat(setTicket(tmp_dividedList.ResultSet.Ticket[i]));
            }
            // 成功
            if (typeof callbackFunction == 'function') {
                callbackFunction(true);
            }
        }
    }

    /**
    * オブジェクトの値を取得
    */
    function getTextValue(obj) {
        if (typeof obj.text != "undefined") {
            return obj.text;
        } else {
            return obj;
        }
    }

    /**
    * チケット要素
    */
    function setTicket(tmpTicketPart) {
        tmp_partList = new Array();
        if (typeof tmpTicketPart.Part != 'undefined') {
            if (typeof tmpTicketPart.Part.length == 'undefined') {
                tmp_partList.push(setTicketPart(tmpTicketPart.Part, tmpTicketPart.type));
            } else {
                for (var i = 0; i < tmpTicketPart.Part.length; i++) {
                    tmp_partList.push(setTicketPart(tmpTicketPart.Part[i], tmpTicketPart.type));
                }
            }
        }
        return tmp_partList;
    }

    /**
    * 分割部分要素
    */
    function setTicketPart(tmpTicketPart, type) {
        var tmp_ticket = new Object();
        tmp_ticket.type = String(type).toLowerCase();
        tmp_ticket.price = parseInt(getTextValue(tmpTicketPart.Price.Oneway));
        tmp_ticket.from = setPointObject(tmpTicketPart.Point[0]);
        tmp_ticket.to = setPointObject(tmpTicketPart.Point[1]);
        return tmp_ticket;
    }

    /**
    * 地点オブジェクトを取得
    */
    function setPointObject(tmpPoint) {
        var tmp_station = new Object();
        tmp_station.name = tmpPoint.Station.Name;
        tmp_station.code = tmpPoint.Station.code;
        tmp_station.yomi = tmpPoint.Station.Yomi;
        if (typeof tmpPoint.Station.Type.text != 'undefined') {
            tmp_station.type = tmpPoint.Station.Type.text;
            if (typeof tmpPoint.Station.Type.detail != 'undefined') {
                tmp_station.type_detail = tmpPoint.Station.Type.text + "." + tmpPoint.Station.Type.detail;
            }
        } else {
            tmp_station.type = tmpPoint.Station.Type;
        }
        //県コード
        if (typeof tmpPoint.Prefecture != 'undefined') {
            tmp_station.kenCode = parseInt(tmpPoint.Prefecture.code);
        }
        return tmp_station;
    }

    /**
    * 分割計算の詳細一覧取得
    */
    function getDividedObject(index) {
        var tmp_dividedObject = new Object();
        if (typeof ticketList != 'undefined') {
            if (typeof ticketList[parseInt(index) - 1] != 'undefined') {
                tmp_dividedObject.type = ticketList[parseInt(index) - 1].type;
                tmp_dividedObject.from = ticketList[parseInt(index) - 1].from.name;
                tmp_dividedObject.to = ticketList[parseInt(index) - 1].to.name;
                tmp_dividedObject.price = ticketList[parseInt(index) - 1].price;
                return tmp_dividedObject;
            }
        }
    }

    /**
    * 駅情報の取得
    */
    function getPointObject(station) {
        // オブジェクトコピー用インライン関数
        function clone(obj) {
            var f = function () { };
            f.prototype = obj;
            return new f;
        }
        if (typeof ticketList != 'undefined') {
            for (var i = 0; i < ticketList.length; i++) {
                if (isNaN(station)) {
                    if (ticketList[i].from.name == station) {
                        return clone(ticketList[i].from);
                    } else if (ticketList[i].to.name == station) {
                        return clone(ticketList[i].to);
                    }
                } else {
                    if (ticketList[i].from.code == station) {
                        return clone(ticketList[i].from);
                    } else if (ticketList[i].to.code == station) {
                        return clone(ticketList[i].to);
                    }
                }
            }
        }
    }

    /**
    * 分割計算金額取得
    */
    function getPrice(type) {
        if (typeof ticketList != 'undefined') {
            var total = 0;
            if (PriceType == "fare") {
                for (var i = 0; i < ticketList.length; i++) {
                    total += ticketList[i].price;
                }
                return total;
            } else {
                for (var i = 0; i < ticketList.length; i++) {
                    if (ticketList[i].type == type) {
                        total += ticketList[i].price;
                    }
                }
                return total;
            }
        }
    }

    /**
    * 分割枚数をintで取得
    */
    function getDividedCount() {
        if (typeof ticketList != 'undefined') {
            return ticketList.length;
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
    this.searchTeikiDivided = searchTeikiDivided;
    this.searchFareDivided = searchFareDivided;
    this.getPrice = getPrice;
    this.getDividedCount = getDividedCount;
    this.getDividedObject = getDividedObject;
    this.getPointObject = getPointObject;
    this.setConfigure = setConfigure;

    // 定数リスト
    this.PRICE_ONEWAY = "oneway";
    this.PRICE_ROUND = "round";
    this.PRICE_TEIKI = "teiki";
    this.TEIKI1 = 1;
    this.TEIKI3 = 3;
    this.TEIKI6 = 6;
    this.TYPE_TEIKI1 = "teiki1";
    this.TYPE_TEIKI3 = "teiki3";
    this.TYPE_TEIKI6 = "teiki6";
    this.TYPE_FARE = "fare";
};
