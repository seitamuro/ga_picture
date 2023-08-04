# セットアップ

1. `Cmd + Shift + P`で`Create p5.js project`をクリック
2. `nodenv local 18.15.0`
3. `yarn add parcel -D`
4. `yarn add p5`
5. `yarn add @types/p5 -D`
6. `package.json`を編集

```json
"scripts": {
  "dev": "parcel index.html --open",
  "build": "parcel build index.html"
},
```

7. `index.html`に下記を追加

```javascript
<script src="sketch.ts" type="module"></script>
```

# 実行

`yarn dev`

# 参考
[VS Code & TypeScriptとp5.jsで始める
モダンなクリエイティブコーディング入門](https://ics.media/entry/210129/)