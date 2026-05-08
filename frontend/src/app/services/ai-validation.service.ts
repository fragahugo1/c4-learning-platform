import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AiValidationService {
  private apiUrl = 'http://localhost:11434/api/chat';

  constructor(private http: HttpClient) {}

  validar(json: string, contexto: string, instrucao: string) {
    const body = {
      model: 'llama3',
      messages: [
        {
          role: 'system',
          content: `
            Você é um avaliador EXTREMAMENTE rigoroso de diagramas C4.

            REGRAS:
            - Responda APENAS em JSON válido
            - NÃO escreva nada fora do JSON

            FORMATO:
            {
              "score": number,
              "dicas": string[]
            }

            CRITÉRIOS INTERNOS (NÃO REPETIR):
            - Diagrama vazio ou com 1 elemento → score 0-20
            - Faltam atores principais → score máximo 30
            - Sem interações → score máximo 40

            IMPORTANTE:
            - NÃO repita os critérios nas dicas
            - As dicas devem ser específicas para o diagrama enviado
            - As dicas devem explicar o que falta ou o que melhorar

            Cenário: ${contexto}
            Instrução: ${instrucao}
            `
        },
        { role: 'user', content: json }
      ],
      stream: false
    };

    return this.http.post(this.apiUrl, body);
  }
}