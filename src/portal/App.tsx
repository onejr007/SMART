import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useStore, UserRole } from './store';
import Auth from './Auth';
import Navbar from './Navbar';
import GameList from './GameList';
import { analytics, auth } from '../firebase';
import { logEvent } from "firebase/analytics";
import { onAuthStateChanged } from 'firebase/auth';
import { ErrorBoundary } from './ErrorBoundary';

const GameView = lazy(() => import('./GameView'));
const EditorWrapper = lazy(() => import('./EditorWrapper'));

export interface Game {
    id: string;
    title: string;
    description: string;
    author: string;
    thumbnail?: string;
    scene?: any[];
}

const App: React.FC = () => {
    const { user, loading, setUser, setLoading } = useStore();
    const [view, setView] = useState<'home' | 'create' | 'play'>('home');
    const [activeGame, setActiveGame] = useState<Game | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const token = await firebaseUser.getIdTokenResult();
                const role =
                    token.claims.role === UserRole.ADMIN ||
                    token.claims.role === UserRole.CREATOR ||
                    token.claims.role === UserRole.PLAYER
                        ? (token.claims.role as UserRole)
                        : UserRole.PLAYER;
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email || '',
                    displayName: firebaseUser.displayName || '',
                    role
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [setUser, setLoading]);

    useEffect(() => {
        if (user) {
            logEvent(analytics, 'app_open', { user_id: user.uid });
        }
    }, [user]);

    const handlePlay = (game: Game) => {
        logEvent(analytics, 'play_game', { 
            game_id: game.id, 
            game_title: game.title,
            user_id: user?.uid 
        });
        setActiveGame(game);
        setView('play');
    };

    const handleNavigate = (newView: 'home' | 'create') => {
        if (newView === 'create') {
            logEvent(analytics, 'enter_editor', { user_id: user?.uid });
        }
        setView(newView);
        setActiveGame(null);
    };

    const handleExit = () => {
        setView('home');
        setActiveGame(null);
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100vh',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '5px solid rgba(255, 255, 255, 0.1)',
                    borderTopColor: '#667eea',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '24px'
                }}></div>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '1.1rem' }}>
                    Loading SMART Metaverse...
                </p>
            </div>
        );
    }

    if (!user) {
        return <Auth onSuccess={() => {}} />;
    }

    return (
        <div style={{ width: '100%', minHeight: '100vh' }}>
            {view === 'home' && (
                <Navbar onNavigate={handleNavigate} currentView={view} />
            )}

            <div style={{ width: '100%', minHeight: '100vh' }}>
                <Suspense fallback={<div style={{ color: 'rgba(255, 255, 255, 0.6)', padding: '20px', textAlign: 'center' }}>Loading component...</div>}>
                    {view === 'home' && (
                        <GameList onPlay={handlePlay} onCreate={() => handleNavigate('create')} />
                    )}

                    {view === 'create' && (
                        <EditorWrapper onExit={handleExit} currentUser={user.displayName || 'User'} />
                    )}

                    {view === 'play' && activeGame && (
                        <ErrorBoundary fallback={<div style={{ padding: 20 }}>Game failed to load. Returning to home...</div>}>
                            <GameView game={activeGame} onExit={handleExit} />
                        </ErrorBoundary>
                    )}
                </Suspense>
            </div>
        </div>
    );
};

export default App;
