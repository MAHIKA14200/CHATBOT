import React, { useState } from 'react';
import './App.css';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator, Button } from '@chatscope/chat-ui-kit-react';

const PEXELS_API_KEY = 'd6ip6JK2gxzuBk2xZQEXhd5UD19hIF9xYQ8G7n5ZT33o9OJlcXbuDiw6'; // Replace with your actual Pexels API key
const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';

function App() {
  const [messages, setMessages] = useState([
    {
      message: "Hello, I'm ChatGPT! Ask me anything!",
      sentTime: "just now",
      sender: "ChatGPT",
      direction: "incoming",
      position: "normal"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState([]); 

  const handleSendText = async () => {
    if (!textPrompt) return;

    const newMessage = {
      message: `Searching for images related to: ${textPrompt}`,
      direction: 'outgoing',
      sender: 'user',
      sentTime: 'just now',
      position: 'normal'
    };

    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const response = await fetch(`${PEXELS_SEARCH_URL}?query=${textPrompt}`, {
        headers: {
          Authorization: PEXELS_API_KEY
        }
      });

      const data = await response.json();
      console.log('API Response:', data); 

      if (response.ok && data && data.photos && data.photos.length > 0) {
        const imageAnalysisMessage = {
          message: `Images found:`,
          sender: 'ChatGPT',
          direction: 'incoming',
          sentTime: 'just now',
          position: 'normal'
        };

        setGeneratedImages(data.photos.slice(0, 5).map(photo => photo.src.medium)); 
        setMessages([...newMessages, imageAnalysisMessage]);
      } else {
        throw new Error('No images found for the given prompt');
      }
    } catch (error) {
      console.error('Error during image search:', error);
      const errorMessage = {
        message: `An error occurred while searching for images: ${error.message}`,
        sender: 'ChatGPT',
        direction: 'incoming',
        sentTime: 'just now',
        position: 'normal'
      };

      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="App">
      <div style={{ position: 'relative', height: '600px', width: '400px' }}>
        <MainContainer>
          <ChatContainer>
            <MessageList
              scrollBehavior="smooth"
              typingIndicator={isTyping ? <TypingIndicator content="Typing..." /> : null}
            >
              {messages.map((message, i) => (
                <Message
                  key={i}
                  model={{
                    message: message.message,
                    direction: message.direction,
                    position: message.position,
                    sender: message.sender
                  }}
                />
              ))}
              {generatedImages.length > 0 && (
                <Message
                  model={{
                    direction: 'incoming',
                    position: 'normal',
                    sender: 'ChatGPT'
                  }}
                >
                  <Message.CustomContent>
                    {generatedImages.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Generated ${index}`}
                        style={{ maxWidth: '100%', marginBottom: '10px' }}
                      />
                    ))}
                  </Message.CustomContent>
                </Message>
              )}
            </MessageList>
            <MessageInput placeholder="Type message here" onSend={handleSendText} />
          </ChatContainer>
        </MainContainer>
        <div style={{ padding: '10px' }}>
          <input
            type="text"
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
            placeholder="Enter text prompt here"
            style={{ width: '100%', padding: '8px' }}
          />
          <Button onClick={handleSendText} style={{ marginTop: '10px' }}>
            Search Image
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;



