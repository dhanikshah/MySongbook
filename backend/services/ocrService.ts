import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { OpenAI } from 'openai';

// Lazy initialization of OpenAI client (only if API key is provided)
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

class OCRService {
  /**
   * Extract text from file based on MIME type
   */
  async extractText(filePath: string, mimeType: string): Promise<string> {
    try {
      const normalizedMimeType = mimeType.toLowerCase().trim();
      
      if (normalizedMimeType === 'application/pdf' || normalizedMimeType.includes('pdf')) {
        return await this.extractFromPDF(filePath);
      } else if (normalizedMimeType.includes('image/')) {
        return await this.extractFromImage(filePath);
      } else if (normalizedMimeType.includes('wordprocessingml.document') || normalizedMimeType.includes('docx')) {
        return await this.extractFromDOCX(filePath);
      } else if (normalizedMimeType === 'text/plain' || normalizedMimeType.includes('text/plain') || normalizedMimeType.includes('txt') || filePath.toLowerCase().endsWith('.txt')) {
        return await this.extractFromTXT(filePath);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw new Error('Failed to extract text from file');
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractFromPDF(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  /**
   * Extract text from image using OCR
   */
  private async extractFromImage(filePath: string): Promise<string> {
    // Try OpenAI Vision API first if available
    if (process.env.OPENAI_API_KEY) {
      try {
        return await this.extractWithOpenAI(filePath);
      } catch (error) {
        console.warn('OpenAI OCR failed, falling back to Tesseract:', error);
      }
    }

    // Fallback to Tesseract
    return await this.extractWithTesseract(filePath);
  }

  /**
   * Extract text using OpenAI Vision API
   */
  private async extractWithOpenAI(filePath: string): Promise<string> {
    const openai = getOpenAIClient();
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this image. Preserve line breaks, spacing, and formatting. Include any musical chords or notation.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Extract text using Tesseract OCR
   */
  private async extractWithTesseract(filePath: string): Promise<string> {
    // Preprocess image for better OCR
    const processedImage = await sharp(filePath)
      .greyscale()
      .normalize()
      .sharpen()
      .toBuffer();

    const { data: { text } } = await Tesseract.recognize(processedImage, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          // Progress logging can go here
        }
      },
    });

    return text;
  }

  /**
   * Extract text from DOCX
   */
  private async extractFromDOCX(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  /**
   * Extract text from TXT
   */
  private async extractFromTXT(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf-8');
  }
}

export const ocrService = new OCRService();

