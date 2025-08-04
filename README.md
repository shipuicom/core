# 🚢 Ship UI

A modern signal based and zoneless compatable UI library for Angular

## Base setup

To start using ShipUI make sure you're using angular 19 or newer.

### Install

```sh
npm i -S @ship/core
```

### Add styles inside your src/styles.scss

```scss
@use 'ship-ui/styles';
```

### Inside your angular.json file

you need to add the ship assets to your assets array this is to add the ship default font

```json
"assets": [
  "src/assets",
  {
    "glob": "**/*",
    "input": "./node_modules/ship-ui/assets",
    "output": "./ship-ui-assets/"
  }
]
```

### Setup Icons

Ship comes with a custom CLI for subsetting and auto generating an icon font currently we support Phospher icons

```html
<!-- Add to the head of your index.html -->
<link rel="stylesheet" href="/ship.css" />
```

### Add following scripts to your package.json scripts

One are for generating the icon font once, the other has a watch feature.

```json
"scripts": {
  ..
  "gen:font": "ship-fg --src='./src' --out='./src/assets' --rootPath='./'",
  "watch:font": "ship-fg --src='./src' --out='./src/assets' --rootPath='./' --watch",
  ..
}
```

### Now update your current start and build scripts

You now wanna add when to build the font and when to watch so it works well together with your start and build, **remember** to add the `npm run gen:font` to all your build scripts

```json
"scripts": {
  ..
  "start": "npm run watch:font & ng serve",
  "build": "npm run gen:font & ng build",
  ..
}
```
