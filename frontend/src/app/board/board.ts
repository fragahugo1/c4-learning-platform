import { CommonModule } from '@angular/common';
import { Component, ElementRef, AfterViewInit, ViewChild, OnDestroy, Input, NgZone, ChangeDetectorRef, SimpleChanges, OnChanges } from '@angular/core';
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
export class BoardComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef;
  @Input() activeTool: string = 'draw';
  @ViewChild('textInput') textInput!: ElementRef;
  @Input() currentLayer = 1;
  isEditingText = false;
  textX = 0;
  textY = 0;
  textValue = '';
  private isSwitchingLayer = false;

  private lastDiagramCoords = { x: 0, y: 0 };
  private graph = new joint.dia.Graph({}, {
    cellNamespace: {
      c4: {
        Person: joint.shapes.standard.Rectangle,
        System: joint.shapes.standard.Rectangle,
        Container: joint.shapes.standard.Rectangle,
        Database: joint.shapes.standard.Cylinder,
        Component: joint.shapes.standard.Rectangle,
        Boundary: joint.shapes.standard.Rectangle,
        PlainText: joint.shapes.standard.Rectangle
      },
      standard: joint.shapes.standard
    }
  });
  private paper!: joint.dia.Paper;
  private editingElement: joint.dia.Element | null = null;

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
      validateConnection: (sourceView, sourceMagnet, targetView, targetMagnet) => {
        if (!targetMagnet) return false;
        return targetMagnet.getAttribute('magnet') !== 'false';
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

    setTimeout(() => {
      this.loadFromLocalStorage();
      setTimeout(() => {
        (this.graph as any).on('add remove change', () => {
          if (this.isSwitchingLayer) return;
          this.saveToLocalStorage();
        });
      }, 500);
    }, 200);

    this.paper.on('element:pointerdblclick', (elementView: any) => {
      if (this.activeTool === 'delete') {
        elementView.model.remove();
        return;
      }

      const element = elementView.model;

      this.ngZone.run(() => {
        const bbox = elementView.getBBox();

        const screenPoint = this.paper.localToClientPoint({
          x: bbox.x,
          y: bbox.y
        });

        this.textX = screenPoint.x + 10;
        this.textY = screenPoint.y + 20;

        this.textValue = element.attr('label/text') || '';
        this.editingElement = element;
        this.isEditingText = true;

        this.cdr.detectChanges();

        setTimeout(() => {
          this.textInput?.nativeElement.focus();
          this.textInput?.nativeElement.select();
        });
      });
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

    this.setupDropListeners();
    window.addEventListener('resize', this.onResize);
    setTimeout(() => this.onResize(), 100);
  }

  private setupDropListeners() {
    const el = this.canvas.nativeElement;

    el.addEventListener('drop', (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer?.getData('type');
      if (!type) return;

      const mouseX = event.offsetX;
      const mouseY = event.offsetY;
      const blockWidth = 120;
      const blockHeight = 60;

      const maxX = el.clientWidth - blockWidth;
      const maxY = el.clientHeight - blockHeight;

      const safeX = Math.max(0, Math.min(mouseX, maxX));
      const safeY = Math.max(0, Math.min(mouseY, maxY));

      this.createC4Element(type, safeX, safeY);
    });

    el.addEventListener('dragover', (event: DragEvent) => {
      event.preventDefault();
    });
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

  ngOnChanges(changes: SimpleChanges) {
    const layerChange = changes['currentLayer'];

    if (layerChange && !layerChange.firstChange) {
      const previousLayer = layerChange.previousValue;
      const newLayer = layerChange.currentValue;

      this.switchLayer(previousLayer, newLayer);
    }
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
      const text = this.textValue.trim();

      if (!text) {
        this.cancelTextEditing();
        return;
      }

      if (this.editingElement) {
        this.editingElement.attr('label/text', text);
      } 
      else {
        this.createPlainText(
          this.lastDiagramCoords.x,
          this.lastDiagramCoords.y,
          text
        );
      }

      this.cancelTextEditing();
    }

    private cancelTextEditing() {
      this.isEditingText = false;
      this.textValue = '';
      this.editingElement = null;
    }

    createC4Element(type: string, x: number, y: number) {
      switch (type) {
        case 'person':
          return this.createPerson(x, y, 'Usuário');

        case 'system':
          return this.createSystem(x, y, 'Sistema');

        case 'container':
          return this.createContainer(x, y, 'Web App');

        case 'database':
          return this.createDatabase(x, y, 'PostgreSQL');

        case 'component':
          return this.createComponent(x, y, 'Auth Service');

        case 'boundary':
          return this.createBoundary(x, y, 'Sistema');

        default:
          return this.createBlock(x, y, 'Novo Bloco');
      }
    }

    createPerson(x: number, y: number, text: string) {
      const person = new joint.shapes.standard.Rectangle();
      person.prop('type', 'c4.Person');

      person.resize(120, 60);
      person.position(x, y);

      person.attr({
        body: {
          fill: '#e3f2fd',
          stroke: '#1976d2',
          strokeWidth: 2,
          rx: 30,
          ry: 30
        },
        label: {
          text: '👤 ' + text,
          fontSize: 14,
          fontWeight: 'bold'
        }
      });

      this.addPorts(person);

      person.addTo(this.graph);
      return person;
    }

    createSystem(x: number, y: number, text: string) {
      const system = new joint.shapes.standard.Rectangle();
      system.prop('type', 'c4.System');

      system.resize(180, 80);
      system.position(x, y);

      system.attr({
        body: {
          fill: '#fff3e0',
          stroke: '#f57c00',
          strokeWidth: 3
        },
        label: {
          text: '🖥️ ' + text,
          fontSize: 15,
          fontWeight: 'bold'
        }
      });

      this.addPorts(system);

      system.addTo(this.graph);
      return system;
    }

    createContainer(x: number, y: number, text: string) {
      const container = new joint.shapes.standard.Rectangle();
      container.prop('type', 'c4.Container');

      container.resize(160, 70);
      container.position(x, y);

      container.attr({
        body: {
          fill: '#ede7f6',
          stroke: '#5e35b1',
          strokeWidth: 2
        },
        label: {
          text: '📦 ' + text,
          fontSize: 14
        }
      });

      this.addPorts(container);

      container.addTo(this.graph);
      return container;
    }

    createDatabase(x: number, y: number, text: string) {
      const db = new joint.shapes.standard.Cylinder();
      db.prop('type', 'c4.Database');

      db.resize(120, 80);
      db.position(x, y);

      db.attr({
        body: {
          fill: '#e8f5e9',
          stroke: '#2e7d32',
          strokeWidth: 2
        },
        label: {
          text: '🛢️ ' + text,
          fontSize: 14
        }
      });

      this.addPorts(db);

      db.addTo(this.graph);
      return db;
    }

    createComponent(x: number, y: number, text: string) {
      const comp = new joint.shapes.standard.Rectangle();
      comp.prop('type', 'c4.Component');

      comp.resize(140, 60);
      comp.position(x, y);

      comp.attr({
        body: {
          fill: '#fce4ec',
          stroke: '#c2185b',
          strokeDasharray: '5 2'
        },
        label: {
          text: '🧩 ' + text
        }
      });

      this.addPorts(comp);

      comp.addTo(this.graph);
      return comp;
    }

    createBoundary(x: number, y: number, text: string) {
      const boundary = new joint.shapes.standard.Rectangle();
      boundary.prop('type', 'c4.Boundary');

      boundary.resize(900, 700);
      boundary.position(x, y);

      boundary.attr({
        body: {
          fill: 'transparent',
          stroke: '#616161',
          strokeWidth: 2,
          strokeDasharray: '10 5',
          magnet: false
        },
        label: {
          text: '🧱 ' + text,
          refY: 10
        }
      });

      boundary.addTo(this.graph);
      return boundary;
    }

    private addPorts(element: joint.dia.Element) {
      const portGroup = {
        position: { name: 'absolute' },
        attrs: {
          circle: {
            r: 6,
            magnet: true,
            fill: '#2196f3',
            stroke: '#fff',
            strokeWidth: 2,
            cursor: 'crosshair'
          }
        }
      };

      element.prop('ports', {
        groups: { out: portGroup },
        items: [
          { group: 'out', args: { x: '50%', y: 0 }, id: 'top' },
          { group: 'out', args: { x: '50%', y: '100%' }, id: 'bottom' },
          { group: 'out', args: { x: 0, y: '50%' }, id: 'left' },
          { group: 'out', args: { x: '100%', y: '50%' }, id: 'right' }
        ]
      });
    }

    private saveToLocalStorage() {
      const data = this.graph.toJSON();
      localStorage.setItem(
        `c4-diagram-layer-${this.currentLayer}`,
        JSON.stringify(data)
      );
    }

    private loadFromLocalStorage() {
      const savedData = localStorage.getItem(
        `c4-diagram-layer-${this.currentLayer}`
      );
      if (savedData) {
        try {
          const json = JSON.parse(savedData);
          this.graph.fromJSON(json);
        } catch (e) {
          console.error('Erro ao carregar:', e);
        }
      }
    }

    private switchLayer(previousLayer: number, newLayer: number) {
      this.isSwitchingLayer = true;

      const currentData = this.graph.toJSON();
      localStorage.setItem(
        `c4-diagram-layer-${previousLayer}`,
        JSON.stringify(currentData)
      );

      this.graph.clear();

      const savedData = localStorage.getItem(
        `c4-diagram-layer-${newLayer}`
      );

      if (savedData) {
        try {
          const json = JSON.parse(savedData);
          this.graph.fromJSON(json);
        } catch (e) {
          console.error('Erro ao trocar camada:', e);
        }
      }

      setTimeout(() => {
        this.isSwitchingLayer = false;
      }, 100);
    }

    exportDiagramAsJson(): string {
      return JSON.stringify(this.graph.toJSON());
    }
}