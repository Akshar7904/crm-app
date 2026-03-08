import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Stats } from 'src/app/interface/stats';

@Component({
  standalone: false,
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsComponent {
  @Input() stats: Stats;

}
