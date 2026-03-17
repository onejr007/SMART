import { Component } from '../Component';

export interface State {
    name: string;
    onEnter?: () => void;
    onUpdate?: (delta: number) => void;
    onExit?: () => void;
}

export class StateMachine extends Component {
    private states: Map<string, State> = new Map();
    private currentState: State | null = null;

    constructor() {
        super('StateMachine');
    }

    public addState(state: State) {
        this.states.set(state.name, state);
    }

    public transitionTo(name: string) {
        if (this.currentState?.name === name) return;

        const nextState = this.states.get(name);
        if (!nextState) {
            console.error(`State ${name} not found in StateMachine`);
            return;
        }

        if (this.currentState?.onExit) {
            this.currentState.onExit();
        }

        this.currentState = nextState;

        if (this.currentState.onEnter) {
            this.currentState.onEnter();
        }
    }

    public update(delta: number): void {
        if (this.currentState?.onUpdate) {
            this.currentState.onUpdate(delta);
        }
    }

    public getCurrentStateName(): string | undefined {
        return this.currentState?.name;
    }
}
