// Constants
const SEASON_PREFIX_V2 = "SEASON";
const DELIVERY_DATE_PREFIX = "SEASONDELIVERYDATE";
const RETRY_MAX = 5;
const RETRY_DELAY_BASE = 100; // milliseconds, base for exponential backoff

// Main update function
async function OnUpdate(importedDeliveryDate, meta) {
    const slicedId = meta.id?.slice(0, meta?.id.lastIndexOf('_'));
    const docIdV2 = slicedId?.replace(DELIVERY_DATE_PREFIX, SEASON_PREFIX_V2);

// Schedule the first attempt with a timer
createTimer(transformDocumentWithRetry, new Date(Date.now() + RETRY_DELAY_BASE), { importedDeliveryDate, docIdV2, meta, retryCount: RETRY_MAX });
}

// Function to handle retries
function transformDocumentWithRetry(args) {
    const { importedDeliveryDate, docIdV2, meta, retryCount } = args;
    
    if (retryCount <= 0) {
        log(`ERROR: Max retry attempts reached for document ${docIdV2}`);
    return;
}

transformDocument(importedDeliveryDate, docIdV2, meta)
    .then(result => {
        if (!result) {
        // Schedule the next retry
        let nextRetryCount = retryCount - 1;
        let delay = RETRY_DELAY_BASE * Math.pow(2, RETRY_MAX - nextRetryCount);
        createTimer(transformDocumentWithRetry, new Date(Date.now() + delay), { importedDeliveryDate, docIdV2, meta, retryCount: nextRetryCount });
    }
    })
    .catch(error => {
        log(`ERROR: ${error.message} | stack: ${error.stack}`);
    });
}

// Function to transform a document
async function transformDocument(importedDeliveryDate, docIdV2, meta) {
    try {
    const meta_id = { "id": `${docIdV2}` };
    const existingDoc = await getDocument(meta_id);

    if (existingDoc) {
        const currentTime = getCurrentTime();
        const seasonDocV2 = createOrGetDocument(existingDoc, currentTime);

        validateDocument(importedDeliveryDate, meta);
        updateOrAppendDeliveryDate(seasonDocV2, importedDeliveryDate, currentTime);

        const updatedDeliveryDate = {
        "seqIdentifier": importedDeliveryDate?.sapIdentifier || null,
        "activeFrom": importedDeliveryDate?.activeFrom || null,
        "activeTo": importedDeliveryDate?.activeTo || null,
        "deliveryDate": importedDeliveryDate?.deliveryDate || null,
        "isActive": importedDeliveryDate?.isActive
    };

    const indexToUpdate = seasonDocV2.deliveryDates.findIndex(deliveryDate => deliveryDate?.seqIdentifier === importedDeliveryDate?.sapIdentifier);

    if (indexToUpdate !== -1) {
        seasonDocV2.deliveryDates[indexToUpdate] = updatedDeliveryDate;
    } else {
        seasonDocV2.deliveryDates.push(updatedDeliveryDate);
    }

    seasonDocV2.modifiedOn = currentTime;

    const new_meta = { "id": `${docIdV2}`, "cas": existingDoc.meta.cas };
    const replaceResult = await replaceDocument(new_meta, seasonDocV2);

    if (replaceResult) {
        return true;
    } else {
        log('### Failure: Retry count:', retryCount, ' replace: id', new_meta.id, 'result', replaceResult);
        return false;
    }
    } else {
    log('Failure: Document not found');
    return false;
    }
    } catch (exception) {
    log(`ERROR: ${getExceptionMessageAndTrace(exception)}`);
    return false;
}
}

// Function to retrieve a document from Couchbase
async function getDocument(meta_id) {
    const existingDoc = await couchbase.get(seasonDatesV2, meta_id);
    return existingDoc.success ? existingDoc.doc : null;
}

// Function to replace a document in Couchbase
async function replaceDocument(new_meta, seasonDocV2) {
    const result = await couchbase.replace(seasonDatesV2, new_meta, seasonDocV2);
    return result.success;
}

