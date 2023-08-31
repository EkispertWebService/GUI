/**
 *  駅すぱあと Web サービス
 *  駅時刻表パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *  
 *  Version:2016-06-20
 *  
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiStationTimeTable = function (pObject, config) {
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
        imagePath = s.src.substring(0, s.src.indexOf("expGuiStationTimeTable\.js"));
        if (s.src && s.src.match(/expGuiStationTimeTable\.js(\?.*)?/)) {
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
    var lineList;
    var httpObj;
    var timeTable;

    var callbackFunction; // コールバック関数の設定
    var timeTableClickFunction;

    /**
    * 駅時刻表の設置
    */
    function dispStationTimetable(str, code, param1, param2) {
        var buffer = '';
        buffer += '<div id="' + baseId + ':stationTimetable" style="display:none;"></div>';
        // HTMLへ出力
        documentObject.innerHTML = buffer;
        // 時刻表取得開始
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        //ロード中の表示
        document.getElementById(baseId + ':stationTimetable').innerHTML = '<div class="expLoading"><div class="expText">時刻表取得中...</div></div>';
        document.getElementById(baseId + ':stationTimetable').style.display = "block";
        var url = apiURL + "v1/json/station/timetable?key=" + key + "&stationName=" + encodeURIComponent(str);
        url += "&code=" + code;
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
    * 経路の時刻表の設置
    */
    function dispCourseTimetable(serializeData, sectionIndex, callback) {
        var buffer = '';
        buffer += '<div id="' + baseId + ':stationTimetable" style="display:none;"></div>';
        // HTMLへ出力
        documentObject.innerHTML = buffer;
        // 時刻表取得開始
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        //ロード中の表示
        document.getElementById(baseId + ':stationTimetable').innerHTML = '<div class="expLoading"><div class="expText">時刻表取得中...</div></div>';
        document.getElementById(baseId + ':stationTimetable').style.display = "block";
        var url = apiURL + "v1/json/course/timetable?key=" + key + "&serializeData=" + serializeData + "&sectionIndex=" + sectionIndex;
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
    * ISOの日時をDateオブジェクトに変換
    */
    function convertISOtoDate(str) {
        var tmp_date;
        if (str.indexOf("T") != -1) {
            // 時間あり
            tmp_date = new Date(parseInt(str.substring(0, 4), 10), parseInt(str.substring(5, 7), 10) - 1, parseInt(str.substring(8, 10), 10), parseInt(str.substring(11, 13), 10), parseInt(str.substring(14, 16), 10), 0);
        } else {
            // 日付のみ
            tmp_date = new Date(parseInt(str.substring(0, 4), 10), parseInt(str.substring(5, 7), 10) - 1, parseInt(str.substring(8, 10), 10));
        }
        return tmp_date;
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
    * 時刻表の出力
    */
    function outTimeTableObj() {
        var buffer;
        if (agent == 1) {
            buffer = '<div class="expGuiStationTimeTable expGuiStationTimeTablePc">';
        } else if (agent == 2) {
            buffer = '<div class="expGuiStationTimeTable expGuiStationTimeTablePhone">';
        } else if (agent == 3) {
            buffer = '<div class="expGuiStationTimeTable expGuiStationTimeTableTablet">';
        }
        if (agent == 1) {
            buffer += '<div class="exp_header">';
        } else if (agent == 2 || agent == 3) {
            buffer += '<div class="exp_header exp_clearfix">';
        }
        // ヘッダの出力
        if (agent == 2 || agent == 3) {
            buffer += '<div class="exp_clock">';
            buffer += '<select id="' + baseId + ':clock">';
            if (typeof timeTable.ResultSet.TimeTable.HourTable.length == 'undefined') {
                buffer += '<option value="' + timeTable.ResultSet.TimeTable.HourTable.Hour + '">' + timeTable.ResultSet.TimeTable.HourTable.Hour + '</option>';
            } else {
                for (var i = 0; i < timeTable.ResultSet.TimeTable.HourTable.length; i++) {
                    buffer += '<option value="' + timeTable.ResultSet.TimeTable.HourTable[i].Hour + '">' + timeTable.ResultSet.TimeTable.HourTable[i].Hour + '</option>';
                }
            }
            buffer += '</select>';
            buffer += '</div>';
        }
        buffer += '<div class="exp_title">';
        if (typeof timeTable.ResultSet.TimeTable.Datetime != 'undefined') {
            var timetableDate = convertISOtoDate(timeTable.ResultSet.TimeTable.Datetime.text);
            buffer += timetableDate.getFullYear() + '年' + (timetableDate.getMonth() + 1) + '月' + timetableDate.getDate() + '日&nbsp;&nbsp;' + timeTable.ResultSet.TimeTable.Station.Name + '時刻表<br>';
        }
        buffer += timeTable.ResultSet.TimeTable.Line.Name + "：" + timeTable.ResultSet.TimeTable.Line.Direction + '方面';
        buffer += '</div>';
        buffer += '</div>';

        if (agent == 1) {
            // マークのリスト
            buffer += '<div class="exp_markInfo" id="' + baseId + ':mark:open">';
            // 種別
            buffer += '<div class="exp_kind exp_clearfix">';
            if (typeof timeTable.ResultSet.TimeTable.LineKind.length == 'undefined') {
                buffer += getOutMark(timeTable.ResultSet.TimeTable.LineKind);
            } else {
                for (var i = 0; i < timeTable.ResultSet.TimeTable.LineKind.length; i++) {
                    buffer += getOutMark(timeTable.ResultSet.TimeTable.LineKind[i]);
                }
            }
            buffer += '</div>';
            // 方向
            buffer += '<div class="exp_destination exp_clearfix">';
            if (typeof timeTable.ResultSet.TimeTable.LineDestination.length == 'undefined') {
                buffer += getOutMark(timeTable.ResultSet.TimeTable.LineDestination);
            } else {
                for (var i = 0; i < timeTable.ResultSet.TimeTable.LineDestination.length; i++) {
                    buffer += getOutMark(timeTable.ResultSet.TimeTable.LineDestination[i]);
                }
            }
            buffer += '</div>';
            buffer += '<div class="exp_closeButton">';
            buffer += '<span class="exp_link"><a id="' + baseId + ':mark:close:button" href="Javascript:void(0);">▲</a></span>';
            buffer += '</div>';
            buffer += '</div>';
            // 開くボタン
            buffer += '<div class="exp_openButton" id="' + baseId + ':mark:close" style="display:none;">';
            buffer += '<span class="exp_link"><a id="' + baseId + ':mark:open:button" href="Javascript:void(0);">▼</a></span>';
            buffer += '</div>';
        }

        // 時刻表本体
        buffer += '<table class="exp_timeTable">';
        if (agent == 1) {
            buffer += '<tr class="exp_header">';
            buffer += '<th class="exp_hour">時</th>';
            buffer += '<th class="exp_minute">分</th>';
            buffer += '</tr>';
        }
        // 時刻表出力
        if (typeof timeTable.ResultSet.TimeTable.HourTable.length == 'undefined') {
            buffer += getHourTable(timeTable.ResultSet.TimeTable.HourTable, 1);
        } else {
            for (var i = 0; i < timeTable.ResultSet.TimeTable.HourTable.length; i++) {
                buffer += getHourTable(timeTable.ResultSet.TimeTable.HourTable[i], (i + 1));
            }
        }
        buffer += '</table>';
        buffer += '</div>';
        document.getElementById(baseId + ':stationTimetable').innerHTML = buffer;
        document.getElementById(baseId + ':stationTimetable').style.display = "block";

        // マークのイベント
        addEvent(document.getElementById(baseId + ":mark:open"), "click", onEvent);
        addEvent(document.getElementById(baseId + ":mark:close"), "click", onEvent);
        // 時間のイベント
        addEvent(document.getElementById(baseId + ":clock"), "change", onEvent);

        // イベントの設定
        if (typeof timeTable.ResultSet.TimeTable.HourTable.length == 'undefined') {
            // 一つだけ
            if (typeof timeTable.ResultSet.TimeTable.HourTable.MinuteTable != 'undefined') {
                if (typeof timeTable.ResultSet.TimeTable.HourTable.MinuteTable.length == 'undefined') {
                    // イベント設定
                    addTimeTableEvent(timeTable.ResultSet.TimeTable.HourTable.MinuteTable);
                } else {
                    for (var j = 0; j < timeTable.ResultSet.TimeTable.HourTable.MinuteTable.length; j++) {
                        // イベント設定
                        addTimeTableEvent(timeTable.ResultSet.TimeTable.HourTable.MinuteTable[j]);
                    }
                }
            }
        } else {
            // 複数
            for (var i = 0; i < timeTable.ResultSet.TimeTable.HourTable.length; i++) {
                if (typeof timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable != 'undefined') {
                    if (typeof timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable.length == 'undefined') {
                        // イベント設定
                        addTimeTableEvent(timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable);
                    } else {
                        for (var j = 0; j < timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable.length; j++) {
                            // イベント設定
                            addTimeTableEvent(timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable[j]);
                        }
                    }
                }
            }
        }
    }

    /**
    * イベントを設定する
    */
    function addTimeTableEvent(minuteTableObject) {
        // 数字のイベント
        addEvent(document.getElementById(baseId + ":table:" + String(minuteTableObject.Stop.lineCode)), "click", onEvent);
        // 種別のイベント
        //  addEvent(document.getElementById(baseId+":kind:"+ String(minuteTableObject.Stop.lineCode)) , "click", onEvent);
        // 方面のイベント
        //  addEvent(document.getElementById(baseId+":destination:"+ String(minuteTableObject.Stop.lineCode)) , "click", onEvent);
    }

    /**
    * イベントの振り分け
    */
    function onEvent(e) {
        var eventIdList = (e.srcElement) ? e.srcElement.id.split(":") : e.target.id.split(":");
        if (eventIdList.length >= 2) {
            if (eventIdList[1] == "table" && eventIdList.length == 3) {
                // 時刻表をクリック
                if (typeof timeTableClickFunction != 'undefined') {
                    timeTableClickFunction(eventIdList[2]);
                }
            } else if (eventIdList[1] == "kind" && eventIdList.length == 3) {
                //イベント無し
            } else if (eventIdList[1] == "destination" && eventIdList.length == 3) {
                //イベント無し
            } else if (eventIdList[1] == "mark" && eventIdList.length == 4) {
                //マークのイベント
                if (eventIdList[2] == "open") {
                    document.getElementById(baseId + ':mark:open').style.display = "block";
                    document.getElementById(baseId + ':mark:close').style.display = "none";
                } else if (eventIdList[2] == "close") {
                    document.getElementById(baseId + ':mark:open').style.display = "none";
                    document.getElementById(baseId + ':mark:close').style.display = "block";
                }
            } else if (eventIdList[1] == "clock" && eventIdList.length == 2) {
                var hour = document.getElementById(baseId + ':clock').options.item(document.getElementById(baseId + ':clock').selectedIndex).value;
                location.href = "#" + baseId + ":timetable:" + String(hour);
            }
        }
    }

    /**
    * マークの種別を出力
    */
    function getOutMark(mark) {
        var buffer = '';
        buffer += '<div class="exp_data">';
        if (typeof mark.Mark != 'undefined') {
            buffer += '<span class="exp_name">' + mark.Mark + '</span>';
        } else {
            buffer += '<span class="exp_plain">無印:</span>';
        }
        buffer += '<span class="exp_value">' + mark.text + '</span>';
        buffer += '</div>';
        return buffer;
    }

    /**
    * 時間ごとの時刻表を出力
    */
    function getHourTable(hourTableObject, lineNo) {
        var buffer = '';
        var hour = (parseInt(hourTableObject.Hour) >= 24) ? (parseInt(hourTableObject.Hour) - 24) : parseInt(hourTableObject.Hour);
        if (agent == 1) {
            buffer += '<tr class="exp_timeTableBody exp_clearfix">';
            buffer += '<th class="exp_hour_' + (lineNo % 2 == 0 ? "even" : "odd") + '">' + String(hour) + '</th>';
        } else if (agent == 2) {
            buffer += '<tr class="exp_timeTable exp_clearfix">';
            buffer += '<th class="exp_hour exp_clearfix">';
            buffer += '<a id="' + baseId + ':timetable:' + String(hour) + '">' + String(hour) + '時</a></th>';
            buffer += '</tr>';
            buffer += '<tr class="exp_timeTable exp_clearfix">';
        } else if (agent == 3) {
            buffer += '<tr class="exp_timeTable">';
            buffer += '<th class="exp_hour">';
            buffer += '<a id="' + baseId + ':timetable:' + String(hour) + '">' + String(hour) + '時</a></th>';
            buffer += '</tr>';
            buffer += '<tr class="exp_timeTable exp_clearfix">';
        }

        if (typeof hourTableObject.MinuteTable == 'undefined') {
            // 枠だけ
            buffer += '<td class="exp_minuteBody exp_minuteTable_' + (lineNo % 2 == 0 ? "even" : "odd") + '">';
            buffer += '</td>';
        } else if (typeof hourTableObject.MinuteTable.length == 'undefined') {
            // 一つだけ
            buffer += '<td class="exp_minuteBody exp_minuteTable_' + (lineNo % 2 == 0 ? "even" : "odd") + '">';
            if (agent == 1) {
                buffer += outMinute(1, getMinuteTable(hourTableObject.MinuteTable), getLineKindMark(hourTableObject.MinuteTable), getLineDestinationMark(hourTableObject.MinuteTable));
            } else if (agent == 2 || agent == 3) {
                buffer += outMinute(1, getMinuteTable(hourTableObject.MinuteTable, hour), getLineDestination(hourTableObject.MinuteTable.Stop.destinationCode), getLineKind(hourTableObject.MinuteTable.Stop.kindCode));
            }
            buffer += '</td>';
        } else {
            buffer += '<td class="exp_minuteBody exp_minuteTable_' + (lineNo % 2 == 0 ? "even" : "odd") + '">';
            for (var i = 0; i < hourTableObject.MinuteTable.length; i++) {
                if (agent == 1) {
                    buffer += outMinute(i + 1, getMinuteTable(hourTableObject.MinuteTable[i]), getLineKindMark(hourTableObject.MinuteTable[i]), getLineDestinationMark(hourTableObject.MinuteTable[i]));
                } else if (agent == 2 || agent == 3) {
                    buffer += outMinute(i + 1, getMinuteTable(hourTableObject.MinuteTable[i], hour), getLineDestination(hourTableObject.MinuteTable[i].Stop.destinationCode), getLineKind(hourTableObject.MinuteTable[i].Stop.kindCode));
                }
            }
            buffer += '</td>';
        }
        buffer += '</tr>';
        return buffer;
    }

    function outMinute(index, minute, direction, kind) {
        var buffer = '';
        buffer += '<div class="exp_minute exp_' + (index % 2 == 0 ? "even" : "odd") + '">';
        if (agent == 1) {
            buffer += '<div class="exp_mark exp_clearfix">';
            if (direction != "") {
                buffer += '<span class="exp_direction">' + direction + '</span>';
            }
            if (kind != "") {
                buffer += '<span class="exp_kind">' + kind + '</span>';
            }
            buffer += '</div>';
            buffer += '<span class="exp_value">' + String(minute) + '</span>';
        } else {
            buffer += '<span class="exp_value">' + String(minute) + '</span>';
            buffer += '<div class="exp_mark">';
            if (direction != "") {
                buffer += '<span class="exp_direction">' + direction + '行' + '</span>';
            }
            if (kind != "") {
                buffer += '<span class="exp_kind">' + kind + '</span>';
            }
            buffer += '</div>';
        }
        buffer += '</div>';
        return buffer;
    }


    /**
    * 時間の出力
    */
    function getMinuteTable(minuteObject, hour) {
        if (typeof hour != 'undefined') {
            return '<span class="exp_link"><a id="' + baseId + ':table:' + String(minuteObject.Stop.lineCode) + '" href="Javascript:void(0);">' + String(hour) + ":" + (parseInt(minuteObject.Minute, 10) < 10 ? "0" : "") + String(minuteObject.Minute) + '</a></span>';
        } else {
            return '<span class="exp_link"><a id="' + baseId + ':table:' + String(minuteObject.Stop.lineCode) + '" href="Javascript:void(0);">' + String(minuteObject.Minute) + '</a></span>';
        }
    }

    /**
    * 路線の種別マークを取得
    */
    function getLineKindMark(minuteObject) {
        if (typeof timeTable.ResultSet.TimeTable.LineKind.length == 'undefined') {
            if (timeTable.ResultSet.TimeTable.LineKind.code == minuteObject.Stop.kindCode) {
                if (typeof timeTable.ResultSet.TimeTable.LineKind.Mark != 'undefined') {
                    //          var mark = timeTable.ResultSet.TimeTable.LineKind.Mark +"<span style='display:block;border:solid 2px #999;background-color:#eee;color:#000;text-decoration:none;position:absolute;padding:5px;visibility:hidden;'>"+ timeTable.ResultSet.TimeTable.LineKind.text +"</span>";
                    //          return '<a id="'+ baseId +':kind:'+ String(minuteObject.Stop.lineCode) +"\" href=\"Javascript:void(0);\" style=\"text-decoration:none;color:Red;font-size:small;position:relative;\" onmouseover=\"this.childNodes[1].style.visibility='visible';this.childNodes[1].style.top='-30px';\" onmouseout=\"this.childNodes[1].style.visibility='hidden';\">"+ mark +'</a>';
                    return timeTable.ResultSet.TimeTable.LineKind.Mark;
                }
            }
        } else {
            for (var i = 0; i < timeTable.ResultSet.TimeTable.LineKind.length; i++) {
                if (timeTable.ResultSet.TimeTable.LineKind[i].code == minuteObject.Stop.kindCode) {
                    if (typeof timeTable.ResultSet.TimeTable.LineKind[i].Mark != 'undefined') {
                        //          var mark = timeTable.ResultSet.TimeTable.LineKind[i].Mark +"<span style='display:block;border:solid 2px #999;background-color:#eee;color:#000;text-decoration:none;position:absolute;padding:5px;visibility:hidden;'>"+ timeTable.ResultSet.TimeTable.LineKind[i].text +"</span>";
                        //          return '<a id="'+ baseId +':kind:'+ String(minuteObject.Stop.lineCode) +"\" href=\"Javascript:void(0);\" style=\"text-decoration:none;color:Red;font-size:small;position:relative;\" onmouseover=\"this.childNodes[1].style.visibility='visible';this.childNodes[1].style.top='-30px';\" onmouseout=\"this.childNodes[1].style.visibility='hidden';\">"+ mark +'</a>';
                        return timeTable.ResultSet.TimeTable.LineKind[i].Mark;
                    }
                }
            }
        }
        return '';
    }

    /**
    * 路線の方向マークを取得
    */
    function getLineDestinationMark(minuteObject) {
        if (typeof timeTable.ResultSet.TimeTable.LineDestination.length == 'undefined') {
            if (timeTable.ResultSet.TimeTable.LineDestination.code == minuteObject.Stop.destinationCode) {
                if (typeof timeTable.ResultSet.TimeTable.LineDestination.Mark != 'undefined') {
                    //        var mark = timeTable.ResultSet.TimeTable.LineDestination.Mark +"<span style='display:block;border:solid 2px #999;background-color:#eee;color:#000;text-decoration:none;position:absolute;padding:5px;visibility:hidden;'>"+ timeTable.ResultSet.TimeTable.LineDestination.text +"行き</span>";
                    //        return '<a id="'+ baseId +':destination:'+ String(minuteObject.Stop.lineCode) +"\" href=\"Javascript:void(0);\" style=\"text-decoration:none;color:Red;font-size:small;position:relative;\" onmouseover=\"this.childNodes[1].style.visibility='visible';this.childNodes[1].style.top='-30px';\" onmouseout=\"this.childNodes[1].style.visibility='hidden';\">"+ mark +'</a>';
                    return timeTable.ResultSet.TimeTable.LineDestination.Mark;
                }
            }
        } else {
            for (var i = 0; i < timeTable.ResultSet.TimeTable.LineDestination.length; i++) {
                if (timeTable.ResultSet.TimeTable.LineDestination[i].code == minuteObject.Stop.destinationCode) {
                    if (typeof timeTable.ResultSet.TimeTable.LineDestination[i].Mark != 'undefined') {
                        //          var mark = timeTable.ResultSet.TimeTable.LineDestination[i].Mark +"<span style='display:block;border:solid 2px #999;background-color:#eee;color:#000;text-decoration:none;position:absolute;padding:5px;visibility:hidden;'>"+ timeTable.ResultSet.TimeTable.LineDestination[i].text +"行き</span>";
                        //          return '<a id="'+ baseId +':destination:'+ String(minuteObject.Stop.lineCode) +"\" href=\"Javascript:void(0);\" style=\"text-decoration:none;color:Red;font-size:small;position:relative;\" onmouseover=\"this.childNodes[1].style.visibility='visible';this.childNodes[1].style.top='-30px';\" onmouseout=\"this.childNodes[1].style.visibility='hidden';\">"+ mark +'</a>';
                        return timeTable.ResultSet.TimeTable.LineDestination[i].Mark;
                    }
                }
            }
        }
        return '';
    }

    /**
    * 路線の検索
    */
    function searchLine(str, param1, param2) {
        if (typeof httpObj != 'undefined') {
            httpObj.abort();
        }
        var url = apiURL + "v1/json/station/timetable?key=" + key + "&stationName=" + encodeURIComponent(str);
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
                splitLine(JSON_object);
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
                    splitLine(JSON_object);
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
    * 路線一覧ををセットする
    */
    function splitLine(lineObject) {
        lineList = lineObject;
        if (typeof callbackFunction == 'function') {
            callbackFunction(true);
        }
    }

    /**
    * 路線オブジェクトリストを取得
    */
    function getLineObjectList() {
        var lineArray = new Array();
        if (typeof lineList != 'undefined') {
            if (typeof lineList.ResultSet.TimeTable.length == 'undefined') {
                lineArray.push(createLineObject(lineList.ResultSet.TimeTable.code, lineList.ResultSet.TimeTable.Line.Name, lineList.ResultSet.TimeTable.Line.Direction));
            } else {
                for (var i = 0; i < lineList.ResultSet.TimeTable.length; i++) {
                    lineArray.push(createLineObject(lineList.ResultSet.TimeTable[i].code, lineList.ResultSet.TimeTable[i].Line.Name, lineList.ResultSet.TimeTable[i].Line.Direction));
                }
            }
        }
        return lineArray;
    }

    /**
    * 路線オブジェクトを作成
    */
    function createLineObject(code, name, direction) {
        var line = new Object();
        line.code = code;
        line.name = name;
        line.direction = direction;
        return line;
    }

    /**
    * 路線の種別を取得
    */
    function getLineKind(code) {
        if (typeof timeTable.ResultSet.TimeTable.LineKind.length == 'undefined') {
            if (String(timeTable.ResultSet.TimeTable.LineKind.code) == String(code)) {
                return timeTable.ResultSet.TimeTable.LineKind.text;
            }
        } else {
            for (var i = 0; i < timeTable.ResultSet.TimeTable.LineKind.length; i++) {
                if (String(timeTable.ResultSet.TimeTable.LineKind[i].code) == String(code)) {
                    return timeTable.ResultSet.TimeTable.LineKind[i].text;
                }
            }
        }
        return;
    }

    /**
    * 路線の方向を取得
    */
    function getLineDestination(code) {
        if (typeof timeTable.ResultSet.TimeTable.LineDestination.length == 'undefined') {
            if (String(timeTable.ResultSet.TimeTable.LineDestination.code) == String(code)) {
                return timeTable.ResultSet.TimeTable.LineDestination.text;
            }
        } else {
            for (var i = 0; i < timeTable.ResultSet.TimeTable.LineDestination.length; i++) {
                if (String(timeTable.ResultSet.TimeTable.LineDestination[i].code) == String(code)) {
                    return timeTable.ResultSet.TimeTable.LineDestination[i].text;
                }
            }
        }
        return '';
    }

    /**
    * 路線名を取得
    */
    function getLineName(code) {
        if (typeof timeTable.ResultSet.TimeTable.LineName.length == 'undefined') {
            if (String(timeTable.ResultSet.TimeTable.LineName.code) == String(code)) {
                return timeTable.ResultSet.TimeTable.LineName.text;
            }
        } else {
            for (var i = 0; i < timeTable.ResultSet.TimeTable.LineName.length; i++) {
                if (String(timeTable.ResultSet.TimeTable.LineName[i].code) == String(code)) {
                    return timeTable.ResultSet.TimeTable.LineName[i].text;
                }
            }
        }
        return '';
    }

    /**
    * lineオブジェクトを取得する
    */
    function getTimeTableObject(lineCode) {
        var tmpLineObject = new Object();
        // イベントの設定
        if (typeof timeTable.ResultSet.TimeTable.HourTable.length == 'undefined') {
            // 一つだけ
            if (typeof timeTable.ResultSet.TimeTable.HourTable.MinuteTable != 'undefined') {
                if (typeof timeTable.ResultSet.TimeTable.HourTable.MinuteTable.length == 'undefined') {
                    // 一つだけ
                    if (String(timeTable.ResultSet.TimeTable.HourTable.MinuteTable.Stop.lineCode) == String(lineCode)) {
                        tmpLineObject.hour = Number(timeTable.ResultSet.TimeTable.HourTable.Hour);
                        tmpLineObject.minute = Number(timeTable.ResultSet.TimeTable.HourTable.MinuteTable.Minute);
                        tmpLineObject.lineCode = Number(timeTable.ResultSet.TimeTable.HourTable.MinuteTable.Stop.lineCode);
                        tmpLineObject.lineKind = getLineKind(timeTable.ResultSet.TimeTable.HourTable.MinuteTable.Stop.kindCode);
                        tmpLineObject.lineName = getLineName(timeTable.ResultSet.TimeTable.HourTable.MinuteTable.Stop.nameCode);
                        tmpLineObject.lineDestination = getLineDestination(timeTable.ResultSet.TimeTable.HourTable.MinuteTable.Stop.destinationCode);
                        return tmpLineObject;
                    }
                } else {
                    for (var j = 0; j < timeTable.ResultSet.TimeTable.HourTable.MinuteTable.length; j++) {
                        // 複数
                        if (String(timeTable.ResultSet.TimeTable.HourTable.MinuteTable[j].Stop.lineCode) == String(lineCode)) {
                            tmpLineObject.hour = Number(timeTable.ResultSet.TimeTable.HourTable.Hour);
                            tmpLineObject.minute = Number(timeTable.ResultSet.TimeTable.HourTable.MinuteTable[j].Minute);
                            tmpLineObject.lineCode = Number(timeTable.ResultSet.TimeTable.HourTable.MinuteTable[j].Stop.lineCode);
                            tmpLineObject.lineKind = getLineKind(timeTable.ResultSet.TimeTable.HourTable.MinuteTable[j].Stop.kindCode);
                            tmpLineObject.lineName = getLineName(timeTable.ResultSet.TimeTable.HourTable.MinuteTable[j].Stop.nameCode);
                            tmpLineObject.lineDestination = getLineDestination(timeTable.ResultSet.TimeTable.HourTable.MinuteTable[j].Stop.destinationCode);
                            return tmpLineObject;
                        }
                    }
                }
            }
        } else {
            // 複数
            for (var i = 0; i < timeTable.ResultSet.TimeTable.HourTable.length; i++) {
                if (typeof timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable != 'undefined') {
                    if (typeof timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable.length == 'undefined') {
                        // 一つだけ
                        if (String(timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable.Stop.lineCode) == String(lineCode)) {
                            tmpLineObject.hour = Number(timeTable.ResultSet.TimeTable.HourTable[i].Hour);
                            tmpLineObject.minute = Number(timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable.Minute);
                            tmpLineObject.lineCode = Number(timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable.Stop.lineCode);
                            tmpLineObject.lineKind = getLineKind(timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable.Stop.kindCode);
                            tmpLineObject.lineName = getLineName(timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable.Stop.nameCode);
                            tmpLineObject.lineDestination = getLineDestination(timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable.Stop.destinationCode);
                            return tmpLineObject;
                        }
                    } else {
                        for (var j = 0; j < timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable.length; j++) {
                            // 複数
                            if (String(timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable[j].Stop.lineCode) == String(lineCode)) {
                                tmpLineObject.hour = Number(timeTable.ResultSet.TimeTable.HourTable[i].Hour);
                                tmpLineObject.minute = Number(timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable[j].Minute);
                                tmpLineObject.lineCode = Number(timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable[j].Stop.lineCode);
                                tmpLineObject.lineKind = getLineKind(timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable[j].Stop.kindCode);
                                tmpLineObject.lineName = getLineName(timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable[j].Stop.nameCode);
                                tmpLineObject.lineDestination = getLineDestination(timeTable.ResultSet.TimeTable.HourTable[i].MinuteTable[j].Stop.destinationCode);
                                return tmpLineObject;
                            }
                        }
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
    this.dispStationTimetable = dispStationTimetable;
    this.dispCourseTimetable = dispCourseTimetable;
    this.searchLine = searchLine;
    this.getLineObjectList = getLineObjectList;
    this.getTimeTableObject = getTimeTableObject;
    this.setConfigure = setConfigure;
    this.bind = bind;
    this.unbind = unbind;

    // 端末制御
    this.AGENT_PC = 1;
    this.AGENT_PHONE = 2;
    this.AGENT_TABLET = 3;
};
