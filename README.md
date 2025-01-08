# 将 Grafana 报警通过飞书 webhook 机器人推送到指定群组

本项目用于将 Grafana 产生的报警信息通过飞书自定义机器人（webhook 机器人）方式推送到指定群组。

部署方式：

一、 源码部署
1. clone 代码
2. 安装 npm 依赖
进入到项目根目录，执行 `npm i`
3. 安装 pm2（可选）
```bash
npm i pm2@latest -g
```
4. 配置
- 配置 redis、HTTP 端口号等信息
通过环境变量方式配置
```bash
export REDIS_HOST=127.0.0.1
export REDIS_PORT=6379
export REDIS_DB_NUMBER=15
export WEBHOOK_HTTP_PORT=44444
export BULL_BOARD_PORT=44445
export LOKI_API_URL=
export LOKI_API_KEY=
export WEBHOOK_AUTH_KEY=123456
```
-  配置在 Grafana 中使用的 HTTP Endpoint
```bash
export WEBHOOK_default=<飞书webhook机器人地址>
export WEBHOOK_openapi_alert=<飞书webhook机器人地址>
```
5. 启动
```bash
// 接收 grafana 告警推送，转存到 redis 队列
node ./http/index.js

// 消费队列，按照配置推送消息
node ./http/job-handler.js

// 可选，队列的管理面板
node ./http/bull-board.js
```
或
```bash
// 需要先安装 pm2
sudo chmod +x ./start.sh
./start.sh
```

二、docker 部署

1. build docker image
```bash
docker build . -t webhook_addin
```
2. run docker container
```bash
docker run --name grafana_webhook webhook_addin -p 44444:44444 -p 44445:44445 -e  REDIS_HOST=127.0.0.1 -e REDIS_PORT=6379 -e REDIS_DB_NUMBER=15 -e LOKI_API_URL=<loki_url> -e LOKI_API_KEY=<loki_key> -e WEBHOOK_AUTH_KEY=123456 -e WEBHOOK_default=<feishu_webhook_url> -d
```