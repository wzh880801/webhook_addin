const { axios } = require('../common/axiosEx');
const logger = require('../log/log_helper_v2').default().useFile(__filename).useSingleAppendMode();
const { buildCardJson, buildCardJsonUsingTable } = require('./common');

module.exports = {
    sendCardMsg
}

/**
 * 
 * @param {string} webhook_url 
 * @param {import("./data").IGrafanaAlertBody} msg 
 */
async function sendCardMsg(webhook_url, msg) {

    // logger.info({ webhook_url, msg })
    const _logger = logger.default().new();
    if (msg && msg.__trace_id) {
        _logger.useTraceId(msg.__trace_id);
    }

    if (msg.status !== 'firing') {
        _logger.info('not firing, ignore');
        return;
    }

    const resp = await axios({
        url: webhook_url,
        method: 'POST',
        headers: {
            "Content-Type": 'application/json'
        },
        data: {
            msg_type: 'interactive',
            // card: {
            //     type: 'template',
            //     data: {
            //         template_id: 'AAqjWKjvUYb96',
            //         template_version_name: '1.0.0',
            //         template_variable: {
            //             title: msg.title,
            //             subtitle: msg.commonLabels.alertname,
            //             content: msg.message
            //         }
            //     }
            // }
            card: buildCardJson(msg)
        }
    })
    return resp.data;
}