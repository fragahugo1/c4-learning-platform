import { Component } from '@angular/core';
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

  tools = [
    { icon: 'pi pi-pencil', value: 'draw' },
    { icon: 'pi pi-comment', value: 'text' },
    { icon: 'pi pi-trash', value: 'layer' },
    { icon: 'pi pi-palette', value: 'paint' }
  ];

  selectTool(tool: any) {
  this.selectedTool = tool.value;

    switch (tool.value) {
        case 'draw':
          console.log('Desenhando!!!');
          break;
        case 'text':
          console.log('Escrevendo!!!');
          break;
        case 'layer':
          console.log('Apagando!!!');
          break;
        case 'paint':
          console.log('Pintando!!!');
          break;
    }
  }

  alternarCamada() {
    this.camadaAtual = this.camadaAtual === 1 ? 2 : 1;
    console.log("Trocando de camada!");
  }
}