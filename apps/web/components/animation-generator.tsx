'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { generateAnimation } from '@/lib/api';
import { Loader2, Download, Sparkles } from 'lucide-react';

export default function AnimationGenerator() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }
        setLoading(true);
        setError(null);
        setVideoUrl(null);

        try {
            const blob = await generateAnimation(prompt);
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate animation');
        } finally {
            setLoading(false);
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
    const examplePrompts = [
        "A circle appears and moves across the screen while changing color",
        "Show 'Hello World' text writing in, then fade out",
        "Three shapes dancing together - a circle, square, and triangle"
    ];
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
                        <Sparkles className="w-8 h-8 text-blue-600" />
                        Text to Animation
                    </h1>
                    <p className="text-gray-600">
                        Describe an animation and watch it come to life
                    </p>
                </div><Card>
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
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim()}
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating Animation...
                                </>
                            ) : (
                                'Generate Animation'
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {videoUrl && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Animation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <video
                                src={videoUrl}
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
                )}
            </div>
        </div>);
}
