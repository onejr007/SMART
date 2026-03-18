
import { useState, useEffect } from 'react';
import { Game } from './App';
import { persistence } from '../engine/PersistenceManager';
import { useStore } from './store';

const defaultGames: Game[] = [
    {
        id: '1',
        title: 'Cyber City Explorer',
        description: 'Explore a neon-lit cyberpunk city. Use WASD to move.',
        author: 'AI Architect',
    }
];

export const useGames = () => {
    const { games, setGames } = useStore();
    const [isLoading, setIsLoading] = useState(games.length === 0);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const ugcGames = await persistence.listGames();
                const combined = [...defaultGames, ...ugcGames].sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA;
                });
                setGames(combined);
            } catch (error) {
                console.error("Error fetching games:", error);
                if (games.length === 0) setGames(defaultGames);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGames();
    }, [setGames]);

    return { games, isLoading };
};
