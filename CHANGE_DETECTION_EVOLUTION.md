# 🚦 Angular Change Detection Evolution Map

A comprehensive guide to how Angular Change Detection has evolved from Angular 2 to Angular 18 (signals era), covering core behavioral changes, performance improvements, APIs, and conceptual shifts.

---

## 🔵 Angular 2 (2016–2017): The Foundation

**The baseline design that established Angular's change detection model.**

### Key Concepts Introduced:

- **Zone.js Integration**: Zones (`zone.js`) drive automatic change detection
- **Change Detection Strategies**:
  - `Default` (CheckAlways) – checks entire component tree every tick
  - `OnPush` (CheckOnce) – checks only when:
    - Input reference changes
    - Event/async/observable triggers
    - Manual `markForCheck()`, `detectChanges()`
- **Tree-Based Traversal**: Views are rechecked in a hierarchical tree traversal
- **ChangeDetectorRef API**: Manual control over change detection

### Architecture:

```
User Action → Zone.js Detects → onMicrotaskEmpty → tick() → Tree Traversal → Update DOM
```

**This is the baseline design that holds for many versions.**

---

## 🟣 Angular 4 → 7 (2017–2018): Stability & Minor Improvements

**No major conceptual changes, but important additions.**

### Notable Features:

- **Performance Optimizations**: Under-the-hood improvements
- **`ngZone: 'noop'` Option**: Ability to disable zones manually
- **`ChangeDetectorRef.detach()`**: More widely used in advanced applications
- **Better Tree-Shaking**: Smaller bundle sizes

### Change Detection Model:

**Stayed the same** – Zone-based, tree traversal approach continued.

---

## 🟢 Angular 8 (2019): Ivy Preparation

**Transition period before the major rewrite.**

- Still using **View Engine** by default
- **Ivy introduced as preview** (opt-in)
- Core change detection unchanged
- Preparation for Angular 9's major shift

---

## 🟢 Angular 9 (2020): Ivy by Default — Huge Internal Shift

**BIG change under the hood, but API unchanged.**

### Major Changes:

- **Ivy Renderer**: Complete rewrite of the rendering engine
- **Change Detection Rewritten**: Using Ivy instructions:
  - `ɵɵproperty()` – property bindings
  - `ɵɵadvance()` – navigate to next node
  - `ɵɵelementStart()` – element creation
  - `ɵɵtextInterpolate()` – text interpolation
- **More Efficient Dirty-Checking**: Optimized comparison algorithms
- **Smaller Bundle Sizes**: Better tree-shaking and code generation

### What Stayed the Same:

- **Still relies on zones** for automatic detection
- **OnPush semantics remain identical**
- **Developer experience unchanged** – same APIs
- **Performance improved significantly** without breaking changes

### Example of Compiled Code:

```typescript
// Before (View Engine) - more verbose
// After (Ivy) - optimized instructions
function MyComponent_Template(rf, ctx) {
  if (rf & RenderFlags.Create) {
    ɵɵelementStart(0, 'div');
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & RenderFlags.Update) {
    ɵɵadvance(1);
    ɵɵtextInterpolate1('Hello ', ctx.name, '!');
  }
}
```

**Developer experience unchanged, performance improved significantly.**

---

## 🟡 Angular 10 → 13 (2020–2021): Improvements but No Major Changes

**Incremental improvements and optimizations.**

### Notable Additions:

- **`ngZoneEventCoalescing`**: Reduces re-renders by batching events
  ```typescript
  @Component({
    // ...
    providers: [
      { provide: NgZone, useClass: NgZone, useValue: { eventCoalescing: true } }
    ]
  })
  ```

- **`runOutsideAngular()`**: More widely recommended for heavy work
  ```typescript
  this.ngZone.runOutsideAngular(() => {
    // Heavy computation that doesn't need CD
  });
  ```

- **Minor Ivy Tweaks**: Faster checks, smaller bundles
- **Better DevTools**: Enhanced debugging capabilities

### Change Detection Model:

**Still the same** – Zone-based, tree traversal approach continued.

---

## 🟠 Angular 14 → 15 (2022): Standalone Components Era

**New component architecture, same change detection.**

### Key Features:

- **Standalone Components**: No NgModule required
- **New Component API**: Simplified component creation

### Change Detection:

- **No change detection model changes**
- Standalone components still follow `Default` / `OnPush`
- Same Zone.js-based approach

