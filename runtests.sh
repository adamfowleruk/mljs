#!/bin/sh
rm logs/*.log
mocha --recursive -R spec -t 300000 -s 30000 -A
echo "Done!"
exit 0
