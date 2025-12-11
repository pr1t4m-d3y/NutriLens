import os
import json
import requests
import google.generativeai as genai
# import easyocr  # <-- 1. Commented out
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from PIL import Image
import io
import re

# --- 1. Configuration ---
load_dotenv() 
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}) 

# --- 2. API Key Setup ---
# Fetches the keys from your .env file
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# --- 3. Initialize Models ---

# Configure Gemini
try:
    if not GEMINI_API_KEY:
        print("⚠️ Warning: GEMINI_API_KEY not found in .env file.")
        raise EnvironmentError("Gemini key not found.")
        
    genai.configure(api_key=GEMINI_API_KEY)
    
    # Your specified models for each step
    gemini_2_5_flash_model = genai.GenerativeModel('models/gemini-2.5-flash')
    gemini_2_0_flash_model = genai.GenerativeModel('gemini-2.0-flash')
    
    print("✅ Gemini models initialized ('2.5-flash' and '2.0-flash').")
except Exception as e:
    print(f"⚠️ Warning: Could not configure Gemini. {e}")
    gemini_2_5_flash_model = None
    gemini_2_0_flash_model = None

# Initialize EasyOCR
# --- 2. Commented out ---
# try:
#     ocr_reader = easyocr.Reader(['en'], gpu=False)
#     print("✅ EasyOCR reader initialized on CPU.")
# except Exception as e:
#     print(f"⚠️ Warning: Could not initialize EasyOCR. {e}")
#     ocr_reader = None
ocr_reader = None # Added this line so the variable exists

# --- 4. Helper: AI Text Cleaning (Your New Logic) ---
# This function is now commented out as it was only for the EasyOCR fallback
#
# def clean_text_with_ai(full_text):
#     """
#     Tries to find *only* the ingredients list from a messy block of text
#     using OpenRouter (DeepSeek) and Gemini 2.0 Flash as a fallback.
#     """
#     prompt = f"""
#     Here is a messy block of text from an OCR scan of a food product.
#     Find and return ONLY the complete ingredient list, and nothing else.
#     Ensure all quantities are listed correctly.
#     Do not add any commentary or markdown.

#     Text:
#     "{full_text}"
#     """
    
#     # --- Try 1: OpenRouter (DeepSeek V3.1) ---
#     if OPENROUTER_API_KEY:
#         try:
#             print("Attempting to clean OCR text with OpenRouter (deepseek/deepseek-chat-v3.1:free)...")
#             response = requests.post(
#                 url="https://openrouter.ai/api/v1/chat/completions",
#                 headers={
#                     "Authorization": f"Bearer {OPENROUTER_API_KEY}",
#                     "Content-Type": "application/json"
#                 },
#                 data=json.dumps({
#                     "model": "deepseek/deepseek-chat-v3.1:free", # As you specified
#                     "messages": [{"role": "user", "content": prompt}],
#                 }),
#                 timeout=20
#             )
#             response.raise_for_status()
#             ingredient_text = response.json()['choices'][0]['message']['content'].strip()
#             if ingredient_text and len(ingredient_text) > 20:
#                 print("✅ OpenRouter (DeepSeek) text cleaning successful.")
#                 return ingredient_text
#             print("OpenRouter cleaning returned empty text, trying Gemini 2.0 Flash...")
#         except Exception as e:
#             print(f"OpenRouter (DeepSeek) text cleaning failed: {e}. Trying Gemini 2.0 Flash...")

#     # --- Try 2: Gemini 2.0 Flash (Fallback) ---
#     if gemini_2_0_flash_model:
#         try:
#             print("Attempting to clean OCR text with Gemini (gemini-2.0-flash)...")
#             response = gemini_2_0_flash_model.generate_content(prompt)
#             ingredient_text = response.text.strip()
#             if ingredient_text and len(ingredient_text) > 20:
#                 print("✅ Gemini (gemini-2.0-flash) text cleaning successful.")
#                 return ingredient_text
#             print("Gemini 2.0 Flash cleaning returned empty text.")
#         except Exception as e:
#             print(f"Gemini (gemini-2.0-flash) text cleaning failed: {e}")

#     return None # Both AI cleaning steps failed


