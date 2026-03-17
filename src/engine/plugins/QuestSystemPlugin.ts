import { Plugin } from '../PluginSystem';
import { Engine } from '../Core';
import { eventBus } from '../EventBus';

export interface Quest {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'active' | 'completed';
    objectives: string[];
    rewards: Record<string, any>;
}

export class QuestSystemPlugin implements Plugin {
    public name = 'QuestSystem';
    public version = '1.0.0';
    
    private quests: Map<string, Quest> = new Map();
    private activeQuests: Set<string> = new Set();

    public initialize(engine: Engine): void {
        console.log('[QuestSystem] Plugin initialized.');
        
        // Listen for objective triggers
        eventBus.on('trigger:enter', (data) => {
            this.onObjectiveTrigger(data.trigger.name);
        });
    }

    public addQuest(quest: Quest) {
        this.quests.set(quest.id, quest);
        eventBus.emit('quest:added', quest);
    }

    public startQuest(id: string) {
        const quest = this.quests.get(id);
        if (quest && quest.status === 'pending') {
            quest.status = 'active';
            this.activeQuests.add(id);
            eventBus.emit('quest:started', quest);
        }
    }

    private onObjectiveTrigger(triggerName: string) {
        this.activeQuests.forEach(id => {
            const quest = this.quests.get(id);
            if (quest && quest.objectives.includes(triggerName)) {
                this.completeQuest(id);
            }
        });
    }

    public completeQuest(id: string) {
        const quest = this.quests.get(id);
        if (quest && quest.status === 'active') {
            quest.status = 'completed';
            this.activeQuests.delete(id);
            eventBus.emit('quest:completed', quest);
            
            // Give rewards via PlayerStats if available
            // rewards logic...
        }
    }

    public dispose(): void {
        this.quests.clear();
        this.activeQuests.clear();
    }
}
