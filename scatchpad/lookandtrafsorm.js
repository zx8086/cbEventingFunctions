function OnUpdate(doc, meta) {
    if (!isNotNullOrEmpty(doc.lookId)) {
        log(`Doc ${meta.id} error: lookId cannot be empty`);
        return;
    }
    var lookId = meta.id;

    // Action-1: Generate/update 'createdOn' (if not exist) and 'modifiedOn' fields with the current time`.
    log(`Document to update : ${meta.id}`);
    var currentTime = getCurrentTime();
    if (!("createdOn" in doc)) {
        doc["createdOn"] = currentTime;
        //doc.createdOn = currentTime;        
    }

    doc["modifiedOn"] = currentTime;
    //doc.modifiedOn = currentTime;
    //looks_col[lookId] = doc;

    
    //log(`Doc ${meta.id}: after modifiedOn/createdOn update`, doc);

    // Action-2: Sending notification to kafka notification-topic
    log(`Doc ${meta.id}: was created/updated, sending notification to topic`);
    let response = sendNotification(lookId);
    if (response && response.status === 200) {
        log(`Doc ${meta.id}: cURL POST notification sent - response.status: ${response.status}`);
    } else if (response && response.status !== 200) {
        log(`Doc ${meta.id}: cURL POST notification failed - response: `, response);
        saveRetryNotificationDoc(lookId);
    }
}

function sendNotification(lookId) {
    try {
        let request = {
            //hardcoded for testing purpose, it's failing, couldn't access to variable topicName
            //path: `/topics/${topicName}`,
            path: `/topics/T_PRIVATE_SOURCE_COUCHBASE_LOOK_NOTIFICATIONS`,
            headers: {
                'Content-Type': 'application/vnd.kafka.json.v2+json',
                'Accept': 'application/vnd.kafka.v2+json, application/vnd.kafka+json, application/json'
            },
            body: {
                "records": [
                    {
                        "key": lookId,
                        "value": {
                            "DATA_ID": lookId,
                            "MSG_TYPE": "MASTER_SYSTEM_UPDATE",
                            "ENTITY_TYPE": "LOOK_VIDEO_PDF_IMAGE"
                        }
                    }
                ]
            }
        };
        return curl("POST", kafkaRestProxyURL, request);
    } catch (e) {
        log(`Doc ${lookId}: ERROR sending notification - cURL POST request exception: ${getExceptionMessageAndTrace(e)}`);
        saveRetryNotificationDoc(lookId);
    }
}

function saveRetryNotificationDoc(lookId) {
    let retryNotificationDoc = notifications_retry_col[lookId];
    if (retryNotificationDoc) {
        retryNotificationDoc.lastAttemptAt = Date.now();
        retryNotificationDoc.failedAttempts = ++retryNotificationDoc.failedAttempts;
    } else {
        retryNotificationDoc = {
            "lookId": lookId,
            "failedAttempts": 1,
            "firstAttemptAt": Date.now(),
            "lastAttemptAt": Date.now()
        };
    }
    notifications_retry_col[lookId] = retryNotificationDoc;
}

function getCurrentTime() {
    var date = new Date;
    // Format date in the format: YYYY-MM-DD hh:mm:ss.SSS
    var formattedDate = [date.getUTCFullYear(),
            getTwoDigitFormat(date.getUTCMonth(), 1),
            getTwoDigitFormat(date.getUTCDate(), 0)
        ]
            .join('-') + ' ' + [getTwoDigitFormat(date.getUTCHours(), 0),
            getTwoDigitFormat(date.getUTCMinutes(), 0),
            getTwoDigitFormat(date.getUTCSeconds(), 0)
        ].join(':') + '.' +
        date.getUTCMilliseconds();

    return formattedDate;
}

function getTwoDigitFormat(value, addBy) {
    return ("0" + (value + addBy)).slice(-2);
}

function isNotNullOrEmpty(value) {
    return value != null && value !== "";
}

function getExceptionMessageAndTrace(e){
    var exMsg = "";
    if (e.message) {
        exMsg += e.message;
    }
    if (e.stack) {
        exMsg += ' | stack: ' + e.stack;
    }
    return exMsg;
}