# --- 5. API Endpoint 1: Extract Text (OCR) ---
@app.route('/api/extract-text', methods=['POST'])
def extract_text_endpoint():
    """
    Receives an image and returns *only* the ingredient text
    using your specified multi-step fallback system.
    """
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    file = request.files['image']
    image_bytes = file.read()
    img = Image.open(io.BytesIO(image_bytes))

    # --- Try 1: Gemini Vision (models/gemini-2.5-flash) ---
    if gemini_2_5_flash_model:
        try:
            print("Attempting OCR with Gemini Vision (models/gemini-2.5-flash)...")
            prompt = "Look at this image of a food product. Find the ingredients list. Return ONLY the text of the ingredients list, and nothing else. Do not add any other commentary."
            response = gemini_2_5_flash_model.generate_content([prompt, img])
            ingredient_text = response.text.strip().replace('\n', ' ')
            
            if ingredient_text and len(ingredient_text) > 20:
                print("✅ Gemini Vision OCR successful.")
                return jsonify({"ingredient_text": ingredient_text})
            print("Gemini Vision (2.5-flash) did not find a clear list. Fallback (EasyOCR) is disabled.")
        except Exception as e:
            print(f"Gemini Vision (2.5-flash) OCR failed: {e}. Fallback (EasyOCR) is disabled.")

    # --- Try 2: EasyOCR (Fallback "Dumb" OCR) ---
    # --- 3. Commented out ---
    # if ocr_reader:
    #     try:
    #         print("Attempting OCR with EasyOCR...")
    #         result = ocr_reader.readtext(image_bytes, detail=0, paragraph=True)
    #         full_text = " ".join(result)
            
    #         if not full_text:
    #             print("EasyOCR returned no text.")
    #             return jsonify({"error": "Could not read any text from the image."}), 400
            
    #         print("EasyOCR successful, got messy text. Now cleaning with AI...")
            
    #         # --- Try 3 & 4: AI Text Cleaning (Your Logic) ---
    #         ingredient_text = clean_text_with_ai(full_text)
            
    #         if ingredient_text:
    #             print("✅ AI cleaning of EasyOCR text successful.")
    #             return jsonify({"ingredient_text": ingredient_text.replace('\n', ' ')})
    #         else:
    #             print("AI cleaning failed. Returning raw text as last resort.")
    #             return jsonify({"ingredient_text": full_text}) # Last resort

    #     except Exception as e:
    #         print(f"EasyOCR or AI cleaning failed: {e}")
    #         return jsonify({"error": f"OCR processing failed: {e}"}), 500
    
    return jsonify({"error": "OCR failed (Gemini) and EasyOCR fallback is disabled."}), 500


# --- 6. Helper: Build AI Prompt (For Smart Scan) ---
def build_smart_scan_prompt(ingredient_text, health_profile):
    """
    Creates the detailed prompt for the AI, incorporating the user's health profile.
    """
    profile_summary = "The user has the following profile:\n"
    if health_profile.get('goal'):
        profile_summary += f"- Goal: {health_profile.get('goal')}\n"
    if health_profile.get('bmiCategory'):
        profile_summary += f"- BMI: {health_profile.get('bmiValue')} ({health_profile.get('bmiCategory')})\n"
    if health_profile.get('chronicConditions'):
        profile_summary += f"- Key Health Conditions: {', '.join(health_profile.get('chronicConditions'))}\n"
    if health_profile.get('medications'):
        profile_summary += f"- Medications: {health_profile.get('medications')}\n"
        
    if profile_summary == "The user has the following profile:\n":
        profile_summary = "The user has not provided a health profile."

    # --- THIS PROMPT IS UPDATED ---
    prompt = f"""
    You are a nutrition expert. Analyze these ingredients based on the user's profile.
    
    User Profile:
    {profile_summary}

    Ingredients:
    "{ingredient_text}"

    Analyze for harmful additives, preservatives, and sugars. 
    Crucially, analyze ingredients based on the user's *Key Health Conditions* (e.g., high sodium for 'high_bp', sugar for 'diabetes').

    Return ONLY a single, minified JSON object with these exact keys:
    - "name": (string, infer the product name or category, e.g., "Fruit Juice")
    - "category": (string, e.g., "Beverage", "Snack")
    - "score": (string, 1-10, based on ingredients AND user profile)
    - "score_color": (string, 'red', 'orange', or 'green'. <5 is red, 5-7.5 is orange, >7.5 is green)
    - "takeaways": (array of 3-4 objects with "type" ['red', 'green'] and "text". ONE MUST be a personalized comment on the user's health profile if they have one.)
    
    - "good_ingredients": (array of strings, e.g., ["Enriched Wheat Flour", "Cocoa Powder"]. If none, return an empty array [].)
    - "bad_ingredients": (array of strings, e.g., ["Modified Palm Oil", "Artificial Flavour"]. If none, return an empty array [].)
    
    - "swap": (object with "name" and a BRIEF "description" for a healthier alternative, ideally one that fits the user's goal)
    """
    return prompt

