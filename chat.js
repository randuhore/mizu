document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const typingIndicator = document.getElementById('typing-indicator');

    const OPENROUTER_API_KEYS = [
        "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",
        "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",
        "API_KEY_3",
        "API_KEY_4",
        "API_KEY_5",
        "API_KEY_6",
        "API_KEY_7",
        "API_KEY_8",
        "API_KEY_9",
        "API_KEY_10"
    ];
    
    let currentKeyIndex = 0;
    const keyStatus = OPENROUTER_API_KEYS.map(() => ({ active: true, lastUsed: 0 }));
    
    function getNextApiKey() {
        const activeKeys = keyStatus.filter(status => status.active);
        if (activeKeys.length === 0) {
            keyStatus.forEach(status => { status.active = true; });
            console.log("All keys have been reset to active");
        }
        
        const startIndex = currentKeyIndex;
        let nextKeyIndex = startIndex;
        
        do {
            if (keyStatus[nextKeyIndex].active) {
                currentKeyIndex = nextKeyIndex;
                keyStatus[nextKeyIndex].lastUsed = Date.now();
                console.log(`Using API key #${currentKeyIndex + 1}`);
                return OPENROUTER_API_KEYS[currentKeyIndex];
            }
            nextKeyIndex = (nextKeyIndex + 1) % OPENROUTER_API_KEYS.length;
        } while (nextKeyIndex !== startIndex);
        
        currentKeyIndex = 0;
        return OPENROUTER_API_KEYS[0];
    }
    
    function markKeyAsInactive(keyIndex) {
        keyStatus[keyIndex].active = false;
        console.log(`API key #${keyIndex + 1} marked as inactive`);
        
        setTimeout(() => {
            keyStatus[keyIndex].active = true;
            console.log(`API key #${keyIndex + 1} has been reactivated`);
        }, 60 * 60 * 1000); // 1 hour
    }
    
    const API_URL = "https://openrouter.ai/api/v1/chat/completions";
    
    const systemInstructions = `
    You are Mizu AI, a friendly AI assistant. You should respond naturally to all questions.

    IMPORTANT GUIDELINES:
    1. Only discuss Mizu AI token or project if the user SPECIFICALLY asks about it.
    2. Structure your responses with proper paragraphs, spacing, and formatting.
    3. Keep responses concise and to the point.
    4. Be conversational and helpful.
    5. For general greetings like "hi" or "hello", respond with a simple greeting without mentioning anything about Mizu AI project.
    6. Use emojis occasionally to appear friendly and engaging.

    If asked specifically about the Mizu AI project/token, here's information you can share:

    # Token Information:
    - MIZU is a utility token on Solana blockchain with a total supply of 1 billion
    - Contract address: 4Zu5b7EsYuxYTbcjKh275e6JYRhazqkC5NAfX2vCeQJh
    - Token allocation: 30% Airdrop, 20% Presale, 15% DEX Liquidity, 15% Ecosystem, 10% CEX Reserve, 10% Team

    # Presale Information:
    - Presale scheduled for Q1 2025
    - Presale price: 0.00005 SOL, Listing price: 0.0001 SOL (2x return at launch)
    - Minimum purchase: 0.1 SOL, Maximum: 10 SOL
    - Presale tokens will be sent after the presale ends on May 5, 2025

    # Airdrop:
    - Airdrop reward: 2,000 MIZU tokens
    - Airdrop ends on May 5, 2025
    - To claim the airdrop, users must complete several social media tasks

    # Features & Utilities:
    - Mizu AI uses advanced AI technology for more natural conversations
    - Main features include intelligent understanding, adaptive learning, and secure & private
    - Token utilities include access to premium AI features, staking rewards, governance rights, and reduced platform fees
    - Mizu AI is also developing image generation and data analysis features with AI technology
    - Users can stake tokens to earn weekly rewards

    # Roadmap:
    - Q1 2025: Airdrop & Presale Launch
    - Q2 2025: Exchange Listing & Token Launch
    - Q3 2025: Ecosystem Development, platform features, staking
    - Q4 2025: Expansion & Governance, DAO launch
    - Q1 2026: Sustainable Growth & Innovation, AI model upgrades

    # Community:
    - Website: mizuai.io (coming soon)
    - Twitter: @mizuai
    - Telegram: t.me/mizuai (community) & t.me/MizuAI_Announcements (channel)
    `;

    let messageHistory = [
        {
            role: "system",
            content: systemInstructions
        }
    ];

    function addInitialMessage() {
        addFormattedMessage('Mizu AI', "Hello! How can I help you today?", 'ai');
    }

    addInitialMessage();

    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    async function sendMessage() {
        const userMessage = chatInput.value.trim();
        if (userMessage === '') return;
        
        addMessage('You', userMessage, 'user');
        chatInput.value = '';
        typingIndicator.classList.add('active');
        
        messageHistory.push({
            role: "user",
            content: userMessage
        });
        
        try {
            const response = await fetchOpenRouterResponseWithRetry(messageHistory);
            typingIndicator.classList.remove('active');
            
            if (response && response.choices && response.choices.length > 0 && response.choices[0].message) {
                const aiMessage = response.choices[0].message.content;
                const formattedMessage = formatMessage(aiMessage);
                addFormattedMessage('Mizu AI', formattedMessage, 'ai');
                
                messageHistory.push({
                    role: "assistant",
                    content: aiMessage
                });
                
                if (messageHistory.length > 12) {
                    messageHistory = [
                        messageHistory[0],
                        ...messageHistory.slice(messageHistory.length - 10)
                    ];
                }
            } else {
                console.error("Invalid response structure:", response);
                throw new Error("Invalid response from API");
            }
        } catch (error) {
            console.error("Error fetching AI response:", error);
            typingIndicator.classList.remove('active');
            addMessage('Mizu AI', "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.", 'ai');
        }
    }

    function formatMessage(text) {
        return text ? text.replace(/\n/g, '<br>') : '';
    }

    async function fetchOpenRouterResponseWithRetry(messages, maxRetries = 5) {
        let retries = 0;
        let lastError = null;
        let usedKeyIndexes = new Set();
        
        while (retries < maxRetries) {
            const apiKeyIndex = currentKeyIndex;
            const apiKey = getNextApiKey();
            usedKeyIndexes.add(apiKeyIndex);
            
            try {
                console.log(`Attempt ${retries + 1} using API key #${apiKeyIndex + 1}...`);
                
                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`,
                        "HTTP-Referer": window.location.origin,
                        "X-Title": "Mizu AI Chat"
                    },
                    body: JSON.stringify({
                        model: "meta-llama/llama-4-maverick:free",
                        messages: messages,
                        temperature: 0.7,
                        max_tokens: 400,
                        top_p: 0.9,
                        stream: false
                    })
                });
                
                if (response.status === 429 || response.status === 401) {
                    console.error(`API key #${apiKeyIndex + 1} limit reached or invalid!`);
                    markKeyAsInactive(apiKeyIndex);
                    
                    if (usedKeyIndexes.size >= OPENROUTER_API_KEYS.length) {
                        throw new Error("All API keys have been tried and are currently rate limited");
                    }
                    
                    continue;
                }
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
                }
                
                const data = await response.json();
                console.log(`API Response successful from key #${apiKeyIndex + 1}`);
                return data;
            } catch (error) {
                lastError = error;
                console.error(`Attempt ${retries + 1} failed:`, error);
                
                if (!error.message.includes("rate limited")) {
                    retries++;
                }
                
                if (retries >= maxRetries) {
                    console.error("All retry attempts failed");
                    throw lastError;
                }
                
                const delay = 1000 * Math.pow(2, retries);
                console.log(`Waiting ${delay}ms before retrying...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError;
    }

    function addMessage(sender, content, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `message-${type}`);
        
        const senderElement = document.createElement('div');
        senderElement.classList.add('message-sender');
        senderElement.textContent = sender;
        
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        contentElement.textContent = content;
        
        messageElement.appendChild(senderElement);
        messageElement.appendChild(contentElement);
        
        chatMessages.appendChild(messageElement);
        
        scrollToBottom();
    }
    
    function addFormattedMessage(sender, content, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `message-${type}`);
        
        const senderElement = document.createElement('div');
        senderElement.classList.add('message-sender');
        senderElement.textContent = sender;
        
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        contentElement.innerHTML = content || '';
        
        messageElement.appendChild(senderElement);
        messageElement.appendChild(contentElement);
        
        chatMessages.appendChild(messageElement);
        
        scrollToBottom();
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
