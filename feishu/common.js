
const linq = require('linq');
const moment = require('moment-timezone');

module.exports = {
    buildCardJson,
    buildCardJsonUsingTable
}

/**
 * 将 Grafana alert 组装为 Table 样式卡片
 * @param {import("./data").IGrafanaAlertBody} msg 
 * @returns {any}
 */
function buildCardJsonUsingTable(msg) {
    const firing_count = linq.from(msg.alerts).count(x => x.status === 'firing');
    const tags = [];
    if (firing_count > 0) {
        tags.push(`FIRING:${firing_count}`);
    }
    const title = `[${tags.join(', ')}] ${msg.groupLabels.alertname}`;

    let table =
    {
        "schema": "2.0",
        "config": {
            "width_mode": "fill"
        },
        "header": {
            "template": "yellow",
            "title": {
                "tag": "plain_text",
                "content": title
            },
            "subtitle": {
                "tag": "plain_text",
                "content": msg.groupLabels.grafana_folder
            }
        },
        body: {
            "elements": [
                {
                    "tag": "table",
                    "page_size": 10,
                    "row_height": "high",
                    // freeze_first_column: true,
                    "header_style": {
                        "text_align": "left",
                        "text_size": "normal",
                        "background_style": "none",
                        "text_color": "grey",
                        "bold": true,
                        "lines": 1
                    },
                    "columns": [
                        {
                            "name": "start",
                            "display_name": "开始时间(GTM+8)",
                            width: '180px',
                            "data_type": "text",
                            "horizontal_align": "left"
                        },
                        {
                            "name": "status",
                            "display_name": "状态",
                            width: '80px',
                            "data_type": "markdown",
                            "horizontal_align": "left"
                        },
                        {
                            "name": "alert_name",
                            "display_name": "报警名称",
                            "data_type": "text",
                            "horizontal_align": "left"
                        },
                        {
                            "name": "grafana_folder",
                            "display_name": "报警组",
                            "data_type": "text",
                            "horizontal_align": "left"
                        },
                        {
                            "name": "labels",
                            "display_name": "标签",
                            "data_type": "markdown",
                            "horizontal_align": "left"
                        },
                        {
                            "name": "values",
                            "display_name": "Values",
                            "data_type": "markdown",
                            "horizontal_align": "left"
                        },
                        {
                            "name": "annotations",
                            "display_name": "注解",
                            "data_type": "markdown",
                            "horizontal_align": "left"
                        },
                        {
                            "name": "more",
                            "display_name": "更多",
                            "data_type": "markdown",
                            "horizontal_align": "left"
                        }
                    ],
                    "rows": [
                    ]
                }
            ]
        }
    }

    for (const alert of msg.alerts) {
        if (alert.status !== 'firing') {
            continue;
        }

        const labels = linq.from(Object.keys(alert.labels)).where(x => ['alertname', 'grafana_folder'].indexOf(x) === -1).toArray();
        table.body.elements[0].rows.push({
            start: moment(alert.startsAt).tz('Asia/Shanghai').format('yyyy-MM-DD HH:mm:ss'),
            status: alert.status === 'firing' ? `<text_tag color='orange'>${alert.status}</text_tag>` : `<text_tag color='green'>${alert.status}</text_tag>`,
            alert_name: alert.labels.alertname,
            grafana_folder: alert.labels.grafana_folder,
            labels: labels.length > 0 ? linq.from(labels).select(x => `- ${x}=${alert.labels[x]}`).toArray().join('\n') : '--',
            values: linq.from(Object.keys(alert.values)).select(x => `- ${x}=${alert.values[x]}`).toArray().join('\n'),
            annotations: Object.keys(alert.annotations).length > 0 ? linq.from(Object.keys(alert.annotations)).select(x => `- ${x}=${alert.values[x]}`).toArray().join('\n') : '--',
            more: `<link icon='window-new_outlined' url='${alert.generatorURL}'>Source</link>\n<link icon='window-new_outlined' url='${alert.dashboardURL}'>Dashboard</link>\n<link icon='window-new_outlined' url='${alert.panelURL}'>Panel</link>\n<link icon='window-new_outlined' url='${alert.silenceURL}'>Silence</link>`
        })
    }

    // console.log(JSON.stringify(table));
    // require('fs').writeFileSync('./c.json', JSON.stringify(table, null, 2))

    return table;

}

/**
 * 将 Grafana alert 组装为 List 样式卡片
 * @param {import("./data").IGrafanaAlertBody} msg 
 * @returns {any}
 */
