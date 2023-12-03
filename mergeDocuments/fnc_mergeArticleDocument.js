function OnUpdate(doc, meta) {
    log(`Start - Processing Article Update: ${meta.id}`);
    
    try {
        var keyParts = meta.id.split("_");
        if (keyParts.length !== 3 || keyParts[0] !== "ARTICLE") {
            log(`   Error - Invalid key format for article: ${meta.id}`);
            return;
        }
        
        var variantId = `VARIANT_${keyParts[1]}_${keyParts[2].slice(0, -3)}`;
        var productId = keyParts[1] + "_" + keyParts[2].slice(0, -6);
        var product2gKey = `PRODUCT_${productId}`;
        
        var product2gDoc = dst_bkt[product2gKey];
        if (product2gDoc) {
            log(`   Check - Product2g Document exists for product ID: ${productId}`);
            
            product2gDoc.variants = product2gDoc.variants || [];
            var variantIndex = product2gDoc.variants.findIndex((v) => Object.keys(v)[0] === variantId);
            
            if (variantIndex === -1) {
                log(`   Error - Variant not found in Product2g document for ID: ${variantId}`);
                return;
            }
            
        // Clone the variant object
        var updatedVariantObject = { ...product2gDoc.variants[variantIndex] };
        updatedVariantObject[variantId].articles =
        updatedVariantObject[variantId].articles || {};
        
        // Update the article within the cloned variant object
        updatedVariantObject[variantId].articles[meta.id] = {};
        
        // Replace the old variant object with the updated one
        product2gDoc.variants[variantIndex] = updatedVariantObject;
        
        dst_bkt[product2gKey] = product2gDoc;
        
        log(`   Create/Update - Article ${meta.id} added/updated for variant ID: ${variantId}`);
        } else { log(`   Error - Product2g Document does not exist for product ID: ${productId}`);}
        
        log(`End - Processed Article Update: ${meta.id}`);
    } catch (error) {
        log(`Error during Article Update with ID: ${meta.id}: ${error.message}`);
    }
}