```typescript
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush // Still works the same
})
export class MyComponent {}
```

---

## 🔴 Angular 16 (2023): REVOLUTION — Signals & Zoneless CD

**This is the largest conceptual change since Angular 2.**

### ⭐ New Change Detection Model NOW AVAILABLE

#### 1️⃣ Angular Signals

```typescript
import { signal, computed, effect } from '@angular/core';

// Create signals
const count = signal(0);
const doubleCount = computed(() => count() * 2);

// Effects run when dependencies change
effect(() => {
  console.log('Count changed:', count());
});
```

**Key Features:**
- Dependency-tracking with fine-grained reactivity
- Updates run **only when a dependency changes** — no tree traversal
- Automatic dependency tracking
- No need for manual change detection triggers

#### 2️⃣ Signal-Based Change Detection (Experimental in v16)

```typescript
@Component({
  selector: 'app-counter',
  changeDetection: ChangeDetectionStrategy.Signal // NEW!
})
export class CounterComponent {
  count = signal(0);
  
  increment() {
    this.count.update(v => v + 1); // Auto-updates!
  }
}
```

**Benefits:**
- No need for `markForCheck()`
- No need for `detectChanges()`
- No need for `async` pipe hacks
- Automatic updates when signals change

#### 3️⃣ Zoneless Change Detection (Experimental)

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideExperimentalZonelessChangeDetection() // Removes zone.js!
  ]
});
```

**What This Means:**
- Removes `zone.js` entirely
- Updates triggered **only** by:
  - Signals
  - Manual events
  - Explicit `markForCheck()` / `detectChanges()`
- No automatic detection of async operations

### Coexistence Period:

**Angular 16 is where the old model and the new model begin to coexist:**
- Zone-based CD still default
- Signals available as opt-in
- Can mix both approaches
- Migration path available

---

## 🟣 Angular 17 (2024): Signal-Based CD Becomes Stable

**Signals solidify as the future of Angular.**

### 1️⃣ ChangeDetectionScheduler Replaces Zone-Based Scheduling

```typescript
// Internal API - Angular uses this for signal-driven updates
class ChangeDetectionScheduler {
  schedule(callback: () => void): void {
    // More efficient than Zone.js
  }
}
```

**Key Features:**
- Used internally for signal-driven updates
- Stable zoneless support
- Better performance than Zone.js
- More predictable timing

### 2️⃣ Deferrable Views → Reduce CD Cost

```html
@defer (on viewport) {
  <expensive-component />
} @loading {
  <div>Loading...</div>
}
```

**Benefits:**
- Loads lazily → lowers initial CD work
- Components only checked when loaded
- Reduces unnecessary change detection cycles

### 3️⃣ Event Listeners Automatically Run Outside Angular

```typescript
// Angular 17+ automatically optimizes event handlers
@Component({
  template: `
    <button (click)="handleClick()">Click</button>
  `
})
export class MyComponent {
  handleClick() {
    // Runs outside zone by default
    // Angular re-enters only when needed
  }
}
```

**Impact:**
- Huge reduction in CD noise
- Better performance
- Fewer unnecessary checks

### 4️⃣ Block Template Syntax

```html
@if (isVisible()) {
  <div>Visible content</div>
} @else {
  <div>Hidden content</div>
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}
```

**Benefits:**
- Tightly coupled with signal-driven rendering
- Better update tracking
- More efficient than `*ngIf` / `*ngFor`

---

## 🟢 Angular 18 (2025): Matured Signals + Zoneless Standard

**Signals become the recommended model, zones optional.**

### Expected and Emerging Trends:

#### 1️⃣ Signal-Based Change Detection is Recommended

```typescript
@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.Signal // Recommended default
})
export class ExampleComponent {
  data = signal('initial');
  computed = computed(() => this.data().toUpperCase());
}
```

#### 2️⃣ Zone.js is Optional, Not Required

```typescript
// Zoneless is now standard
bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection() // No zone.js needed!
  ]
});
```

#### 3️⃣ Pull-Based Instead of Push-Based

**Old Model (Push-Based):**
```
Zone.js detects change → Triggers CD → Checks all components
```

**New Model (Pull-Based):**
```
Signal changes → Only dependent components update
```

**Benefits:**
- More efficient
- Predictable updates
- Better performance
- No unnecessary checks

### Template Updates Tied Solely To:

- **Signals** – automatic updates
- **Inputs** – reference changes
- **Direct DOM Events** – user interactions

---

## 🌳 Summary: Angular Change Detection Evolution Timeline

| Version   | Change Detection Model                         | Major Changes                                    |
| --------- | ---------------------------------------------- | ------------------------------------------------ |
| **2**     | Zone-based, tree traversal                     | Introduced `OnPush`, `ChangeDetectorRef`         |
| **4–7**   | Same                                           | Small improvements, `ngZone: 'noop'` option      |
| **8**     | Same                                           | Ivy preview                                      |
| **9**     | Ivy CD engine                                  | Internal rewrite, same API, better performance   |
| **10–15** | Same                                           | Event coalescing, performance optimizations      |
| **16**    | **Signals introduced**, experimental zoneless  | Start of major shift, signals + zones coexist    |
| **17**    | **Signal-based CD stable**, zoneless supported | Scheduler, deferrable views, block templates      |
| **18**    | **Signals-first, zones optional**              | Fully mature pull-based model                    |

---

## 📊 Comparison: Zone-Based vs Signal-Based

### Zone-Based (Angular 2–15)

```typescript
// Automatic detection via Zone.js
setTimeout(() => {
  this.counter++; // Zone.js triggers CD automatically
}, 1000);

