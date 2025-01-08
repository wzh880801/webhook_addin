#! /bin/bash
pm2 start ./http/index.js --name http-server
pm2 start ./http/job-handler.js --name job-handler
pm2 start ./http/bull-board.js --name bull-board
tail -f /dev/null