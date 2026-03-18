import React, { useState, useCallback } from 'react';
import { Game } from './App';
import { useStore } from './store';
import { useGames } from './useGames';
import './GameList.css';

interface GameListProps {
    onPlay: (game: Game) => void;
    onCreate: () => void;
}

const GameList: React.FC<GameListProps> = ({ onPlay, onCreate }) => {
    const { games: allGames, isLoading } = useGames();
    const { prefetchGame, user } = useStore();
    const [filter, setFilter] = useState<'all' | 'mine'>('all');
    const [search, setSearch] = useState('');

    const normalizedSearch = search.trim().toLowerCase();
    const baseGames = filter === 'mine' 
        ? allGames.filter(game => game.author === user?.displayName)
        : allGames;
    const filteredGames = normalizedSearch.length === 0
        ? baseGames
        : baseGames.filter((game) => {
            const haystack = `${game.title} ${game.description} ${game.author}`.toLowerCase();
            return haystack.includes(normalizedSearch);
        });

    const handleMouseEnter = useCallback((gameId: string) => {
        prefetchGame(gameId);
    }, [prefetchGame]);

    return (
        <div className="game-list-container">
            <div className="game-list-header">
                <div className="header-top">
                    <div className="header-content">
                        <h1 className="header-title">Discover Worlds</h1>
                        <p className="header-subtitle">
                            Explore amazing 3D experiences created by our community
                        </p>
                    </div>

                    <button className="create-game-button" onClick={onCreate}>
                        <span className="create-game-icon">✨</span>
                        <span>Create Game</span>
                    </button>
                </div>

                <div className="header-controls">
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

                    <div className="search-wrap">
                        <span className="search-icon">🔎</span>
                        <input
                            className="search-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search games..."
                        />
                    </div>
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
                            ? "You haven't created any games yet. Create your first world to get started."
                            : "No games available at the moment."}
                    </p>
                    <button className="empty-create-button" onClick={onCreate}>
                        <span>✨</span>
                        <span>Create Game</span>
                    </button>
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
            <button className="create-game-fab" onClick={onCreate} aria-label="Create Game">
                ✨
            </button>
        </div>
    );
};

export default GameList;
