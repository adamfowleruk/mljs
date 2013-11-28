#!/bin/sh
./cpjs.sh 

mkdir mljsrest/src/js
mkdir mljsrest/src/js/lib
mkdir mljsrest/src/js/mljs
mkdir mljsrest/src/js/mljstest
mkdir mljsrest/src/css
mkdir mljsrest/src/css/mljs
mkdir mljsrest/src/images
mkdir mljsrest/src/images/mljs

cp -R mldbwebtest/src/public/js/mljs mljsrest/src/js
cp -R mldbwebtest/src/public/js/mljstest mljsrest/src/js
cp -R mldbwebtest/src/public/css/mljs mljsrest/src/css
cp -R mldbwebtest/src/public/images/mljs mljsrest/src/images

# other dependencies now
cp -R mldbwebtest/src/public/js/OpenLayers-2.13.1 mljsrest/src/js
cp -R mldbwebtest/src/public/js/dataproviders mljsrest/src/js
cp mldbwebtest/src/public/js/highcharts.js mljsrest/src/js/
cp mldbwebtest/src/public/js/kratu.js mljsrest/src/js/
cp mldbwebtest/src/public/js/kratuSignalAdjustments.js mljsrest/src/js/

cp mldbwebtest/src/public/js/lib/jquery-1.7.1.min.js mljsrest/src/js/lib/ 

echo "Done."
exit 0
