import React, { useState } from 'react';
import './App.css';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator, Button } from '@chatscope/chat-ui-kit-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

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
  const [selectedFile, setSelectedFile] = useState(null);

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

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const formatExcelData = (data) => {
    return data.map(row => row.join(', ')).join('\n');
  };

  const formatText = (text) => {
    return text
      .replace(/\n\s*\n/g, '\n')
      .replace(/•/g, '\n•')
      .replace(/(\d+)\s*(hours)/g, '\n$1 $2');
  };

  const extractTextFromWord = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        mammoth.extractRawText({ arrayBuffer: event.target.result })
          .then(result => resolve(result.value))
          .catch(error => reject(error));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const extractTextFromImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apikey', 'K87934536488957');
    formData.append('isOverlayRequired', 'true');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.ParsedResults) {
      return data.ParsedResults.map(result => result.ParsedText).join('\n');
    } else {
      throw new Error(data.ErrorMessage ? data.ErrorMessage.join(', ') : 'Document analysis failed');
    }
  };

  const handleSendFile = async () => {
    if (!selectedFile) return;

    const fileType = selectedFile.type;
    const newMessage = {
      message: `Analyzing document: ${selectedFile.name}`,
      direction: 'outgoing',
      sender: 'user',
      sentTime: 'just now',
      position: 'normal'
    };

    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      if (fileType.includes('sheet') || fileType.includes('excel')) {
        const fileReader = new FileReader();
        fileReader.onload = (event) => {
          const binaryStr = event.target.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          const formattedText = formatExcelData(excelData);

          const analysisMessage = {
            message: `Document analysis result:\n${formattedText}`,
            sender: 'ChatGPT',
            direction: 'incoming',
            sentTime: 'just now',
            position: 'normal'
          };

          setMessages([...newMessages, analysisMessage]);
        };
        fileReader.readAsBinaryString(selectedFile);
      } else if (fileType.includes('image')) {
        const text = await extractTextFromImage(selectedFile);
        const formattedText = formatText(text);
        const analysisMessage = {
          message: `Document analysis result:\n${formattedText}`,
          sender: 'ChatGPT',
          direction: 'incoming',
          sentTime: 'just now',
          position: 'normal'
        };

        setMessages([...newMessages, analysisMessage]);
      } else if (fileType.includes('word')) {
        const text = await extractTextFromWord(selectedFile);
        const formattedText = formatText(text);
        const analysisMessage = {
          message: `Document analysis result:\n${formattedText}`,
          sender: 'ChatGPT',
          direction: 'incoming',
          sentTime: 'just now',
          position: 'normal'
        };

        setMessages([...newMessages, analysisMessage]);
      } else {
        throw new Error('Unsupported file type. Please upload an Excel, image, or Word file.');
      }
    } catch (error) {
      console.error('Error during document analysis:', error);
      const errorMessage = {
        message: `An error occurred during document analysis: ${error.message}`,
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
            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          />
          <Button onClick={handleSendText} style={{ marginBottom: '10px' }}>
            Search Image
          </Button>
          <input
            type="file"
            onChange={handleFileChange}
            style={{ width: '100%', padding: '8px' }}
          />
          <Button onClick={handleSendFile} style={{ marginTop: '10px' }}>
            Analyze Document
          </Button>
        </div>
      </div>
    </div>
  );
}

export default App;
