import { Injectable } from '@angular/core';

export interface MiniMundo {
  layer: number;
  contexto: string;
  instrucao: string;
}

@Injectable({
  providedIn: 'root'
})
export class MiniMundoService {
  private miniMundos: MiniMundo[] = [
    {
      layer: 1,
      contexto: "Você está desenvolvendo o ByteBite, uma plataforma completa de entrega de comida. O sistema deve permitir que clientes busquem restaurantes e façam pedidos, que restaurantes gerenciem seus cardápios e recebam ordens, e que entregadores encontrem rotas para entrega. O sistema também deve processar pagamentos online de forma segura.",
      instrucao: "Apenas desenhe as interações de alto nível entre os atores internos e externos (Clientes, Restaurantes, Entregadores). Não se preocupe com detalhes técnicos ou de implementação nesta fase."
    },
    {
      layer: 2,
      contexto: "Você está desenvolvendo o ByteBite, uma plataforma completa de entrega de comida. O sistema deve permitir que clientes busquem restaurantes e façam pedidos, que restaurantes gerenciem seus cardápios e recebam ordens, e que entregadores encontrem rotas para entrega. O sistema também deve processar pagamentos online de forma segura.",
      instrucao: "Quais são as grandes unidades de software que precisam ser instaladas e executadas? Foque nas conexões técnicas entre os componentes, como APIs, filas de mensagens, bancos de dados, etc."
    }
  ];

  getPhaseByLayer(layer: number): MiniMundo | undefined {
    return this.miniMundos.find(miniMundo => miniMundo.layer === layer);
  }

  getAllPhases(): MiniMundo[] {
    return this.miniMundos;
  }

  addOrUpdatePhase(phase: MiniMundo): void {
    const index = this.miniMundos.findIndex(p => p.layer === phase.layer);
    if (index >= 0) {
      this.miniMundos[index] = phase;
    } else {
      this.miniMundos.push(phase);
    }
  }
}
