#!/bin/sh

mkdir dist/temp
cd dist/temp

rm -rf ../grunt/css
rm -rf ../grunt/js
rm -rf ../grunt/images
mkdir ../grunt/css
mkdir ../grunt/images
mkdir ../grunt/js

tar -xzf ../mljs-browser.tar.gz

mv dist/mljs/browser-raw/roxy/public/js/mljs/* ../grunt/js
mv dist/mljs/browser-raw/roxy/public/css/mljs/* ../grunt/css
#mv dist/mljs/browser-raw/roxy/public/images/mljs/* ../grunt/images

cd ../..

rm -rf dist/temp

echo "Done bower"

exit 0
