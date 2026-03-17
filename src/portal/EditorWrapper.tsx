import React from 'react';
import Editor from './Editor';
import './EditorWrapper.css';

interface EditorWrapperProps {
    onExit: () => void;
    currentUser: string;
}

const EditorWrapper: React.FC<EditorWrapperProps> = ({ onExit, currentUser }) => {
    return (
        <div className="editor-wrapper">
            <div className="editor-header">
                <div className="editor-title">
                    <span className="editor-icon">✨</span>
                    <h2>World Editor</h2>
                </div>
                <button className="editor-exit-btn" onClick={onExit}>
                    <span>←</span>
                    <span>Back to Portal</span>
                </button>
            </div>
            <div className="editor-content">
                <Editor onExit={onExit} currentUser={currentUser} />
            </div>
        </div>
    );
};

export default EditorWrapper;