function buildCardJson(msg) {
    const result = buildMarkdown(msg);

    const firing_count = linq.from(msg.alerts).count(x => x.status === 'firing');
    // const resolved_count = linq.from(msg.alerts).count(x => x.status === 'resolved');

    const tags = [];
    if (firing_count > 0) {
        tags.push(`FIRING:${firing_count}`);
    }
    // if (resolved_count > 0) {
    //     tags.push(`RESOLVED:${resolved_count}`);
    // }

    const title = `[${tags.join(', ')}] ${msg.groupLabels.alertname}`;

    let card = {
        "config": {},
        "schema": "2.0",
        "header": {
            "template": "yellow",
            "title": {
                "tag": "plain_text",
                "content": title
            },
            "subtitle": {
                "tag": "plain_text",
                "content": msg.groupLabels.grafana_folder
            }
        },
        "body": {
            "elements": [
                {
                    "tag": "column_set",
                    "flex_mode": "none",
                    "horizontal_spacing": "8px",
                    "horizontal_align": "left",
                    "margin": "4px 0px 0px 0px",
                    "columns": [{
                        "tag": "column",
                        "width": "weighted",
                        "vertical_align": "top",
                        "vertical_spacing": "4px",
                        "background_style": "default",
                        "elements": [
                        ],
                        "weight": 1
                    }]
                }
            ]
        }
    }


    for (const v of result) {
        if (v.group !== 'Firing') {
            continue;
        }

        card.body.elements[0].columns[0].elements.push({
            "tag": "markdown",
            "content": v.group === 'Firing' ? `### <font color='red'>${v.group}</font>` : `### <font color='green'>${v.group}</font>`
        })

        for (const c of v.contents) {
            card.body.elements[0].columns[0].elements.push({
                "tag": "column_set",
                "flex_mode": "none",
                "horizontal_spacing": "8px",
                "horizontal_align": "left",
                "margin": "4px 0px 0px 0px",
                "columns": [
                    {
                        "tag": "column",
                        "width": "weighted",
                        "vertical_align": "top",
                        "background_style": "grey-100",
                        "padding": "8px",
                        "elements": [
                            {
                                "tag": "markdown",
                                "content": `${c}`
                            }
                        ],
                        "weight": 1
                    }
                ]
            })
        }
    }
    // const dashborad_count = linq.from(msg.alerts).select(x => x.dashboardURL).distinct().count();
    // card.body.elements[0].columns[0].elements.push(
    //     {
    //         "tag": "button",
    //         "text": {
    //             "tag": "plain_text",
    //             "content": "查看看板"
    //         },
    //         "type": "default",
    //         "width": "default",
    //         "size": "medium",
    //         "icon": {
    //             "tag": "standard_icon",
    //             "token": "window-new_outlined"
    //         },
    //         "behaviors": [
    //             {
    //                 "type": "open_url",
    //                 "default_url": dashborad_count === 1 ? msg.alerts[0].dashboardURL : msg.externalURL,
    //                 "pc_url": "",
    //                 "ios_url": "",
    //                 "android_url": ""
    //             }
    //         ]
    //     }
    // )
    return card;
}

/**
 * 
 * @param {import("./data").IGrafanaAlertBody} msg 
 * @returns {Array<{group: string, contents: Array<string>}>}
 */
function buildMarkdown(msg) {
    let result = [];

    const all_status = linq.from(msg.alerts).select(x => x.status).distinct().toArray().sort();
    for (const s of all_status) {
        const alerts = linq.from(msg.alerts).where(x => x.status === s).toArray();

        result.push({
            group: s.substring(0, 1).toUpperCase() + s.substring(1, s.length),
            contents: buildSingle(alerts)
        })
    }

    return result;
}

/**
 * 
 * @param {Array<import('./data').IAlert>} alerts 
 * @returns {Array<string>}
 */
function buildSingle(alerts) {
    let result = [];
    let i = 0;
    for (const alert of alerts) {
        let _result = [];
        // if (a.status === 'firing') {
        //     _result.push(`${++i}. **Alert ${i}**`);
        // }
        _result.push(`${++i}. 开始时间: ${moment(alert.startsAt).tz('Asia/Shanghai').format('yyyy-MM-DDTHH:mm:ss+08:00')}`);
        if (alert.status === 'resolved') {
            _result.push(`- 结束时间: ${alert.endsAt}`);
        }

        if (Object.keys(alert.labels).length > 0) {
            _result.push(`- 标签:`);
            for (const k in alert.labels) {
                _result.push(`  - ${k}=${alert.labels[k]}`);
            }
        }

        _result.push(`- Values:`);
        for (const k in alert.values) {
            _result.push(`  - ${k}=${alert.values[k]}`);
        }

        if (Object.keys(alert.annotations).length > 0) {
            _result.push(`- 注解:`);
            for (const k in alert.annotations) {
                _result.push(`  - ${k}=${alert.annotations[k]}`);
            }
        }

        const navigator = [];
        if (alert.generatorURL) {
            navigator.push(`<link icon='window-new_outlined' url='${alert.generatorURL}'>明细</link>`);
        }
        if (alert.dashboardURL) {
            navigator.push(`<link icon='window-new_outlined' url='${alert.dashboardURL}'>看板</link>`);
        }
        if (alert.panelURL) {
            navigator.push(`<link icon='window-new_outlined' url='${alert.panelURL}'>图表</link>`);
        }
        if (alert.silenceURL) {
            navigator.push(`<link icon='window-new_outlined' url='${alert.silenceURL}'>静默设置</link>`);
        }
        if (navigator.length > 0) {
            _result.push(`\n${navigator.join(' | ')}`);
        }

        result.push(_result.join('\n'));
    }

    return result;
}