import React, { useEffect, useRef } from 'react';
import { Engine } from '../engine/Core';
import { Entity } from '../engine/Entity';
import { FPSController } from '../engine/Controller';
import { InputManager } from '../engine/Input';
import { PlayerStats } from '../engine/components/PlayerStats';
import { useAuth } from './AuthContext';
import * as THREE from 'three';
import { Game } from './App';

interface GameViewProps {
    game: Game;
    onExit: () => void;
}

const GameView: React.FC<GameViewProps> = ({ game, onExit }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Engine | null>(null);
    const inputRef = useRef<InputManager | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (!canvasRef.current) return;

        // Initialize Engine
        const engine = new Engine(canvasRef.current);
        engineRef.current = engine;
        
        // Initialize Input
        const input = new InputManager();
        inputRef.current = input;

        // Initialize Player Controller
        const controller = new FPSController(engine.getCamera(), canvasRef.current);
        const playerBody = controller.getBody();
        engine.getPhysicsWorld().addBody(playerBody);
        
        const playerObject = controller.getObject();
        engine.getScene().add(playerObject);

        // Add Player Stats Component
        if (user && game.id) {
            // Find or create an entity for the player to attach components
            const playerEntity = new Entity({
                position: engine.getCamera().position.clone(),
                name: 'Player'
            });
            // Link controller body and mesh to the entity
            playerEntity.body = playerBody;
            playerEntity.mesh = playerObject;
            
            const stats = new PlayerStats(user.displayName, game.id);
            playerEntity.addComponent(stats);
            engine.addEntity(playerEntity);
        }

        // Game Loop Hook
        engine.onUpdate((delta) => {
            controller.update(delta, input);
        });

        // Load Game Scene based on ID or game data
        loadGameScene(engine, game);

        // Start Engine
        engine.start();

        // Cleanup
        return () => {
            engine.stop();
            // Dispose logic would go here
        };
    }, [game]);

    const loadGameScene = (engine: Engine, gameData: Game) => {
        if (gameData.scene && gameData.scene.length > 0) {
            // Load UGC Scene
            gameData.scene.forEach((entData: any) => {
                const entity = new Entity({
                    position: new THREE.Vector3(entData.position.x, entData.position.y, entData.position.z),
                    rotation: new THREE.Euler(entData.rotation.x, entData.rotation.y, entData.rotation.z),
                    size: new THREE.Vector3(entData.scale.x, entData.scale.y, entData.scale.z),
                    mass: entData.mass > 0 ? entData.mass : 1, // Make it dynamic when playing
                    name: entData.name,
                    color: entData.name === 'EditorFloor' ? 0x333333 : Math.random() * 0xffffff
                });
                
                // If it's a floor, keep it static
                if (entData.name === 'EditorFloor') {
                    entity.body.mass = 0;
                    entity.body.updateMassProperties();
                }

                engine.addEntity(entity);
            });
        } else {
            // Default Procedural Scene (For older static games)
            const floor = new Entity({
                position: new THREE.Vector3(0, -1, 0),
                size: new THREE.Vector3(50, 1, 50),
                mass: 0, // Static
                color: 0x228B22,
                name: 'Floor'
            });
            engine.addEntity(floor);

            for (let i = 0; i < 20; i++) {
                const box = new Entity({
                    position: new THREE.Vector3(Math.random() * 20 - 10, 5 + i * 2, Math.random() * 20 - 10),
                    size: new THREE.Vector3(1, 1, 1),
                    mass: 1,
                    color: Math.random() * 0xffffff,
                    name: `Box_${i}`
                });
                engine.addEntity(box);
            }
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
            
            <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '8px', color: 'white' }}>
                <h2 style={{ margin: '0 0 5px 0' }}>{game.title}</h2>
                <button onClick={onExit} style={{ background: '#ff4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                    Exit Game
                </button>
            </div>

            <div style={{ position: 'absolute', bottom: '20px', left: '20px', color: 'rgba(255,255,255,0.7)', pointerEvents: 'none' }}>
                <b>Controls:</b><br/>
                WASD - Move<br/>
                Space - Jump<br/>
                Click - Lock Mouse
            </div>
        </div>
    );
};

export default GameView;
