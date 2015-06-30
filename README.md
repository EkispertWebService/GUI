# Webサービス・GUIソリューション

https://github.com/EkispertWebService/GUI

1.ダウンロードしたファイルの利用方法

ダウンロードしたファイルを展開し、表示するサーバーへ設置してください。

なお、表示するページごとにJavaScriptをインクルードする必要があります。

インクルードは下記使用例を参考に記述してください。 

`<script type="text/javascript" src="コンポーネント名.js?key=keycode" charset="UTF-8"></script>`

※ keycode の部分には、Webサービスのキーコードを記述します。

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

`<link class="css" rel="stylesheet" type="text/css" href="expCss/コンポーネント名.css">`

2.対象環境

Windows  xp/Vista/7  IE8  表示が崩れることがあります  
Windows  Vista/7  IE9  追加のライブラリが必要です  
Windows  7/8  IE10/IE11   
Windows  8.1  IE11   
MacOSX  10.7以降  Safari  最新版のみ対応  
Windows/Mac  -  FireFox  最新版のみ対応  
Windows/Mac  -  Chrome  最新版のみ対応  
iOS  5.1.1以降  Safari   
Android(2.x系)  2.3.4以降  標準ブラウザ  一部端末では表示が崩れることがあります  
Android(3.x系)  3.1以降  標準ブラウザ   
Android(4.x系)  4.0  標準ブラウザ  4.1以降は未対応  
Android(4.x系)  4.0以降  Chrome  
Android(5.x系)  5.0以降  Chrome  

3.IE8/IE9での制限

* 制限事項

IE8/IE9は標準でJSONに対応していないため、そのままでは利用することが出来ません。 

* 回避方法 

IE8/IE9の場合は"json2.js"等を利用し、JSONへの拡張を行なってください。 なお、IE10/IE11やFIrefox、Chromeは標準で対応していますので、追加は不要です。 
