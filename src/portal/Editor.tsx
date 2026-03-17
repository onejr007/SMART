import React, { useEffect, useRef, useState } from 'react';
import { Engine } from '../engine/Core';
import { Entity } from '../engine/Entity';
import * as THREE from 'three';
import { OrbitControls, TransformControls } from 'three-stdlib';
import { persistence } from '../engine/PersistenceManager';

interface EditorProps {
    onExit: () => void;
    currentUser: string;
}

const Editor: React.FC<EditorProps> = ({ onExit, currentUser }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Engine | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const transformRef = useRef<TransformControls | null>(null);
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [playerSchema, setPlayerSchema] = useState<Record<string, any>>({
        level: 1,
        coins: 0,
        experience: 0,
        health: 100
    });

    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new Engine(canvasRef.current);
        engineRef.current = engine;

        // Editor Camera Controls
        const orbit = new OrbitControls(engine.getCamera(), canvasRef.current);
        orbit.enableDamping = true;
        orbit.dampingFactor = 0.05;
        controlsRef.current = orbit;

        // Transform Gizmos
        const transform = new TransformControls(engine.getCamera(), canvasRef.current);
        (transform as any).addEventListener('dragging-changed', (event: any) => {
            orbit.enabled = !event.value;
        });
        
        // Sync Physics body when dragging finishes
        (transform as any).addEventListener('change', () => {
            const transformObj = (transform as any).object;
            if (transformObj && transformObj.userData?.entity) {
                const entity = transformObj.userData.entity as Entity;
                // Update Physics body position based on Mesh position
                entity.body.position.copy(entity.mesh.position as any);
                entity.body.quaternion.copy(entity.mesh.quaternion as any);
            }
        });
        
        engine.getScene().add(transform);
        transformRef.current = transform;

        // Raycaster for selecting objects
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseClick = (event: MouseEvent) => {
            if (!canvasRef.current) return;
            
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, engine.getCamera());
            
            // Only intersect objects that belong to entities (skip floor for now)
            const sceneMeshes = Array.from(engine.getScene().children).filter(
                (c: THREE.Object3D) => c.userData?.entity && c.userData.entity.name !== 'EditorFloor'
            );
            
            // We need to raycast against the children of the Object3D containers
            const interactableMeshes: THREE.Object3D[] = [];
            sceneMeshes.forEach((container: THREE.Object3D) => {
                container.children.forEach((mesh: THREE.Object3D) => interactableMeshes.push(mesh));
            });

            const intersects = raycaster.intersectObjects(interactableMeshes, true);

            if (intersects.length > 0) {
                // Find the parent Object3D container that holds the userData
                let object = intersects[0].object;
                while (object.parent && !object.userData?.entity) {
                    object = object.parent;
                }
                
                if (object.userData?.entity) {
                    transform.attach(object);
                    setSelectedEntity(object.userData.entity);
                }
            } else {
                // Check if clicking on empty space (not dragging the gizmo itself)
                const gizmoHelper = (transform as any).getHelper ? (transform as any).getHelper() : null;
                if (gizmoHelper) {
                    const gizmoIntersects = raycaster.intersectObjects([gizmoHelper], true);
                    if (gizmoIntersects.length === 0) {
                        transform.detach();
                        setSelectedEntity(null);
                    }
                } else {
                    transform.detach();
                    setSelectedEntity(null);
                }
            }
        };

        window.addEventListener('dblclick', onMouseClick);

        // Editor Scene Setup
        const floor = new Entity({
            position: new THREE.Vector3(0, -1, 0),
            size: new THREE.Vector3(50, 1, 50),
            mass: 0,
            color: 0x333333,
            name: 'EditorFloor'
        });
        floor.mesh.userData = { entity: floor };
        engine.addEntity(floor);

        // Update loop for controls
        engine.onUpdate(() => {
            orbit.update();
        });

        engine.start();

        return () => {
            window.removeEventListener('dblclick', onMouseClick);
            engine.stop();
            orbit.dispose();
            transform.dispose();
        };
    }, []);

    const addCube = () => {
        if (!engineRef.current) return;
        
        const cube = new Entity({
            position: new THREE.Vector3(0, 5, 0),
            size: new THREE.Vector3(1, 1, 1),
            mass: 0, // Static in editor mode so it doesn't fall while editing
            color: Math.random() * 0xffffff,
            name: `Cube_${Date.now()}`
        });
        
        // Link mesh back to entity for raycasting
        cube.mesh.userData = { entity: cube };
        
        engineRef.current.addEntity(cube);
        setEntities(prev => [...prev, cube]);
        
        if (transformRef.current) {
            transformRef.current.attach(cube.mesh);
            setSelectedEntity(cube);
        }
    };

    const setTransformMode = (mode: 'translate' | 'rotate' | 'scale') => {
        if (transformRef.current) {
            transformRef.current.setMode(mode);
        }
    };

    const saveScene = async () => {
        if (!engineRef.current) return;
        
        const title = prompt("Enter Game Title:", `Game by ${currentUser}`);
        if (!title) return;

        try {
            const sceneManager = engineRef.current.getSceneManager();
            const gameId = await persistence.saveGame(currentUser, title, sceneManager, playerSchema);
            
            alert(`Game "${title}" saved successfully to Cloud Storage! Other players can now find and play it in the Portal.`);
        } catch (error) {
            console.error("Error saving game:", error);
            alert('Failed to save game to cloud storage. Check console for details.');
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex' }}>
            {/* Left Sidebar - Hierarchy */}
            <div style={{ width: '250px', background: '#222', color: 'white', padding: '15px', overflowY: 'auto', borderRight: '1px solid #444' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '10px' }}>Scene Hierarchy</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '20px' }}>
                    {entities.map((ent, idx) => (
                        <li 
                            key={idx}
                            style={{ 
                                padding: '8px', 
                                cursor: 'pointer', 
                                background: selectedEntity === ent ? '#0072ff' : 'transparent',
                                borderRadius: '4px',
                                marginBottom: '4px'
                            }}
                            onClick={() => {
                                if (transformRef.current) {
                                    transformRef.current.attach(ent.mesh);
                                    setSelectedEntity(ent);
                                }
                            }}
                        >
                            {ent.name}
                        </li>
                    ))}
                </ul>

                <h3 style={{ marginTop: '20px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>Player Variables</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(playerSchema).map(([key, value]) => (
                        <div key={key} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#aaa', width: '70px' }}>{key}</span>
                            <input 
                                type="number" 
                                value={value} 
                                onChange={(e) => setPlayerSchema({...playerSchema, [key]: Number(e.target.value)})}
                                style={{ background: '#333', border: '1px solid #555', color: 'white', width: '60px', padding: '2px' }}
                            />
                        </div>
                    ))}
                    <button 
                        onClick={() => {
                            const key = prompt("Variable Name:");
                            if (key) setPlayerSchema({...playerSchema, [key]: 0});
                        }}
                        style={{ marginTop: '10px', background: '#444', border: 'none', color: 'white', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        + Add Custom Variable
                    </button>
                </div>
            </div>

            {/* Main Viewport */}
            <div style={{ flex: 1, position: 'relative' }}>
                <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
                
                {/* Top Toolbar */}
                <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '8px', color: 'white' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <button onClick={() => setTransformMode('translate')} style={{ background: '#444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Move</button>
                        <button onClick={() => setTransformMode('rotate')} style={{ background: '#444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Rotate</button>
                        <button onClick={() => setTransformMode('scale')} style={{ background: '#444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Scale</button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={addCube} style={{ background: '#0072ff', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>+ Add Cube</button>
                        <button onClick={saveScene} style={{ background: '#28a745', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Save Game</button>
                        <button onClick={onExit} style={{ background: '#ff4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Exit Editor</button>
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '10px', color: '#aaa' }}>
                        Double-click object to select
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Inspector */}
            <div style={{ width: '250px', background: '#222', color: 'white', padding: '15px', overflowY: 'auto', borderLeft: '1px solid #444' }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid #444', paddingBottom: '10px' }}>Inspector</h3>
                {selectedEntity ? (
                    <div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>Name</label>
                            <input 
                                type="text" 
                                value={selectedEntity.name} 
                                readOnly
                                style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }} 
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>Position</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px' }}>
                                <input type="number" value={selectedEntity.mesh.position.x.toFixed(2)} readOnly style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: '1px solid #555' }} />
                                <input type="number" value={selectedEntity.mesh.position.y.toFixed(2)} readOnly style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: '1px solid #555' }} />
                                <input type="number" value={selectedEntity.mesh.position.z.toFixed(2)} readOnly style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: '1px solid #555' }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>Physics Mass</label>
                            <input 
                                type="number" 
                                value={selectedEntity.body.mass} 
                                readOnly
                                style={{ width: '100%', padding: '5px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }} 
                            />
                        </div>
                    </div>
                ) : (
                    <p style={{ color: '#aaa', fontSize: '14px' }}>No object selected</p>
                )}
            </div>
        </div>
    );
};

export default Editor;
