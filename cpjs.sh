#!/bin/sh
cp src/js/mljs.js ./apps/mldbwebtest/src/public/js/mljs/
cp src/js/widgets*.js ./apps/mldbwebtest/src/public/js/mljs/
cp src/css/* ./apps/mldbwebtest/src/public/css/mljs/
cp src/images/ ./apps/mldbwebtest/src/public/images/mljs/#!/bin/sh

cp src/js/mljs.js ./apps/mljsrest/src/public/js/mljs/
cp src/js/widgets*.js ./apps/mljsrest/src/public/js/mljs/
cp src/css/* ./apps/mljsrest/src/public/css/mljs/
cp src/images/ ./apps/mljsrest/src/public/images/mljs/

echo "Copied mljs files to webapps."
