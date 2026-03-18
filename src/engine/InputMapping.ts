// 18. Input mapping dengan rebind, gamepad, touch
export type InputAction = string;
export type InputBinding = {
  type: 'keyboard' | 'mouse' | 'gamepad' | 'touch';
  code: string | number;
};

export class InputMapping {
  private bindings = new Map<InputAction, InputBinding[]>();
  private actionStates = new Map<InputAction, boolean>();
  private gamepadIndex = 0;

  constructor() {
    this.initListeners();
  }

  private initListeners(): void {
    window.addEventListener('keydown', (e) => this.handleKeyboard(e.code, true));
    window.addEventListener('keyup', (e) => this.handleKeyboard(e.code, false));
    window.addEventListener('mousedown', (e) => this.handleMouse(e.button, true));
    window.addEventListener('mouseup', (e) => this.handleMouse(e.button, false));
    window.addEventListener('touchstart', () => this.handleTouch('touch', true));
    window.addEventListener('touchend', () => this.handleTouch('touch', false));
  }

  bind(action: InputAction, binding: InputBinding): void {
    if (!this.bindings.has(action)) {
      this.bindings.set(action, []);
    }
    this.bindings.get(action)!.push(binding);
  }

  unbind(action: InputAction, binding?: InputBinding): void {
    if (!binding) {
      this.bindings.delete(action);
    } else {
      const bindings = this.bindings.get(action);
      if (bindings) {
        const index = bindings.findIndex(b => 
          b.type === binding.type && b.code === binding.code
        );
        if (index !== -1) bindings.splice(index, 1);
      }
    }
  }

  isActionActive(action: InputAction): boolean {
    return this.actionStates.get(action) || false;
  }

  private handleKeyboard(code: string, pressed: boolean): void {
    for (const [action, bindings] of this.bindings) {
      if (bindings.some(b => b.type === 'keyboard' && b.code === code)) {
        this.actionStates.set(action, pressed);
      }
    }
  }

  private handleMouse(button: number, pressed: boolean): void {
    for (const [action, bindings] of this.bindings) {
      if (bindings.some(b => b.type === 'mouse' && b.code === button)) {
        this.actionStates.set(action, pressed);
      }
    }
  }

  private handleTouch(code: string, pressed: boolean): void {
    for (const [action, bindings] of this.bindings) {
      if (bindings.some(b => b.type === 'touch' && b.code === code)) {
        this.actionStates.set(action, pressed);
      }
    }
  }

  updateGamepad(): void {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[this.gamepadIndex];
    
    if (gamepad) {
      for (const [action, bindings] of this.bindings) {
        for (const binding of bindings) {
          if (binding.type === 'gamepad' && typeof binding.code === 'number') {
            const pressed = gamepad.buttons[binding.code]?.pressed || false;
            this.actionStates.set(action, pressed);
          }
        }
      }
    }
  }

  setMapping(action: string, keyCode: string): void {
    this.bind(action, { type: 'keyboard', code: keyCode });
  }

  getMapping(action: string): string | null {
    const bindings = this.bindings.get(action);
    if (bindings && bindings.length > 0) {
      return bindings[0].code as string;
    }
    return null;
  }
}
