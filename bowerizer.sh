#!/bin/sh

if [ -a ../mljs-bower ]; then
    rm -rf ../mljs-bower
fi

mkdir ../mljs-bower

cd ../mljs-bower
tar -xzf ../mljs/dist/mljs-browser-minified.tar.gz 

mv dist/mljs/browser-minified prod
rm -rf dist

tar -xzf ../mljs/dist/mljs-browser.tar.gz 
mv dist/mljs/browser-raw dev

rm -rf dist

cp ../mljs/mljs-bower.json bower.json




