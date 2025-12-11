document.addEventListener('DOMContentLoaded', () => {
    // --- Global Variables ---
    let userProfile = {}; // Stores { name, gender, height, weight, bmiValue, bmiCategory, goal }
    let currentSlide = 0;
    let isUpdatingGoal = false; // Flag for goal update flow

    // --- Screen & UI Elements ---
    const body = document.body;
    const snackbar = document.getElementById('snackbar');
    const loaderOverlay = document.getElementById('loader-overlay'); // Original loader
    
    // Screens
    const onboardingScreen = document.getElementById('onboarding-screen');
    const loggedInScreen = document.getElementById('logged-in-screen');
    const scannerScreen = document.getElementById('scanner-screen');
    const resultsScreen = document.getElementById('results-screen');
    const personalizeNameScreen = document.getElementById('personalize-name-screen');
    const personalizeBmiScreen = document.getElementById('personalize-bmi-screen');
    const personalizeGoalScreen = document.getElementById('personalize-goal-screen');
    const medicalHistoryScreen = document.getElementById('medical-history-screen');
    
    // Buttons & Inputs
    const quickScanBtn = document.getElementById('quick-scan-btn');
    const personalizeBtn = document.getElementById('personalize-btn');
    const quickScanLoggedInBtn = document.getElementById('quick-scan-loggedin-btn');
    const trackCalorieBtn = document.getElementById('track-calorie-btn');
    const uploadMedicalBtn = document.getElementById('upload-medical-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const backBtns = document.querySelectorAll('.back-btn');
    const scanNewBtn = document.querySelector('.scan-new-btn');
    const fileUpload = document.getElementById('file-upload');
    const cameraCaptureBtn = document.getElementById('camera-capture-btn');
    const calculateBmiBtn = document.getElementById('calculate-bmi-btn');
    const bmiContinueBtn = document.getElementById('bmi-continue-btn');
    const goalBtns = document.querySelectorAll('.goal-btn');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const userNameInput = document.getElementById('user-name');
    const genderGroup = document.getElementById('gender-group');
    const genderButtons = document.querySelectorAll('.gender-btn'); 
    const heightFtInput = document.getElementById('height-ft');
    const heightInInput = document.getElementById('height-in');
    const weightKgInput = document.getElementById('weight-kg');

    // Dynamic Content Elements
    const welcomeUserName = document.getElementById('welcome-user-name');
    const logoutUserName = document.getElementById('logout-user-name');
    const uploadMedicalBtnTitle = document.getElementById('upload-medical-btn-title'); 
    const personalizedAlert = document.getElementById('personalized-alert');
    const scoreCircle = document.getElementById('score-circle');
    const scoreValue = document.getElementById('score-value');
    const productNameEl = document.getElementById('product-name');
    const productCategory = document.getElementById('product-category');
    const takeawayTagsContainer = document.getElementById('takeaway-tags');
    const swapName = document.getElementById('swap-name');
    const swapDesc = document.getElementById('swap-desc');
    const bmiRevealSection = document.getElementById('bmi-reveal-section');
    const bmiResultContainer = document.getElementById('bmi-result-container');
    const bmiValueEl = document.getElementById('bmi-value');
    const bmiCategoryEl = document.getElementById('bmi-category');
    const goalSuggestion = document.getElementById('goal-suggestion');
    
    // *** MODIFIED: Get new ingredient list elements ***
    // const ingredientsList = document.getElementById('ingredients-list'); // REMOVED
    const goodIngredientsList = document.getElementById('good-ingredients-list');
    const badIngredientsList = document.getElementById('bad-ingredients-list');
    const goodIngredientsContainer = document.getElementById('good-ingredients-container');
    const badIngredientsContainer = document.getElementById('bad-ingredients-container');
    // *** END MODIFICATION ***
    
    // Bento Grid Elements
    const mhUserName = document.getElementById('mh-user-name');
    const mhGender = document.getElementById('mh-gender');
    const mhHeight = document.getElementById('mh-height');
    const mhWeightDisplay = document.getElementById('mh-weight-display'); 
    const mhBmiValue = document.getElementById('mh-bmi-value');
    const mhBmiCategory = document.getElementById('mh-bmi-category');
    const mhGoal = document.getElementById('mh-goal');

    // Bento Grid Edit Elements
    const editWeightBtn = document.getElementById('edit-weight-btn');
    const mhWeightEditGroup = document.getElementById('mh-weight-edit-group');
    const mhWeightInput = document.getElementById('mh-weight-input');
    const mhUpdateWeightBtn = document.getElementById('mh-update-weight-btn');
    const editGoalBtn = document.getElementById('edit-goal-btn');

    // Accordion & Carousel Elements
    const accordionHeaderContainer = document.getElementById('health-accordion-headers');
    const accordionHeaders = document.querySelectorAll('.accordion-header.carousel-slide');
    const accordionContentPanels = document.querySelectorAll('.accordion-content-container .accordion-content');
    const carouselPrevBtn = document.getElementById('carousel-prev');
    const carouselNextBtn = document.getElementById('carousel-next');
    const totalSlides = accordionHeaders.length;

    // --- PULL-CHAIN THEME TOGGLE LOGIC ---
    const pullChain = document.getElementById('pull-chain');
    const pullChainVisual = document.getElementById('pull-chain-visual');
    const themeBulbSvg = document.getElementById('theme-bulb-svg');
    let isDragging = false;
    let startY = 0;
    const MAX_PULL = 50; // Max pull distance
    const TRIGGER = 30; // Distance to trigger toggle
    
    function onPointerDown(e) {
        e.preventDefault();
        if (isDragging) return;
        isDragging = true;
        startY = e.clientY;
        pullChainVisual.style.transition = 'none'; 
        pullChain.setPointerCapture(e.pointerId); 
    }
    
    function onPointerMove(e) {
        if (!isDragging) return;
        const pullY = Math.max(0, Math.min(MAX_PULL, e.clientY - startY));
        pullChainVisual.style.transform = `translateY(${pullY}px)`;
    }
    
    function onPointerUp(e) {
        if (!isDragging) return;
        isDragging = false;
        pullChain.releasePointerCapture(e.pointerId);
        
        pullChainVisual.style.transition = 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)';
        
        const pullY = Math.max(0, Math.min(MAX_PULL, e.clientY - startY));
        const didToggle = pullY >= TRIGGER;
        
        if (didToggle) {
            toggleTheme();
            pullChainVisual.style.transform = `translateY(${MAX_PULL}px)`;
        } else {
            pullChainVisual.style.transform = 'translateY(0px)';
        }
        
        setTimeout(() => {
            pullChainVisual.style.transform = 'translateY(0px)';
        }, 150);
    }
    // --- END THEME LOGIC ---


    // --- Core Functions ---

    function toggleTheme() {
        body.classList.toggle('dark-mode');
        body.classList.toggle('light-mode');
        localStorage.setItem('theme', body.className);
        
        const isDark = body.classList.contains('dark-mode');
        themeBulbSvg.setAttribute('aria-label', isDark ? 'Bulb off' : 'Bulb on');
    }

    function applySavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            body.className = savedTheme;
        } else {
            body.className = 'light-mode'; // Default
        }
        const isDark = body.classList.contains('dark-mode');
        themeBulbSvg.setAttribute('aria-label', isDark ? 'Bulb off' : 'Bulb on');
    }

    function showScreen(screenToShow) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screenToShow.classList.add('active');
    }

    function showLoaderAndNavigate(screenToShow, delay = 600) {
        loaderOverlay.classList.add('visible');
        setTimeout(() => {
            showScreen(screenToShow);
            loaderOverlay.classList.remove('visible');
        }, delay);
    }

    function showSnackbar(message) {
        snackbar.textContent = message;
        snackbar.classList.add('show');
        setTimeout(() => {
            snackbar.classList.remove('show');
        }, 3000);
    }

    function checkLoginState() {
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
            userProfile = JSON.parse(savedProfile);
            welcomeUserName.textContent = userProfile.name;
            logoutUserName.textContent = userProfile.name;
            
            if (localStorage.getItem('healthProfileSaved') === 'true') {
                uploadMedicalBtnTitle.textContent = 'Update Health report';
            } else {
                uploadMedicalBtnTitle.textContent = 'Upload health report';
            }
            
            showScreen(loggedInScreen);
        } else {
            userProfile = {};
            uploadMedicalBtnTitle.textContent = 'Upload health report'; 
            showScreen(onboardingScreen);
        }
    }

    function logout() {
        localStorage.removeItem('userProfile');
        localStorage.removeItem('healthProfileSaved'); 
        userProfile = {};
        uploadMedicalBtnTitle.textContent = 'Upload health report'; 
        showLoaderAndNavigate(onboardingScreen);
    }
    
    // --- NEW 2-STEP API AND SCAN LOGIC ---
    
    const scanLoader = document.getElementById('scan-loader');
    const resultCardContent = document.getElementById('result-card-content');

    /**
     * Main function to handle the entire scan flow.
     */
    async function handleFileUpload(file) {
        if (!file) return;

        showScreen(resultsScreen); 
        clearResultsCard(); 
        scanLoader.style.display = 'flex';

        try {
            // --- CALL 1: Get Ingredient Text from OCR ---
            const ingredientText = await fetchOcrText(file);

            // --- LOCAL SCAN (INSTANT) ---
            const localMatches = runLocalScan(ingredientText);
            
            // Get the user's Smart Scan profile
            const profile = getLocalProfile(); 
            let smartScanData = {};
            if (profile && profile.healthData) {
                smartScanData = {
                    chronicConditions: profile.healthData.chronicConditions || [],
                    medications: profile.healthData.medications || "",
                    goal: profile.goal || null,
                    bmiValue: profile.bmiValue || null,
                    bmiCategory: profile.bmiCategory || null
                };
            }

            // --- DECISION (Your new logic) ---
            if (localMatches.length > 0) {
                // CAUTION FOUND: Show card now, then load AI in background
                displayLocalResults(localMatches); // This also hides the loader
                
                fetchSmartScan(ingredientText, smartScanData)
                    .then(aiData => {
                        populateSmartScanResults(aiData);
                    })
                    .catch(err => {
                        console.error("Smart Scan failed:", err);
                        showSnackbar("Local scan complete. AI analysis failed.");
                    });

            } else {
                // NO CAUTION: Wait for AI, then show all results at once.
                const aiData = await fetchSmartScan(ingredientText, smartScanData);
                displayFullResults(aiData); 
                scanLoader.style.display = 'none'; // Hide loader
            }

        } catch (error) {
            console.error('Error during OCR or flow:', error);
            showSnackbar(`Error: ${error.message}`);
            scanLoader.style.display = 'none'; 
            showLoaderAndNavigate(loggedInScreen.classList.contains('active') ? loggedInScreen : onboardingScreen);
        }
    }

    /**
     * Helper Function: Call 1 (OCR)
     */
    async function fetchOcrText(file) {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('https://nutrilens-tp7f.onrender.com/api/extract-text', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `OCR failed! Status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.ingredient_text; 
    }

    /**
     * Helper Function: Call 2 (Smart Scan)
     */
    async function fetchSmartScan(ingredientText, smartScanData) {
        const response = await fetch('https://nutrilens-tp7f.onrender.com/api/smart-scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ingredient_text: ingredientText,
                health_profile: smartScanData
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `AI analysis failed! Status: ${response.status}`);
        }
        
        return await response.json(); 
    }

    /**
     * *** MODIFIED ***
     * Helper Function: Clears the results card for a new scan.
     */
    function clearResultsCard() {
        resultCardContent.style.display = 'none'; 
        personalizedAlert.innerHTML = '';
        personalizedAlert.style.display = 'none';
        personalizedAlert.classList.remove('alert-red', 'alert-green', 'alert-blue'); 
        
        scoreValue.textContent = '';
        scoreCircle.className = 'score-circle';
        productNameEl.textContent = 'Analyzing...';
        productCategory.textContent = '';
        takeawayTagsContainer.innerHTML = '';
        swapName.textContent = '';
        swapDesc.textContent = '';
        
        // NEW: Clear the new lists and hide containers
        if(goodIngredientsList) goodIngredientsList.innerHTML = '';
        if(badIngredientsList) badIngredientsList.innerHTML = '';
        if(goodIngredientsContainer) goodIngredientsContainer.style.display = 'none';
        if(badIngredientsContainer) badIngredientsContainer.style.display = 'none';
    }

    /**
     * Helper Function: Shows *only* the local scan results.
     */
    function displayLocalResults(localMatches) {
        scanLoader.style.display = 'none'; 
        
        personalizedAlert.style.display = 'block';
        personalizedAlert.classList.remove('alert-green', 'alert-blue');
        personalizedAlert.classList.add('alert-red'); 
        
        personalizedAlert.innerHTML = `<h4><i class="fa-solid fa-user-shield"></i> Personalized Alert for ${userProfile.name || 'You'}</h4>
                                     <p><strong>Local Scan Found:</strong> ${localMatches.join(', ')}</p>`;
        
        productNameEl.textContent = 'Scan complete. AI analysis pending...';
        resultCardContent.style.display = 'block'; 
    }

    /**
     * *** MODIFIED ***
     * Helper Function: Populates the card with the full AI "Smart Scan" data.
     */
    function populateSmartScanResults(data) {
        // Populate score, name, etc.
        scoreValue.textContent = data.score;
        scoreCircle.className = 'score-circle ' + data.score_color;
        productNameEl.textContent = data.name;
        productCategory.textContent = data.category;
        
        takeawayTagsContainer.innerHTML = '';
        data.takeaways.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = `tag tag-${tag.type}`;
            let iconClass = 'fa-solid fa-check';
            if (tag.type === 'red') iconClass = 'fa-solid fa-triangle-exclamation';
            if (tag.type === 'orange') iconClass = 'fa-solid fa-fire-flame-curved';
            tagElement.innerHTML = `<i class="${iconClass}"></i> ${tag.text}`;
            takeawayTagsContainer.appendChild(tagElement);
        });
        
        swapName.textContent = data.swap.name;
        swapDesc.textContent = data.swap.desc;

        // --- NEW: Populate Good/Bad Ingredient Lists ---
        
        // Clear lists first
        goodIngredientsList.innerHTML = ''; 
        badIngredientsList.innerHTML = '';
        
        // Populate "Good Ingredients"
        if (data.good_ingredients && data.good_ingredients.length > 0) {
            data.good_ingredients.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                goodIngredientsList.appendChild(li);
            });
            goodIngredientsContainer.style.display = 'block'; // Show the container
        } else {
            goodIngredientsContainer.style.display = 'none'; // Hide if empty
        }
        
        // Populate "Bad Ingredients"
        if (data.bad_ingredients && data.bad_ingredients.length > 0) {
            data.bad_ingredients.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                badIngredientsList.appendChild(li);
            });
            badIngredientsContainer.style.display = 'block'; // Show the container
        } else {
            badIngredientsContainer.style.display = 'none'; // Hide if empty
        }
    }

    /**
     * *** MODIFIED ***
     * Helper Function: Populates *all* results at once.
     */
    function displayFullResults(data) {
        
        // Check if user has a profile saved
        if (localStorage.getItem('healthProfileSaved') !== 'true') {
            // User has NOT saved a profile. Show the "please upload" message.
            personalizedAlert.style.display = 'block';
            personalizedAlert.classList.remove('alert-red', 'alert-green');
            personalizedAlert.classList.add('alert-blue'); // Use new blue style
            
            personalizedAlert.innerHTML = `<h4><i class="fa-solid fa-user-plus"></i> Get a Better Scan</h4>
                                         <p>For a fully personalized report, please upload your health profile. 
                                         <a id="go-to-profile-link">Upload Health Report</a></p>`;
        
        } else {
            // User HAS a profile. Show the green "no issues found" message.
            personalizedAlert.style.display = 'block';
            personalizedAlert.classList.remove('alert-red', 'alert-blue');
            personalizedAlert.classList.add('alert-green');
            
            personalizedAlert.innerHTML = `<h4><i class="fa-solid fa-user-shield"></i> Personalized Alert for ${userProfile.name || 'You'}</h4>
                                         <p><strong>Local Scan:</strong> No immediate allergens or intolerances from your profile were found.</p>`;
        }

        // Populate all the AI data (scores, takeaways, AND new ingredient lists)
        populateSmartScanResults(data);
        
        // Show the card
        resultCardContent.style.display = 'block';
    }

    // --- *** END OF 2-STEP API LOGIC *** ---


    // --- BMI/Goal Functions ---

    function getBmiCategory(bmi) {
        if (bmi < 18.5) return 'Underweight';
        if (bmi <= 24.9) return 'Normal Weight';
        if (bmi <= 29.9) return 'Overweight';
        return 'Obesity';
    }

    function getBmiColorClass(category) {
        if (category === 'Underweight') return 'orange';
        if (category === 'Normal Weight') return 'green';
        if (category === 'Overweight') return 'orange';
        if (category === 'Obesity') return 'red';
        return 'grey';
    }

    function calculateBmiFromProfile(weightKg, heightString) {
        if (!heightString || !weightKg) return null;
        try {
            const feet = parseInt(heightString.split("'")[0]);
            const inches = parseInt(heightString.split("'")[1].replace('"', ''));
            const kg = parseFloat(weightKg);
            if (isNaN(feet) || isNaN(inches) || isNaN(kg)) return null;
            const totalInches = (feet * 12) + inches;
            const meters = totalInches * 0.0254;
            const bmi = kg / (meters * meters);
            const bmiValue = bmi.toFixed(1);
            const bmiCategory = getBmiCategory(bmi);
            return { value: bmiValue, category: bmiCategory };
        } catch (error) {
            console.error("Error calculating BMI:", error);
            return null;
        }
    }
    
    function calculateAndShowBMI() {
        const feet = parseFloat(heightFtInput.value);
        const inches = parseFloat(heightInInput.value) || 0;
        const kg = parseFloat(weightKgInput.value);
        if (!feet || !kg) { 
            showSnackbar('Please enter a valid height and weight.'); 
            return null; 
        }
        
        bmiRevealSection.classList.add('visible');
        
        const totalInches = (feet * 12) + inches;
        const meters = totalInches * 0.0254;
        const bmi = kg / (meters * meters);
        const bmiFormatted = bmi.toFixed(1);
        const category = getBmiCategory(bmi); 
        const colorClass = getBmiColorClass(category); 
        
        bmiValueEl.textContent = bmiFormatted;
        bmiCategoryEl.textContent = category;
        bmiCategoryEl.className = `tag tag-${colorClass}`;

        let suggestion = '';
        document.querySelectorAll('.goal-btn').forEach(btn => btn.classList.remove('recommended', 'hidden'));
        if (category === 'Underweight') {
            suggestion = 'Based on your BMI, we suggest focusing on gaining weight.';
            document.getElementById('goal-gain').classList.add('recommended');
            document.getElementById('goal-shred').classList.add('hidden');
        } else if (category === 'Normal Weight') {
            suggestion = 'Your BMI is in a healthy range! We suggest focusing on getting fit.';
            document.getElementById('goal-fit').classList.add('recommended');
        } else { // Overweight or Obesity
            suggestion = 'Based on your BMI, we suggest focusing on shredding weight.';
            document.getElementById('goal-shred').classList.add('recommended');
            document.getElementById('goal-gain').classList.add('hidden');
        }
        goalSuggestion.textContent = suggestion;
        
        setTimeout(() => {
             bmiRevealSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

        userProfile.height = `${feet}' ${inches}"`;
        userProfile.weight = `${kg} kg`;
        
        return { value: bmiFormatted, category: category };
    }

    function populateMedicalHistorySummary() {
        if (!userProfile) return;
        mhUserName.textContent = userProfile.name || 'N/A';
        mhGender.textContent = userProfile.gender ? userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1) : 'N/A';
        mhHeight.textContent = userProfile.height || 'N/A';
        mhWeightDisplay.textContent = userProfile.weight || 'N/A'; 
        mhBmiValue.textContent = userProfile.bmiValue || 'N/A';
        mhBmiCategory.textContent = userProfile.bmiCategory || 'N/A';
        mhBmiCategory.className = `tag tag-${getBmiColorClass(userProfile.bmiCategory)}`;
        let goalText = 'N/A';
        if (userProfile.goal) {
            goalText = userProfile.goal.replace('goal-', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        mhGoal.textContent = goalText;
    }
    
    // --- Event Listeners ---
    
    // Theme toggle listeners
    pullChain.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove); 
    window.addEventListener('pointerup', onPointerUp);     
    
    // Navigation listeners
    quickScanBtn.addEventListener('click', () => { userProfile = {}; showLoaderAndNavigate(scannerScreen); });
    personalizeBtn.addEventListener('click', () => showLoaderAndNavigate(personalizeNameScreen));
    quickScanLoggedInBtn.addEventListener('click', () => showLoaderAndNavigate(scannerScreen));
    trackCalorieBtn.addEventListener('click', () => showSnackbar('Calorie Tracking Feature Coming Soon!'));
    
    uploadMedicalBtn.addEventListener('click', () => {
        populateMedicalHistorySummary();
        currentSlide = 0;
        updateCarousel(); 
        mhWeightDisplay.classList.remove('hidden');
        mhWeightEditGroup.classList.add('hidden');
        showLoaderAndNavigate(medicalHistoryScreen);
    });

    logoutBtn.addEventListener('click', logout);
    backBtns.forEach(btn => btn.addEventListener('click', () => checkLoginState()));
    
    // *** GLITCH FIX: "Scan Another Item" button ***
    scanNewBtn.addEventListener('click', () => {
        if (userProfile.name) {
            // User is logged in, go back to the scanner
            showLoaderAndNavigate(scannerScreen);
        } else {
            // User is in "Quick Scan" mode, go back to the start
            showLoaderAndNavigate(onboardingScreen);
        }
    });
    
    // Onboarding listeners
    genderButtons.forEach(button => {
        button.addEventListener('click', () => {
            const name = userNameInput.value.trim();
            if (!name) {
                showSnackbar('Please enter your name first.');
                userNameInput.focus();
                return;
            }
            genderButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const gender = button.dataset.value;
            userProfile = { name: name, gender: gender };
            showLoaderAndNavigate(personalizeBmiScreen);
        });
    });

    calculateBmiBtn.addEventListener('click', () => {
        const bmiInfo = calculateAndShowBMI();
        if (bmiInfo) {
            userProfile.bmiValue = bmiInfo.value;
            userProfile.bmiCategory = bmiInfo.category;
        }
    });
    
    bmiContinueBtn.addEventListener('click', () => showLoaderAndNavigate(personalizeGoalScreen));
    
    goalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            userProfile.goal = btn.id;
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            
            if (isUpdatingGoal) {
                isUpdatingGoal = false;
                populateMedicalHistorySummary(); 
                showLoaderAndNavigate(medicalHistoryScreen);
                showSnackbar('Goal updated!');
            } else {
                welcomeUserName.textContent = userProfile.name;
                logoutUserName.textContent = userProfile.name;
                showLoaderAndNavigate(loggedInScreen); 
            }
        });
    });

    // File/Camera listeners
    fileUpload.addEventListener('change', (event) => {
        handleFileUpload(event.target.files[0]);
        event.target.value = null;
    });

    cameraCaptureBtn.addEventListener('click', () => {
        showSnackbar('Camera feature would be implemented here!');
    });

    // *** NEW: Event listener for the dynamic "Upload Report" link ***
    personalizedAlert.addEventListener('click', (event) => {
        // Check if the clicked element is our new link
        if (event.target.id === 'go-to-profile-link') {
            event.preventDefault(); // Stop the link from acting like a normal link
            
            // Populate the summary and go to the medical history screen
            populateMedicalHistorySummary();
            currentSlide = 0;
            updateCarousel(); 
            mhWeightDisplay.classList.remove('hidden');
            mhWeightEditGroup.classList.add('hidden');
            showLoaderAndNavigate(medicalHistoryScreen);
        }
    });

    // *** SAVE PROFILE FUNCTION (with all text area fixes) ***
    saveProfileBtn.addEventListener('click', (event) => {
        event.preventDefault(); 
        
        const allergies = Array.from(document.querySelectorAll('input[name="allergy"]:checked')).map(el => el.value);
        const otherFoodAllergies = document.getElementById('other-food-allergies').value.trim();
        
        const intolerances = Array.from(document.querySelectorAll('input[name="intolerance"]:checked')).map(el => el.value);
        const otherIntolerances = document.getElementById('other-intolerances').value.trim();

        const skinConditions = Array.from(document.querySelectorAll('input[name="skin_condition"]:checked')).map(el => el.value);
        const otherSkinConditions = document.getElementById('other-skin-conditions').value.trim(); 
        
        const cosmeticTriggers = Array.from(document.querySelectorAll('input[name="cosmetic_trigger"]:checked')).map(el => el.value);
        const otherCosmeticTriggers = document.getElementById('other-cosmetic-triggers').value.trim(); 

        const chronicConditions = Array.from(document.querySelectorAll('input[name="chronic_condition"]:checked')).map(el => el.value);
        const otherConditions = document.getElementById('other-conditions').value.trim();

        const medications = document.getElementById('medications-list').value.trim();
        const customAvoid = document.getElementById('custom-avoid-list').value.trim();

        userProfile.healthData = {
            allergies,
            otherFoodAllergies,
            intolerances,
            otherIntolerances,
            skinConditions,
            otherSkinConditions, 
            cosmeticTriggers,
            otherCosmeticTriggers, 
            chronicConditions,
            otherConditions,
            medications,
            customAvoid
        };
        
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        localStorage.setItem('healthProfileSaved', 'true');
        
        uploadMedicalBtnTitle.textContent = 'Update Health report';
        showSnackbar('Health Profile Saved!');
        showLoaderAndNavigate(loggedInScreen);
    });
    // *** END SAVE PROFILE FUNCTION ***

    // --- Enter Key Functionality ---
    userNameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            genderGroup.querySelector('.gender-btn').focus();
        }
    });
    heightFtInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); heightInInput.focus(); } });
    heightInInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); weightKgInput.focus(); } });
    weightKgInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); calculateBmiBtn.click(); } });


    // --- Carousel & Accordion Logic ---
    function updateCarousel() {
        accordionHeaders.forEach((header, index) => {
            header.classList.remove('active', 'prev-1', 'next-1', 'prev-2', 'next-2', 'expanded');
            if (index === currentSlide) {
                header.classList.add('active');
            } else if (index === currentSlide - 1) {
                header.classList.add('prev-1');
            } else if (index === currentSlide + 1) {
                header.classList.add('next-1');
            } else if (index === currentSlide - 2) {
                header.classList.add('prev-2');
            } else if (index === currentSlide + 2) {
                header.classList.add('next-2');
            }
        });

        accordionContentPanels.forEach(panel => {
            panel.classList.remove('active', 'expanded');
        });

        const activeHeader = accordionHeaders[currentSlide];
        if (activeHeader) {
            const activeContentId = activeHeader.dataset.contentId;
            const activeContentPanel = document.getElementById(activeContentId);

            if (activeContentPanel) {
                activeHeader.classList.add('expanded');
                activeContentPanel.classList.add('active');
                activeContentPanel.classList.add('expanded');
            }
        }
        carouselPrevBtn.disabled = currentSlide === 0;
        carouselNextBtn.disabled = currentSlide === totalSlides - 1;
    }

    carouselNextBtn.addEventListener('click', () => {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
            updateCarousel();
        }
    });

    carouselPrevBtn.addEventListener('click', () => {
        if (currentSlide > 0) {
            currentSlide--;
            updateCarousel();
        }
    });

    accordionHeaders.forEach((header, index) => {
        header.addEventListener('click', () => {
            if (index === currentSlide) {
                const contentId = header.dataset.contentId;
                const contentPanel = document.getElementById(contentId);
                header.classList.toggle('expanded');
                if (contentPanel) {
                    contentPanel.classList.toggle('expanded');
                }
            } else {
                currentSlide = index;
                updateCarousel();
            }
        });
    });

    // --- Bento Grid Edit Listeners ---
    editWeightBtn.addEventListener('click', () => {
        mhWeightDisplay.classList.toggle('hidden');
        mhWeightEditGroup.classList.toggle('hidden');
        if (!mhWeightEditGroup.classList.contains('hidden')) {
            mhWeightInput.value = parseFloat(userProfile.weight) || '';
            mhWeightInput.focus();
        }
    });

    mhUpdateWeightBtn.addEventListener('click', () => {
        const newWeight = parseFloat(mhWeightInput.value);
        if (!newWeight || newWeight <= 0) {
            showSnackbar('Please enter a valid weight.');
            return;
        }

        const bmiInfo = calculateBmiFromProfile(newWeight, userProfile.height);
        
        if (bmiInfo) {
            userProfile.weight = `${newWeight} kg`;
            userProfile.bmiValue = bmiInfo.value;
            userProfile.bmiCategory = bmiInfo.category;
            
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            populateMedicalHistorySummary();
            
            mhWeightDisplay.classList.remove('hidden');
            mhWeightEditGroup.classList.add('hidden');
            showSnackbar('Weight and BMI updated!');

            let newRecommendedGoal;
            if (bmiInfo.category === 'Underweight') newRecommendedGoal = 'goal-gain';
            else if (bmiInfo.category === 'Normal Weight') newRecommendedGoal = 'goal-fit';
            else newRecommendedGoal = 'goal-shred';

            if(userProfile.goal !== newRecommendedGoal) {
                showSnackbar('Your BMI category changed. We recommend updating your goal.');
                document.getElementById('bento-goal').style.animation = 'pulse 1s 2';
                setTimeout(() => {
                    document.getElementById('bento-goal').style.animation = '';
                }, 2000);
            }
        } else {
            showSnackbar('Error recalculating BMI. Please check your profile height.');
        }
    });

    editGoalBtn.addEventListener('click', () => {
        isUpdatingGoal = true;
        document.querySelectorAll('.goal-btn').forEach(btn => {
            btn.classList.remove('recommended');
            if(btn.id === userProfile.goal) {
                btn.classList.add('recommended'); 
            }
            const category = userProfile.bmiCategory;
            if (category === 'Underweight') {
                if(btn.id === 'goal-shred') btn.classList.add('hidden');
                else btn.classList.remove('hidden');
            } else if (category === 'Normal Weight') {
                btn.classList.remove('hidden');
            } else { 
                if(btn.id === 'goal-gain') btn.classList.add('hidden');
                else btn.classList.remove('hidden');
            }
        });
        showLoaderAndNavigate(personalizeGoalScreen);
    });

    // --- Initial Load ---
    applySavedTheme();
    checkLoginState();
});