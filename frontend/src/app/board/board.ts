import { CommonModule } from '@angular/common';
import { Component, ElementRef, AfterViewInit, ViewChild, OnDestroy, Input, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as joint from 'jointjs';

@Component({
  selector: 'app-board',
  standalone: true,
  template: `
  <div class="board-wrapper">
    <div #canvas class="canvas-container"></div>

    <input
      *ngIf="isEditingText"
      #textInput
      class="floating-text-input"
      [style.left.px]="textX"
      [style.top.px]="textY"
      [(ngModel)]="textValue"
      (blur)="finishTextEditing()"
      (keydown.enter)="finishTextEditing()"
      autofocus
    />
  </div>
  `,
  styleUrls: ['./board.css'],
  imports: [CommonModule, FormsModule],
})
export class BoardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef;
  @Input() activeTool: string = 'draw';
  @ViewChild('textInput') textInput!: ElementRef;
  isEditingText = false;
  textX = 0;
  textY = 0;
  textValue = '';

  private lastDiagramCoords = { x: 0, y: 0 };
  private graph = new joint.dia.Graph();
  private paper!: joint.dia.Paper;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    const width = this.canvas.nativeElement.clientWidth || window.innerWidth;
    const height = this.canvas.nativeElement.clientHeight || window.innerHeight;

    this.paper = new joint.dia.Paper({
      el: this.canvas.nativeElement,
      model: this.graph,
      width: width,
      height: height,
      gridSize: 10,
      drawGrid: { name: 'mesh', color: '#d1d1d1' }, 
      background: { color: '#ffffff' },
      restrictTranslate: true,
      async: true,
      sorting: joint.dia.Paper.sorting.APPROX,
      linkPinning: false, 
      markAvailable: true, 
      validateMagnet: (cellView, magnet) => {
        return magnet && magnet.getAttribute('magnet') !== 'false';
      },
      defaultLink: () => new joint.shapes.standard.Link({
        attrs: {
          line: {
            stroke: '#333',
            strokeWidth: 1.5,
            targetMarker: {
              'type': 'path',
              'd': 'M 8 -4 0 0 8 4 Z'
            }
          }
        }
      })
    });

    this.paper.on('element:pointerclick', (elementView: any) => {
      if (this.activeTool === 'delete') {
        elementView.model.remove();
        return;
      }
    });

    // Evento para mostrar o botão de remover (X) na seta
    this.paper.on('link:pointerclick', (linkView) => {
      const removeButton = new joint.linkTools.Remove({
        distance: '50%',
        offset: 20
      });

      const toolsView = new joint.dia.ToolsView({
        tools: [removeButton]
      });

      linkView.addTools(toolsView);
    });

    this.paper.on('blank:pointerclick', (_evt, x, y) => {
      if (this.activeTool === 'text') {
        this.ngZone.run(() => {
          this.lastDiagramCoords = { x, y };

          const localPoint = this.paper.localToClientPoint({ x, y });
          this.textX = localPoint.x;
          this.textY = localPoint.y;

          this.textValue = '';
          this.isEditingText = true;

          this.cdr.detectChanges(); // força render AGORA

          setTimeout(() => {
            this.textInput?.nativeElement.focus();
          });
        });

        return;
      }
    });

    const rect1 = this.createBlock(50, 50, 'Início');
    const rect2 = this.createBlock(250, 150, 'Processo');
    this.createLink(rect1, rect2);

    this.setupDropListeners();
    window.addEventListener('resize', this.onResize);
    setTimeout(() => this.onResize(), 100);
  }

  private setupDropListeners() {
    const el = this.canvas.nativeElement;

    el.addEventListener('drop', (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer?.getData('type');
      
      const mouseX = event.offsetX;
      const mouseY = event.offsetY;
      const blockWidth = 120;
      const blockHeight = 60;

      const maxX = el.clientWidth - blockWidth;
      const maxY = el.clientHeight - blockHeight;

      const safeX = Math.max(0, Math.min(mouseX, maxX));
      const safeY = Math.max(0, Math.min(mouseY, maxY));

      if (type === 'Rectangle') {
        this.createBlock(safeX, safeY, 'Novo Bloco');
      }
    });

    el.addEventListener('dragover', (event: DragEvent) => event.preventDefault());
  }

  private onResize = () => {
    if (this.paper && this.canvas) {
      const width = this.canvas.nativeElement.clientWidth;
      const height = this.canvas.nativeElement.clientHeight;
      this.paper.setDimensions(width, height);
    }
  }

  createBlock(x: number, y: number, text: string) {
    const rect = new joint.shapes.standard.Rectangle();
    
    // 1. Configuração das Portas (Ímãs)
    const portGroup = {
      position: { name: 'absolute' },
      attrs: {
        circle: {
          r: 6,
          magnet: true, // APENAS aqui o magnet é true
          fill: '#2196f3',
          stroke: '#fff',
          strokeWidth: 2,
          cursor: 'crosshair'
        }
      }
    };

    // 2. Aplicando as portas
    rect.prop('ports', {
      groups: { 'out': portGroup },
      items: [
        { group: 'out', args: { x: '50%', y: 0 }, id: 'top' },
        { group: 'out', args: { x: '50%', y: '100%' }, id: 'bottom' },
        { group: 'out', args: { x: 0, y: '50%' }, id: 'left' },
        { group: 'out', args: { x: '100%', y: '50%' }, id: 'right' }
      ]
    });

    // 3. Configuração do Corpo (Arrasto)
    rect.attr({
      body: {
        fill: '#ffffff',
        stroke: '#333333',
        strokeWidth: 2,
        magnet: false,
        pointerEvents: 'auto'
      },
      label: {
        text: text,
        fill: '#333333',
        fontSize: 13,
        fontWeight: 'bold',
        pointerEvents: 'none'
      }
    });

  rect.resize(150, 70);
  rect.position(x, y);
  rect.addTo(this.graph);
  
  return rect;
}

  createLink(source: any, target: any) {
    const link = new joint.shapes.standard.Link();
    link.source(source);
    link.target(target);
    link.addTo(this.graph);
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize);
  }

  createPlainText(x: number, y: number, text: string) {
    const textElement = new joint.shapes.standard.Rectangle();

    textElement.position(x, y);
    textElement.resize(200, 40);

    textElement.attr({
      body: {
        fill: 'transparent',
        stroke: 'transparent'
      },
      label: {
        text,
        fontSize: 18,
        fill: '#222',
        textAnchor: 'start',
        textVerticalAnchor: 'middle',
        refX: 0
      }
    });

    textElement.addTo(this.graph);
  }

  finishTextEditing() {
    if (this.textValue.trim()) {
      this.createPlainText(this.lastDiagramCoords.x, this.lastDiagramCoords.y, this.textValue);
    }
    this.isEditingText = false;
    this.textValue = '';
  }
}