// Manual triggers needed for OnPush
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent {
  update() {
    this.data = 'new';
    this.cdr.markForCheck(); // Manual trigger needed
  }
}
```

**Characteristics:**
- ✅ Automatic detection
- ❌ Checks entire tree
- ❌ Can be inefficient
- ❌ Hard to predict when CD runs

### Signal-Based (Angular 16+)

```typescript
// Fine-grained reactivity
const count = signal(0);

setTimeout(() => {
  count.update(v => v + 1); // Only updates what depends on count
}, 1000);

// No manual triggers needed
@Component({
  changeDetection: ChangeDetectionStrategy.Signal
})
export class MyComponent {
  data = signal('initial');
  
  update() {
    this.data.set('new'); // Auto-updates!
  }
}
```

**Characteristics:**
- ✅ Only updates what changed
- ✅ No tree traversal needed
- ✅ More efficient
- ✅ Predictable updates
- ✅ No Zone.js required

---

## 🔄 Migration Guide: Zone-Based → Signal-Based

### Step 1: Convert Properties to Signals

```typescript
// Before
export class MyComponent {
  count = 0;
  name = 'Angular';
}

// After
export class MyComponent {
  count = signal(0);
  name = signal('Angular');
}
```

### Step 2: Update Template

```html
<!-- Before -->
<p>Count: {{ count }}</p>
<p>Name: {{ name }}</p>

<!-- After -->
<p>Count: {{ count() }}</p>
<p>Name: {{ name() }}</p>
```

### Step 3: Update Component Strategy

```typescript
// Before
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// After
@Component({
  changeDetection: ChangeDetectionStrategy.Signal
})
```

### Step 4: Remove Manual Triggers

```typescript
// Before
update() {
  this.data = 'new';
  this.cdr.markForCheck(); // Remove this!
}

// After
update() {
  this.data.set('new'); // Auto-updates!
}
```

### Step 5: Convert Observables to Signals

```typescript
// Before
data$ = new BehaviorSubject('initial');

// After
data = signal('initial');

// Or use toSignal() for existing observables
data = toSignal(this.data$);
```

---

## 🎯 Key Takeaways

### For Angular 2–15 Developers:

1. **Zone.js is your friend** – automatic change detection
2. **OnPush is your optimization** – reduces checks
3. **Manual triggers** needed for OnPush components
4. **Tree traversal** happens on every check

### For Angular 16+ Developers:

1. **Signals are the future** – fine-grained reactivity
2. **Zoneless is possible** – better performance
3. **No manual triggers** needed with signals
4. **Pull-based updates** – only what changed updates

### Best Practices:

- **Angular 2–15**: Use OnPush + manual triggers when needed
- **Angular 16+**: Migrate to signals gradually
- **Angular 17+**: Use signal-based CD for new components
- **Angular 18+**: Consider zoneless for new projects

---

## 📚 Additional Resources

- [Angular Signals Documentation](https://angular.dev/guide/signals)
- [Zoneless Change Detection Guide](https://angular.dev/guide/change-detection/zoneless)
- [Migration Guide: Zone to Signals](https://angular.dev/guide/signals/migration)

---

**Version:** Based on Angular 2–18 evolution  
**Last Updated:** 2025

