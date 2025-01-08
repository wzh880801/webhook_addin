"use strict";
exports.__esModule = true;
var logHelper_1 = require("./logHelper");
function default_1() {
    const logger = new logHelper_1.LogHelper()
        .setServiceName('webhook')
        .setPath('/var/logs/webhook');

    if (process.env['LOKI_API_URL']) {
        return logger
            .setLoki(process.env['LOKI_API_URL'], process.env['LOKI_API_KEY'])
            .withReport();
    }
    return logger.noReport();
}
exports["default"] = default_1;
