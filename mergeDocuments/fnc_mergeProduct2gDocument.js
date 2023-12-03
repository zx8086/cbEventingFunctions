function OnUpdate(doc, meta) {
    log(`Start - Processing Product2g Merge: ${meta.id}`);
    
    try {
        var key = meta.id;
        var existingDoc = dst_bkt[key];
        
        function mergeDocuments(target, source) {
            Object.keys(source).forEach(key => {
                if (key !== 'variants') { // Exclude variants from the merge
                    target[key] = source[key];
                }
            });
        }
        
        if (existingDoc) {
            log(`   Check - Product2g Document already exists with ID: ${key}`);
            
            // Preserve existing variantt
            var existingVariants = existingDoc.variants;
            
            // Create a clone of the existing document for merging
            var updatedDoc = {...existingDoc};
            
            // Merge incoming changes, excluding the variants
            mergeDocuments(updatedDoc, doc);
            
            // Re-assign the preserved variants to the updated document
            updatedDoc.variants = existingVariants;
            
            dst_bkt[key] = updatedDoc;
            log(`   Update - Product2g Document updated with ID: ${key}`);
        } else {
        log(`   Check - Product2g Document does not exist`);
        doc.variants = doc.variants || [];
        dst_bkt[key] = doc;
        log(`   Create - New Product2g Document with ID: ${key}`);
    }
    
    log(`End - Processed Product2g Document with ID: ${key}`);
    } catch (error) {
        log(`Error during processing Product2g Document with ID: ${meta.id}: ${error.message}`);
    }
}
