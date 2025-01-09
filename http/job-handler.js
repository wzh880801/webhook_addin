
const axios = require('axios');
const Queue = require("bull");
const cfg = require('./config');

const logger = require('../log/log_helper_v2').default().useFile(__filename).useSingleAppendMode();

const { sendCardMsg } = require('../feishu/webhook_robot');

const myQueue = new Queue(cfg.queue_name, {
    redis: cfg.redis
});
myQueue.on('error', err => {
    console.log(`[job-handler]bull queue error`, err);
})

// 增加队列的处理逻辑
myQueue.process(async (job, done) => {

    const body = job.data;

    const _logger = logger.default().new();
    if (body.__trace_id) {
        _logger.useTraceId(body.__trace_id);
    }

    await job.progress(10);

    try {
        const resp = await handle(body);

        await job.progress(100);

        done(null, resp);
    }
    catch (err) {
        _logger.append({ ext: 'JOB_PROCESS_ERROR' }).error({ err_msg: err.message, stack: err.stack });
        done(err, null);
    }
    finally {

    }
});

/**
 * 
 * @param {import('../feishu/data').IGrafanaAlertBody} body 
 * @returns 
 */
async function handle(body) {
    // process logic

    const _logger = logger.default().new();
    if (body.__trace_id) {
        _logger.useTraceId(body.__trace_id);
    }

    if (!body.__webhook_url) {
        throw new Error(`webhook(${body.__webhook_id})'s configuration is incorrect!`);
    }

    const resp = await sendCardMsg(body.__webhook_url, body);
    if (resp) {
        _logger.info(resp);
    }
}

logger.info(`processor started.`);