#!/bin/sh

if [ ! -d ../mljs-bower ]; then
   mkdir ../mljs-bower
fi

cd ../mljs-bower

rm -rf prod
rm -rf dev
rm -rf widgets
mkdir prod
mkdir dev

tar -xzf ../mljs/dist/mljs-browser-minified.tar.gz

mv dist/mljs/browser-minified/roxy/public/js/mljs prod/js
mv dist/mljs/browser-minified/roxy/public/css/mljs prod/css
mv dist/mljs/browser-minified/roxy/public/images/mljs prod/images
rm -rf dist

tar -xzf ../mljs/dist/mljs-browser.tar.gz
mv dist/mljs/browser-raw/roxy/public/js/mljs dev/js
mv dist/mljs/browser-raw/roxy/public/css/mljs dev/css
mv dist/mljs/browser-raw/roxy/public/images/mljs dev/images
rm -rf dist

cp ../mljs/mljs-bower.json bower.json
