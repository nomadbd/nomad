import os
import time
import re
import logging
import google.generativeai as genai
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
THREADS_TOKEN = os.environ.get("THREADS_TOKEN")

if not GEMINI_API_KEY or not THREADS_TOKEN:
    logging.error("CRITICAL: GEMINI_API_KEY or THREADS_TOKEN environment variable is missing!")
    exit(1)

genai.configure(api_key=GEMINI_API_KEY)

def extract_version(name):
    match = re.search(r'(\d+)\.(\d+)', name)
    if match:
        return float(f"{match.group(1)}.{match.group(2)}")
    match_single = re.search(r'(\d+)', name)
    if match_single:
        return float(match_single.group(1))
    return 0.0

def generate_content_with_fallback(prompt_text):
    try:
        available_models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods and 'gemini' in m.name:
                clean_name = m.name.replace("models/", "")
                exclude_keywords = ['tts', 'image', 'audio', 'computer-use', 'vision-only', 'banana']
                if any(kw in clean_name.lower() for kw in exclude_keywords):
                    continue
                available_models.append(clean_name)

        if not available_models:
            raise Exception("No active Gemini text models discovered via API.")

        def score_model(name):
            version = extract_version(name)
            score = version * 100
            if 'flash' in name.lower():
                score += 50
            elif 'pro' in name.lower():
                score += 30
            return score

        available_models.sort(key=score_model, reverse=True)
        logging.info(f"Sorted available models for fallback: {available_models}")

        for model_name in available_models:
            retries = 2
            for attempt in range(retries):
                try:
                    logging.info(f"Attempting generation with {model_name} (Attempt {attempt+1}/{retries})")
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(prompt_text)
                    
                    # রেসপন্স টেক্সট নিরাপদে রিড করার ব্যবস্থা
                    if response:
                        try:
                            text_output = response.text
                            if text_output:
                                logging.info(f"Successfully generated content using: {model_name}")
                                return text_output.strip()
                        except ValueError:
                            # যদি সেফটি ফিল্টার বা অন্য কারণে টেক্সট ব্লOCKED থাকে
                            logging.warning(f"Model {model_name} response text blocked or empty.")
                except Exception as e:
                    logging.warning(f"Model {model_name} failed on attempt {attempt+1}: {e}")
                    if attempt < retries - 1:
                        time.sleep(2)
                    continue

        raise Exception("All dynamically discovered Gemini models failed to generate content.")

    except Exception as e:
    
        logging.error(f"Critical error during dynamic model generation: {e}")
        raise e

prompt_path = "prompt.txt"
if not os.path.exists(prompt_path):
    logging.error(f"Error: {prompt_path} not found!")
    exit(1)

with open(prompt_path, "r", encoding="utf-8") as file:
    prompt_content = file.read().strip()

if not prompt_content:
    logging.error("Error: prompt.txt is empty!")
    exit(1)

logging.info("Generating content with smart dynamic fallback...")
post_text = generate_content_with_fallback(prompt_content)

if len(post_text) > 500:
    logging.warning(f"Post length ({len(post_text)} chars) exceeds 500-limit. Truncating...")
    post_text = post_text[:497] + "..."

logging.info(f"Generated Post Preview: {post_text[:100]}... (Total Length: {len(post_text)})")

THREADS_URL_ME = "https://graph.threads.net/v1.0/me"
headers = {"Authorization": f"Bearer {THREADS_TOKEN}"}

try:
    user_res = requests.get(THREADS_URL_ME, headers=headers, timeout=10)
    user_data = user_res.json()
    user_id = user_data.get("id")

    if not user_id:
        raise Exception(f"Invalid response structure: {user_data}")

    logging.info(f"Fetched Threads User ID: {user_id}")
except Exception as e:
    logging.error(f"Failed to fetch Threads User ID: {e}")
    exit(1)

container_url = f"https://graph.threads.net/v1.0/{user_id}/threads"
payload = {"media_type": "TEXT", "text": post_text}

container_res = requests.post(container_url, headers=headers, data=payload, timeout=15)
container_data = container_res.json()
container_id = container_data.get("id")

if not container_id:
    logging.error(f"Failed to create media container: {container_data}")
    exit(1)

logging.info(f"Created Media Container ID: {container_id}")

logging.info("Waiting 5 seconds before publishing...")
time.sleep(5)

publish_url = f"https://graph.threads.net/v1.0/{user_id}/threads_publish"
publish_payload = {"creation_id": container_id}

publish_res = requests.post(publish_url, headers=headers, data=publish_payload, timeout=15)
publish_data = publish_res.json()

if "id" in publish_data:
    logging.info(f"Successfully posted to Threads! Post ID: {publish_data['id']}")
else:
    logging.error(f"Failed to publish post: {publish_data}")
    exit(1)
