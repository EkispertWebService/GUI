/**
 *  駅すぱあと Web サービス
 *  列車時刻表パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *  
 *  Version:2016-06-20
 *  
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiTrainTimeTable = function (pObject, config) {
    // ドキュメントのオブジェクトを格納
    var documentObject = pObject;
    var baseId = pObject.id;

    // Webサービスの設定
    var apiURL = "http://api.ekispert.jp/";

    // GETパラメータからキーの設定
    var key;
    var scripts = document.getElementsByTagName("script");
    var imagePath;
    for (var i = 0; i < scripts.length; i++) {
        var s = scripts[i];
        imagePath = s.src.substring(0, s.src.indexOf("expGuiTrainTimeTable\.js"));
        if (s.src && s.src.match(/expGuiTrainTimeTable\.js(\?.*)?/)) {
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

    // AGENTのチェック
    var agent = 1;
    var isiPad = navigator.userAgent.match(/iPad/i) != null;
    var isiPhone = navigator.userAgent.match(/iPhone/i) != null;
    var isAndroid_phone = (navigator.userAgent.match(/Android/i) != null && navigator.userAgent.match(/Mobile/i) != null);
    var isAndroid_tablet = (navigator.userAgent.match(/Android/i) != null && navigator.userAgent.match(/Mobile/i) == null);
    if (isiPhone || isAndroid_phone) { agent = 2; }
    if (isiPad || isAndroid_tablet) { agent = 3; }

    /**
    * イベントの設定(IE対応版)
    */
    function addEvent(element, eventName, func) {
        if (element) {
            if (typeof eventName == 'string' && typeof func == 'function') {
                if (element.addEventListener) {
                    element.addEventListener(eventName, func, false);
                } else if (element.attachEvent) {
                    element.attachEvent("on" + eventName, func);
                }
            }
        }
    }

    // 変数郡
    var httpObj;
    var timeTable;
    var callbackFunction; // コールバック関数の設定
    var timeTableClickFunction;

    /**
    * 列車時刻表の設置
    */
    function dispStationTrainTimetable(code, callback) {
        var buffer = '';
        buffer += '<div id="' + baseId + ':trainTimetable" style="display:none;"></div>';
        // HTMLへ出力
        documentObject.innerHTML = buffer;
        // 時刻表取得開始
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        //ロード中の表示
        document.getElementById(baseId + ':trainTimetable').innerHTML = '<div class="expLoading"><div class="expText">情報取得中...</div></div>';
        document.getElementById(baseId + ':trainTimetable').style.display = "block";
        var url = apiURL + "v1/json/station/timetable/train?key=" + key + "&code=" + code;
        callbackFunction = callback;
        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            httpObj = new XDomainRequest();
            httpObj.onload = function () {
                JSON_object = JSON.parse(httpObj.responseText);
                outTimeTable(JSON_object);
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
                    outTimeTable(JSON_object);
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
    * 列車時刻表の設置
    */
    function dispCourseTrainTimetable(code, callback) {
        var buffer = '';
        buffer += '<div id="' + baseId + ':trainTimetable" style="display:none;"></div>';
        // HTMLへ出力
        documentObject.innerHTML = buffer;
        // 時刻表取得開始
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        var url = apiURL + "v1/json/course/timetable/train?key=" + key + "&code=" + code;
        callbackFunction = callback;

        var JSON_object = {};
        if (window.XDomainRequest) {
            // IE用
            httpObj = new XDomainRequest();
            httpObj.onload = function () {
                JSON_object = JSON.parse(httpObj.responseText);
                outTimeTable(JSON_object);
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
                    outTimeTable(JSON_object);
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
    * ISOの日時を文字列に変換
    */
    function convertISOtoTime(str, type) {
        var tmp_time = str.split(":");
        var hour = parseInt(tmp_time[0], 10);
        if (typeof type != 'undefined') {
            if (type == "yesterday") { hour += 24; }
        }
        return String(hour) + ":" + tmp_time[1];
    }

    /**
    * 時刻表の出力開始
    */
    function outTimeTable(timeTableObject) {
        timeTable = timeTableObject;

        // 時刻表の出力
        outTimeTableObj();

        if (typeof callbackFunction == 'function') {
            callbackFunction(true);
        }
    }

    /**
    * 時刻表内の時間出力
    */
    function getTimeString(timeObject) {
        var linkTimeList = convertISOtoTime(timeObject.text, timeObject.operation).split(':');
        return '<a id="' + baseId + ':table:' + String(parseInt(linkTimeList[0], 10)) + ':' + String(parseInt(linkTimeList[1], 10)) + '" href="Javascript:void(0);" style="text-decoration:none;color:Black;font-weight:bold;">' + convertISOtoTime(timeObject.text) + '</a>';
    }

    /**
    * 時刻表の出力
    */
    function outTimeTableObj() {
        // 時刻表の表示
        var buffer = '';
        var buffer;
        if (agent == 1) {
            buffer = '<div class="expGuiTrainTimeTable expGuiTrainTimeTablePc">';
        } else if (agent == 2) {
            buffer = '<div class="expGuiTrainTimeTable expGuiTrainTimeTablePhone">';
        } else if (agent == 3) {
            buffer = '<div class="expGuiTrainTimeTable expGuiTrainTimeTableTablet">';
        }
        buffer += '<div class="exp_header">';
        buffer += '<div class="exp_name"><span class="exp_value">' + timeTable.ResultSet.Line.Name + '</span></div>';
        buffer += '<div class="exp_comment"><span class="exp_value">' + timeTable.ResultSet.Line.DriveComment + '</span></div>';
        buffer += '</div>';

        buffer += '<div class="exp_timeTable">';
        buffer += '<table>';
        buffer += '<tr><th class="exp_tableHeader">駅名</th><th class="exp_tableHeader" colspan="2">時刻</th></tr>';
        for (var i = 0; i < timeTable.ResultSet.Line.Stop.length; i++) {
            buffer += '<tr class="exp_' + ((i % 2 == 0) ? "odd" : "even") + '">';
            // 発着時刻の取得
            var dateTimeObject = (typeof timeTable.ResultSet.Line.Stop[i].DepartureState != 'undefined') ? timeTable.ResultSet.Line.Stop[i].DepartureState.Datetime : timeTable.ResultSet.Line.Stop[i].ArrivalState.Datetime;
            var linkTimeList = convertISOtoTime(dateTimeObject.text, dateTimeObject.operation).split(':');
            if (typeof timeTable.ResultSet.Line.Stop[i].DepartureState == 'undefined' || typeof timeTable.ResultSet.Line.Stop[i].ArrivalState == 'undefined') {
                // どちらか一方
                buffer += '<td class="exp_name"><a id="' + baseId + ':point:' + String(parseInt(linkTimeList[0], 10)) + ':' + String(parseInt(linkTimeList[1], 10)) + '" href="Javascript:void(0);">' + timeTable.ResultSet.Line.Stop[i].Point.Station.Name + '</a></td>';
                buffer += '<td class="exp_minute" colspan="2"><a id="' + baseId + ':table:' + String(parseInt(linkTimeList[0], 10)) + ':' + String(parseInt(linkTimeList[1], 10)) + '" href="Javascript:void(0);">' + linkTimeList.join(":") + '</a></td>';
            } else {
                // 両方ある
                if (timeTable.ResultSet.Line.Stop[i].DepartureState.Datetime.text == timeTable.ResultSet.Line.Stop[i].ArrivalState.Datetime.text) {
                    // 同じ時間
                    buffer += '<td class="exp_name"><a id="' + baseId + ':point:' + String(parseInt(linkTimeList[0], 10)) + ':' + String(parseInt(linkTimeList[1], 10)) + '" href="Javascript:void(0);">' + timeTable.ResultSet.Line.Stop[i].Point.Station.Name + '</a></td>';
                    buffer += '<td class="exp_minute" colspan="2"><a id="' + baseId + ':table:' + String(parseInt(linkTimeList[0], 10)) + ':' + String(parseInt(linkTimeList[1], 10)) + '" href="Javascript:void(0);">' + linkTimeList.join(":") + '</a></td>';
                } else {
                    // 異なる時間
                    var arrTimeList = convertISOtoTime(timeTable.ResultSet.Line.Stop[i].ArrivalState.Datetime.text, timeTable.ResultSet.Line.Stop[i].ArrivalState.Datetime.operation).split(':');
                    var depTimeList = convertISOtoTime(timeTable.ResultSet.Line.Stop[i].DepartureState.Datetime.text, timeTable.ResultSet.Line.Stop[i].DepartureState.Datetime.operation).split(':');
                    buffer += '<td class="exp_name" rowspan="2"><a id="' + baseId + ':point:' + String(parseInt(depTimeList[0], 10)) + ':' + String(parseInt(depTimeList[1], 10)) + '" href="Javascript:void(0);">' + timeTable.ResultSet.Line.Stop[i].Point.Station.Name + '</a></td>';
                    buffer += '<td class="exp_arrival"><span class="exp_caption">着</span></td>';
                    buffer += '<td class="exp_arrivalMinute"><b><a id="' + baseId + ':table:' + String(parseInt(arrTimeList[0], 10)) + ':' + String(parseInt(arrTimeList[1], 10)) + '" href="Javascript:void(0);">' + arrTimeList.join(":") + '</a></td>';
                    buffer += '</tr>';
                    buffer += '<tr class="exp_' + ((i % 2 == 0) ? "odd" : "even") + '">';
                    buffer += '<td class="exp_departure"><span class="exp_caption">発</span></td>';
                    buffer += '<td class="exp_departureMinute"><a id="' + baseId + ':table:' + String(parseInt(depTimeList[0], 10)) + ':' + String(parseInt(depTimeList[1], 10)) + '" href="Javascript:void(0);">' + depTimeList.join(":") + '</a></td>';
                }
            }
            buffer += '</tr>';
        }
        buffer += '</div>';
        buffer += '</div>';
        document.getElementById(baseId + ':trainTimetable').innerHTML = buffer;
        document.getElementById(baseId + ':trainTimetable').style.display = "block";

        // イベントの設置
        for (var i = 0; i < timeTable.ResultSet.Line.Stop.length; i++) {
            // 発着時刻の取得
            var dateTimeObject = (typeof timeTable.ResultSet.Line.Stop[i].DepartureState != 'undefined') ? timeTable.ResultSet.Line.Stop[i].DepartureState.Datetime : timeTable.ResultSet.Line.Stop[i].ArrivalState.Datetime;
            var linkTimeList = convertISOtoTime(dateTimeObject.text, dateTimeObject.operation).split(':');
            // 駅は片方しか設定しない
            addEvent(document.getElementById(baseId + ":point:" + String(parseInt(linkTimeList[0], 10)) + ':' + String(parseInt(linkTimeList[1], 10))), "click", onEvent);
            if (typeof timeTable.ResultSet.Line.Stop[i].DepartureState != 'undefined') {
                // 発時間のイベントを設定
                var depTimeList = convertISOtoTime(timeTable.ResultSet.Line.Stop[i].DepartureState.Datetime.text, timeTable.ResultSet.Line.Stop[i].DepartureState.Datetime.operation).split(':');
                addEvent(document.getElementById(baseId + ":table:" + String(parseInt(depTimeList[0], 10)) + ':' + String(parseInt(depTimeList[1], 10))), "click", onEvent);
                if (typeof timeTable.ResultSet.Line.Stop[i].ArrivalState != 'undefined') {
                    // 同じかをチェック
                    if (timeTable.ResultSet.Line.Stop[i].DepartureState.Datetime.text != timeTable.ResultSet.Line.Stop[i].ArrivalState.Datetime.text) {
                        // 違う場合のみイベントを設置
                        var arrTimeList = convertISOtoTime(timeTable.ResultSet.Line.Stop[i].ArrivalState.Datetime.text, timeTable.ResultSet.Line.Stop[i].ArrivalState.Datetime.operation).split(':');
                        addEvent(document.getElementById(baseId + ":table:" + String(parseInt(arrTimeList[0], 10)) + ':' + String(parseInt(arrTimeList[1], 10))), "click", onEvent);
                    }
                }
            } else {
                // 着時間のイベントを設定
                var arrTimeList = convertISOtoTime(timeTable.ResultSet.Line.Stop[i].ArrivalState.Datetime.text, timeTable.ResultSet.Line.Stop[i].ArrivalState.Datetime.operation).split(':');
                addEvent(document.getElementById(baseId + ":table:" + String(parseInt(arrTimeList[0], 10)) + ':' + String(parseInt(arrTimeList[1], 10))), "click", onEvent);
            }
        }
    }

    /**
    * イベントの振り分け
    */
    function onEvent(e) {
        var eventIdList = (e.srcElement) ? e.srcElement.id.split(":") : e.target.id.split(":");
        if (eventIdList.length >= 2) {
            if (eventIdList[1] == "point" && eventIdList.length == 4) {
                // 駅ををクリック
                if (typeof timeTableClickFunction != 'undefined') {
                    timeTableClickFunction(((eventIdList[2].length == 1) ? "0" : "") + eventIdList[2] + ((eventIdList[3].length == 1) ? "0" : "") + eventIdList[3]);
                }
            } else if (eventIdList[1] == "table" && eventIdList.length == 4) {
                // 時刻表をクリック
                if (typeof timeTableClickFunction != 'undefined') {
                    timeTableClickFunction(((eventIdList[2].length == 1) ? "0" : "") + eventIdList[2] + ((eventIdList[3].length == 1) ? "0" : "") + eventIdList[3]);
                }
            }
        }
    }

    /**
    * 時間から地点オブジェクトを取得
    */
    function getPointObject(time) {
        var checkTime = String(Number(String(time).substr(0, 2), 10)) + ":" + String(time).substr(2);
        if (typeof timeTable.ResultSet.Line != 'undefined') {
            for (var i = 0; i < timeTable.ResultSet.Line.Stop.length; i++) {
                //着時間をチェック
                if (typeof timeTable.ResultSet.Line.Stop[i].ArrivalState != 'undefined') {
                    if (convertISOtoTime(timeTable.ResultSet.Line.Stop[i].ArrivalState.Datetime.text, timeTable.ResultSet.Line.Stop[i].ArrivalState.Datetime.operation) == checkTime) {
                        return convertPointObject(timeTable.ResultSet.Line.Stop[i]);
                    }
                }
                //発時間をチェック
                if (typeof timeTable.ResultSet.Line.Stop[i].DepartureState != 'undefined') {
                    if (convertISOtoTime(timeTable.ResultSet.Line.Stop[i].DepartureState.Datetime.text, timeTable.ResultSet.Line.Stop[i].DepartureState.operation) == checkTime) {
                        return convertPointObject(timeTable.ResultSet.Line.Stop[i]);
                    }
                }
            }
        }
        return;
    }

    /**
    * pointオブジェクトを作成
    */
    function convertPointObject(stopObject) {
        var tmpPointObject = new Object();
        tmpPointObject.name = stopObject.Point.Station.Name;
        tmpPointObject.code = stopObject.Point.Station.code;
        tmpPointObject.getOn = (stopObject.Point.getOn == "True") ? true : false;
        tmpPointObject.getOff = (stopObject.Point.getOff == "True") ? true : false;
        // 発時刻
        if (typeof stopObject.DepartureState != 'undefined') {
            tmpPointObject.departureTime = convertISOtoTime(stopObject.DepartureState.Datetime.text, stopObject.DepartureState.Datetime.operation);
        }
        // 着時刻
        if (typeof stopObject.ArrivalState != 'undefined') {
            tmpPointObject.arrivalTime = convertISOtoTime(stopObject.ArrivalState.Datetime.text, stopObject.ArrivalState.Datetime.operation);
        }
        return tmpPointObject;
    }

    /**
    * 環境設定
    */
    function setConfigure(name, value) {
        if (name.toLowerCase() == String("apiURL").toLowerCase()) {
            apiURL = value;
        } else if (name.toLowerCase() == String("key").toLowerCase()) {
            key = value;
        } else if (name.toLowerCase() == String("Agent").toLowerCase()) {
            agent = value;
        } else if (String(name).toLowerCase() == String("ssl").toLowerCase()) {
            if (String(value).toLowerCase() == "true" || String(value).toLowerCase() == "enable" || String(value).toLowerCase() == "enabled") {
                apiURL = apiURL.replace('http://', 'https://');
            } else {
                apiURL = apiURL.replace('https://', 'http://');
            }
        }
    }

    /**
    * コールバック関数の定義
    */
    function bind(type, func) {
        if (type == 'click' && typeof func == 'function') {
            timeTableClickFunction = func;
        }
    }

    /**
    * コールバック関数の解除
    */
    function unbind(type) {
        if (type == 'click') {
            timeTableClickFunction = undefined;
        }
    }

    // 外部参照可能な関数リスト
    this.dispStationTrainTimetable = dispStationTrainTimetable;
    this.dispCourseTrainTimetable = dispCourseTrainTimetable;
    this.getPointObject = getPointObject;
    this.setConfigure = setConfigure;
    this.bind = bind;
    this.unbind = unbind;

    // 端末制御
    this.AGENT_PC = 1;
    this.AGENT_PHONE = 2;
    this.AGENT_TABLET = 3;
};
