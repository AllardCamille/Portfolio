import { Component, ElementRef, HostListener, OnInit, ViewChild, NgZone, inject, AfterViewInit, OnDestroy } from '@angular/core';

interface NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  side: 'left' | 'right';
}

@Component({
  selector: 'app-sidebars',
  standalone: true,
  imports: [],
  templateUrl: './sidebars.component.html',
  styleUrl: './sidebars.component.css'
})
export class SidebarsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('networkCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private nodes: NetworkNode[] = [];
  private mouse = { x: -1000, y: -1000 };
  private dpr = 1;
  private ngZone = inject(NgZone);
  private resizeObserver!: ResizeObserver;
  private currentDocHeight = 0;

  private sidebarWidth = 220;
  private readonly nodeRadius = 4;

  ngOnInit() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  ngAfterViewInit() {
    // Attend que le DOM et les images soient complètement ajustés pour calculer la vraie hauteur
    setTimeout(() => {
      this.resizeCanvas(true);
    }, 200);

    // Ajuste le canvas si le contenu change de taille, sans réinitialiser les points inutilement
    this.resizeObserver = new ResizeObserver(() => {
      const newHeight = this.getDocHeight();
      if (Math.abs(newHeight - this.currentDocHeight) > 50) {
        this.resizeCanvas(true);
      }
    });
    this.resizeObserver.observe(document.body);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private getDocHeight(): number {
    return Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      window.innerHeight
    );
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.resizeCanvas(true);
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouse.x = event.clientX;
    this.mouse.y = event.pageY; // pageY suit le curseur en position absolue dans le document
  }

  private resizeCanvas(reinitNodes = false) {
    const canvas = this.canvasRef.nativeElement;
    const width = window.innerWidth;
    const height = this.getDocHeight();
    this.currentDocHeight = height;

    this.dpr = window.devicePixelRatio || 1;

    canvas.width = width * this.dpr;
    canvas.height = height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.sidebarWidth = Math.min(Math.max(width * 0.18, 50), 1000);

    if (reinitNodes || this.nodes.length === 0) {
      this.initNetwork(height);
    }
  }

  private initNetwork(height: number) {
    this.nodes = [];
    const width = window.innerWidth;

    // Calcul de la quantité de nœuds proportionnelle à la surface totale des sidebars
    const sidebarArea = this.sidebarWidth * height;
    const nodeCountPerSide = Math.min(Math.max(Math.floor(sidebarArea / 4500), 20), 400);

    this.generateSideNodes(0, this.sidebarWidth, height, nodeCountPerSide, 'left');
    this.generateSideNodes(width - this.sidebarWidth, width, height, nodeCountPerSide, 'right');
  }

  private generateSideNodes(minX: number, maxX: number, height: number, count: number, side: 'left' | 'right') {
    for (let i = 0; i < count; i++) {
      const x = minX + Math.random() * (maxX - minX);
      const y = Math.random() * height; // Répartition homogène du haut jusqu'au bas de la page

      this.nodes.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        side
      });
    }
  }

  private animate = () => {
    const width = window.innerWidth;
    const height = this.currentDocHeight || window.innerHeight;

    this.ctx.clearRect(0, 0, width, height);

    // 1. Déplacement et limites
    this.nodes.forEach(node => {
      // Repulsion souris (utilise mouse.y qui est relatif à la page entière)
      const distMouse = Math.hypot(node.x - this.mouse.x, node.y - this.mouse.y);
      if (distMouse < 120) {
        const angle = Math.atan2(node.y - this.mouse.y, node.x - this.mouse.x);
        node.x += Math.cos(angle) * 1.5;
        node.y += Math.sin(angle) * 1.5;
      }

      node.x += node.vx;
      node.y += node.vy;

      const minX = node.side === 'left' ? 0 : width - this.sidebarWidth;
      const maxX = node.side === 'left' ? this.sidebarWidth : width;

      // Rebond rigide sur X
      if (node.x < minX) {
        node.x = minX;
        node.vx = Math.abs(node.vx);
      } else if (node.x > maxX) {
        node.x = maxX;
        node.vx = -Math.abs(node.vx);
      }

      // Rebond rigide sur Y (du haut tout en haut au tout bas du document)
      if (node.y < 0) {
        node.y = 0;
        node.vy = Math.abs(node.vy);
      } else if (node.y > height) {
        node.y = height;
        node.vy = -Math.abs(node.vy);
      }
    });

    // 2. Traçage des lignes
    const maxDistance = 130;
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const nodeA = this.nodes[i];
        const nodeB = this.nodes[j];

        if (nodeA.side !== nodeB.side) continue;

        const dist = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);

        if (dist < maxDistance) {
          const alpha = (1 - dist / maxDistance) * 0.45;
          this.ctx.strokeStyle = `rgba(30, 41, 59, ${alpha})`;
          this.ctx.lineWidth = 1.2;

          this.ctx.beginPath();
          this.ctx.moveTo(Math.floor(nodeA.x), Math.floor(nodeA.y));
          this.ctx.lineTo(Math.floor(nodeB.x), Math.floor(nodeB.y));
          this.ctx.stroke();
        }
      }
    }

    // 3. Dessin des points
    this.ctx.fillStyle = '#6b7280';
    this.nodes.forEach(node => {
      const px = Math.floor(node.x);
      const py = Math.floor(node.y);

      this.ctx.beginPath();
      this.ctx.arc(px, py, this.nodeRadius, 0, Math.PI * 2);
      this.ctx.fill();
    });

    requestAnimationFrame(this.animate);
  };
}
