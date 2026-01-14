'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { generateAnimation, generatePlan } from '@/lib/api';
import { Loader2, Download, Sparkles, Copy, CheckCircle, XCircle, Play } from 'lucide-react';

interface AnimationPlan {
  json_ir: any;
  manim_code: string;
  description: string;
  validation: {
    valid: boolean;
    errors: string[];
  };
}

export default function AnimationGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [plan, setPlan] = useState<AnimationPlan | null>(null);
  const [activeTab, setActiveTab] = useState<string>('input');
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [renderingVideo, setRenderingVideo] = useState(false);

  const handleGeneratePlan = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setPlan(null);
    setVideoUrl(null);

    try {
      const planData = await generatePlan(prompt);
      setPlan(planData);
      setActiveTab('json');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  const handleRenderVideo = async () => {
    if (!plan?.validation.valid) return;

    setRenderingVideo(true);
    setError(null);

    try {
      const blob = await generateAnimation(prompt);
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setActiveTab('video');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render video');
    } finally {
      setRenderingVideo(false);
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
    "A circle appears and moves across the screen",
    "Show 'Hello World' text writing in, then fade out",
    "Three shapes dancing together - a circle, square, and triangle"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            Text to Animation
          </h1>
          <p className="text-gray-600">
            Describe an animation and watch it come to life
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="json" disabled={!plan}>Animation Plan (IR)</TabsTrigger>
            <TabsTrigger value="code" disabled={!plan?.validation.valid}>Manim Code</TabsTrigger>
            <TabsTrigger value="video" disabled={!videoUrl}>Video</TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Animation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Describe your animation
                  </label>
                  <Textarea
                    placeholder="Example: A blue circle appears in the center, then moves to the right while a text saying 'Hello' fades in from the top..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={6}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Try these examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.map((example, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(example)}
                        disabled={loading}
                        className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors disabled:opacity-50"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleGeneratePlan}
                  disabled={loading || !prompt.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    'Generate Animation Plan'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Animation Plan (JSON IR)</span>
                  {plan?.validation.valid ? (
                    <span className="flex items-center gap-2 text-sm font-normal text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Valid
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-sm font-normal text-red-600">
                      <XCircle className="w-4 h-4" />
                      Invalid
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan?.validation.valid === false && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md space-y-2">
                    <p className="font-medium text-red-900">Validation Errors:</p>
                    {plan.validation.errors.map((err, i) => (
                      <p key={i} className="text-sm text-red-700">• {err}</p>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-96 overflow-y-auto">
                    {JSON.stringify(plan?.json_ir, null, 2)}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(JSON.stringify(plan?.json_ir, null, 2), 'json')}
                    className="absolute top-2 right-2"
                  >
                    {copiedJson ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                {plan?.validation.valid && (
                  <Button
                    onClick={handleRenderVideo}
                    disabled={renderingVideo}
                    className="w-full"
                  >
                    {renderingVideo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rendering Video...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Render Video
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Generated Manim Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">Expected Output:</h3>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <pre className="text-xs whitespace-pre-wrap text-gray-700">
                      {plan?.description}
                    </pre>
                  </div>
                </div>

                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-96 overflow-y-auto font-mono">
                    {plan?.manim_code}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(plan?.manim_code || '', 'code')}
                    className="absolute top-2 right-2"
                  >
                    {copiedCode ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="video" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Animation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <video
                  src={videoUrl || ''}
                  controls
                  className="w-full rounded-lg shadow-lg"
                  autoPlay
                  loop
                />
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Video
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}