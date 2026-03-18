/**
 * DialogueSystem.ts
 * Dialogue System (#32)
 * Branching dialogue dengan choices
 * Quest integration dan condition checking
 */

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string;
  condition?: (context: any) => boolean;
  action?: (context: any) => void;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices: DialogueChoice[];
  onEnter?: (context: any) => void;
  onExit?: (context: any) => void;
}

export interface DialogueTree {
  id: string;
  name: string;
  startNodeId: string;
  nodes: Map<string, DialogueNode>;
}

export class DialogueManager {
  private dialogues: Map<string, DialogueTree> = new Map();
  private currentDialogue: DialogueTree | null = null;
  private currentNode: DialogueNode | null = null;
  private context: any = {};
  private onDialogueUpdate?: (node: DialogueNode) => void;
  private onDialogueEnd?: () => void;

  public registerDialogue(dialogue: DialogueTree): void {
    this.dialogues.set(dialogue.id, dialogue);
  }

  public startDialogue(dialogueId: string, context: any = {}): boolean {
    const dialogue = this.dialogues.get(dialogueId);
    if (!dialogue) {
      console.error(`Dialogue ${dialogueId} not found`);
      return false;
    }

    this.currentDialogue = dialogue;
    this.context = context;
    
    const startNode = dialogue.nodes.get(dialogue.startNodeId);
    if (!startNode) {
      console.error(`Start node ${dialogue.startNodeId} not found`);
      return false;
    }

    this.setCurrentNode(startNode);
    return true;
  }

  public selectChoice(choiceId: string): boolean {
    if (!this.currentNode) return false;

    const choice = this.currentNode.choices.find(c => c.id === choiceId);
    if (!choice) {
      console.error(`Choice ${choiceId} not found`);
      return false;
    }

    // Check condition
    if (choice.condition && !choice.condition(this.context)) {
      console.warn(`Choice ${choiceId} condition not met`);
      return false;
    }

    // Execute action
    if (choice.action) {
      choice.action(this.context);
    }

    // Move to next node
    if (choice.nextNodeId === 'END') {
      this.endDialogue();
      return true;
    }

    const nextNode = this.currentDialogue?.nodes.get(choice.nextNodeId);
    if (!nextNode) {
      console.error(`Next node ${choice.nextNodeId} not found`);
      this.endDialogue();
      return false;
    }

    this.setCurrentNode(nextNode);
    return true;
  }

  private setCurrentNode(node: DialogueNode): void {
    if (this.currentNode?.onExit) {
      this.currentNode.onExit(this.context);
    }

    this.currentNode = node;

    if (node.onEnter) {
      node.onEnter(this.context);
    }

    if (this.onDialogueUpdate) {
      this.onDialogueUpdate(node);
    }
  }

  private endDialogue(): void {
    if (this.currentNode?.onExit) {
      this.currentNode.onExit(this.context);
    }

    this.currentDialogue = null;
    this.currentNode = null;
    this.context = {};

    if (this.onDialogueEnd) {
      this.onDialogueEnd();
    }
  }

  public getCurrentNode(): DialogueNode | null {
    return this.currentNode;
  }

  public getAvailableChoices(): DialogueChoice[] {
    if (!this.currentNode) return [];

    return this.currentNode.choices.filter(choice => {
      return !choice.condition || choice.condition(this.context);
    });
  }

  public isDialogueActive(): boolean {
    return this.currentDialogue !== null;
  }

  public setOnDialogueUpdate(callback: (node: DialogueNode) => void): void {
    this.onDialogueUpdate = callback;
  }

  public setOnDialogueEnd(callback: () => void): void {
    this.onDialogueEnd = callback;
  }
}

// Dialogue Builder Helper
export class DialogueBuilder {
  private tree: DialogueTree;

  constructor(id: string, name: string) {
    this.tree = {
      id,
      name,
      startNodeId: '',
      nodes: new Map()
    };
  }

  public addNode(node: DialogueNode, isStart: boolean = false): this {
    this.tree.nodes.set(node.id, node);
    if (isStart) {
      this.tree.startNodeId = node.id;
    }
    return this;
  }

  public build(): DialogueTree {
    if (!this.tree.startNodeId) {
      throw new Error('Dialogue tree must have a start node');
    }
    return this.tree;
  }

  public static createNode(
    id: string,
    speaker: string,
    text: string,
    choices: DialogueChoice[] = []
  ): DialogueNode {
    return { id, speaker, text, choices };
  }

  public static createChoice(
    id: string,
    text: string,
    nextNodeId: string,
    condition?: (context: any) => boolean,
    action?: (context: any) => void
  ): DialogueChoice {
    return { id, text, nextNodeId, condition, action };
  }
}