# --- 7. AI Helper: Gemini 2.5 Flash Scan (Smart Scan PRIMARY) ---
def run_gemini_2_5_scan(ingredient_text, health_profile):
    prompt = build_smart_scan_prompt(ingredient_text, health_profile)
    
    try:
        # Using 'models/gemini-2.5-flash' as your specified PRIMARY model
        print("Attempting Smart Scan with Gemini (models/gemini-2.5-flash)...")
        response = gemini_2_5_flash_model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json")
        )
        return json.loads(response.text)

    except Exception as e:
        print(f"Gemini (models/gemini-2.5-flash) Smart Scan failed: {e}")
        raise # Re-raise exception to trigger fallback

# --- 8. AI Helper: OpenRouter Scan (Smart Scan FALLBACK 1) ---
def run_openrouter_scan(ingredient_text, health_profile):
    prompt = build_smart_scan_prompt(ingredient_text, health_profile)
    
    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            data=json.dumps({
                "model": "deepseek/deepseek-chat-v3.1:free", # Your specified fallback 1
                "messages": [{"role": "user", "content": prompt}],
                "response_format": {"type": "json_object"}
            }),
            timeout=30
        )
        response.raise_for_status()
        
        api_response = response.json()
        json_string = api_response['choices'][0]['message']['content']
        
        # Clean the response to find the JSON
        json_match = re.search(r'\{.*\}', json_string, re.DOTALL)
        if not json_match:
            raise ValueError("AI did not return a valid JSON object.")
        
        return json.loads(json_match.group(0)) 

    except Exception as e:
        print(f"OpenRouter (DeepSeek V3.1) Smart Scan failed: {e}")
        raise # Re-raise exception to trigger next fallback

# --- 9. AI Helper: Gemini 2.0 Flash Scan (Smart Scan FALLBACK 2) ---
def run_gemini_2_0_scan(ingredient_text, health_profile):
    prompt = build_smart_scan_prompt(ingredient_text, health_profile)
    
    try:
        # Using 'gemini-2.0-flash' as your specified fallback 2 model
        print("Attempting Smart Scan with Gemini (gemini-2.0-flash)...")
        response = gemini_2_0_flash_model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json")
        )
        return json.loads(response.text)

    except Exception as e:
        print(f"Gemini (gemini-2.0-flash) Smart Scan failed: {e}")
        raise # Re-raise exception, will be caught by the final error handler


# --- 10. API Endpoint 2: "Slow" Smart Scan (NEW 3-STEP LOGIC) ---
@app.route('/api/smart-scan', methods=['POST'])
def smart_scan_endpoint():
    """
    Receives ingredient text and a health profile, performs the
    full AI analysis using your specified 3-step fallback.
    """
    data = request.json
    ingredient_text = data.get('ingredient_text')
    health_profile = data.get('health_profile', {})
    
    if not ingredient_text:
        return jsonify({"error": "No ingredient text provided"}), 400

    # --- Try 1: Gemini (models/gemini-2.5-flash) ---
    if gemini_2_5_flash_model:
        try:
            print("Attempting Smart Scan with Gemini (models/gemini-2.5-flash)...")
            ai_response = run_gemini_2_5_scan(ingredient_text, health_profile)
            print("✅ Gemini (models/gemini-2.5-flash) Smart Scan successful.")
            return jsonify(ai_response)
        except Exception as e:
            # Error is already printed in the helper function
            print("Falling back to OpenRouter (DeepSeek)...")

    # --- Try 2: OpenRouter (DeepSeek V3.1) ---
    if OPENROUTER_API_KEY:
        try:
            print("Attempting Smart Scan with OpenRouter (deepseek/deepseek-chat-v3.1:free)...")
            ai_response = run_openrouter_scan(ingredient_text, health_profile)
            print("✅ OpenRouter (DeepSeek V3.1) Smart Scan successful.")
            return jsonify(ai_response)
        except Exception as e:
            # Error is already printed in the helper function
            print("Falling back to Gemini (gemini-2.0-flash)...")

    # --- Try 3: Gemini (gemini-2.0-flash) ---
    if gemini_2_0_flash_model:
        try:
            print("Attempting Smart Scan with Gemini (gemini-2.0-flash)...")
            ai_response = run_gemini_2_0_scan(ingredient_text, health_profile)
            print("✅ Gemini (gemini-2.0-flash) Smart Scan successful.")
            return jsonify(ai_response)
        except Exception as e:
            # Error is already printed in the helper function
            print("All Smart Scan fallbacks have failed.")
            return jsonify({"error": "All AI Smart Scan services failed."}), 500
            
    return jsonify({"error": "All Smart Scan services are unavailable or not configured."}), 500


# --- 11. Run the App ---
if __name__ == '__main__':
    # Make sure you have installed:
    # pip install Flask flask-cors python-dotenv google-generativeai Pillow requests
    # (You no longer need easyocr)
    app.run(debug=True, port=5001)