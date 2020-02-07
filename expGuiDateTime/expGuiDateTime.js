/**
 *  駅すぱあと Web サービス
 *  日付入力パーツ
 *  サンプルコード
 *  https://github.com/EkispertWebService/GUI
 *
 *  Version:2016-08-04
 *
 *  Copyright (C) Val Laboratory Corporation. All rights reserved.
 **/

var expGuiDateTime = function (pObject, config) {
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
        imagePath = s.src.substring(0, s.src.indexOf("expGuiDateTime\.js"));
        if (s.src && s.src.match(/expGuiDateTime\.js(\?.*)?/)) {
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
    // カレンダー連携用変数
    var c_year;
    var c_month;
    var c_date;

    /**
    * 日時入力の設置
    */
    function dispDateTime(type) {
        // 探索条件・日付・時間設定のテーブル
        var buffer = "";
        if (agent == 1) {
            buffer += '<div class="expGuiDateTime expGuiDateTimePc">';
            buffer += '<input type="hidden" id="' + baseId + ':searchType">';
            buffer += '<div id="' + baseId + ':searchTypeList" class="exp_searchTypeList exp_clearfix">';
            buffer += '<div id="' + baseId + ':searchType:dia">';
            buffer += '<div class="exp_searchTypeDepartureOn" id="' + baseId + ':searchType:' + String(1) + ':active"><span class="exp_text">出発</span></div>';
            buffer += '<div class="exp_searchTypeDepartureOff" id="' + baseId + ':searchType:' + String(1) + ':none">';
            buffer += '<a class="exp_searchTypeButton" id="' + baseId + ':searchType:' + String(1) + '" href="javascript:void(0);"><span class="exp_text">出発</span></a>';
            buffer += '</div>';
            buffer += '<div class="exp_searchTypeArrivalOn" id="' + baseId + ':searchType:' + String(2) + ':active"><span class="exp_text">到着</span></div>';
            buffer += '<div class="exp_searchTypeArrivalOff" id="' + baseId + ':searchType:' + String(2) + ':none">';
            buffer += '<a class="exp_searchTypeButton" id="' + baseId + ':searchType:' + String(2) + '" href="javascript:void(0);"><span class="exp_text">到着</span></a>';
            buffer += '</div>';
            buffer += '<div class="exp_searchTypeFirstTrainOn" id="' + baseId + ':searchType:' + String(3) + ':active"><span class="exp_text">始発</span></div>';
            buffer += '<div class="exp_searchTypeFirstTrainOff" id="' + baseId + ':searchType:' + String(3) + ':none">';
            buffer += '<a class="exp_searchTypeButton" id="' + baseId + ':searchType:' + String(3) + '" href="javascript:void(0);"><span class="exp_text">始発</span></a>';
            buffer += '</div>';
            buffer += '<div class="exp_searchTypeLastTrainOn" id="' + baseId + ':searchType:' + String(4) + ':active"><span class="exp_text">終電</span></div>';
            buffer += '<div class="exp_searchTypeLastTrainOff" id="' + baseId + ':searchType:' + String(4) + ':none">';
            buffer += '<a class="exp_searchTypeButton" id="' + baseId + ':searchType:' + String(4) + '" href="javascript:void(0);"><span class="exp_text">終電</span></a>';
            buffer += '</div>';
            buffer += '</div>';
            buffer += '<div id="' + baseId + ':searchType:average">';
            buffer += '<div class="exp_searchTypePlainOn" id="' + baseId + ':searchType:' + String(5) + ':active"><span class="exp_text">平均</span></div>';
            buffer += '<div class="exp_searchTypePlainOff" id="' + baseId + ':searchType:' + String(5) + ':none">';
            buffer += '<a class="exp_searchTypeButton" id="' + baseId + ':searchType:' + String(5) + '" href="javascript:void(0);"><span class="exp_text">平均</span></a>';
            buffer += '</div>';
            buffer += '</div>';
            buffer += '</div>';
        } else if (agent == 2 || agent == 3) {
            if (agent == 2) {
                buffer += '<div class="expGuiDateTime expGuiDateTimePhone">';
            } else if (agent == 3) {
                buffer += '<div class="expGuiDateTime expGuiDateTimeTablet">';
            }
            buffer += '<div id="' + baseId + ':searchTypeList" class="exp_searchType exp_clearfix">';
            buffer += '<div id="' + baseId + ':searchType:dia">';
            buffer += '<span class="exp_departure"><input type="radio" id="' + baseId + ':searchType:1" name="' + baseId + ':searchType" value="departure" id="' + baseId + ':searchType:1"><label for="' + baseId + ':searchType:1" id="' + baseId + ':searchType:1:text">出発</label></span>';
            buffer += '<span class="exp_arrival"><input type="radio" id="' + baseId + ':searchType:2" name="' + baseId + ':searchType" value="arrival" id="' + baseId + ':searchType:2"><label for="' + baseId + ':searchType:2" id="' + baseId + ':searchType:2:text">到着</label></span>';
            buffer += '<span class="exp_firstTrain"><input type="radio" id="' + baseId + ':searchType:3" name="' + baseId + ':searchType" value="firstTrain" id="' + baseId + ':searchType:3"><label for="' + baseId + ':searchType:3" id="' + baseId + ':searchType:3:text">始発</label></span>';
            buffer += '<span class="exp_lastTrain"><input type="radio" id="' + baseId + ':searchType:4" name="' + baseId + ':searchType" value="lastTrain" id="' + baseId + ':searchType:4"><label for="' + baseId + ':searchType:4" id="' + baseId + ':searchType:4:text">終電</span></span>';
            buffer += '</div>';
            buffer += '<div id="' + baseId + ':searchType:average">';
            buffer += '<span class="exp_plain"><input type="radio" id="' + baseId + ':searchType:5" name="' + baseId + ':searchType" value="plain" id="' + baseId + ':searchType:5"><label for="' + baseId + ':searchType:5" id="' + baseId + ':searchType:5:text">平均</label></span>';
            buffer += '</div>';
            buffer += '</div>';
        }
        buffer += '<div class="exp_dateTime exp_clearfix">';
        buffer += '<div id="' + baseId + ':calendar" style="display:none;"></div>';
        buffer += '<div class="exp_dateGroup">';
        if (agent == 1) {
            buffer += '<select id="' + baseId + ':date:mm" class="exp_date"></select>';
            buffer += '<select id="' + baseId + ':date:dd" class="exp_date"></select>';
        } else if (agent == 2 || agent == 3) {
            buffer += '<select id="' + baseId + ':date" class="exp_date"></select>';
        }
        buffer += '</div>';
        buffer += '<a class="exp_cal_open" id="' + baseId + ':cal_open" href="javascript:void(0);"></a>';
        buffer += '<div id="' + baseId + ':time">';
        // 改行
        if (agent == 2) {
            buffer += '<div class="exp_separate"></div>';
        }
        buffer += '<div class="exp_timeGroup">';
        buffer += '<select class="exp_time" id="' + baseId + ':timeHH">';
        for (var i = 0; i <= 23; i++) {
            buffer += '<option value="' + i + '">' + String(i) + '時</option>';
        }
        buffer += '</select>';
        buffer += '<select class="exp_time" id="' + baseId + ':timeMM">';
        for (var i = 0; i <= 59; i++) {
            buffer += '<option value="' + i + '">' + String(((i <= 9) ? '0' : '') + i) + '分</option>';
        }
        buffer += '</select>';
        buffer += '</div>';
        buffer += '<a class="exp_setNow" id="' + baseId + ':setNow" href="javascript:void(0);"></a>';
        buffer += '</div>';
        buffer += '</div>';
        buffer += '</div>';
        // HTMLへ出力
        documentObject.innerHTML = buffer;

        // デフォルト設定
        setSearchType("departure");

        // 表示設定
        if (typeof type != 'undefined') {
            if (type == "dia") {
                // 駅すぱあと for Web用の設定
                document.getElementById(baseId + ":searchType:average").style.display = "none";
            } else if (type == "plain") {
                document.getElementById(baseId + ":searchTypeList").style.display = "none";
                document.getElementById(baseId + ":time").style.display = "none";
                setSearchType("plain");
            }
        }

        // イベントの設定
        addEvent(document.getElementById(baseId + ":searchType:1"), "click", function () { setSearchType("departure"); });
        addEvent(document.getElementById(baseId + ":searchType:2"), "click", function () { setSearchType("arrival"); });
        addEvent(document.getElementById(baseId + ":searchType:3"), "click", function () { setSearchType("firstTrain"); });
        addEvent(document.getElementById(baseId + ":searchType:4"), "click", function () { setSearchType("lastTrain"); });
        addEvent(document.getElementById(baseId + ":searchType:5"), "click", function () { setSearchType("plain"); });
        addEvent(document.getElementById(baseId + ":cal_open"), "click", function () { changeCalendar(); });
        if (agent == 1) {
            addEvent(document.getElementById(baseId + ":date:mm"), "change", function () { changeDate(); });
        }
        addEvent(document.getElementById(baseId + ":setNow"), "click", function () { setNow(); });
        // デフォルトの日時設定
        setNow();
    }

    /**
    * 現在日時をフォームに設定
    */
    function setNow() {
        // 現在日時の設定
        var now = new Date();
        setDate(now.getFullYear() + "/" + (now.getMonth() + 1) + "/" + now.getDate());
        document.getElementById(baseId + ':timeHH').selectedIndex = now.getHours();
        document.getElementById(baseId + ':timeMM').selectedIndex = now.getMinutes();
    }

    /**
    * 年月を変更する
    */
    function changeDate() {
        var tmp_date = document.getElementById(baseId + ':date:mm').value.split("/");
        tmp_date.push(document.getElementById(baseId + ':date:dd').value);
        setDateList(tmp_date[0], tmp_date[1]);
        setDate(tmp_date.join("/"));
    }

    /**
    * 日付設定を取得する
    */
    function getDate() {
        var tmp_date = new Array();
        if (agent == 1) {
            tmp_date = document.getElementById(baseId + ':date:mm').value.split("/");
            tmp_date.push(document.getElementById(baseId + ':date:dd').value);
        } else if (agent == 2 || agent == 3) {
            tmp_date = document.getElementById(baseId + ':date').value.split("/");
        }
        // 日付設定
        var buffer = "";
        buffer += tmp_date[0];
        if (parseInt(tmp_date[1], 10) >= 10) {
            buffer += parseInt(tmp_date[1], 10);
        } else {
            buffer += "0" + parseInt(tmp_date[1], 10);
        }
        if (parseInt(tmp_date[2], 10) >= 10) {
            buffer += parseInt(tmp_date[2], 10);
        } else {
            buffer += "0" + parseInt(tmp_date[2], 10);
        }
        return buffer;
    }

    /**
    * 時間設定を取得する
    */
    function getTime() {
        var hh;
        var mi;
        if (document.getElementById(baseId + ':timeHH').selectedIndex < 10) {
            hh = "0" + String(document.getElementById(baseId + ':timeHH').selectedIndex);
        } else {
            hh = String(document.getElementById(baseId + ':timeHH').selectedIndex);
        }
        if (document.getElementById(baseId + ':timeMM').selectedIndex < 10) {
            mi = "0" + String(document.getElementById(baseId + ':timeMM').selectedIndex);
        } else {
            mi = String(document.getElementById(baseId + ':timeMM').selectedIndex);
        }
        return String(hh) + String(mi);
    }

    /**
    * 日付の正当性チェック
    */
    function checkDate() {
        var tmp_date = new Array();
        if (agent == 1) {
            tmp_date = document.getElementById(baseId + ':date:mm').value.split("/");
            tmp_date.push(document.getElementById(baseId + ':date:dd').value);
        } else if (agent == 2 || agent == 3) {
            tmp_date = document.getElementById(baseId + ':date').value.split("/");
        }
        if (tmp_date.length != 3) {
            return false;
        } else if (isNaN(parseInt(tmp_date[0], 10)) || isNaN(parseInt(tmp_date[1], 10)) || isNaN(parseInt(tmp_date[2], 10))) {
            return false;
        }
        return true;
    }

    /**
    * 探索種別を取得
    */
    function getSearchType() {
        if (agent == 1) {
            return document.getElementById(baseId + ':searchType').value;
        } else if (agent == 2 || agent == 3) {
            for (var i = 0; i < document.getElementsByName(baseId + ':searchType').length; i++) {
                if (document.getElementsByName(baseId + ':searchType')[i].checked == true) {
                    return document.getElementsByName(baseId + ':searchType')[i].value;
                }
            }
        }
        return;
    }

    /**
    * 探索種別によって時間指定の有無を設定
    */
    function changeSearchType() {
        if (getSearchType() == "departure" || getSearchType() == "arrival") {
            document.getElementById(baseId + ':timeHH').disabled = false;
            document.getElementById(baseId + ':timeMM').disabled = false;
        } else {
            document.getElementById(baseId + ':timeHH').disabled = true;
            document.getElementById(baseId + ':timeMM').disabled = true;
        }
    }

    /**
    * カレンダーで本日を設定
    */
    function today() {
        var now = new Date();
        setDate(now.getFullYear() + "/" + (now.getMonth() + 1) + "/" + now.getDate());
        document.getElementById(baseId + ':calendar').innerHTML = "";
        document.getElementById(baseId + ':calendar').style.display = "none";
    }

    /**
    * カレンダーの月を変更する
    */
    function changeMonth(type) {
        if (type == 'prev') {
            c_month--;
            if (c_month == 0) {
                c_year--;
                c_month = 12;
            }
        } else if (type == 'next') {
            c_month++;
            if (c_month == 13) {
                c_year++;
                c_month = 1;
            }
        }

        // 存在しない日付が指定されるのを防ぐため、カレンダー移動時には日付を1日に固定する
        c_date = 1;
        document.getElementById(baseId + ':c_table').innerHTML = getCalendarTable(c_year, c_month, c_date);
        document.getElementById(baseId + ':calendar').style.display = "block";

        setFunction();
    }

    /**
    * カレンダーボタンを押した時の動作
    */
    function changeCalendar() {
        if (document.getElementById(baseId + ':calendar').innerHTML == "") {
            openCalendar();
        } else {
            closeCalendar();
        }
    }

    /**
    * カレンダーを閉じる
    */
    function closeCalendar() {
        document.getElementById(baseId + ':calendar').innerHTML = "";
        document.getElementById(baseId + ':calendar').style.display = "none";
    }

    /**
    * カレンダーを表示する
    */
    function openCalendar() {
        var tmp_date = new Array();
        if (agent == 1) {
            tmp_date = document.getElementById(baseId + ':date:mm').value.split("/");
            tmp_date.push(document.getElementById(baseId + ':date:dd').value);
        } else if (agent == 2 || agent == 3) {
            tmp_date = document.getElementById(baseId + ':date').value.split("/");
        }
        var date;
        if (tmp_date.length != 3) {
            date = new Date();
        } else {
            try {
                date = new Date(parseInt(tmp_date[0], 10), parseInt(tmp_date[1], 10) - 1, parseInt(tmp_date[2], 10));
            } catch (e) {
                date = new Date();
            }
        }
        var buffer = '';
        // カレンダー本体
        buffer += '<div class="exp_calendar" id="' + baseId + ':c_table">';
        buffer += getCalendarTable(date.getFullYear(), (date.getMonth() + 1), date.getDate());
        buffer += '</div>';
        // デフォルトの日付設定
        c_year = date.getFullYear();
        c_month = (date.getMonth() + 1);
        c_date = date.getDate();
        // カレンダー出力
        document.getElementById(baseId + ':calendar').innerHTML = buffer;
        document.getElementById(baseId + ':calendar').style.display = "block";
        // カレンダーのボタンを設定
        setFunction();
    }

    /**
    * カレンダーの各イベントを設定
    */
    function setFunction() {
        // 本日ボタンのイベント設定
        //  addEvent(document.getElementById(baseId+":cal_today"), "click", function(){today();});
        // 前後の月のイベント設定
        addEvent(document.getElementById(baseId + ":header_prev"), "click", function () { changeMonth('prev'); });
        addEvent(document.getElementById(baseId + ":header_next"), "click", function () { changeMonth('next'); });

        // 日付選択のイベント設定
        // 前月
        for (var i = 23; i <= 31; i++) {
            addEvent(document.getElementById(baseId + ":prev:" + String(i)), "click", onEvent);
        }
        // 当月
        for (var i = 1; i <= 31; i++) {
            addEvent(document.getElementById(baseId + ":this:" + String(i)), "click", onEvent);
        }
        // 翌月
        for (var i = 1; i <= 14; i++) {
            addEvent(document.getElementById(baseId + ":next:" + String(i)), "click", onEvent);
        }
    }

    /**
    * イベントの振り分け
    */
    function onEvent(e) {
        var eventIdList = (e.srcElement) ? e.srcElement.id.split(":") : e.target.id.split(":");
        if (eventIdList.length == 3) {
            if (eventIdList[1] == "prev") {
                // 前月の指定
                selectDate(-parseInt(eventIdList[2]));
            } else if (eventIdList[1] == "this") {
                // 当月の指定
                selectDate(parseInt(eventIdList[2]));
            } else if (eventIdList[1] == "next") {
                // 翌月の指定
                selectDate(parseInt(eventIdList[2]) + 50);
            }
        }
    }

    /**
    * カレンダーで日付を選んだ時の動作
    */
    function selectDate(dd) {
        var tmp_year = c_year;
        var tmp_month = c_month;
        var tmp_day;
        // 振り分け
        if (dd < 0) {
            // 前の月
            tmp_month--;
            if (tmp_month < 1) {
                tmp_year--;
                tmp_month = 12;
            }
            tmp_day = Math.abs(dd);
        } else if (dd > 50) {
            // 翌月
            tmp_month++;
            if (tmp_month > 12) {
                tmp_year++;
                tmp_month = 1;
            }
            tmp_day = dd - 50;
        } else {
            tmp_day = dd;
        }
        setDate(tmp_year + "/" + tmp_month + "/" + tmp_day);
        document.getElementById(baseId + ':calendar').innerHTML = "";
        document.getElementById(baseId + ':calendar').style.display = "none";
    }

    /**
    * 月の最終日を判定し、カレンダーに反映する
    */
    function getLastDate(yyyy, mm) {
        if (mm == 4 || mm == 6 || mm == 9 || mm == 11) {
            return 30;
        } else if (mm == 2) {
            if (yyyy % 4 == 0 && (yyyy % 100 != 0 || yyyy % 400 == 0)) {
                return 29;
            } else {
                return 28;
            }
        } else {
            return 31;
        }
    }

    /**
    * カレンダーをテーブルとして取得
    */
    function getCalendarTable(yyyy, mm, dd) {
        // 祝日チェック用の変数初期化
        furi = 0;
        ck = 0;
        // 現在日
        var date;
        var today = new Date();
        try {
            date = new Date(yyyy, mm - 1, dd);
        } catch (e) {
            date = new Date();
        }
        // 曜日の色設定
        var week = new Array('<span class="exp_header_sunday">日</span>', '<span class="exp_header_week">月</span>', '<span class="exp_header_week">火</span>', '<span class="exp_header_week">水</span>', '<span class="exp_header_week">木</span>', '<span class="exp_header_week">金</span>', '<span class="exp_header_saturday">土</span>');
        var weekLineClass = new Array("calFirstWeek", "calSecWeek", "calThirWeek", "calFourWeek", "calFifWeek", "calSixWeek");
        // カレンダー出力設定
        var doc = "";
        doc += '<table>';
        doc += '<tr>';
        doc += '<td colspan="7">';
        doc += '<div class="exp_cal_header">';
        doc += '<div class="exp_prev"><a class="exp_header_prev" href="javascript:void(0);" id="' + baseId + ':header_prev"></a></div>';
        doc += '<div class="exp_title"><span class="exp_header_month">' + date.getFullYear() + "年" + (date.getMonth() + 1) + "月" + '</span></div>';
        doc += '<div class="exp_next"><a class="exp_header_next" href="javascript:void(0);" id="' + baseId + ':header_next"></a></div>';
        doc += '</td>';
        doc += '</tr>';
        doc += '</div>';
        // 曜日設定
        doc += '<tr class="exp_calWeek">';
        for (var i = 0; i < week.length; i++) {
            doc += '<td>' + week[i] + '</td>';
        }
        doc += '</tr>';
        // 曜日の計算
        var dayOfWeek = 0;
        // 表示する段
        var viewRows = 0;
        // 開始日付まで進める
        var prevYear = date.getFullYear();
        var prevMonth = (date.getMonth() + 1) - 1;
        if (prevMonth == 0) {
            prevYear--;
            prevMonth = 12;
        }
        doc += '<tr class="exp_' + weekLineClass[viewRows] + '">';
        var firstDate = new Date(date.getFullYear(), date.getMonth(), 1);
        for (var i = -firstDate.getDay(); i < 0; i++) {
            doc += '<td class="exp_otherday">';
            doc += '<a href="javascript:void(0);" id="' + baseId + ':prev:' + String(getLastDate(prevYear, prevMonth) + i + 1) + '">' + (getLastDate(prevYear, prevMonth) + i + 1) + '</a>';
            doc += '</td>';
            dayOfWeek++;
        }
        // 日を設定
        for (var i = 1; i <= getLastDate(date.getFullYear(), date.getMonth() + 1); i++) {
            // 当日に色を付ける
            if (today.getFullYear() == date.getFullYear() && today.getMonth() == date.getMonth() && today.getDate() == i) {
                doc += '<td class="exp_today">';
            } else {
                doc += '<td class="exp_days">';
            }
            doc += '<a class="exp_' + getDateColor(yyyy, mm, i, dayOfWeek) + '" href="javascript:void(0);" id="' + baseId + ':this:' + String(i) + '">' + String(i) + '</a>';
            doc += '</td>';
            dayOfWeek++;
            if (dayOfWeek == 7 && i != getLastDate(date.getFullYear(), date.getMonth() + 1)) {
                dayOfWeek = 0;
                viewRows++;
                doc += '</tr>';
                doc += '<tr class="exp_' + weekLineClass[viewRows] + '">';
            }
        }
        // 残りの空白をセット
        var startWeek = dayOfWeek;
        var n = 1;
        var endDay = (6 - viewRows) * 7;
        for (var i = startWeek; i < endDay; i++) {
            if (dayOfWeek == 7) {
                dayOfWeek = 0;
                viewRows++;
                doc += '</tr>';
                doc += '<tr class="exp_' + weekLineClass[viewRows] + '">';
            }
            doc += '<td class="exp_otherday">';
            doc += '<a href="javascript:void(0);" id="' + baseId + ':next:' + String(n) + '">' + String(n) + '</a>';
            doc += '</td>';
            dayOfWeek++;
            n++;
        }
        doc += '</tr>';
        // 本日ボタン
        /**
        doc+='<tr>';
        doc+='<td colspan="7">';
        doc+='<a class="exp_cal_today" id="'+ baseId +':cal_today" href="javascript:void(0);"></a>';
        doc+='</td>';
        doc+='</tr>';
        */
        doc += '</table>';
        return doc;
    }

    /**
    * カレンダー内の文字の色を取得
    */
    function getDateColor(yyyy, mm, i, dayOfWeek) {
        if (getNationalHoliday(yyyy, mm, i, dayOfWeek) != '') {
            return "holiday";
        } else if (dayOfWeek == 0) {
            return "sunday";
        } else if (dayOfWeek == 6) {
            return "saturday";
        } else {
            return "weekday";
        }
    }

    /**
    * 祭日の取得
    */
    var furi = 0;
    var ck = 0;
    var Syunbunpar1 = new Array(19.8277, 20.8357, 20.8431, 21.8510);  // 春分・秋分の日付計算用1980-2099
    var Syunbunpar2 = new Array(22.2588, 23.2588, 23.2488, 24.2488);  // 春分・秋分の日付計算用1980-2099
    function getNationalHoliday(year, month, day, week) {
        // 変数の初期化
        syuku = '';
        // ハッピーマンデーと振替休日
        if (week == 1) {
            var moncnt = Math.floor(day / 7) + 1;
            // 振替休日
            // (2006年まで)「国民の祝日」が日曜日にあたるときは、その翌日を休日とする。
            if (furi == 1 && year <= 2006) {
                syuku = '振替休日';   // 振替フラグが立っていたら休み
                furi = 0;
            }
            // 第2月曜
            if (moncnt == 2) {
                if (month == 1) { syuku = '成人の日'; }    // 1月
                if (month == 10 && year != 2020) { // 2020年のみ、スポーツの日は固定の日になる
                    if (year < 2020) {
                        syuku = '体育の日';
                    } else {
                        syuku = 'スポーツの日'; // 体育の日は、2020年よりスポーツの日になる
                    }
                }
            }
            // 第3月曜
            if (moncnt == 3) {
                if (year >= 2003 && month == 7 && year != 2020) { syuku = '海の日'; }   // 7月(2003～)　2020年のみ、海の日は固定の日になる
                if (year >= 2003 && month == 9) { syuku = '敬老の日'; } // 9月(2003～)
            }
        }

        // 春分の日・秋分の日
        var i, tyear;
        if ((year >= 1851) && (year <= 1899)) i = 0;
        else if ((year >= 1900) && (year <= 1979)) i = 1;
        else if ((year >= 1980) && (year <= 2099)) i = 2;
        else if ((year >= 2100) && (year <= 2150)) i = 3;
        else i = 4;   // 範囲外
        if (i < 4) {
            if (i < 2) tyear = 1983; else tyear = 1980;
            tyear = (year - tyear);
            if (month == 3) {      // 春分の日
                if (day == Math.floor(Syunbunpar1[i] + 0.242194 * tyear - Math.floor((tyear + 0.1) / 4))) syuku = '春分の日';
            } else if (month == 9) { // 秋分の日
                if (day == Math.floor(Syunbunpar2[i] + 0.242194 * tyear - Math.floor((tyear + 0.1) / 4))) syuku = '秋分の日';
            }
        }

        // その他の祝日
        if (month == 1 && day == 1) { syuku = '元日'; }            //  1月 1日
        if (month == 2 && day == 11) { syuku = '建国記念の日'; }    //  2月11日
        if (year >= 2020 && month == 2 && day == 24) { syuku = '天皇誕生日'; }     // 2020年から2月24日
        if (month == 4 && day == 29 && year <= 2006) { syuku = 'みどりの日'; }      //  4月29日(2006年まで)
        if (month == 4 && day == 29 && year >= 2007) { syuku = '昭和の日'; }        //  4月29日(2007年から)
        if (month == 5 && day == 3) { syuku = '憲法記念日'; }      //  5月 3日
        if (month == 5 && day == 4 && year >= 2007) { syuku = 'みどりの日'; }      //  5月 4日(2007年から)
        if (month == 5 && day == 5) { syuku = 'こどもの日'; }      //  5月 5日
        if (month == 11 && day == 3) { syuku = '文化の日'; }       // 11月 3日
        if (month == 11 && day == 23) { syuku = '勤労感謝の日'; }   // 11月23日
        if (year < 2003 && month == 7 && day == 20) { syuku = '海の日'; }   // 7月20日(～2002)
        if (year < 2003 && month == 9 && day == 15) { syuku = '敬老の日'; } //  9月15日(～2002)
        if (month == 8 && day == 11 && year >= 2016 && year != 2020) { syuku = '山の日'; } //  8月11日(2016年から) 2020年のみ、山の日は別の日となる
        if (year == 2020 && month == 7 && day == 23) { syuku = '海の日'; }      //  2020年7月23日
        if (year == 2020 && month == 7 && day == 24) { syuku = 'スポーツの日'; }      //  2020年7月24日
        if (year == 2020 && month == 8 && day == 10) { syuku = '山の日'; }      //  2020年8月10日
        if (year <= 2018 && month == 12 && day == 23) { syuku = '天皇誕生日'; } // 2018年まで

        // 振替休日
        // (2007年から)「国民の祝日」が日曜日に当たるときは、その日後においてその日に最も近い「国民の祝日」でない日を休日とする。
        if (furi == 1 && syuku == '' && year >= 2007) {
            syuku = '振替休日';   // 振替フラグが立っていたら休み
            furi = 0;
        } else if (furi == 1 && syuku != '' && year >= 2007) {
            furi = 1;             // 振替フラグが立っていて祝日の場合は振替フラグを立てる
        } else if (week == 0 && syuku != '') {
            furi = 1;             // 日曜で祝日の場合は振替フラグを立てる
        } else {
            furi = 0;
        }

        // 国民の休日(祝日に挟まれた平日)
        // (2006年まで)その前日及び翌日が「国民の祝日」である日（日曜日にあたる日及び前項に規定する休日にあたる日を除く。）は、休日とする。
        // (2007年から)その前日及び翌日が「国民の祝日」である日（「国民の祝日」でない日に限る。）は、休日とする。
        if ((week > 0 && syuku == '' && !ck && year <= 2006) || (syuku == '' && !ck && syuku != '振替休日' && year >= 2007)) {
            ck = 1;  // 再帰呼び出しでここを通らないようにする
            // 前日と次日が祝日か確認
            // １日と末日が祝日の場合はないので日にちは単純に１を増減する
            // 曜日の設定
            bweek = week - 1; if (bweek < 0) bweek = 6;
            aweek = week + 1; if (bweek > 6) bweek = 0;
            if (getNationalHoliday(year, month, day - 1, bweek) && getNationalHoliday(year, month, day + 1, aweek)) {
                syuku = '国民の休日';
            }
            ck = 0;  // フラグの初期化
        }

        return syuku;
    }

    /**
    * 探索種別を外部から制御
    */
    function setSearchType(str) {
        if (agent == 1) {
            for (var i = 0; i < 5; i++) {
                document.getElementById(baseId + ':searchType:' + String(i + 1) + ':active').style.display = 'none';
                document.getElementById(baseId + ':searchType:' + String(i + 1) + ':none').style.display = 'block';
            }
            document.getElementById(baseId + ':searchType').value = str;
            if (str == "departure") {
                document.getElementById(baseId + ':searchType:' + String(1) + ':active').style.display = 'block';
                document.getElementById(baseId + ':searchType:' + String(1) + ':none').style.display = 'none';
            } else if (str == "arrival") {
                document.getElementById(baseId + ':searchType:' + String(2) + ':active').style.display = 'block';
                document.getElementById(baseId + ':searchType:' + String(2) + ':none').style.display = 'none';
            } else if (str == "firstTrain") {
                document.getElementById(baseId + ':searchType:' + String(3) + ':active').style.display = 'block';
                document.getElementById(baseId + ':searchType:' + String(3) + ':none').style.display = 'none';
            } else if (str == "lastTrain") {
                document.getElementById(baseId + ':searchType:' + String(4) + ':active').style.display = 'block';
                document.getElementById(baseId + ':searchType:' + String(4) + ':none').style.display = 'none';
            } else if (str == "plain") {
                document.getElementById(baseId + ':searchType:' + String(5) + ':active').style.display = 'block';
                document.getElementById(baseId + ':searchType:' + String(5) + ':none').style.display = 'none';
            }
        } else if (agent == 2 || agent == 3) {
            if (str == "departure") {
                document.getElementsByName(baseId + ':searchType')[0].checked = true;
            } else if (str == "arrival") {
                document.getElementsByName(baseId + ':searchType')[1].checked = true;
            } else if (str == "firstTrain") {
                document.getElementsByName(baseId + ':searchType')[2].checked = true;
            } else if (str == "lastTrain") {
                document.getElementsByName(baseId + ':searchType')[3].checked = true;
            } else if (str == "plain") {
                document.getElementsByName(baseId + ':searchType')[4].checked = true;
            }
        }
        changeSearchType();
    }

    /**
    * 日付を外部から設定
    */
    function setDate(date) {
        var tmpDate = String(date);
        var yyyy, mm, dd;
        if (tmpDate.length == 8 && !isNaN(tmpDate)) {
            yyyy = tmpDate.substr(0, 4).replace(new RegExp('^0+'), '');
            mm = tmpDate.substr(4, 2).replace(new RegExp('^0+'), '');
            dd = tmpDate.substr(6, 2).replace(new RegExp('^0+'), '');
        } else if (tmpDate.split("/").length == 3) {
            yyyy = tmpDate.split("/")[0].replace(new RegExp('^0+'), '');
            mm = tmpDate.split("/")[1].replace(new RegExp('^0+'), '');
            dd = tmpDate.split("/")[2].replace(new RegExp('^0+'), '');
            if (isNaN(yyyy) || isNaN(mm) || isNaN(dd)) {
                // 日付は数値で指定してください。
                return false;
            }
        } else {
            // 日付はyyyy/mm/dd形式で指定してください。
            return false;
        }
        if (yyyy < 1900 || yyyy > 2099) {
            // 年の指定が間違っています。\n年は西暦で指定してください。
            return false;
        } else if (mm < 1 || mm > 12) {
            // 月の指定が間違っています。\n1月～12月の間で指定してください。
            return false;
        } else {
            if (dd < 1) {
                // 日の指定が間違っています。
                return false;
            }
            /**
            if(mm == 4 || mm == 6 || mm == 9 || mm == 11){
            if(dd<1 || dd>30){
            // 日の指定が間違っています。\n"+mm+"月は1日～30日の間で指定してください。
            return false;
            }
            }else if(mm == 2){
            if(yyyy%4 == 0 && (yyyy%100 != 0 || yyyy%400 == 0)){
            if(dd<1 || dd>29){
            // 日の指定が間違っています。\n"+yyyy+"年"+mm+"月は1日～29日の間で指定してください。
            return false;
            }
            }else{
            if(dd<1 || dd>28){
            // 日の指定が間違っています。\n"+yyyy+"年"+mm+"月は1日～28日の間で指定してください。
            return false;
            }
            }
            }else{
            if(dd<1 || dd>31){
            // 日の指定が間違っています。\n"+mm+"月は1日～31日の間で指定してください。
            return false;
            }
            }
            */
        }
        // リストから選択
        if (agent == 1) {
            // 年月+日の場合
            if (document.getElementById(baseId + ':date:mm').options.length == 0) {
                // まずは年月を設定
                var now = new Date();
                for (var i = now.getFullYear() - 1; i <= now.getFullYear() + 1; i++) {
                    for (var j = 1; j <= 12; j++) {
                        var tmp_option = document.createElement('option');
                        tmp_option.text = String(i) + '年' + String(j) + '月';
                        tmp_option.value = String(i) + '/' + String(j);
                        document.getElementById(baseId + ':date:mm').add(tmp_option);
                    }
                }
            }
            var refrech = false;
            var check = false;
            for (var i = 0; i < document.getElementById(baseId + ':date:mm').options.length; i++) {
                if (document.getElementById(baseId + ':date:mm').options.item(i).value == String(yyyy) + "/" + String(mm)) {
                    check = true;
                    if (document.getElementById(baseId + ':date:mm').selectedIndex != i) {
                        document.getElementById(baseId + ':date:mm').selectedIndex = i;
                        refrech = true;
                    }
                }
            }
            if (!check) {
                // 対象外の日付
                return false;
            }
            // カレンダーを再設定
            if (refrech) {
                setDateList(yyyy, mm);
            }
            for (var i = 0; i < document.getElementById(baseId + ':date:dd').options.length; i++) {
                if (document.getElementById(baseId + ':date:dd').options.item(i).value == String(dd)) {
                    document.getElementById(baseId + ':date:dd').selectedIndex = i;
                    return true;
                }
            }
            // 存在しない日付の場合は、最終日を設定
            document.getElementById(baseId + ':date:dd').selectedIndex = document.getElementById(baseId + ':date:dd').options.length - 1;
        } else if (agent == 2 || agent == 3) {
            // 月日の場合
            for (var i = 0; i < document.getElementById(baseId + ':date').options.length; i++) {
                if (document.getElementById(baseId + ':date').options.item(i).value == String(yyyy) + "/" + String(mm) + "/" + String(dd)) {
                    document.getElementById(baseId + ':date').selectedIndex = i;
                    return true;
                }
            }
            // リストがないので、カレンダーを再設定
            while (document.getElementById(baseId + ':date').lastChild) {
                document.getElementById(baseId + ':date').removeChild(document.getElementById(baseId + ':date').lastChild);
            }
            // リストを設定
            var calender_limit = 1;
            var week = new Array("日", "月", "火", "水", "木", "金", "土");
            var tmp_year = yyyy;
            var tmp_month = mm - calender_limit;
            if (tmp_month < 1) { tmp_year--; tmp_month += 12; }
            for (var i = 0; i < (calender_limit * 2) + 1; i++) {
                for (var j = 1; j <= getLastDate(tmp_year, tmp_month); j++) {
                    var tmp_option = document.createElement('option');
                    tmp_option.text = String(tmp_month) + '月' + String(j) + '日(' + week[new Date(tmp_year, tmp_month - 1, j).getDay()] + ')';
                    tmp_option.value = String(tmp_year) + '/' + String(tmp_month) + '/' + String(j);
                    document.getElementById(baseId + ':date').appendChild(tmp_option);
                }
                tmp_month++;
                if (tmp_month > 12) { tmp_year++; tmp_month = 1; }
            }
            for (var i = 0; i < document.getElementById(baseId + ':date').options.length; i++) {
                if (document.getElementById(baseId + ':date').options.item(i).value == String(yyyy) + "/" + String(mm) + "/" + String(dd)) {
                    document.getElementById(baseId + ':date').selectedIndex = i;
                    return true;
                }
            }
        }
    }

    /**
    * 日付のリストを修正
    */
    function setDateList(yyyy, mm) {
        while (document.getElementById(baseId + ':date:dd').lastChild) {
            document.getElementById(baseId + ':date:dd').removeChild(document.getElementById(baseId + ':date:dd').lastChild);
        }
        // リストを設定
        var calender_limit = 1;
        var week = new Array("日", "月", "火", "水", "木", "金", "土");
        for (var j = 1; j <= getLastDate(yyyy, mm); j++) {
            var tmp_option = document.createElement('option');
            tmp_option.text = String(j) + '日(' + week[new Date(yyyy, mm - 1, j).getDay()] + ')';
            tmp_option.value = String(j);
            document.getElementById(baseId + ':date:dd').add(tmp_option);
        }
    }

    /**
    * 時間を外部から設定
    */
    function setTime(time) {
        var tmpTime = String(time);
        if (tmpTime.length == 3 && tmpTime.indexOf(":") == -1) {
            document.getElementById(baseId + ':timeHH').selectedIndex = parseInt(tmpTime.substr(0, 1), 10);
            document.getElementById(baseId + ':timeMM').selectedIndex = parseInt(tmpTime.substr(1, 2), 10);
        } else if (tmpTime.length == 4 && tmpTime.indexOf(":") == -1) {
            document.getElementById(baseId + ':timeHH').selectedIndex = parseInt(tmpTime.substr(0, 2), 10);
            document.getElementById(baseId + ':timeMM').selectedIndex = parseInt(tmpTime.substr(2, 2), 10);
        } else if (tmpTime.indexOf(":") != -1) {
            var timeList = tmpTime.split(":");
            if (timeList.length == 2) {
                document.getElementById(baseId + ':timeHH').selectedIndex = parseInt(timeList[0], 10);
                document.getElementById(baseId + ':timeMM').selectedIndex = parseInt(timeList[1], 10);
            }
        }
    }

    /**
     * 平日に補正
     */
    function setWeekday() {
        var tmp_Date = getDate();
        var check_date = new Date(parseInt(tmp_Date.substr(0, 4), 10), parseInt(tmp_Date.substr(4, 2), 10) - 1, parseInt(tmp_Date.substr(6, 4), 10));
        for (var i = 0; i < 31; i++) {
            if (check_date.getDay() > 0 && check_date.getDay() < 6) {
                // 祝日判定
                if (getNationalHoliday(check_date.getFullYear(), check_date.getMonth() + 1, check_date.getDate(), check_date.getDay()) == '') {
                    break;
                }
            }
            check_date.setDate(check_date.getDate() + 1);
        }
        setDate(check_date.getFullYear() + "/" + (check_date.getMonth() + 1) + "/" + check_date.getDate());
    }

    /**
    * 環境設定
    */
    function setConfigure(name, value) {
        if (name.toLowerCase() == String("apiURL").toLowerCase()) {
            apiURL = value;
        } else if (name.toLowerCase() == String("key").toLowerCase()) {
            key = value;
        } else if (name.toLowerCase() == String("agent").toLowerCase()) {
            agent = value;
        } else if (String(name).toLowerCase() == String("ssl").toLowerCase()) {
            if (String(value).toLowerCase() == "true" || String(value).toLowerCase() == "enable" || String(value).toLowerCase() == "enabled") {
                apiURL = apiURL.replace('http://', 'https://');
            } else {
                apiURL = apiURL.replace('https://', 'http://');
            }
        }
    }

    // 外部参照可能な関数リスト
    this.dispDateTime = dispDateTime;
    this.checkDate = checkDate;
    this.getDate = getDate;
    this.getTime = getTime;
    this.getSearchType = getSearchType;
    this.setSearchType = setSearchType;
    this.setDate = setDate;
    this.setTime = setTime;
    this.openCalendar = openCalendar;
    this.closeCalendar = closeCalendar;
    this.setConfigure = setConfigure;
    this.setWeekday = setWeekday;

    // 定数リスト
    this.SEARCHTYPE_DEPARTURE = "departure";
    this.SEARCHTYPE_ARRIVAL = "arrival";
    this.SEARCHTYPE_FIRSTTRAIN = "firstTrain";
    this.SEARCHTYPE_LASTTRAIN = "lastTrain";
    this.SEARCHTYPE_PLAIN = "plain";
    this.SEARCHTYPE_DIA = "dia";

    // 端末制御
    this.AGENT_PC = 1;
    this.AGENT_PHONE = 2;
    this.AGENT_TABLET = 3;
};
