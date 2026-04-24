import { Component, input, computed } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { MiniMundoService } from '../services/mini-mundo.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [DrawerModule, ButtonModule, DragDropModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  currentLayer = input<number>(1);
  sidebarVisible: boolean = false;

  currentPhase = computed(() => {
    return this.miniMundoService.getPhaseByLayer(this.currentLayer());
  });

  constructor(private miniMundoService: MiniMundoService) {}

  onDragStart(event: DragEvent, type: string) {
    if (event.dataTransfer) {
      // Guardamos o tipo de elemento (ex: 'Rectangle') dentro do evento de arrasto
      event.dataTransfer.setData('type', type);
      
      // Define o efeito visual do mouse
      event.dataTransfer.effectAllowed = 'copy';
    }
  }
}
