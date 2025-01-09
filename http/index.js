
// const redis_client = require('../redis/redis_client').createInstance(1);
const logger = require('../log/log_helper_v2').default().useFile(__filename).useSingleAppendMode();
const { v4: uuidv4 } = require('uuid');
const Queue = require('bull');
const cfg = require('./config');

/* 引入express框架 */
const express = require('express');
const app = express();

const myQueue = new Queue(cfg.queue_name, {
    redis: cfg.redis
});
myQueue.on('error', err => {
    console.log(`[index]bull queue error`, err);
})

/* 引入cors */
const cors = require('cors');
app.use(cors());

app.use(express.urlencoded({ extended: false }));

app.use(function (req, res, next) {

    var contentType = req.headers['content-type'] || '', mime = contentType.split(';')[0];

    let data = '';

    req.on('data', function (chunk) {
        data += chunk;
    });

    req.on('end', function () {
        req.rawBody = data;
        if (['application/json'].indexOf(mime) !== -1) {
            try {
                req.body = JSON.parse(req.rawBody);
            }
            catch (err) {
                logger.error(`[Parse JSON Body Error]${err.message}\t${err.stack}`);
            }
        }
        next();
    });
});

// 插入一个中间件用来做签名验证
app.all('*', async function (req, res, next) {
    const _logger = logger.default().new();
    _logger.info(`${req.method}\t${req.url}`);

    req.__trace_id = _logger.getTraceid();

    // 获取签名验证的 header
    const sign = req.headers['authorization'];

    // webhook 的请求合法性验证
    const v_sign = process.env['WEBHOOK_AUTH_KEY'];
    if (v_sign) {

        if (!sign) {
            res.status(401).json({
                code: -1,
                msg: 'Authorization info is empty!'
            })
            return;
        }

        if (sign !== `Bearer ${v_sign}`) {
            res.status(401).json({
                code: -1,
                msg: 'Authorization failed!'
            })
            return;
        }
    }

    next();
});

// default webhook
app.post('/webhook', async (req, res) => {

    const _logger = logger.default().new();
    if (req.__trace_id) {
        _logger.useTraceId(req.__trace_id);
    }

    const id = 'default';
    if (!process.env[getWebhookEnvId(id)]) {
        res.status(400).json({
            code: -1,
            msg: `default webhook configuration incorrect. `
        })
        return;
    }

    const event_body = req.body;

    const uuid = uuidv4();

    _logger.info({ uuid, event_body });

    const job = await myQueue.add({
        ...event_body,
        __webhook_id: 'default',
        __webhook_url: process.env[getWebhookEnvId(id)],
        __trace_id: _logger.getTraceid(),
        __uuid: uuid
    }, { removeOnComplete: { age: 3600 * 12, count: 100 } });

    res.json({
        code: 200,
        msg: "ok",
        uuid: uuid,
        jobId: job.id,
        timestamp: `${new Date().getTime()}`
    });
})

app.post('/webhook/:id', async (req, res) => {

    const _logger = logger.default().new();
    if (req.__trace_id) {
        _logger.useTraceId(req.__trace_id);
    }

    const id = req.params.id;
    if (!id || !process.env[getWebhookEnvId(id)]) {
        res.status(400).json({
            code: -1,
            msg: `webhook configuration incorrect. `
        })
        return;
    }

    const event_body = req.body;

    const uuid = uuidv4();

    _logger.info({ uuid, event_body });

    const job = await myQueue.add({
        ...event_body,
        __webhook_id: id,
        __webhook_url: process.env[getWebhookEnvId(id)],
        __trace_id: _logger.getTraceid(),
        __uuid: uuid
    }, { removeOnComplete: { age: 3600 * 12, count: 100 } });

    res.json({
        code: 200,
        msg: "ok",
        uuid: uuid,
        jobId: job.id,
        timestamp: `${new Date().getTime()}`
    });
})

app.get('/jobs/:jobid', async (req, res) => {
    // 路径参数可以通过req.params对象访问
    const jobid = req.params.jobid;
    if (!jobid) {
        res.json({
            code: -1,
            msg: `jobid is null`
        })
        return;
    }

    const job = await myQueue.getJob(jobid);
    if (!job) {
        res.json({
            code: 0,
            msg: `job ${jobid} does not exists.`
        })
        return;
    }

    // 你可以使用这些参数来执行一些操作
    res.json({
        code: 0,
        data: {
            id: job.id,
            state: await job.getState(),
            result: job.returnvalue
        }
    })
});

/**
 * 
 * @param {string} id 
 * @returns {string}
 */
function getWebhookEnvId(id) {
    return `WEBHOOK_${id}`;
}

const { WEBHOOK_HTTP_PORT } = process.env;

const http_port = WEBHOOK_HTTP_PORT ? WEBHOOK_HTTP_PORT : 44444;

/* 监听端口 */
app.listen(http_port, () => {
    console.log(`listening: ${http_port}`);
})