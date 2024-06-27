# Moddable版 ｽﾀｯｸもん

このプログラムは、[ｽﾀｯｸﾁｬﾝ](https://github.com/stack-chan/stack-chan) の顔を妖精形態のずんだもんにするための改造ファームウェアと、専用Modのセットです。画像は一切使っておらず、図形描画機能しか使用していないため、簡単に導入可能です。

## インストール方法

既にｽﾀｯｸﾁｬﾝが作れている環境であれば、追加のソフトウェアやライブラリの導入は不要です。

### 1. 改造ファームウェアとModの導入

`firmware`ディレクトリのすべてのファイルを、`stack-chan/firmware`フォルダに上書きコピーしてください。

### 2. 設定ファイルの編集

※あらかじめWifiのSSID, パスワードと、ホストPCのIPアドレスを確認してください。

`stack-chan/firmware/stackchan`ディレクトリに上書き保存された、`manifest_local.json`を開きます。
```json
{
    "include": [
        "./manifest.json",
		"./manifest_8mb_flash.json"
    ],
    "config": {
		"ssid": "Your_SSID",
        "password": "Your_PASSWORD",
        "tts": {
            "type": "voicevox",
            "host": "192.168.0.1",
            "port": 50021
        },
        "driver": {
			"type": "pwm",
			"pwmPan": 13,
			"pwmTilt": 14
        },
        "renderer": {
			      "type": "zunf"
        }
    }
}
```

7行目 `Your_SSID` 、8行目 `Your_PASSWORD` をお使いのWifiのSSIDとパスワードに、11行目のIPアドレス `192.168.0.1` をあらかじめ確認したホストPCのIPアドレスに変えてください。

また、14～18行目 `driver` の項目についても、お使いになるｽﾀｯｸﾁｬﾝに合わせて変えてください。

### 3. ファームウェアの書き込み
ターミナル(Windowsの場合は、ｽﾀｯｸﾁｬﾝファームウェアのインストール時に導入されるModdable コマンドプロンプトを使用)を開いてください。

`stack-chan/firmware` ディレクトリに移動し、[ｽﾀｯｸﾁｬﾝのドキュメント](https://github.com/stack-chan/stack-chan/blob/dev/v1.0/firmware/docs/flashing-firmware_ja.md) に従い、ホストプログラムの書き込みまたはデバッグを行ってください。書き込みに成功すると、白黒が反転した姿のずんだもんになると思いますが、**これで正常です**。

### 4. Modの導入

`mods`ディレクトリに導入された、`zunda_mod`というModを使用します。

[ｽﾀｯｸﾁｬﾝのドキュメント](https://github.com/stack-chan/stack-chan/blob/dev/v1.0/firmware/docs/flashing-firmware_ja.md) に従い、ホストプログラムの書き込みまたはデバッグを行ってください。

**例(M5Stack Core2の場合)**

```console
npm run mod --target=esp32/m5stackk_core2 ./mods/zunda_mod/manifest.json
```
Modの導入に成功すれば、正しい色のずんだもんが表示されるはずです。

## 使い方
専用Modでは、A～Cの各ボタンに機能を割り当てています。

### ボタンA: 独り言モード

※Monologue Modを改良し、反復呼び出しに変えたもの

あらかじめ設定されたセリフと感情の組み合わせに従い、ずんだもんがしゃべり続けます。もう一度ボタンAを押すと、独り言を止めます。

### ボタンB: きょろきょろモード

※ほぼLook around Modの移植

ｽﾀｯｸもんがきょろきょろします。もう一度ボタンBを押すと、動きを止めます。

### ボタンC: 色変え

ボタンCを押すたび、いろが「ずんだもん色」と「あんこもん色」で切り替わります。

## 注意事項

- 画面サイズが320x240のM5Stack Core2 v1.1で開発しております。それ以外のサイズでは描画がうまくいかない可能性があります。
- ソースコードが・＿・の2倍以上の行数、レイヤー数が・＿・の4倍あるので、もしかすると描画処理能力が低いマイコンでは正常動作しないかもしれません。

## 既知の問題

私がCore2 v1.1 2台でテストした際、いずれの個体でもボタンがなかなか反応しない場合がありました。Modで、ボタンが押されると右上に文字が表示される仕様にしたので、反応するまで根気よく押してみてください。