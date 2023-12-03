function OnUpdate(doc, meta) {
    log(`Start - Processing Variant Update: ${meta.id}`);
    
    try {
        var keyParts = meta.id.split('_');
        if (keyParts.length < 3 || keyParts[0] !== 'VARIANT') {
            log(`   Error - Invalid key format for variant: ${meta.id}`);
            return;
        }

        var productId = keyParts[1] + '_' + keyParts[2].slice(0, 10); 
        log(`   Extracted Product ID from Variant: ${productId}`);
        
        var product2gKey = `PRODUCT_${productId}`; 
        var product2gDoc = dst_bkt[product2gKey];
        
        if (product2gDoc) {
            log(`   Check - Product2g Document exists for product ID: ${productId}`);
            
            product2gDoc.variants = product2gDoc.variants || [];
            var variantIndex = product2gDoc.variants.findIndex(v => Object.keys(v)[0] === meta.id);
            var updatedVariantObject = variantIndex >= 0 ? {...product2gDoc.variants[variantIndex]} : {};
            updatedVariantObject[meta.id] = updatedVariantObject[meta.id] || {};
            updatedVariantObject[meta.id].articles = updatedVariantObject[meta.id].articles || {};
            
            // Update other variant properties here...
            // updatedVariantObject[meta.id].property = doc.property;
            
            if (variantIndex >= 0) {
                product2gDoc.variants[variantIndex] = updatedVariantObject;
            } else {
                product2gDoc.variants.push(updatedVariantObject);
            }
            
            dst_bkt[product2gKey] = product2gDoc;
            log(`   Create/Update - Variant ${meta.id} added/updated for product ID: ${productId}`);
        } else {
            log(`   Check - Product2g Document does not exist for product ID: ${productId}`);
        }
        
        log(`End - Processed Variant Update: ${meta.id}`);
    } catch (error) {
        log(`Error during Variant Update with ID: ${meta.id}: ${error.message}`);
    }
}