export class InputManager {
    private keys: Map<string, boolean>;
    private mouse: { x: number, y: number, isDown: boolean };
    private onMouseDown?: (event: MouseEvent) => void;
    private onMouseMove?: (event: MouseEvent) => void;
    private onMouseUp?: (event: MouseEvent) => void;
    private isLocked: boolean = false;

    constructor() {
        this.keys = new Map();
        this.mouse = { x: 0, y: 0, isDown: false };
        this.setupListeners();
    }

    private setupListeners() {
        window.addEventListener('keydown', (e) => this.keys.set(e.code, true));
        window.addEventListener('keyup', (e) => this.keys.set(e.code, false));
        
        window.addEventListener('mousedown', (e) => {
            this.mouse.isDown = true;
            if (this.onMouseDown) this.onMouseDown(e);
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            if (this.onMouseMove) this.onMouseMove(e);
        });

        window.addEventListener('mouseup', (e) => {
            this.mouse.isDown = false;
            if (this.onMouseUp) this.onMouseUp(e);
        });
    }

    public isKeyDown(code: string): boolean {
        return this.keys.get(code) || false;
    }

    public getMousePosition() {
        return { ...this.mouse };
    }

    public lockPointer(element: HTMLElement) {
        element.requestPointerLock();
        this.isLocked = true;
    }

    public unlockPointer() {
        document.exitPointerLock();
        this.isLocked = false;
    }

    public isPointerLocked(): boolean {
        return document.pointerLockElement !== null;
    }
}
