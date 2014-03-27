#!/bin/sh

if [ ! -d ../mljs-bower ]; then
   mkdir ../mljs-bower
fi

cd ../mljs-bower

rm -rf prod
rm -rf dev
rm -rf widgets

tar -xzf ../mljs/dist/mljs-browser-minified.tar.gz 

mv dist/mljs/browser-minified prod
rm -rf dist

tar -xzf ../mljs/dist/mljs-browser.tar.gz 
mv dist/mljs/browser-raw dev

rm -rf dist

mkdir -p widgets
cp ../mljs/mldbwebtest/src/public/js/mldbtest/widget*.js widgets

cp ../mljs/mljs-bower.json bower.json




