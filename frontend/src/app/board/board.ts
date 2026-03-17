import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DragDropModule, CdkDragDrop, CdkDragEnd, moveItemInArray } from '@angular/cdk/drag-drop';

interface DiagramNode {
  id: string;
  text: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, DragDropModule], 
  templateUrl: './board.html',
  styleUrl: './board.css'
})
export class BoardComponent {

  nodes: DiagramNode[] = [
    { id: '1', text: 'Início', x: 50, y: 50 },
    { id: '2', text: 'Processo', x: 200, y: 150 }
  ];

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.nodes, event.previousIndex, event.currentIndex);
  }

  onDragEnded(event: CdkDragEnd, node: DiagramNode) {
    const transform = event.source.getFreeDragPosition();
    
    node.x += transform.x;
    node.y += transform.y;

    event.source.reset();
  }
}

