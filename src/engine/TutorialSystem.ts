/**
 * TutorialSystem.ts
 * Tutorial System (#36)
 * Interactive step-by-step tutorials
 * Contextual hints dan tooltips
 */

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  highlightElement?: string; // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    type: 'click' | 'keypress' | 'custom';
    target?: string;
    key?: string;
    validator?: () => boolean;
  };
  onEnter?: () => void;
  onExit?: () => void;
  skippable?: boolean;
}

export interface Tutorial {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
  autoStart?: boolean;
  showOnce?: boolean;
}

export class TutorialSystem {
  private tutorials: Map<string, Tutorial> = new Map();
  private currentTutorial: Tutorial | null = null;
  private currentStepIndex: number = 0;
  private completedTutorials: Set<string> = new Set();
  private onStepChange?: (step: TutorialStep, index: number, total: number) => void;
  private onTutorialComplete?: (tutorialId: string) => void;
  private onTutorialSkip?: (tutorialId: string) => void;

  constructor() {
    this.loadCompletedTutorials();
  }

  public registerTutorial(tutorial: Tutorial): void {
    this.tutorials.set(tutorial.id, tutorial);
  }

  public startTutorial(tutorialId: string, force: boolean = false): boolean {
    const tutorial = this.tutorials.get(tutorialId);
    if (!tutorial) {
      console.error(`Tutorial ${tutorialId} not found`);
      return false;
    }

    // Check if already completed
    if (!force && tutorial.showOnce && this.completedTutorials.has(tutorialId)) {
      console.log(`Tutorial ${tutorialId} already completed`);
      return false;
    }

    this.currentTutorial = tutorial;
    this.currentStepIndex = 0;
    this.showStep(0);
    return true;
  }

  public nextStep(): boolean {
    if (!this.currentTutorial) return false;

    const currentStep = this.currentTutorial.steps[this.currentStepIndex];
    if (currentStep?.onExit) {
      currentStep.onExit();
    }

    this.currentStepIndex++;

    if (this.currentStepIndex >= this.currentTutorial.steps.length) {
      this.completeTutorial();
      return false;
    }

    this.showStep(this.currentStepIndex);
    return true;
  }

  public previousStep(): boolean {
    if (!this.currentTutorial || this.currentStepIndex === 0) return false;

    const currentStep = this.currentTutorial.steps[this.currentStepIndex];
    if (currentStep?.onExit) {
      currentStep.onExit();
    }

    this.currentStepIndex--;
    this.showStep(this.currentStepIndex);
    return true;
  }

  public skipTutorial(): void {
    if (!this.currentTutorial) return;

    const currentStep = this.currentTutorial.steps[this.currentStepIndex];
    if (currentStep?.onExit) {
      currentStep.onExit();
    }

    const tutorialId = this.currentTutorial.id;
    this.currentTutorial = null;
    this.currentStepIndex = 0;

    if (this.onTutorialSkip) {
      this.onTutorialSkip(tutorialId);
    }
  }

  private showStep(index: number): void {
    if (!this.currentTutorial) return;

    const step = this.currentTutorial.steps[index];
    if (!step) return;

    if (step.onEnter) {
      step.onEnter();
    }

    // Setup action listener if needed
    if (step.action) {
      this.setupActionListener(step);
    }

    if (this.onStepChange) {
      this.onStepChange(step, index, this.currentTutorial.steps.length);
    }
  }

  private setupActionListener(step: TutorialStep): void {
    if (!step.action) return;

    const handleAction = () => {
      if (step.action?.validator && !step.action.validator()) {
        return; // Validation failed
      }
      this.nextStep();
      cleanup();
    };

    const cleanup = () => {
      if (step.action?.type === 'click' && step.action.target) {
        const element = document.querySelector(step.action.target);
        element?.removeEventListener('click', handleAction);
      } else if (step.action?.type === 'keypress' && step.action.key) {
        document.removeEventListener('keydown', keyHandler);
      }
    };

    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === step.action?.key) {
        handleAction();
      }
    };

    if (step.action.type === 'click' && step.action.target) {
      const element = document.querySelector(step.action.target);
      element?.addEventListener('click', handleAction);
    } else if (step.action.type === 'keypress' && step.action.key) {
      document.addEventListener('keydown', keyHandler);
    }
  }

  private completeTutorial(): void {
    if (!this.currentTutorial) return;

    const tutorialId = this.currentTutorial.id;
    this.completedTutorials.add(tutorialId);
    this.saveCompletedTutorials();

    this.currentTutorial = null;
    this.currentStepIndex = 0;

    if (this.onTutorialComplete) {
      this.onTutorialComplete(tutorialId);
    }
  }

  public getCurrentStep(): TutorialStep | null {
    if (!this.currentTutorial) return null;
    return this.currentTutorial.steps[this.currentStepIndex] || null;
  }

  public getCurrentTutorial(): Tutorial | null {
    return this.currentTutorial;
  }

  public getProgress(): { current: number; total: number } | null {
    if (!this.currentTutorial) return null;
    return {
      current: this.currentStepIndex + 1,
      total: this.currentTutorial.steps.length
    };
  }

  public isTutorialActive(): boolean {
    return this.currentTutorial !== null;
  }

  public isTutorialCompleted(tutorialId: string): boolean {
    return this.completedTutorials.has(tutorialId);
  }

  public resetTutorial(tutorialId: string): void {
    this.completedTutorials.delete(tutorialId);
    this.saveCompletedTutorials();
  }

  public resetAllTutorials(): void {
    this.completedTutorials.clear();
    this.saveCompletedTutorials();
  }

  private loadCompletedTutorials(): void {
    try {
      const saved = localStorage.getItem('completedTutorials');
      if (saved) {
        this.completedTutorials = new Set(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load completed tutorials:', error);
    }
  }

  private saveCompletedTutorials(): void {
    try {
      localStorage.setItem(
        'completedTutorials',
        JSON.stringify(Array.from(this.completedTutorials))
      );
    } catch (error) {
      console.error('Failed to save completed tutorials:', error);
    }
  }

  public setOnStepChange(callback: (step: TutorialStep, index: number, total: number) => void): void {
    this.onStepChange = callback;
  }

  public setOnTutorialComplete(callback: (tutorialId: string) => void): void {
    this.onTutorialComplete = callback;
  }

  public setOnTutorialSkip(callback: (tutorialId: string) => void): void {
    this.onTutorialSkip = callback;
  }
}
