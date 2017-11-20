# 駅すぱあとWebサービス HTML5インターフェースサンプル

「駅すぱあとWebサービス」を利用したサンプルコードです。  

 ソースコードや画像は自由に改変できますので、是非ご利用ください。  
 なお、サンプルとしてのご提供のため、動作保証やお問い合わせ等のサポートは承っておりません。  
 ご利用にあたりユーザーズガイドをご用意しておりますので、ご参照ください。  

 サンプルコードへのご意見・ご要望につきましては、[GitHubのIssue](https://github.com/EkispertWebService/GUI/issues/new)へ投稿いただけますと幸いです。  
 今後のサンプルご提供にあたり参考とさせていただきます。  

## ダウンロードしたファイルの利用方法

ダウンロードしたファイルを展開し、表示するサーバーへ設置してください。

なお、表示するページごとにJavaScriptをインクルードする必要があります。

インクルードは下記使用例を参考に記述してください。

### 【使用例1】jsファイルをルートに設置した場合

~~~html
<script type="text/javascript" src="コンポーネント名.js?key=keycode" charset="UTF-8"></script>
~~~

### 【使用例2】ディレクトリ構成を残した場合

~~~html
<script type="text/javascript" src="コンポーネント名/コンポーネント名.js?key=keycode" charset="UTF-8"></script>
~~~

※ keycode の部分には、Webサービスのキーコードを記述します。

※ コンポーネントのご利用にはアクセスキーが必要になります。アクセスキーはサービス契約時に弊社より送付されます。


また、下記のパーツをご利用の場合はCSSファイルのインクルードも必要になります。

* 日付入力パーツ
* 駅名入力パーツ
* 探索条件パーツ
* 経路表示パーツ
* 駅時刻表パーツ
* 区間時刻表パーツ
* 列車時刻表パーツ
* 定期払戻計算パーツ
* 路線図パーツ

インクルードは下記使用例のいずれかを三項に記述してください。

### 【使用例1】expCssをルートに設置した場合

~~~html
<link class="css" rel="stylesheet" type="text/css" href="expCss/コンポーネント名.css">
~~~

### 【使用例2】ディレクトリ構成を残した場合

~~~html
<link class="css" rel="stylesheet" type="text/css" href="コンポーネント名/expCss/コンポーネント名.css">
~~~

## サンプルコード

[Wiki](https://github.com/EkispertWebService/GUI/wiki)にてリファレンスやサンプルなどをご用意しております。

## 対象環境

|OS|バージョン|ブラウザ|備考|
| --- | --- | --- | --- |
|Windows  |xp/Vista/7 | IE8 | 表示が崩れることがあります  |
|Windows  |Vista/7 | IE9 | 追加のライブラリが必要です  |
|Windows  |7/8 | IE10/IE11 |  |
|Windows  |8.1 | IE11 |  |
|MacOSX  |10.7以降 | Safari | 最新版のみ対応  |
|Windows/Mac | - | FireFox | 最新版のみ対応  |
|Windows/Mac | - | Chrome | 最新版のみ対応  |
|iOS | 5.1.1以降 | Safari |  |
|Android(2.x系) | 2.3.4以降 | 標準ブラウザ | 一部端末では表示が崩れることがあります  |
|Android(3.x系) | 3.1以降 | 標準ブラウザ |  |
|Android(4.x系) | 4.0 | 標準ブラウザ | 4.1以降は未対応  |
|Android(4.x系) | 4.0以降 | Chrome | |
|Android(5.x系) | 5.0以降 | Chrome | |

### IE8/IE9での制限

* 制限事項

IE8/IE9は標準でJSONに対応していないため、そのままでは利用することが出来ません。

* 回避方法

IE8/IE9の場合は"json2.js"等を利用し、JSONへの拡張を行なってください。 なお、IE10/IE11やFIrefox、Chromeは標準で対応していますので、追加は不要です。


## デモ

### 画面サンプル

|||
| --- | --- |
|経路探索|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/sample.html)|
|鉄道駅の時刻表|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/stationTimetable.html)|
|区間の時刻表|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/sectionTimetable.html)|
|鉄道駅時刻表の列車情報|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/trainTimetable.html)|
|定期代の払い戻し計算|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/repayment.html)|
|定期代/運賃の分割計算|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/divided.html)|
|経路を利用した時刻表表示|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/courseTimetable.html)|
|回数券を利用した経路探索|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/courseCoupon.html)|
|ランドマークを利用した経路探索|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/landmardCourse.html)|

### データ取得サンプル

|||
| --- | --- |
|駅情報の取得|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/stationInfo.html)|
|路線情報の取得|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/railInfo.html)|
|範囲探索|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/stationRange.html)|
|回数券情報の表示|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/couponList.html)|

### 路線図

|||
| --- | --- |
|路線図表示サンプル|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/basic.html)|
|路線図イベント設定サンプル|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/event.html)|
|路線図駅クリック設定サンプル|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/click.html)|
|路線図サイズ調整サンプル|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/table.html)|
|路線図アプリケーションの実例サンプル|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/powerful.html)|

### 駅すぱあとの情報

|||
| --- | --- |
|データバージョンの取得|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/dataVersion.html)|

### 拡張ツール

|||
| --- | --- |
|JSON/XML変換|[サンプルを確認](http://ekispertwebservice.github.io/GUI/sample/xmlCourse.html)|
