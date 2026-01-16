'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { sendChatMessage, renderAnimation } from '@/lib/api';
import { Loader2, Send, Sparkles, Copy, CheckCircle, Play, RotateCcw, Download } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  animation_state?: any;
}

interface AnimationState {
  json_ir: any;
  manim_code: string;
  description: string;
  validation: {
    valid: boolean;
    errors: string[];
  };
}

export default function ConversationalAnimator() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage('');
    setLoading(true);

    try {
      const response = await sendChatMessage(
        userMessage,
        messages,
        currentAnimation?.json_ir
      );

      setMessages(response.conversation_history);
      
      if (response.animation_ir) {
        setCurrentAnimation({
          json_ir: response.animation_ir,
          manim_code: response.manim_code,
          description: response.description,
          validation: response.validation
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...messages, {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      }, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRender = async () => {
    if (!currentAnimation?.json_ir || rendering) return;

    setRendering(true);
    setVideoUrl(null);

    try {
      const blob = await renderAnimation(currentAnimation.json_ir);
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setActiveTab('video');
    } catch (error) {
      console.error('Render error:', error);
    } finally {
      setRendering(false);
    }
  };

  const handleReset = () => {
    if (confirm('Start a new animation? This will clear the current conversation.')) {
      setMessages([]);
      setCurrentAnimation(null);
      setVideoUrl(null);
      setActiveTab('chat');
    }
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `animation-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyToClipboard = (text: string, type: 'json' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'json') {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const examplePrompts = [
    "Create a blue circle that moves from left to right",
    "Add the text 'Hello World' at the top",
    "Make the circle bigger and change its color to red",
    "Add a square below the circle"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex h-screen">
        {/* Left Sidebar - Chat */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Animation Chat
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                disabled={messages.length === 0}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Describe or modify your animation
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-4">
                <p className="text-gray-500 text-sm">Start a conversation!</p>
                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Try these:</p>
                  {examplePrompts.slice(0, 2).map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setMessage(prompt)}
                      className="block w-full text-left text-xs px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Textarea
                placeholder="Describe what you want to create or change..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={3}
                disabled={loading}
                className="resize-none"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || loading}
                size="sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Content - Preview & Code */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Animation Studio</h1>
            {currentAnimation && (
              <Button
                onClick={handleRender}
                disabled={rendering || !currentAnimation.validation.valid}
              >
                {rendering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rendering...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Render Video
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="flex-1 p-6 overflow-auto">
            {!currentAnimation ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md">
                  <Sparkles className="w-16 h-16 mx-auto text-blue-600" />
                  <h3 className="text-xl font-semibold">No animation yet</h3>
                  <p className="text-gray-600">
                    Start by describing an animation in the chat on the left
                  </p>
                </div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="chat">Preview</TabsTrigger>
                  <TabsTrigger value="json">JSON IR</TabsTrigger>
                  <TabsTrigger value="code">Manim Code</TabsTrigger>
                  <TabsTrigger value="video" disabled={!videoUrl}>Video</TabsTrigger>
                </TabsList>

                <TabsContent value="chat">
                  <Card>
                    <CardHeader>
                      <CardTitle>Animation Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {!currentAnimation.validation.valid && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="font-medium text-red-900">Validation Errors:</p>
                            {currentAnimation.validation.errors.map((err, i) => (
                              <p key={i} className="text-sm text-red-700">• {err}</p>
                            ))}
                          </div>
                        )}
                        
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                          <h3 className="font-semibold mb-2">Expected Output:</h3>
                          <pre className="text-sm whitespace-pre-wrap text-gray-700">
                            {currentAnimation.description}
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="json">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>Animation JSON (IR)</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(JSON.stringify(currentAnimation.json_ir, null, 2), 'json')}
                        >
                          {copiedJson ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-[600px] overflow-y-auto">
                        {JSON.stringify(currentAnimation.json_ir, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="code">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>Manim Code</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(currentAnimation.manim_code, 'code')}
                        >
                          {copiedCode ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-[600px] overflow-y-auto font-mono">
                        {currentAnimation.manim_code}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="video">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rendered Video</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <video
                        src={videoUrl || ''}
                        controls
                        className="w-full rounded-lg shadow-lg"
                        autoPlay
                        loop
                      />
                      <Button onClick={handleDownload} variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download Video
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}