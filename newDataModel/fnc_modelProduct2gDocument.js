// Function to log messages in a formatted way
function formattedLog(meta, message) {
    var logMessage = meta.id + ": " + message;
    log(logMessage);
}

function OnUpdate(doc, meta) {
    try {
        formattedLog(meta, 'Start - Transforming Document for ' + meta.id)

        if (doc.documentType === "product2g") {
            var transformedDoc = transformDocument(meta, doc);
            dst_bkt[meta.id] = transformedDoc;
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
        formattedLog(meta, 'End - Transforming Document for ' + meta.id)
    } catch (e) {
        formattedLog(meta, 'Error in transformDocument for doc id ' + originalDoc.id + ': ' + e.message);
        throw e; // re-throw the exception to prevent the document from being saved
    }

    return newDoc;
}

function applySpecificTransformations(meta, newDoc, originalDoc) {
    // Specific transformations
    transformGarment(newDoc, originalDoc);
    formattedLog(meta, '    Transform - Garment Object for ' + meta.id)

    transformMarketingMainMaterial(newDoc, originalDoc);
    formattedLog(meta, '    Transform - Marketing Main Material Object for ' + meta.id)

    transformMaterialComposition(newDoc, originalDoc);
    formattedLog(meta, '    Transform - Material Composition Object for ' + meta.id)

    transformAFS(newDoc, originalDoc);
    formattedLog(meta, '    Transform - AFS Object for ' + meta.id)

    transformSilhouette(newDoc, originalDoc);
    formattedLog(meta, '    Transform - Silhouette Object for ' + meta.id)

    transformSize(newDoc, originalDoc);
    formattedLog(meta, '    Transform - Size Object for ' + meta.id)

    transformSupport(newDoc, originalDoc);
    formattedLog(meta, '    Transform - Support Object for ' + meta.id)

    transformFms(newDoc, originalDoc);
    formattedLog(meta, '    Transform - FMS Object for ' + meta.id)

}

// Specific transformations (broken down to each object for clarity)

// Garment
function transformGarment(newDoc, originalDoc) {
    newDoc.garment = {
        length: originalDoc.garmentLength,
        subType: {
            code: originalDoc.garmentSubType.code,
            name: originalDoc.garmentSubType.name,
            translations: originalDoc.garmentSubTypeTranslations
        },
        type: {
            code: originalDoc.garmentType.code,
            name: originalDoc.garmentType.name,
            translations: originalDoc.garmentTypeTranslations
        },
        wash: originalDoc.garmentWash
    };
}

// Marketing Main Material
function transformMarketingMainMaterial(newDoc, originalDoc) {
    newDoc.marketingMainMaterial = {
        text: originalDoc.marketingMainMaterial,
        sustainable: originalDoc.marketingMainMaterialSustainable,
        sustainableAttribute: originalDoc.marketingMainMaterialSustainableAttribute,
        sustainableAttributeTranslations: originalDoc.marketingMainMaterialSustainableAttributeTranslations,
        sustainableFiber: {
            code: originalDoc.marketingMainMaterialSustainableFiber.code,
            name: originalDoc.marketingMainMaterialSustainableFiber.name,
            translations: originalDoc.marketingMainMaterialSustainableFiberTranslations
        }
    }
}

// Material Composition
function transformMaterialComposition(newDoc, originalDoc) {
    newDoc.materialComposition = {
        code: originalDoc.materialComposition,
        description: originalDoc.materialCompositionDescr
    };
}

// AFS Season
function transformAFS(newDoc, originalDoc) {
    newDoc.afs = {
        season: {
            code: originalDoc.seasonCodeAfs,
            name: originalDoc.season
        }
    };
}

// Silhouette
function transformSilhouette(newDoc, originalDoc) {
    newDoc.silhouette = {
        code: originalDoc.silhouette.code,
        name: originalDoc.silhouette.name,
        translations: originalDoc.silhouetteTranslations
    };
}

// Size
function transformSize(newDoc, originalDoc) {
    newDoc.size = {
        category: {
            code: originalDoc.sizeCategory.code,
            name: originalDoc.sizeCategory.name
        },
        code: originalDoc.sizeCode,
        range: originalDoc.sizeRange
    }
}

// Support
function transformSupport(newDoc, originalDoc) {
    newDoc.support = {
        creationDate: originalDoc.creationDate,
        modificationDate: originalDoc.modificationDate,
        deletionDate: originalDoc.deletionDate,
        copiedFromStyle: originalDoc.copiedFromStyle,
        monitoringType: originalDoc.monitoringType,
        sourceSystem: originalDoc.sourceSystem       
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
    var transformedFields = [ "copiedFromStyle", "creationDate", "deletionDate", "fmsCollection", "fmsSeason", "fmsSeasonCode", "fmsSeasonYear", "garmentLength", "garmentSubType", "garmentSubTypeTranslations", "garmentType", "garmentTypeTranslations", "garmentWash", "marketingMainMaterial", "marketingMainMaterialSustainable", "marketingMainMaterialSustainableAttribute", "marketingMainMaterialSustainableAttributeTranslations", "marketingMainMaterialSustainableFiber", "marketingMainMaterialSustainableFiberTranslations", "materialComposition", "materialCompositionDescr", "modificationDate", "monitoringType", "season", "seasonCodeAfs", "silhouette", "silhouetteTranslations", "sizeCode", "sizeRange", "sizeCategory", "sourceSystem" ];
    return transformedFields.includes(fieldName);
}

function OnDelete(meta, options) {
    try {
        formattedLog(meta, "Doc deleted/expired", meta.id);
    } catch (e) {
        formattedLog(meta, 'Error in OnDelete for doc id ' + meta.id + ': ' + e.message);
    }
}
