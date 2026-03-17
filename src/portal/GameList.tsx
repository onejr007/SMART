import React, { useState, useEffect, useCallback } from 'react';
import { Game } from './App';
import { persistence } from '../engine/PersistenceManager';
import { useAuth } from './AuthContext';
import { useStore } from './store';
import './GameList.css';

interface GameListProps {
    onPlay: (game: Game) => void;
}

const defaultGames: Game[] = [
    {
        id: '1',
        title: 'Cyber City Explorer',
        description: 'Explore a neon-lit cyberpunk city. Use WASD to move.',
        author: 'AI Architect',
    }
];

const GameList: React.FC<GameListProps> = ({ onPlay }) => {
    // Optimization #45: Global State Optimization (Zustand)
    const { games: allGames, setGames: setAllGames, prefetchGame } = useStore();
    const [isLoading, setIsLoading] = useState(allGames.length === 0);
    const [filter, setFilter] = useState<'all' | 'mine'>('all');
    const { user } = useAuth();

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const ugcGames = await persistence.listGames();
                // Combine with default and sort by date
                const combined = [...defaultGames, ...ugcGames].sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });
                setAllGames(combined);
            } catch (error) {
                console.error("Error fetching games:", error);
                if (allGames.length === 0) setAllGames(defaultGames);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGames();
    }, [setAllGames]);

    const filteredGames = filter === 'mine' 
        ? allGames.filter(game => game.author === user?.displayName)
        : allGames;

    // Optimization #40: Prefetching Strategy
    const handleMouseEnter = useCallback((gameId: string) => {
        prefetchGame(gameId);
    }, [prefetchGame]);

    return (
        <div className="game-list-container">
            <div className="game-list-header">
                <div className="header-content">
                    <h1 className="header-title">Discover Worlds</h1>
                    <p className="header-subtitle">
                        Explore amazing 3D experiences created by our community
                    </p>
                </div>

                <div className="filter-tabs">
                    <button 
                        className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        <span>🌍</span>
                        <span>All Games</span>
                        <span className="badge">{allGames.length}</span>
                    </button>
                    <button 
                        className={`filter-tab ${filter === 'mine' ? 'active' : ''}`}
                        onClick={() => setFilter('mine')}
                    >
                        <span>⭐</span>
                        <span>My Games</span>
                        <span className="badge">
                            {allGames.filter(g => g.author === user?.displayName).length}
                        </span>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-container">
                    <div className="loading-spinner-large"></div>
                    <p>Loading games from cloud...</p>
                </div>
            ) : filteredGames.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🎮</div>
                    <h3>No games found</h3>
                    <p>
                        {filter === 'mine' 
                            ? "You haven't created any games yet. Click 'Create' to start building!"
                            : "No games available at the moment."}
                    </p>
                </div>
            ) : (
                <div className="games-grid">
                    {filteredGames.map(game => (
                        <div 
                            key={game.id} 
                            className="game-card"
                            onClick={() => onPlay(game)}
                            onMouseEnter={() => handleMouseEnter(game.id)}
                        >
                            <div className="game-thumbnail">
                                <div className="thumbnail-overlay">
                                    <button className="play-button">
                                        <span className="play-icon">▶</span>
                                        <span>Play Now</span>
                                    </button>
                                </div>
                                <div className="thumbnail-icon">🎮</div>
                            </div>

                            <div className="game-info">
                                <h3 className="game-title">{game.title}</h3>
                                <p className="game-description">{game.description}</p>
                                
                                <div className="game-footer">
                                    <div className="game-author">
                                        <div className="author-avatar">
                                            {game.author.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="author-name">
                                            {game.author === user?.displayName ? 'You' : game.author}
                                        </span>
                                    </div>
                                    
                                    {game.author === user?.displayName && (
                                        <span className="owner-badge">Owner</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GameList;
