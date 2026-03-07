import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables, ChartDataset, DefaultDataPoint } from 'chart.js';

Chart.register(...registerables);

export interface ChartDatasetConfig {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDatasetConfig[];
}

@Component({
  selector: 'app-dashboard-chart',
  template: `
    <div class="chart-container">
      <div class="chart-header" *ngIf="title">
        <h3>{{ title }}</h3>
        <p *ngIf="subtitle">{{ subtitle }}</p>
      </div>
      <div class="chart-wrapper">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid #f0f0f0;
    }

    .chart-header {
      margin-bottom: 1.5rem;
    }

    .chart-header h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
    }

    .chart-header p {
      font-size: 0.9rem;
      color: #7f8c8d;
      margin: 0;
    }

    .chart-wrapper {
      position: relative;
      height: 300px;
    }

    canvas {
      max-height: 300px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardChartComponent implements OnInit, OnChanges {
  @Input() chartType: ChartType = 'bar';
  @Input() chartData: ChartData;
  @Input() title: string;
  @Input() subtitle: string;
  @Input() options: any = {};

  @ViewChild('chartCanvas', { static: true }) chartCanvas: ElementRef<HTMLCanvasElement>;

  private chart: Chart;

  ngOnInit(): void {
    if (this.chartData) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['chartData'] && !changes['chartData'].firstChange) {
      this.updateChart();
    }
  }

  private createChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    // Convert our custom ChartData to Chart.js format
    const chartJsData: ChartConfiguration['data'] = {
      labels: this.chartData.labels,
      datasets: this.chartData.datasets.map(dataset => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor || this.getDefaultBackgroundColor(),
        borderColor: dataset.borderColor || dataset.backgroundColor || this.getDefaultBorderColor(),
        borderWidth: dataset.borderWidth || 2,
        fill: dataset.fill !== undefined ? dataset.fill : this.chartType !== 'bar' && this.chartType !== 'line'
      }))
    };

    const config: ChartConfiguration = {
      type: this.chartType,
      data: chartJsData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.chartType === 'pie' || this.chartType === 'doughnut' || this.chartType === 'line',
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12,
                family: "'Inter', sans-serif"
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14
            },
            bodyFont: {
              size: 13
            },
            cornerRadius: 8
          }
        },
        ...this.getChartSpecificOptions(),
        ...this.options
      }
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (this.chart && this.chartData) {
      // Update chart data
      this.chart.data.labels = this.chartData.labels;
      this.chart.data.datasets = this.chartData.datasets.map(dataset => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor || this.getDefaultBackgroundColor(),
        borderColor: dataset.borderColor || dataset.backgroundColor || this.getDefaultBorderColor(),
        borderWidth: dataset.borderWidth || 2,
        fill: dataset.fill !== undefined ? dataset.fill : this.chartType !== 'bar' && this.chartType !== 'line'
      }));
      this.chart.update();
    } else if (this.chartData) {
      this.createChart();
    }
  }

  private getDefaultBackgroundColor(): string | string[] {
    switch (this.chartType) {
      case 'pie':
      case 'doughnut':
        return [
          'rgba(75, 73, 172, 0.8)',
          'rgba(121, 120, 233, 0.8)',
          'rgba(152, 189, 255, 0.8)',
          'rgba(243, 121, 126, 0.8)',
          'rgba(255, 217, 61, 0.8)'
        ];
      case 'bar':
      case 'line':
        return 'rgba(75, 73, 172, 0.6)';
      default:
        return 'rgba(75, 73, 172, 0.6)';
    }
  }

  private getDefaultBorderColor(): string | string[] {
    switch (this.chartType) {
      case 'pie':
      case 'doughnut':
        return [
          '#4B49AC',
          '#7978E9',
          '#98BDFF',
          '#E84A5F',
          '#F7971E'
        ];
      case 'bar':
      case 'line':
        return '#4B49AC';
      default:
        return '#4B49AC';
    }
  }

  private getChartSpecificOptions(): any {
    switch (this.chartType) {
      case 'pie':
      case 'doughnut':
        return {
          cutout: this.chartType === 'doughnut' ? '70%' : '0%'
        };

      case 'bar':
      case 'line':
        return {
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                font: {
                  size: 11
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 11
                }
              }
            }
          }
        };

      default:
        return {};
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
