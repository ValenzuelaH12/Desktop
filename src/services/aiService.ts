import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export interface AIAnalysisResult {
  diagnostico: string;
  sugerencia: string;
  departamento: string;
  materiales_sugeridos: string[];
}

export const aiService = {
  /**
   * Analiza una imagen de una incidencia para sugerir diagnósticos y materiales.
   */
  async analyzeIncidentImage(imageUrl: string, title: string): Promise<AIAnalysisResult> {
    if (!API_KEY) {
      throw new Error("VITE_GEMINI_API_KEY no encontrada en las variables de entorno.");
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Convertir la URL de Supabase a base64 para Gemini
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });
      
      const base64Data = await base64Promise;

      const prompt = `
        Analiza esta foto de una avería en un hotel titulada "${title}". 
        Tu objetivo es ayudar al técnico de mantenimiento.
        Genera una respuesta en formato JSON estrictamente con esta estructura:
        {
          "diagnostico": "breve descripción de lo que ves",
          "sugerencia": "pasos recomendados para arreglarlo",
          "departamento": "Mantenimiento / IT / Pisos / Recepción",
          "materiales_sugeridos": ["material 1", "material 2"]
        }
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: blob.type
          }
        }
      ]);

      const text = result.response.text();
      // Limpiar posibles bloques de código de la respuesta
      const jsonStr = text.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr) as AIAnalysisResult;
    } catch (error) {
      console.error("AI Analysis Error:", error);
      throw new Error("No se pudo completar el análisis de IA. Verifica la conexión y la API Key.");
    }
  },

  /**
   * Detecta anomalías en las lecturas de suministros.
   */
  async detectAnomalies(readings: any[]): Promise<string | null> {
    if (!API_KEY || readings.length < 3) return null;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        Analiza estas lecturas de consumos de hotel y detecta si hay alguna anomalía evidente (picos de consumo injustificados, posibles fugas).
        Lecturas: ${JSON.stringify(readings)}
        Responde brevemente con el problema detectado o "OK" si todo es normal.
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      return response.includes("OK") ? null : response;
    } catch (error) {
      return null;
    }
  }
};
