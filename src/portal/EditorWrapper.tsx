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
            <Editor onExit={onExit} currentUser={currentUser} />
        </div>
    );
};

export default EditorWrapper;
