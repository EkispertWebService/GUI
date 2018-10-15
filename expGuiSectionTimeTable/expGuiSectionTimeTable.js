/**
 *  駅すぱあと Web サービス
 *  区間時刻表パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *  
 *  Version:2016-06-20
 *  
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiSectionTimeTable = function (pObject, config) {
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
        imagePath = s.src.substring(0, s.src.indexOf("expGuiSectionTimeTable\.js"));
        if (s.src && s.src.match(/expGuiSectionTimeTable\.js(\?.*)?/)) {
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
    var sectionList;
    var timeTable;
    var type;
    var callbackFunction; // コールバック関数の設定
    var timeTableClickFunction;

    /**
    * 空路時刻表の設置
    */
    function dispPlaneTimetable(railName, direction, param1, param2) {
        type = "plane";
        var buffer = '';
        buffer += '<div id="' + baseId + ':sectionTimetable" style="display:none;"></div>';
        // HTMLへ出力
        documentObject.innerHTML = buffer;
        // 時刻表取得開始
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        //ロード中の表示
        document.getElementById(baseId + ':sectionTimetable').innerHTML = '<div class="expLoading"><div class="expText">時刻表取得中...</div></div>';
        document.getElementById(baseId + ':sectionTimetable').style.display = "block";
        var url = apiURL + "v1/json/plane/timetable?key=" + key + "&railName=" + encodeURIComponent(railName);
        url += "&direction=" + String(direction);
        if (typeof param1 == 'undefined') {
            callbackFunction = undefined;
        } else if (typeof param2 == 'undefined') {
            if (typeof param1 == 'function') {
                // 日付なし
                callbackFunction = param1;
            } else {
                // コールバックなし
                url += "&date=" + param1;
                callbackFunction = undefined;
            }
        } else {
            url += "&date=" + param1;
            callbackFunction = param2;
        }
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
    * バスの時刻表を表示
    */
    function dispBusTimetable(from, to, param1, param2) {
        type = "bus";
        var buffer = '';
        buffer += '<div id="' + baseId + ':sectionTimetable" style="display:none;"></div>';
        // HTMLへ出力
        documentObject.innerHTML = buffer;
        // 時刻表取得開始
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        //ロード中の表示
        document.getElementById(baseId + ':sectionTimetable').innerHTML = '<div class="expLoading"><div class="expText">経路取得中...</div></div>';
        document.getElementById(baseId + ':sectionTimetable').style.display = "block";
        var url = apiURL + "v1/json/bus/timetable?key=" + key + "&from=" + encodeURIComponent(from) + "&to=" + encodeURIComponent(to);
        if (typeof param1 == 'undefined') {
            callbackFunction = undefined;
        } else if (typeof param2 == 'undefined') {
            if (typeof param1 == 'function') {
                // 日付なし
                callbackFunction = param1;
            } else {
                // コールバックなし
                url += "&date=" + param1;
                callbackFunction = undefined;
            }
        } else {
            url += "&date=" + param1;
            callbackFunction = param2;
        }
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
    * 海路の時刻表を表示
    */
    function dispShipTimetable(railName, direction, param1, param2) {
        type = "ship";
        var buffer = '';
        buffer += '<div id="' + baseId + ':sectionTimetable" style="display:none;"></div>';
        // HTMLへ出力
        documentObject.innerHTML = buffer;
        // 時刻表取得開始
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        //ロード中の表示
        document.getElementById(baseId + ':sectionTimetable').innerHTML = '<div class="expLoading"><div class="expText">経路取得中...</div></div>';
        document.getElementById(baseId + ':sectionTimetable').style.display = "block";
        var url = apiURL + "v1/json/ship/timetable?key=" + key + "&railName=" + encodeURIComponent(railName);
        url += "&direction=" + String(direction);
        if (typeof param1 == 'undefined') {
            callbackFunction = undefined;
        } else if (typeof param2 == 'undefined') {
            if (typeof param1 == 'function') {
                // 日付なし
                callbackFunction = param1;
            } else {
                // コールバックなし
                url += "&date=" + param1;
                callbackFunction = undefined;
            }
        } else {
            url += "&date=" + param1;
            callbackFunction = param2;
        }
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
    * 路線の時刻表
    */
    function dispRailTimetable(serializeData, sectionIndex, callback) {
        type = "rail";
        var buffer = '';
        buffer += '<div id="' + baseId + ':sectionTimetable" style="display:none;"></div>';
        // HTMLへ出力
        documentObject.innerHTML = buffer;
        // 時刻表取得開始
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        //ロード中の表示
        document.getElementById(baseId + ':sectionTimetable').innerHTML = '<div class="expLoading"><div class="expText">経路取得中...</div></div>';
        document.getElementById(baseId + ':sectionTimetable').style.display = "block";
        var url = apiURL + "v1/json/rail?key=" + key + "&serializeData=" + serializeData;
        url += "&sectionIndex=" + String(sectionIndex);
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
    * 時刻表の出力
    */
    function outTimeTable(timeTableObject) {
        timeTable = timeTableObject;
        // 時刻表の出力
        if (outTimeTableObj()) {
            if (typeof callbackFunction == 'function') {
                callbackFunction(true);
            }
        } else {
            if (typeof callbackFunction == 'function') {
                callbackFunction(false);
            }
        }
    }

    /**
    * 時刻表の表示
    */
    function outTimeTableObj() {
        var timeTableList = new Array();
        if (typeof timeTable.ResultSet.Line != 'undefined') {
            // 路線の時刻表
            if (typeof timeTable.ResultSet.Line.length == 'undefined') {
                // 一便だけ
                timeTableList.push(timeTable.ResultSet.Line);
            } else {
                for (var i = 0; i < timeTable.ResultSet.Line.length; i++) {
                    timeTableList.push(timeTable.ResultSet.Line[i]);
                }
            }
        } else if (typeof timeTable.ResultSet.TimeTable != 'undefined') {
            if (typeof timeTable.ResultSet.TimeTable.Line.length == 'undefined') {
                // 一便だけ
                timeTableList.push(timeTable.ResultSet.TimeTable.Line);
            } else {
                for (var i = 0; i < timeTable.ResultSet.TimeTable.Line.length; i++) {
                    timeTableList.push(timeTable.ResultSet.TimeTable.Line[i]);
                }
            }
        } else {
            return false;
        }
        // 時刻表出力
        var buffer;
        if (agent == 1) {
            buffer = '<div class="expGuiSectionTimeTable expGuiSectionTimeTablePc">';
        } else if (agent == 2) {
            buffer = '<div class="expGuiSectionTimeTable expGuiSectionTimeTablePhone">';
        } else if (agent == 3) {
            buffer = '<div class="expGuiSectionTimeTable expGuiSectionTimeTableTablet">';
        }
        if (typeof timeTable.ResultSet.TimeTable != 'undefined') {
            if (agent == 1) {
                buffer += '<div class="exp_header">';
            } else if (agent == 2 || agent == 3) {
                buffer += '<div class="exp_header exp_clearfix">';
            }
            buffer += '<div class="exp_headerTitle">';
            if (agent == 1) {
                if (type == "plane") {
                    buffer += '<div class="exp_from"><span class="exp_title">出発地</span><span class="exp_value">' + timeTable.ResultSet.TimeTable.Station.Name + '</span></div>';
                    buffer += '<div class="exp_to"><span class="exp_title">到着地</span><span class="exp_value">' + timeTable.ResultSet.TimeTable.Direction + '</span></div>';
                } else if (type == "bus") {
                    buffer += '<div class="exp_name"><span class="exp_value">' + timeTable.ResultSet.TimeTable.Station.Name + '</span></div>';
                } else if (type == "ship") {
                    buffer += '<div class="exp_from"><span class="exp_title">出発地</span><span class="exp_value">' + timeTable.ResultSet.TimeTable.Station.Name + '</span></div>';
                    buffer += '<div class="exp_to"><span class="exp_title">到着地</span><span class="exp_value">' + timeTable.ResultSet.TimeTable.Direction + '</span></div>';
                }
            } else if (agent == 2) {
                if (type == "plane") {
                    buffer += '<div class="exp_from"><span class="exp_title">出</span><span class="exp_value">' + timeTable.ResultSet.TimeTable.Station.Name + '</span></div>';
                    buffer += '<div class="exp_to"><span class="exp_title">到</span><span class="exp_value">' + timeTable.ResultSet.TimeTable.Direction + '</span></div>';
                } else if (type == "bus") {
                    buffer += '<div class="exp_name"><span class="exp_value">' + timeTable.ResultSet.TimeTable.Station.Name + '</span></div>';
                } else if (type == "ship") {
                    buffer += '<div class="exp_from"><span class="exp_title">出</span><span class="exp_value">' + timeTable.ResultSet.TimeTable.Station.Name + '</span></div>';
                    buffer += '<div class="exp_to"><span class="exp_title">到</span><span class="exp_value">' + timeTable.ResultSet.TimeTable.Direction + '</span></div>';
                }
            } else if (agent == 3) {
                if (type == "plane") {
                    buffer += '<div class="exp_from"><span class="exp_title">出</span><span class="exp_value">' + timeTable.ResultSet.TimeTable.Station.Name + '</span></div>';
                    buffer += '<div class="exp_cursor"></div>';
                    buffer += '<div class="exp_to"><span class="exp_title">到</span><span class="exp_value">' + timeTable.ResultSet.TimeTable.Direction + '</span></div>';
                } else if (type == "bus") {
                    buffer += '<div class="exp_name"><span class="exp_value">' + timeTable.ResultSet.TimeTable.Station.Name + '</span></div>';
                } else if (type == "ship") {
                    buffer += '<div class="exp_from"><span class="exp_title">出</span><span class="exp_value">' + timeTable.ResultSet.TimeTable.Station.Name + '</span></div>';
                    buffer += '<div class="exp_cursor"></div>';
                    buffer += '<div class="exp_to"><span class="exp_title">到</span><span class="exp_value">' + timeTable.ResultSet.TimeTable.Direction + '</span></div>';
                }
            }
            buffer += '</div>';
            if (agent == 2 || agent == 3) {
                var hour;
                buffer += '<div class="exp_clock">';
                buffer += '<select id="' + baseId + ':clock">';
                for (var i = 0; i < timeTableList.length; i++) {
                    var tmpDepartureTime = convertISOtoTime(timeTableList[i].DepartureState.Datetime.text, timeTableList[i].DepartureState.Datetime.operation).split(':');
                    if (hour != parseInt(tmpDepartureTime[0], 10)) {
                        hour = parseInt(tmpDepartureTime[0], 10);
                        buffer += '<option value="' + hour + '">' + hour + '</option>';
                    }
                }
                buffer += '</select>';
                buffer += '</div>';
            }
            buffer += '</div>';
        }
        // 時刻表
        var hour;
        var row = 0;
        buffer += '<div class="exp_timeTable">';
        for (var i = 0; i < timeTableList.length; i++) {
            // 時間が変わる場合はヘッダを出力
            var tmpDepartureTime = convertISOtoTime(timeTableList[i].DepartureState.Datetime.text, timeTableList[i].DepartureState.Datetime.operation).split(':');
            if (hour != parseInt(tmpDepartureTime[0], 10)) {
                hour = parseInt(tmpDepartureTime[0], 10);
                buffer += '<div class="exp_hour">';
                buffer += '<a id="' + baseId + ':timetable:' + String(hour) + '"></a>';
                buffer += '<span class="exp_value">' + String(hour) + '時</span>';
                buffer += '</div>';
                row = 1;
            } else {
                row++;
            }
            buffer += '<div class="exp_line exp_' + (row % 2 == 0 ? "even" : "odd") + '' + (agent == 3 ? " exp_tablet" : "") + '">';
            if (agent == 1 || agent == 3) {
                buffer += outLineTimeTable(timeTableList[i], (i + 1));
            } else if (agent == 2) {
                buffer += outLineTimeTablePhone(timeTableList[i], (i + 1));
            }
            buffer += '</div>';
        }
        buffer += '</div>';
        buffer += '</div>';
        document.getElementById(baseId + ':sectionTimetable').innerHTML = buffer;
        document.getElementById(baseId + ':sectionTimetable').style.display = "block";

        // イベントの設定
        for (var i = 0; i < timeTableList.length; i++) {
            addEvent(document.getElementById(baseId + ":table:" + String(i) + ":name"), "click", onEvent);
            addEvent(document.getElementById(baseId + ":table:" + String(i) + ":number"), "click", onEvent);
            addEvent(document.getElementById(baseId + ":table:" + String(i) + ":station"), "click", onEvent);
            addEvent(document.getElementById(baseId + ":table:" + String(i) + ":departure"), "click", onEvent);
            addEvent(document.getElementById(baseId + ":table:" + String(i) + ":arrival"), "click", onEvent);
        }
        // 時間のイベント
        addEvent(document.getElementById(baseId + ":clock"), "change", onEvent);
        return true;
    }

    /**
    * 名称を短くする
    */
    function convertName(stationName) {
        if (stationName.indexOf("／") == -1) {
            return stationName;
        } else {
            return stationName.substring(0, stationName.lastIndexOf("／"));
        }
    }

    /**
    * 区間のデータを出力
    */
    function outLineTimeTable(lineObject, lineNo) {
        var buffer = '';
        buffer += '<div class="exp_data exp_clearfix">';
        if (type == "plane") {
            buffer += '<div class="exp_icon"><span class="exp_plane"></span></div>';
            buffer += '<div class="exp_name"><a id="' + baseId + ':table:' + String(lineNo) + ':name" href="Javascript:void(0);">' + lineObject.Name.abbreviation + '</a></div>';
        } else if (type == "bus") {
            buffer += '<div class="exp_icon"><span class="exp_bus"></span></div>';
            buffer += '<div class="exp_name"><a id="' + baseId + ':table:' + String(lineNo) + ':name" href="Javascript:void(0);">' + lineObject.Name + '</a></div>';
        } else if (type == "ship") {
            buffer += '<div class="exp_icon"><span class="exp_ship"></span></div>';
        } else if (type == "rail") {
            // 複合
            if (lineObject.Type == 'train') {
                buffer += '<div class="exp_icon"><span class="exp_train"></span></div>';
            } else if (lineObject.Type == "plane") {
                buffer += '<div class="exp_icon"><span class="exp_plane"></span></div>';
            } else if (lineObject.Type == "ship") {
                buffer += '<div class="exp_icon"><span class="exp_ship"></span></div>';
            } else if (lineObject.Type == "bus") {
                buffer += '<div class="exp_icon"><span class="exp_bus"></span></div>';
            }
            var lineName = lineObject.Name;
            if (typeof lineObject.Number != 'undefined') {
                if (lineObject.Type == 'train') {
                    lineName += '&nbsp;' + lineObject.Number + '号';
                } else if (lineObject.Type == "plane" || lineObject.Type == "ship") {
                    lineName += '&nbsp;' + lineObject.Number + '便';
                }
            }
            buffer += '<div class="exp_name"><a id="' + baseId + ':table:' + String(lineNo) + ':name" href="Javascript:void(0);">' + lineName + '</a></div>';
        }
        var tmpDepartureTime = convertISOtoTime(lineObject.DepartureState.Datetime.text, lineObject.DepartureState.Datetime.operation).split(':');
        var tmpArrivalTime = convertISOtoTime(lineObject.ArrivalState.Datetime.text, lineObject.ArrivalState.Datetime.operation).split(':');
        if (type == "plane" || type == "ship") {
            if (type == "plane") {
                buffer += '<div class="exp_separator">&nbsp;</div>';
            }
            buffer += '<div class="exp_no"><a id="' + baseId + ':table:' + String(lineNo) + ':number" href="Javascript:void(0);">' + lineObject.Number + '便</a></div>';
        } else if (type == "bus") {
            buffer += '<div class="exp_separator">&nbsp;</div>';
            buffer += '<div class="exp_no"><a id="' + baseId + ':table:' + String(lineNo) + ':station" href="Javascript:void(0);">' + convertName(lineObject.Destination.Station.Name) + '</a></div>';
        }
        buffer += '<div class="exp_time">';
        buffer += '<div class="exp_departure exp_clearfix">';
        buffer += '<span class="exp_caption">出</span>';
        buffer += '<span class="exp_value">';
        buffer += '<a id="' + baseId + ':table:' + String(lineNo) + ':departure" href="Javascript:void(0);">' + convertISOtoTime(lineObject.DepartureState.Datetime.text) + '</a>';
        buffer += '</span>';
        buffer += '</div>';
        buffer += '<div class="exp_arrival exp_clearfix">';
        buffer += '<span class="exp_caption">着</span>';
        buffer += '<span class="exp_value">';
        buffer += '<a id="' + baseId + ':table:' + String(lineNo) + ':arrival" href="Javascript:void(0);">' + convertISOtoTime(lineObject.ArrivalState.Datetime.text) + '</a>';
        buffer += '</span>';
        buffer += '</div>';
        buffer += '</div>';

        buffer += '<div class="exp_return">&nbsp;</div>';
        buffer += '</div>';
        return buffer;
    }

    /**
    * 区間のデータを出力(スマホ用)
    */
    function outLineTimeTablePhone(lineObject, lineNo) {
        var buffer = '';
        buffer += '<div class="exp_data exp_clearfix">';

        buffer += '<div class="exp_time">';
        buffer += '<div class="exp_departure exp_clearfix">';
        buffer += '<span class="exp_caption">出</span>';
        buffer += '<span class="exp_value">';
        buffer += '<a id="' + baseId + ':table:' + String(lineNo) + ':departure" href="Javascript:void(0);">' + convertISOtoTime(lineObject.DepartureState.Datetime.text) + '</a>';
        buffer += '</span>';
        buffer += '</div>';
        buffer += '<div class="exp_arrival exp_clearfix">';
        buffer += '<span class="exp_caption">着</span>';
        buffer += '<span class="exp_value">';
        buffer += '<a id="' + baseId + ':table:' + String(lineNo) + ':arrival" href="Javascript:void(0);">' + convertISOtoTime(lineObject.ArrivalState.Datetime.text) + '</a>';
        buffer += '</span>';
        buffer += '</div>';
        buffer += '</div>';

        buffer += '<div class="exp_info">';
        if (type == "plane") {
            buffer += '<div class="exp_icon"><span class="exp_plane"></span></div>';
            buffer += '<div class="exp_name"><a id="' + baseId + ':table:' + String(lineNo) + ':name" href="Javascript:void(0);">' + lineObject.Name.abbreviation + '</a></div>';
        } else if (type == "bus") {
            buffer += '<div class="exp_icon"><span class="exp_bus"></span></div>';
            buffer += '<div class="exp_name"><a id="' + baseId + ':table:' + String(lineNo) + ':name" href="Javascript:void(0);">' + lineObject.Name + '</a></div>';
        } else if (type == "ship") {
            buffer += '<div class="exp_icon"><span class="exp_ship"></span></div>';
        } else if (type == "rail") {
            // 複合
            if (lineObject.Type == 'train') {
                buffer += '<div class="exp_icon"><span class="exp_train"></span></div>';
            } else if (lineObject.Type == "plane") {
                buffer += '<div class="exp_icon"><span class="exp_plane"></span></div>';
            } else if (lineObject.Type == "ship") {
                buffer += '<div class="exp_icon"><span class="exp_ship"></span></div>';
            } else if (lineObject.Type == "bus") {
                buffer += '<div class="exp_icon"><span class="exp_bus"></span></div>';
            }
            var lineName = lineObject.Name;
            if (typeof lineObject.Number != 'undefined') {
                if (lineObject.Type == 'train') {
                    lineName += '&nbsp;' + lineObject.Number + '号';
                } else if (lineObject.Type == "plane" || lineObject.Type == "ship") {
                    lineName += '&nbsp;' + lineObject.Number + '便';
                }
            }
            buffer += '<div class="exp_name"><a id="' + baseId + ':table:' + String(lineNo) + ':name" href="Javascript:void(0);">' + lineName + '</a></div>';
        }
        var tmpDepartureTime = convertISOtoTime(lineObject.DepartureState.Datetime.text, lineObject.DepartureState.Datetime.operation).split(':');
        var tmpArrivalTime = convertISOtoTime(lineObject.ArrivalState.Datetime.text, lineObject.ArrivalState.Datetime.operation).split(':');
        if (type == "plane" || type == "ship") {
            buffer += '<div class="exp_no"><a id="' + baseId + ':table:' + String(lineNo) + ':number" href="Javascript:void(0);">' + lineObject.Number + '便</a></div>';
        } else if (type == "bus") {
            buffer += '<div class="exp_no"><a id="' + baseId + ':table:' + String(lineNo) + ':station" href="Javascript:void(0);">' + convertName(lineObject.Destination.Station.Name) + '</a></div>';
        }
        buffer += '</div>';
        buffer += '</div>';
        return buffer;
    }

    /**
    * イベントの振り分け
    */
    function onEvent(e) {
        var eventIdList = (e.srcElement) ? e.srcElement.id.split(":") : e.target.id.split(":");
        if (eventIdList.length >= 2) {
            if (eventIdList[1] == "table" && eventIdList.length == 4 && typeof timeTableClickFunction != 'undefined') {
                // 時刻表をクリック
                if (typeof timeTable.ResultSet.Line != 'undefined') {
                    // 探索結果
                    if (typeof timeTable.ResultSet.Line.length == 'undefined') {
                        timeTableClickFunction(timeTable.ResultSet.Line.code);
                    } else {
                        timeTableClickFunction(timeTable.ResultSet.Line[parseInt(eventIdList[2])].code);
                    }
                } else {
                    if (typeof timeTable.ResultSet.TimeTable.Line.length == 'undefined') {
                        timeTableClickFunction(timeTable.ResultSet.TimeTable.Line.trainID);
                    } else {
                        timeTableClickFunction(timeTable.ResultSet.TimeTable.Line[parseInt(eventIdList[2])].trainID);
                    }
                }
            } else if (eventIdList[1] == "clock" && eventIdList.length == 2) {
                var hour = document.getElementById(baseId + ':clock').options.item(document.getElementById(baseId + ':clock').selectedIndex).value;
                location.href = "#" + baseId + ":timetable:" + String(hour);
            }
        }
    }

    /**
    * lineオブジェクトを作成
    */
    function convertLineObject(lineObject) {
        var tmpLineObject = new Object();
        // 発着地
        if (typeof timeTable.ResultSet.TimeTable != 'undefined') {
            if (typeof timeTable.ResultSet.TimeTable.Station != 'undefined') {
                if (typeof timeTable.ResultSet.TimeTable.Station.Name != 'undefined') {
                    tmpLineObject.from = timeTable.ResultSet.TimeTable.Station.Name;
                }
            }
            if (typeof timeTable.ResultSet.TimeTable.Direction != 'undefined') {
                tmpLineObject.to = timeTable.ResultSet.TimeTable.Direction;
            }
        }
        // 名称
        if (typeof lineObject.Name != 'undefined') {
            if (typeof lineObject.Name.text != 'undefined') {
                tmpLineObject.name = lineObject.Name.text;
            } else {
                tmpLineObject.name = lineObject.Name;
            }
            // 略称
            if (typeof lineObject.Name.abbreviation != 'undefined') {
                tmpLineObject.abbreviation = lineObject.Name.abbreviation;
            }
        }
        // タイプ
        if (typeof lineObject.Type != 'undefined') {
            if (typeof lineObject.Type.text != 'undefined') {
                if (typeof lineObject.Type.detail != 'undefined') {
                    tmpLineObject.type = lineObject.Type.text;
                    if (typeof lineObject.Type.detail != 'undefined') {
                        tmpLineObject.type_detail = lineObject.Type.text + "." + lineObject.Type.detail;
                    }
                } else {
                    tmpLineObject.type = lineObject.Type.text;
                }
            } else {
                tmpLineObject.type = lineObject.Type;
            }
        } else {
            if (type == "plane") {
                tmpLineObject.type = "plane";
            } else if (type == "bus") {
                tmpLineObject.type = "bus";
            } else if (type == "ship") {
                tmpLineObject.type = "ship";
            }
        }
        // 番号
        if (typeof lineObject.Number != 'undefined') {
            tmpLineObject.number = Number(lineObject.Number);
        }
        // 色
        if (typeof lineObject.Color != 'undefined') {
            tmpLineObject.color = Number(lineObject.Color);
        }
        // 発着時刻
        tmpLineObject.departureTime = convertISOtoTime(lineObject.DepartureState.Datetime.text, lineObject.DepartureState.Datetime.operation);
        tmpLineObject.arrivalTime = convertISOtoTime(lineObject.ArrivalState.Datetime.text, lineObject.ArrivalState.Datetime.operation);
        // 行き先
        if (typeof lineObject.Destination != 'undefined') {
            tmpLineObject.to = lineObject.Destination.Station.Name;
        }
        return tmpLineObject;
    }

    /**
    * インデックスから路線オブジェクトを取得
    */
    function getLineObject(code) {
        if (typeof timeTable.ResultSet.Line != 'undefined') {
            // 路線の時刻表
            if (typeof timeTable.ResultSet.Line.length == 'undefined') {
                if (timeTable.ResultSet.Line.code == code) {
                    return convertLineObject(timeTable.ResultSet.Line);
                }
            } else {
                for (var i = 0; i < timeTable.ResultSet.Line.length; i++) {
                    if (timeTable.ResultSet.Line[i].code == code) {
                        return convertLineObject(timeTable.ResultSet.Line[i]);
                    }
                }
            }
        } else {
            if (typeof timeTable.ResultSet.TimeTable.Line.length == 'undefined') {
                if (timeTable.ResultSet.Line.trainID == code) {
                    return convertLineObject(timeTable.ResultSet.TimeTable.Line);
                }
            } else {
                for (var i = 0; i < timeTable.ResultSet.TimeTable.Line.length; i++) {
                    if (timeTable.ResultSet.TimeTable.Line[i].trainID == code) {
                        return convertLineObject(timeTable.ResultSet.TimeTable.Line[i]);
                    }
                }
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
    this.dispPlaneTimetable = dispPlaneTimetable;
    this.dispBusTimetable = dispBusTimetable;
    this.dispShipTimetable = dispShipTimetable;
    this.dispRailTimetable = dispRailTimetable;
    this.getLineObject = getLineObject;
    this.setConfigure = setConfigure;
    this.bind = bind;
    this.unbind = unbind;

    // 定数リスト
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

    // 端末制御
    this.AGENT_PC = 1;
    this.AGENT_PHONE = 2;
    this.AGENT_TABLET = 3;
};
