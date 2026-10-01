import { Component, input } from '@angular/core';
import { ConversionExplanation } from '../../domain/explanation';

/** Renders a structured conversion explanation followed by the result line. */
@Component({
  selector: 'app-conversion-steps',
  templateUrl: 'conversion-steps.component.html',
  styleUrls: ['conversion-steps.component.scss'],
})
export class ConversionStepsComponent {
  readonly explanation = input<ConversionExplanation | null>(null);
  readonly numeral = input.required<string>();
  readonly fromBase = input.required<number>();
  readonly toBase = input.required<number>();
  readonly result = input.required<string>();
}
