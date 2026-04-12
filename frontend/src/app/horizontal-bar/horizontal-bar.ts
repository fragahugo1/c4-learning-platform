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
  @Output() layerChanged = new EventEmitter<number>();

  tools = [
    { icon: 'pi pi-pencil', value: 'draw' },
    { icon: 'pi pi-comment', value: 'text' },
    { icon: 'pi pi-trash', value: 'delete' },
    { icon: 'pi pi-palette', value: 'paint' }
  ];

  selectTool(tool: any) {
    if (this.selectedTool === tool.value) {
      this.selectedTool = '';
      this.toolChanged.emit('');
      return;
    }

    this.selectedTool = tool.value;
    this.toolChanged.emit(tool.value);
  }

  alternarCamada() {
    this.camadaAtual = this.camadaAtual === 1 ? 2 : 1;
    this.layerChanged.emit(this.camadaAtual);
  }
}