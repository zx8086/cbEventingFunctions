// Function to log messages in a formatted way
function formattedLog(meta, message) {
    var logMessage = meta.id + ": " + message;
    log(logMessage);
}

function OnUpdate(doc, meta) {
    try {
        if (doc.documentType === "variant") {
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
    transformDeliveryDate(newDoc, originalDoc);
    formattedLog(meta, '    Transform - DeliveryDate Object for ' + meta.id)

    transformWeight(newDoc, originalDoc);
    formattedLog(meta, '    Transform - Weight Object for ' + meta.id)

    transformColor(newDoc, originalDoc);
    formattedLog(meta, '    Transform - Color Object for ' + meta.id)

    transformCountryOfOrigin(newDoc, originalDoc);
    formattedLog(meta, '    Transform - CountryOfOrigin Object for ' + meta.id)

    transformVisibility(newDoc, originalDoc);
    formattedLog(meta, '    Transform - Visibility Object for ' + meta.id)

    transformSupport(newDoc, originalDoc);
    formattedLog(meta, '    Transform - Support Object for ' + meta.id)

    transformFms(newDoc, originalDoc);
    formattedLog(meta, '    Transform - FMS Object for ' + meta.id)

}

// Specific transformations (broken down to each object for clarity)

// Delivery date
function transformDeliveryDate(newDoc, originalDoc) {
    newDoc.deliveryDate = {
        additionalEU: originalDoc.additionalDeliveryDateEU,
        additionalIM: originalDoc.additionalDeliveryDateIM,
        adjustedEU: originalDoc.adjustedDeliveryDateEU,
        adjustedIM: originalDoc.adjustedDeliveryDateIM,
        ctpMonth: originalDoc.ctpMonth,
        dropDate: originalDoc.dropDate,
        dropDateString: originalDoc.dropDateString
    };
}

// Weight (Gross + Net)
function transformWeight(newDoc, originalDoc) {
    newDoc.weight = {
        net: originalDoc.netWeight,
        gross: originalDoc.grossWeight,
        grossUnit: originalDoc.grossWeightUnit
    };
}

// Color
function transformColor(newDoc, originalDoc) {
    newDoc.color = {
        code: originalDoc.colorCode,
        description : originalDoc.colorDescription,
        mainColor: {
            code: originalDoc.mainColor.code,
            name: originalDoc.mainColor.name,
            translations: {
                deu: originalDoc.mainColorTranslations.deu,
                eng: originalDoc.mainColorTranslations.eng,
                esl: originalDoc.mainColorTranslations.esl,
                fra: originalDoc.mainColorTranslations.fra,
                ita: originalDoc.mainColorTranslations.ita
            },
            hexCode: originalDoc.mainColorHexCode
        }
    };
}

// Country of Origin
function transformCountryOfOrigin(newDoc, originalDoc) {
    newDoc.countryOfOrigin = {
        code: originalDoc.countryOfOrigin.code,
        name: originalDoc.countryOfOrigin.name,
        translations: {
            deu: originalDoc.countryOfOriginTranslations.deu,
            eng: originalDoc.countryOfOriginTranslations.eng,
            esl: originalDoc.countryOfOriginTranslations.esl,
            fra: originalDoc.countryOfOriginTranslations.fra,
            ita: originalDoc.countryOfOriginTranslations.ita
        }
    };
}

// Visibility
function transformVisibility(newDoc, originalDoc) {
    newDoc.visibility = {
        activeOption: originalDoc.activeOption,
        salesChannels: originalDoc.salesChannels,
        marketSellIn: originalDoc.marketSellIn,
        readyForB2b: originalDoc.readyForB2b,
        readyForEcom: originalDoc.readyForEcom,
        readyForSellIn: originalDoc.readyForSellIn,
        openForEcom: originalDoc.openForEcom,
        optionToB2b: originalDoc.optionToB2b,
        optionToEcom: originalDoc.optionToEcom,
        optionToSellIn: originalDoc.optionToSellIn,
        internationalOption: originalDoc.internationalOption,
        omnichannelAssortment: originalDoc.omnichannelAssortment,
        consumerAssortment: originalDoc.consumerAssortment
    };
}

// Support
function transformSupport(newDoc, originalDoc) {
    newDoc.support = {
        creationDate: originalDoc.creationDate,
        copiedFromOption: originalDoc.copiedFromOption,
        deletionDate: originalDoc.deletionDate,
        updated: originalDoc.updated,
        sourceSystem: originalDoc.sourceSystem,
        modificationDate: originalDoc.modificationDate,
        monitoringType: originalDoc.monitoringType
    };
}

// FMS
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
    var transformedFields = ["additionalDeliveryDateEU", "additionalDeliveryDateIM", "adjustedDeliveryDateEU", "adjustedDeliveryDateIM", "ctpMonth", "dropDate", "dropDateString", "activeOption", "marketSellIn", "internationalOption", "readyForB2b", "readyForEcom", "readyForSellIn", "omnichannelAssortment", "openForEcom", "optionToB2b", "optionToEcom", "optionToSellIn", "creationDate", "copiedFromOption", "deletionDate", "updated", "sourceSystem", "modificationDate", "monitoringType", "fmsCollection", "fmsSeason", "fmsSeasonCode", "fmsSeasonYear", "colorCode", "colorDescription", "mainColor", "mainColorTranslations", "hexCode", "countryOfOrigin", "countryOfOriginTranslations", "grossWeight", "grossWeightUnit", "netWeight", "consumerAssortment" ];
    return transformedFields.includes(fieldName);
}

function OnDelete(meta, options) {
    try {
        formattedLog(meta, "Doc deleted/expired", meta.id);
    } catch (e) {
        formattedLog(meta, 'Error in OnDelete for doc id ' + meta.id + ': ' + e.message);
    }
}
