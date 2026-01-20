// src/utils/translator.ts
import { Translate } from '@google-cloud/translate/build/src/v2';

// Instantiates a client
// Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set
const translate = new Translate();

export async function translateText(
  text: string,
  targetLanguage: string = 'en'
): Promise<string> {
  if (!text) {
    return "";
  }

  try {
    const [translationResult] = await translate.translate(text, targetLanguage);
    
    let finalTranslation: string;

    if (Array.isArray(translationResult)) {
      // If translate.translate returned an array of translations (e.g., if multiple texts were passed)
      // We assume the first element is the desired translation for our single input text.
      finalTranslation = translationResult[0]; 
    } else {
      // If translate.translate returned a single string
      finalTranslation = translationResult;
    }
    return finalTranslation;
  } catch (error) {
    console.error(`Error translating text "${text}":`, error);
    // Fallback to original text if translation fails
    return text;
  }
}