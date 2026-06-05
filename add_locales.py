import json
import os

files = ['frontend/messages/en.json', 'frontend/messages/hi.json', 'frontend/messages/kn.json']

CITIES = {
    'en': {'Bangalore': 'Bangalore', 'Mumbai': 'Mumbai', 'Delhi': 'Delhi', 'Hyderabad': 'Hyderabad', 'Chennai': 'Chennai', 'Pune': 'Pune', 'Other': 'Other'},
    'hi': {'Bangalore': 'बेंगलुरु', 'Mumbai': 'मुंबई', 'Delhi': 'दिल्ली', 'Hyderabad': 'हैदराबाद', 'Chennai': 'चेन्नई', 'Pune': 'पुणे', 'Other': 'अन्य'},
    'kn': {'Bangalore': 'ಬೆಂಗಳೂರು', 'Mumbai': 'ಮುಂಬೈ', 'Delhi': 'ದೆಹಲಿ', 'Hyderabad': 'ಹೈದರಾಬಾದ್', 'Chennai': 'ಚೆನ್ನೈ', 'Pune': 'ಪುಣೆ', 'Other': 'ಇತರೆ'}
}

PLATFORMS = {
    'en': {'swiggy': 'Swiggy', 'zomato': 'Zomato', 'blinkit': 'Blinkit', 'porter': 'Porter', 'dunzo': 'Dunzo', 'rapido': 'Rapido', 'other': 'Other'},
    'hi': {'swiggy': 'Swiggy', 'zomato': 'Zomato', 'blinkit': 'Blinkit', 'porter': 'Porter', 'dunzo': 'Dunzo', 'rapido': 'Rapido', 'other': 'अन्य'},
    'kn': {'swiggy': 'Swiggy', 'zomato': 'Zomato', 'blinkit': 'Blinkit', 'porter': 'Porter', 'dunzo': 'Dunzo', 'rapido': 'Rapido', 'other': 'ಇತರೆ'}
}

for file in files:
    lang = os.path.basename(file).split('.')[0]
    with open(file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'form' not in data:
        data['form'] = {}
    
    if 'options' not in data['form']:
        data['form']['options'] = {}
        
    data['form']['options']['cities'] = CITIES[lang]
    data['form']['options']['platforms'] = PLATFORMS[lang]
    
    with open(file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("Added options to locales.")
