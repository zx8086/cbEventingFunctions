// Function to log messages in a formatted way
function formattedLog(meta, message) {
    var logMessage = meta.id + ": " + message;
    log(logMessage);
}

function OnUpdate(doc, meta) {
    try {
        if (doc.documentType === "article") {
            formattedLog(meta, 'Start - Transforming Document for ' + meta.id)
            var transformedDoc = transformDocument(meta, doc);
            dst_bkt[meta.id] = transformedDoc;
            formattedLog(meta, 'End - Transforming Document for ' + meta.id)
        }
    } catch (e) {
        formattedLog(meta, 'Error in OnUpdate for doc id ' + meta.id + ': ' + e.message);
    }
}

function transformDocument(meta, originalDoc) {
    var newDoc = {};

    try {
        applySpecificTransformations(meta, newDoc, originalDoc);
        formattedLog(meta, '    Copy - Untransformed fields in Document for ' + meta.id)
        copyUntransformedFields(newDoc, originalDoc);
    } catch (e) {
        formattedLog(meta, 'Error in transformDocument for doc id ' + originalDoc.id + ': ' + e.message);
        throw e; // re-throw the exception to prevent the document from being saved
    }

    return newDoc;
}

function applySpecificTransformations(meta, newDoc, originalDoc) {
    // Specific transformations

    transformSupport(newDoc, originalDoc);
    formattedLog(meta, '    Transform - Support Object for ' + meta.id)

    transformSize(newDoc, originalDoc);
    formattedLog(meta, '    Transform - Size Object for ' + meta.id)

    transformFms(newDoc, originalDoc);
    formattedLog(meta, '    Transform - FMS Object for ' + meta.id)

}

// Specific transformations (broken down to each object for clarity)

// Size
function transformSize(newDoc, originalDoc) {
    newDoc.size = {
        main: originalDoc.mainSize,
        mainIndex: originalDoc.mainSizeIndex,
        second: originalDoc.secondSize,
        secondIndex: originalDoc.secondSizeIndex
    };
}

// Support
function transformSupport(newDoc, originalDoc) {
    newDoc.support = {
        creationDate: originalDoc.creationDate,
        modificationDate: originalDoc.modificationDate,
        deletionDate: originalDoc.deletionDate,
        migratedStyle: originalDoc.migratedStyle,
        monitoringType: originalDoc.monitoringType,
        sourceSystem: originalDoc.sourceSystem       
    };
}

// FMS Season
function transformFms(newDoc, originalDoc) {
    newDoc.fms = {
        collection: originalDoc.fmsCollection,
        season: {
            code: originalDoc.fmsSeason.code,
            name: originalDoc.fmsSeason.name,
            year: originalDoc.fmsSeasonYear
        }
    };
}

// Copy untransformed fields
function copyUntransformedFields(newDoc, originalDoc) {
    for (var key in originalDoc) {
        if (!newDoc.hasOwnProperty(key) && !isFieldTransformed(key)) {
            newDoc[key] = originalDoc[key];
        }
    }
}

// Function to determine if a field is transformed
function isFieldTransformed(fieldName) {
    var transformedFields = ["creationDate", "modificationDate", "deletionDate", "migratedStyle", "monitoringType", "sourceSystem", "fmsCollection", "fmsSeason", "fmsSeasonCode", "fmsSeasonYear", "mainSize", "mainSizeIndex", "secondSize", "secondSizeIndex"];
    return transformedFields.includes(fieldName);
}

function OnDelete(meta, options) {
    try {
        formattedLog(meta, "Doc deleted/expired", meta.id);
    } catch (e) {
        formattedLog(meta, 'Error in OnDelete for doc id ' + meta.id + ': ' + e.message);
    }
}
