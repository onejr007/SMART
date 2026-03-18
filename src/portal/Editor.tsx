import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditorFacade } from './EditorFacade';
import { Entity } from '../engine/Entity';
import { useOverlay } from './ui/OverlayProvider';
import './EditorStudio.css';

interface EditorProps {
    onExit: () => void;
    currentUser: string;
}

const Editor: React.FC<EditorProps> = ({ onExit, currentUser }) => {
    const overlay = useOverlay();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [editorFacade, setEditorFacade] = useState<EditorFacade | null>(null);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
    const [enableDayNight, setEnableDayNight] = useState<boolean>(false);
    const [enableTerrain, setEnableTerrain] = useState<boolean>(false);
    const [enableQuests, setEnableQuests] = useState<boolean>(false);
    const [playerSchema, setPlayerSchema] = useState<Record<string, number>>({ health: 100, coins: 0 });
    const [tool, setTool] = useState<'translate' | 'rotate' | 'scale'>('translate');

    useEffect(() => {
        if (!canvasRef.current) return;

        const facade = new EditorFacade(canvasRef.current, setSelectedEntity);
        setEditorFacade(facade);
        facade.start();
        setEntities(facade.getEntities());

        return () => {
            facade.stop();
        };
    }, []);

    const addCube = () => {
        if (!editorFacade) return;
        const newEntity = editorFacade.addCube();
        setEntities(prev => [...prev, newEntity]);
        setSelectedEntity(newEntity);
    };

    const addNPC = () => {
        if (!editorFacade) return;
        const newEntity = editorFacade.addNPC();
        setEntities(prev => [...prev, newEntity]);
    };

    const addTriggerZone = () => {
        if (!editorFacade) return;
        const newEntity = editorFacade.addTriggerZone();
        setEntities(prev => [...prev, newEntity]);
    };

    const toggleDayNight = () => {
        if (!editorFacade) return;
        const newEnable = !enableDayNight;
        editorFacade.toggleDayNight(newEnable);
        setEnableDayNight(newEnable);
    };

    const toggleTerrain = () => {
        if (!editorFacade) return;
        const newEnable = !enableTerrain;
        editorFacade.toggleTerrain(newEnable);
        setEnableTerrain(newEnable);
    };

    const toggleQuests = () => {
        if (!editorFacade) return;
        const newEnable = !enableQuests;
        editorFacade.toggleQuests(newEnable);
        setEnableQuests(newEnable);
    };

    const setTransformMode = (mode: 'translate' | 'rotate' | 'scale') => {
        if (editorFacade) {
            editorFacade.setTransformMode(mode);
            setTool(mode);
        }
    };

    const saveScene = async () => {
        if (!editorFacade) return;

        const title = await overlay.prompt({
            title: 'Save Game',
            label: 'Game title',
            placeholder: `Game by ${currentUser}`,
            initialValue: `Game by ${currentUser}`,
            primaryText: 'Save',
            secondaryText: 'Cancel'
        });
        if (!title) return;

        try {
            await editorFacade.saveScene(currentUser, title, entities, playerSchema);
            overlay.toast(`Game "${title}" saved`, { variant: 'success' });
        } catch (error) {
            console.error("Error saving game:", error);
            overlay.toast('Failed to save game', { variant: 'error' });
        }
    };

    const addCustomVariable = async () => {
        const key = await overlay.prompt({
            title: 'Add Variable',
            label: 'Variable name',
            placeholder: 'e.g. stamina',
            primaryText: 'Add',
            secondaryText: 'Cancel'
        });
        if (!key) return;
        setPlayerSchema((prev) => ({ ...prev, [key]: prev[key] ?? 0 }));
        overlay.toast(`Variable "${key}" added`, { variant: 'success' });
    };

    const visibleEntities = useMemo(
        () => entities.filter((ent) => ent.name !== 'EditorFloor'),
        [entities]
    );

    return (
        <div className="studio-root">
            <div className="studio-topbar">
                <div className="studio-brand">
                    <div className="studio-brand-badge">S</div>
                    <div>SMART Studio</div>
                </div>
                <div className="studio-top-actions">
                    <button className={`studio-btn ${tool === 'translate' ? 'studio-btn-primary' : ''}`} onClick={() => setTransformMode('translate')}>Move</button>
                    <button className={`studio-btn ${tool === 'rotate' ? 'studio-btn-primary' : ''}`} onClick={() => setTransformMode('rotate')}>Rotate</button>
                    <button className={`studio-btn ${tool === 'scale' ? 'studio-btn-primary' : ''}`} onClick={() => setTransformMode('scale')}>Scale</button>
                    <button className="studio-btn" onClick={addCube}>+ Cube</button>
                    <button className="studio-btn" onClick={addNPC}>+ NPC</button>
                    <button className="studio-btn" onClick={addTriggerZone}>+ Trigger</button>
                    <button className="studio-btn" onClick={toggleDayNight}>{enableDayNight ? '☀️ Day/Night' : '🌙 Day/Night'}</button>
                    <button className="studio-btn" onClick={toggleTerrain}>{enableTerrain ? '🏔️ Terrain' : '🏔️ Terrain'}</button>
                    <button className="studio-btn" onClick={toggleQuests}>{enableQuests ? '📜 Quests' : '📜 Quests'}</button>
                    <button className="studio-btn studio-btn-primary" onClick={saveScene}>💾 Save</button>
                    <button className="studio-btn studio-btn-danger" onClick={onExit}>← Back</button>
                </div>
            </div>

            <div className="studio-main">
                <div className="studio-panel">
                    <div className="panel-scroll">
                        <div className="panel-title">Explorer</div>
                        {visibleEntities.map((ent: Entity, idx: number) => (
                            <div
                                key={idx}
                                className={`entity-item ${selectedEntity === ent ? 'entity-item-active' : ''}`}
                                onClick={() => {
                                    if (editorFacade) editorFacade.attachToEntity(ent);
                                    setSelectedEntity(ent);
                                }}
                            >
                                <div className="entity-name">{ent.name}</div>
                                <div className="entity-tag">Entity</div>
                            </div>
                        ))}

                        <div className="panel-subtitle">Player Variables</div>
                        {Object.entries(playerSchema).map(([key, value]: [string, number]) => (
                            <div key={key} className="schema-row">
                                <div className="schema-key">{key}</div>
                                <input
                                    className="schema-input"
                                    type="number"
                                    value={value}
                                    onChange={(e) => setPlayerSchema({ ...playerSchema, [key]: Number(e.target.value) })}
                                />
                            </div>
                        ))}
                        <button className="studio-btn" onClick={addCustomVariable}>+ Add Variable</button>
                    </div>
                </div>

                <div className="viewport">
                    <canvas ref={canvasRef} />
                    <div className="viewport-hud">Double-click object to select • Drag gizmo to transform</div>
                </div>

                <div className="studio-panel studio-panel-right">
                    <div className="panel-scroll">
                        <div className="panel-title">Properties</div>
                        {selectedEntity ? (
                            <div className="props-grid">
                                <div className="prop-block">
                                    <div className="prop-label">Name</div>
                                    <div className="prop-value">{selectedEntity.name}</div>
                                </div>
                                <div className="prop-block">
                                    <div className="prop-label">Position</div>
                                    <div className="prop-row3">
                                        <div className="prop-value">{selectedEntity.mesh.position.x.toFixed(2)}</div>
                                        <div className="prop-value">{selectedEntity.mesh.position.y.toFixed(2)}</div>
                                        <div className="prop-value">{selectedEntity.mesh.position.z.toFixed(2)}</div>
                                    </div>
                                </div>
                                <div className="prop-block">
                                    <div className="prop-label">Physics Mass</div>
                                    <div className="prop-value">{selectedEntity.body.mass}</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800 }}>No selection</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="studio-statusbar">
                <div className="status-pill">Entities: {visibleEntities.length}</div>
                <div className="status-pill">User: {currentUser}</div>
            </div>
        </div>
    );
};

export default Editor;