// Function to validate a document
function validateDocument(importedDeliveryDate, meta) {
    const documentPrerequisitesMatch =
    (importedDeliveryDate?.salesOrganizationCode ?? false) &&
    (importedDeliveryDate?.divisionCode ?? false) &&
    (importedDeliveryDate?.styleSeasonCodeFms ?? false);
    
    if (!documentPrerequisitesMatch) {
    log(`WARNING INCOMPLETE_DOC_FOUND ${meta?.id} from default.seasons.import_delivery_dates: FMS_SEASON_CODE_[${importedDeliveryDate?.styleSeasonCodeFms}],SEASON_DIVISION_[${importedDeliveryDate?.divisionCode}],SEASON_SALES_ORG_[${importedDeliveryDate?.salesOrganizationCode}]`);
}
}

// Function to create or retrieve a document
function createOrGetDocument(existingDoc, currentTime) {
    if (existingDoc) {
    return existingDoc;
    } else {
    return {
        "salesOrganizationCode": null,
        "divisionCode": null,
        "styleSeasonCodeFMS": null,
        "documentType": "seasonFMS",
        "createdOn": currentTime,
        "modifiedOn": currentTime,
        "deliveryDates": []
    };
}
}

// Function to update or append a delivery date to a document
function updateOrAppendDeliveryDate(seasonDoc, importedDeliveryDate, currentTime) {
    const indexToUpdate = seasonDoc.deliveryDates.findIndex(deliveryDate => deliveryDate?.seqIdentifier === importedDeliveryDate?.sapIdentifier);
    const updatedDeliveryDate = {
    "seqIdentifier": importedDeliveryDate?.sapIdentifier || null,
    "activeFrom": importedDeliveryDate?.activeFrom || null,
    "activeTo": importedDeliveryDate?.activeTo || null,
    "deliveryDate": importedDeliveryDate?.deliveryDate || null,
    "isActive": importedDeliveryDate?.isActive
};

if (indexToUpdate !== -1) {
    seasonDoc.deliveryDates[indexToUpdate] = updatedDeliveryDate;
} else {
    seasonDoc.deliveryDates.push(updatedDeliveryDate);
}

seasonDoc.modifiedOn = currentTime;
}

// Function to remove a document (Placeholder for actual removal logic)
function removeDocument(meta, docIdV2) {
  // Implement actual document removal logic here
  // For example: couchbase.delete('bucketName', docIdV2);
}

// Function to get the current time in a specific format
function getCurrentTime() {
    const date = new Date();
    const year = date.getUTCFullYear();
    const month = padZero(date.getUTCMonth() + 1);
    const day = padZero(date.getUTCDate());
    const hours = padZero(date.getUTCHours());
    const minutes = padZero(date.getUTCMinutes());
    const seconds = padZero(date.getUTCSeconds());
    const milliseconds = date.getUTCMilliseconds();
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
}

// Function to pad a number with a leading zero if necessary
function padZero(value) {
    return value.toString().padStart(2, '0');
}

// Function triggered on delete events
function OnDelete(meta) {
    log(`INFO REMOVED_DOC ${meta?.id} `);
}

// Function to format exception messages
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

// Timer creation function (Assuming this is provided by the Couchbase environment)
function createTimer(callback, time, args) {

}


// Function called by the timer to retry document transformation
function transformDocumentWithRetry(args) {
    const { importedDeliveryDate, docIdV2, meta, retryCount } = args;
    if (retryCount <= 0) {
    log(`ERROR: Max retry attempts reached for document ${docIdV2}`);
    return;
}

    transformDocument(importedDeliveryDate, docIdV2, meta)
    .then(result => {
        if (!result) {
        // Prepare for the next retry
        let nextRetryCount = retryCount - 1;
        let delay = RETRY_DELAY_BASE * Math.pow(2, RETRY_MAX - nextRetryCount);
        // Schedule the retry using Couchbase's createTimer
        createTimer(transformDocumentWithRetry, new Date(Date.now() + delay), { importedDeliveryDate, docIdV2, meta, retryCount: nextRetryCount });
    }
    })
    .catch(error => {
        log(`ERROR: ${error.message} | stack: ${error.stack}`);
    });
}