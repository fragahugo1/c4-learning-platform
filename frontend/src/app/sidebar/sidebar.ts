import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [DrawerModule, ButtonModule, DragDropModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  sidebarVisible: boolean = false;

  onDragStart(event: DragEvent, type: string) {
    if (event.dataTransfer) {
      // Guardamos o tipo de elemento (ex: 'Rectangle') dentro do evento de arrasto
      event.dataTransfer.setData('type', type);
      
      // Define o efeito visual do mouse
      event.dataTransfer.effectAllowed = 'copy';
    }
  }
}
