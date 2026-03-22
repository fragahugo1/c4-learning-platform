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

  tools = [
    { icon: 'pi pi-pencil', value: 'draw' },
    { icon: 'pi pi-comment', value: 'text' },
    { icon: 'pi pi-trash', value: 'layer' },
    { icon: 'pi pi-palette', value: 'layer' }
  ];

  selectTool(tool: any) {
    this.selectedTool = tool.value;
  }
}