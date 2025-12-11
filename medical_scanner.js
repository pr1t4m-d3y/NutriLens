/**
 * ===================================================================
 * NutriLens LocalScan Engine
 * ===================================================================
 *
 * This script provides the "Local Scan" functionality. Its job is to
 * perform an instant, 100% private scan on the user's device.
 *
 * It works by:
 * 1. Reading the user's saved profile from localStorage.
 * 2. Compiling a "dumb" list of all keywords to avoid (allergies,
 * intolerances, and all custom "Other" lists).
 * 3. Critically, it EXCLUDES "Chronic Conditions" (like high_bp)
 * which are *only* meant for the "Smart Scan" AI on the backend.
 * 4. Comparing the ingredient text against this keyword list.
 * 5. Returning a simple array of any direct matches found.
 *
 */

/**
 * Main function to run the local scan.
 * @param {string} ingredientText - The raw ingredient text extracted by the OCR.
 * @returns {string[]} An array of warning strings for all matches found.
 * (e.g., ["Contains: Peanut", "Contains: Gluten"])
 */
function runLocalScan(ingredientText) {
    const profile = getLocalProfile();
    
    // 1. Check if a valid health profile exists.
    if (!profile || !profile.healthData) {
        console.warn("LocalScan: No health profile found in localStorage.");
        return []; // No profile, so no matches.
    }

    // 2. Compile the master list of "dumb" keywords to avoid.
    const keywords = getKeywordsToAvoid(profile.healthData);
    if (keywords.length === 0) {
        console.log("LocalScan: Profile found, but no keywords to check against.");
        return []; // No keywords, so no matches.
    }

    // 3. Normalize and clean the ingredient text for an easier scan.
    let textToScan = ingredientText.toLowerCase();

    // Pre-cleaning: Remove common "X-free" or "free from X" phrases
    // This prevents false positives like flagging "soy" in "soy-free".
    textToScan = textToScan.replace(/(\w+)(\s*|-)(free)/g, ' ');
    textToScan = textToScan.replace(/free from (\w+)/g, ' ');

    // 4. Run the scan.
    const matches = [];
    for (const keyword of keywords) {
        // Use a simple, fast .includes() check.
        // This is the "dumb" part of the scan.
        if (textToScan.includes(keyword)) {
            // Format the match message for the UI
            const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            matches.push(`Contains: ${capitalizedKeyword}`);
        }
    }

    // 5. Return the unique list of matches.
    return [...new Set(matches)];
}


/**
 * Helper function to retrieve and parse the user profile from localStorage.
 * @returns {object | null} The parsed userProfile object or null if it doesn't exist.
 */
function getLocalProfile() {
    const profileString = localStorage.getItem('userProfile');
    if (!profileString) {
        return null;
    }
    try {
        return JSON.parse(profileString);
    } catch (e) {
        console.error("LocalScan: Failed to parse userProfile from localStorage.", e);
        return null;
    }
}

/**
 * Helper function to compile all relevant keywords from the healthData object.
 * This function *intentionally* skips 'chronicConditions' and 'medications'
 * as they are only for the backend "Smart Scan".
 *
 * @param {object} healthData - The userProfile.healthData object.
 * @returns {string[]} A de-duplicated array of all keywords to avoid, in lowercase.
 */
function getKeywordsToAvoid(healthData) {
    let allKeywords = [];

    // Helper to process comma-separated strings from text areas
    const processStringList = (str) => {
        if (!str || typeof str !== 'string') {
            return [];
        }
        return str
            .split(',') // Split by comma
            .map(s => s.trim().toLowerCase()) // Clean, lowercase
            .filter(s => s.length > 0); // Remove empty strings
    };

    // --- Add all CHECKBOX lists ---
    if (healthData.allergies) {
        allKeywords = allKeywords.concat(healthData.allergies);
    }
    if (healthData.intolerances) {
        allKeywords = allKeywords.concat(healthData.intolerances);
    }
    if (healthData.skinConditions) {
        allKeywords = allKeywords.concat(healthData.skinConditions);
    }
    if (healthData.cosmeticTriggers) {
        allKeywords = allKeywords.concat(healthData.cosmeticTriggers);
    }

    // --- Add all "Other" and "Custom" TEXTAREA lists ---
    allKeywords = allKeywords.concat(processStringList(healthData.otherFoodAllergies));
    allKeywords = allKeywords.concat(processStringList(healthData.otherIntolerances));
    allKeywords = allKeywords.concat(processStringList(healthData.otherSkinConditions));
    allKeywords = allKeywords.concat(processStringList(healthData.otherCosmeticTriggers));
    allKeywords = allKeywords.concat(processStringList(healthData.otherConditions));
    allKeywords = allKeywords.concat(processStringList(healthData.customAvoid));

    // Final cleanup: Ensure everything is lowercase, trimmed, and non-empty.
    const finalKeywords = allKeywords
        .map(k => k.toLowerCase().trim())
        .filter(k => k.length > 0);

    // Return a de-duplicated list
    return [...new Set(finalKeywords)];
}