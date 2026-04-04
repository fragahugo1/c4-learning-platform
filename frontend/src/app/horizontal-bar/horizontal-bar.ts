import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-horizontal-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horizontal-bar.html',
  styleUrls: ['./horizontal-bar.css'],
})
export class HorizontalBar {
  selectedTool = 'select';
  camadaAtual = 1;
  @Output() toolChanged = new EventEmitter<string>();

  // Para adicionar um botão, apenas dar um valor único a ele e escolher um icon da primeng
  tools = [
    { icon: 'pi pi-pencil', value: 'draw' },
    { icon: 'pi pi-comment', value: 'text' },
    { icon: 'pi pi-trash', value: 'delete' },
    { icon: 'pi pi-palette', value: 'paint' }
  ];

  // Para adicionar uma funcionalidade em um dos botões, apenas substitua o console.log por uma chamada de método
  // Para atualizações, pode mudar o nome do case ou adicionar mais um case no switch
  selectTool(tool: any) {
    if (this.selectedTool === tool.value) {
      this.selectedTool = '';
      this.toolChanged.emit('');
      return;
    }

    this.selectedTool = tool.value;
    this.toolChanged.emit(tool.value);
  }

  // Método que usaremos para funcionalidade do botão de troca das camadas
  alternarCamada() {
    this.camadaAtual = this.camadaAtual === 1 ? 2 : 1;
    console.log("Trocando de camada!");
  }
}