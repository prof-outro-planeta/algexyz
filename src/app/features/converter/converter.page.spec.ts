import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { SubscriptionService } from '../../core/subscription';
import { FakeSubscriptionGateway, provideFakeSubscription } from '../../core/subscription/subscription.testing';
import { ConverterPage } from './converter.page';

describe('ConverterPage navigation contract', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'converter', component: ConverterPage }])],
    });
  });

  it('preloads the numeral and source base from query params', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/converter?value=100&from=hexadecimal', ConverterPage);

    expect(page.input()).toBe('100');
    expect(page.sourceId()).toBe('hexadecimal');
    expect(page.targetId()).toBe('decimal');
    expect(page.result()).toBe('256');
  });

  it('ignores an unknown source base', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/converter?value=100&from=ternary', ConverterPage);

    expect(page.input()).toBe('11010110');
    expect(page.sourceId()).toBe('binary');
  });
});

describe('ConverterPage', () => {
  let component: ConverterPage;
  let fixture: ComponentFixture<ConverterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConverterPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ConverterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('starts with 11010110 in BIN converted to D6 in HEX', () => {
    expect(component.validation()).toEqual({ status: 'valid' });
    expect(component.result()).toBe('D6');

    const explanation = component.explanation();
    expect(explanation?.strategy).toBe('bit-grouping');
    expect(explanation?.strategy === 'bit-grouping' && explanation.groups).toHaveLength(2);
  });

  it('flags digits that do not exist in the source base without throwing', () => {
    expect(() => component.input.set('102')).not.toThrow();

    expect(component.validation()).toEqual({ status: 'invalid', invalidDigits: ['2'] });
    expect(component.result()).toBeNull();
    expect(component.explanation()).toBeNull();
    expect(component.invalidMessage()).toBe("Digit 2 doesn't exist in base 2.");
  });

  it('treats blank input as empty', () => {
    component.input.set('   ');

    expect(component.validation()).toEqual({ status: 'empty' });
    expect(component.result()).toBeNull();
    expect(component.invalidMessage()).toBeNull();
  });

  it('swaps the systems and uses the previous result as the new input', () => {
    component.swap();

    expect(component.sourceId()).toBe('hexadecimal');
    expect(component.targetId()).toBe('binary');
    expect(component.input()).toBe('D6');
    expect(component.result()).toBe('11010110');
  });

  it('only swaps the systems when there is no result', () => {
    component.input.set('102');

    component.swap();

    expect(component.sourceId()).toBe('hexadecimal');
    expect(component.targetId()).toBe('binary');
    expect(component.input()).toBe('102');
  });

  it('updates the source system and valid digits from the picker', () => {
    component.openPicker('from');
    expect(component.picker()).toBe('from');

    component.pick('hexadecimal');

    expect(component.sourceId()).toBe('hexadecimal');
    expect(component.picker()).toBeNull();
    expect(component.source().digits).toBe('0123456789ABCDEF');
    expect(component.inputMode()).toBe('text');
  });

  it('updates the target system from the picker', () => {
    component.openPicker('to');
    component.pick('decimal');

    expect(component.targetId()).toBe('decimal');
    expect(component.sourceId()).toBe('binary');
    expect(component.result()).toBe('214');
    expect(component.explanation()?.strategy).toBe('positional-expansion');
  });

  it('renders the bit groups from the domain explanation', () => {
    const element: HTMLElement = fixture.nativeElement;
    const groups = [...element.querySelectorAll('.bit-group')].map((group) => [
      group.querySelector('.bit-group-bits')?.textContent?.trim(),
      group.querySelector('.bit-group-digit')?.textContent?.trim(),
    ]);

    expect(groups).toEqual([
      ['1101', 'D'],
      ['0110', '6'],
    ]);
    expect(element.querySelector('.step-joined')?.textContent).toContain('Joined');
    expect(element.querySelector('.numeral-result')?.textContent?.trim()).toBe('D6');
  });

  it('renders the repeated divisions for decimal to hexadecimal', async () => {
    component.openPicker('from');
    component.pick('decimal');
    component.input.set('214');
    fixture.detectChanges();
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const divisions = [...element.querySelectorAll('.division')].map((division) =>
      division.textContent?.replace(/\s+/g, ' ').trim(),
    );

    expect(component.explanation()?.strategy).toBe('repeated-division');
    expect(divisions).toEqual(['214 ÷ 16 = 13 r 6', '13 ÷ 16 = 0 r 13 → D']);
    expect(element.querySelector('.steps-method')?.textContent?.trim()).toBe('Repeated division');
  });

  it('shows the inline error in the hint when the input is invalid', async () => {
    component.input.set('19');
    fixture.detectChanges();
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('#numeral-hint')?.textContent).toContain(
      "Digit 9 doesn't exist in base 2.",
    );
    expect(element.querySelector('#numeral-input')?.getAttribute('aria-invalid')).toBe('true');
    expect(element.querySelector('.bit-group')).toBeNull();
  });
});

describe('ConverterPage base access', () => {
  let component: ConverterPage;
  let fixture: ComponentFixture<ConverterPage>;
  let gateway: FakeSubscriptionGateway;

  beforeEach(async () => {
    const subscription = provideFakeSubscription('free');
    gateway = subscription.gateway;
    await TestBed.configureTestingModule({
      imports: [ConverterPage],
      providers: [provideRouter([]), ...subscription.providers],
    }).compileComponents();
    await TestBed.inject(SubscriptionService).initialize();

    fixture = TestBed.createComponent(ConverterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('allows binary, decimal and hexadecimal on Free', () => {
    expect(component.isUnlocked('binary')).toBe(true);
    expect(component.isUnlocked('decimal')).toBe(true);
    expect(component.isUnlocked('hexadecimal')).toBe(true);
    expect(component.isUnlocked('octal')).toBe(false);
    expect(component.requiredPlanLabel('duodecimal')).toBe('Pro');
  });

  it('opens the paywall when a locked base is picked', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.openPicker('to');

    component.pick('octal');
    expect(component.picker()).toBeNull();
    expect(navigate).not.toHaveBeenCalled();

    component.onPickerDismissed();

    expect(navigate).toHaveBeenCalledWith(['/paywall']);
    expect(component.targetId()).toBe('hexadecimal');
  });

  it('unlocks octal and duodecimal for Pro', () => {
    gateway.emit(['pro']);
    component.openPicker('to');

    component.pick('octal');

    expect(component.targetId()).toBe('octal');
    expect(component.result()).toBe('326');
  });

  it('moves off a paid base when the subscription lapses', async () => {
    gateway.emit(['premium']);
    component.openPicker('to');
    component.pick('duodecimal');

    gateway.emit([]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.targetId()).not.toBe('duodecimal');
    expect(component.isUnlocked(component.targetId())).toBe(true);
  });
});
