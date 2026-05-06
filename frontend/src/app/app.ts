import { Component, signal, ViewChild } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { Sidebar } from './sidebar/sidebar';
import { BoardComponent } from './board/board';
import { HorizontalBar } from './horizontal-bar/horizontal-bar';
import { AiValidationService } from './services/ai-validation.service';
import { MiniMundoService } from './services/mini-mundo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DrawerModule, Sidebar, HorizontalBar, BoardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  @ViewChild(BoardComponent) board!: BoardComponent;

  activeTool = 'draw';
  protected readonly title = signal('frontend');
  currentLayer = signal(1);

  constructor(
    private aiService: AiValidationService,
    private miniMundoService: MiniMundoService
  ) {}

  onLayerChanged(layer: number) {
    this.currentLayer.set(layer);
  }

  executarValidacao() {
    if (!this.board) return;

    const jsonDiagrama = this.board.exportDiagramAsJson();
    const faseAtual = this.miniMundoService.getPhaseByLayer(this.currentLayer());

    if (faseAtual) {
      this.aiService.validar(
        jsonDiagrama, 
        faseAtual.contexto, 
        faseAtual.instrucao
      ).subscribe({
        next: (res: any) => {
          alert(`Nota: ${res.score}/100\n\nDicas:\n- ${res.dicas.join('\n- ')}`);
        },
        error: (err: any) => {
          console.error('Erro na validação:', err);
        }
      });
    } else {
      console.error('Fase não encontrada para a camada:', this.currentLayer());
    }
  }
}