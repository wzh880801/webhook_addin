export interface IGrafanaAlertBody {
    receiver: string;
    status: IStatus;
    alerts: IAlert[];
    groupLabels: ICommonLabels;
    commonLabels: ICommonLabels;
    commonAnnotations: IAnnotations;
    externalURL: string;
    version: string;
    groupKey: string;
    truncatedAlerts: number;
    orgId: number;
    title: string;
    state: string;
    message: string;

    __webhook_id: string,
    __webhook_url: string,
    __trace_id: string,
    __uuid: string
}

export interface IAlert {
    status: 'firing' | 'resolved';
    labels: ILabels;
    annotations: IAnnotations;
    startsAt: Date;
    endsAt: Date;
    generatorURL: string;
    fingerprint: string;
    silenceURL: string;
    dashboardURL: string;
    panelURL: string;
    values: IValues;
    valueString: string;
}

export interface IAnnotations {
}

export interface ILabels extends ICommonLabels {
    [key: string]: string
}

export interface IValues {
    [key: string]: number
}

export interface ICommonLabels {
    alertname: string;
    grafana_folder: string;
}
