import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home'; 
import Chat from './pages/tts'; 
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} onEnter={requireAuth} />
      </Routes>
    </Router>
  );
}

export default App;


function requireAuth(nextState, replace) {
  if (!sessionStorage.getItem('chatAiToken')) {
    replace({
      pathname: '/',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}