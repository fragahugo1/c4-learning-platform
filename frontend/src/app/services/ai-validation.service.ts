import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AiValidationService {
  private apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private apiKey = 'CHAVE'; 

  constructor(private http: HttpClient) {}

  validar(json: string, contexto: string, instrucao: string) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    });

    const body = {
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: `Você é um professor de C4 Model. Avalie o diagrama JSON. Cenário: ${contexto}. Instrução: ${instrucao}. Responda em JSON: {"score": 0-100, "dicas": ["..."]}`
        },
        { role: 'user', content: json }
      ],
      response_format: { type: 'json_object' }
    };

    return this.http.post(this.apiUrl, body, { headers });
  }
}