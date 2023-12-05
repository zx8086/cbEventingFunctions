function getExceptionMessageAndTrace(e) {
    var exMsg = "";
    if (e.message) {
        exMsg += e.message;
    }
    if (e.stack) {
        exMsg += ' | stack: ' + e.stack;
    }
    return exMsg;
}

function OnUpdate(doc, meta) {
    log(`Start - Processing Document: ${meta.id}`);
    // Uncomment the next line to send a notification if required
    // sendNotification();

    // Update the document
    updateDocument(doc, meta);
}

function updateDocument(doc, meta) {
    log(`Document to update: `, meta.id);

    // Copy the document and make updates to the copy
    var updatedDoc = {...doc};
    updatedDoc["new_field"] = "Test";

    // Use the alias to update the document in the source bucket/collection
    try {
        sourceAlias[meta.id] = updatedDoc;
        log(`Doc ${meta.id} updated`, sourceAlias[meta.id]);
    } catch (e) {
        log(`Error updating document ${meta.id}: `, getExceptionMessageAndTrace(e));
    }
}

function sendNotification() {
    let request = {
        path: `/topics/T_PRIVATE_TEST`,
        headers: {
            'Content-Type': 'application/vnd.kafka.json.v2+json',
            'Accept': 'application/vnd.kafka.v2+json, application/vnd.kafka+json, application/json'
        },
        body: {
            "records": [
                {
                    "key": "test",
                    "value": {
                        "DATA_ID": "test",
                        "MSG_TYPE": "MASTER_SYSTEM_UPDATE",
                        "ENTITY_TYPE": ":)"
                    }
                }
            ]
        }
    };
    let response = curl("POST", kafkaRestProxyURL, request);
    log(`Response: ${response.body}`);
    log(`Return Code: ${response.status}`);
}

function OnDelete(meta, options) {
    log("Doc deleted/expired", meta.id);
}
