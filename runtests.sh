#!/bin/sh
mocha --recursive -R spec -t 300000 -s 30000 -A
echo "Done!"
exit 0
