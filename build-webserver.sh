#!/bin/sh

echo "---------------------"
echo "Starting build of $1"

# $1 = app name
D=./dist/app-$1
rm -rf $D

mkdir $D
mkdir $D/src
mkdir $D/rest-api
mkdir $D/config
mkdir $D/util
mkdir $D/data
mkdir $D/modules
mkdir $D/modules/app
mkdir $D/modules/roxy
mkdir $D/example-workplaces

cp ./webserver/* $D/
echo "Copying src"
cp -R ./apps/$1/src/* $D/src/
cp -R ./apps/$1/src/app/* $D/modules/app/
cp -R ./apps/$1/src/roxy/* $D/modules/roxy/
echo "Copying rest-api"
cp -R ./webserver/rest-api/* $D/rest-api/
cp -R ./apps/$1/rest-api/* $D/rest-api/
echo "Copying workplaces"
cp -R ./apps/$1/example-workplaces/* $D/example-workplaces/
echo "Copying configuration"
cp -R ./webserver/config/* $D/config/
echo "Copying util apps"
cp -R ./webserver/util/* $D/util/
#echo "Copying package.json" #Superseded by mljswebserver's npm package.json
#cp ./apps/$1/package.json $D/
echo "Installing rest extension description file"
cp ./apps/$1/data/restapi.json $D/data/
echo "Copying bower.json"
cp ./apps/$1/bower.json $D/

# Now copy final files in to Yeoman generator
BASE=../generator-mljs$1
echo "gen base: $BASE"
rm -rf $BASE/app/templates/files/*
cp -R $D/* $BASE/app/templates/files/
rm $BASE/app/templates/files/config/env.js
rm $BASE/app/templates/files/config/webserver-settings.sh
# Above two files are overwritten by Yeoman. Doing the above avoids conflict warnings

cd dist
tar czf ./app-$1.tar.gz app-$1
cd ..

rm -rf $D

echo "Completed build of $1"
echo "---------------------"
exit 0
