import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are Artha AI, an intelligent financial assistant specializing in the Indian stock market. You help users understand stocks, analyze market trends, and make informed investment decisions.

Key capabilities:
- Explain stock fundamentals and technical indicators
- Analyze NSE/BSE listed companies
- Discuss market trends and sector performance
- Help with portfolio analysis and stock comparison
- Provide educational content about investing
- Calculate SIP returns and investment projections

Guidelines:
- Be concise but informative
- Use bullet points for clarity when listing multiple items
- Always include relevant numbers and data points when discussing stocks
- Remind users that you provide educational content, not financial advice
- Use ₹ for Indian Rupee values
- Format large numbers in lakhs/crores (Indian numbering system)

If asked about specific stock prices or real-time data, note that you're providing analysis based on general knowledge and recommend checking the stock view for live prices.`;

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export async function POST(request: NextRequest) {
    try {
        const { message, history, context } = await request.json();

        if (!message || typeof message !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Message is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7,
            }
        });

        // Build context-aware prompt
        let contextInfo = '';
        if (context) {
            if (context.currentStock) {
                contextInfo += `\nUser is currently viewing: ${context.currentStock.name} (${context.currentStock.symbol})`;
                if (context.currentStock.price) {
                    contextInfo += ` - Current Price: ₹${context.currentStock.price}`;
                }
            }
            if (context.watchlist && context.watchlist.length > 0) {
                contextInfo += `\nUser's watchlist: ${context.watchlist.join(', ')}`;
            }
        }

        // Build conversation history for Gemini
        const chatHistory = (history || []).map((msg: ChatMessage) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 1024,
            },
        });

        const fullPrompt = contextInfo
            ? `${SYSTEM_PROMPT}\n\nCurrent Context:${contextInfo}\n\nUser: ${message}`
            : `${SYSTEM_PROMPT}\n\nUser: ${message}`;

        // Stream the response
        const result = await chat.sendMessageStream(fullPrompt);

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        if (text) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    console.error('Streaming error:', error);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Streaming error' })}\n\n`));
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Chat API error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to process chat request' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
