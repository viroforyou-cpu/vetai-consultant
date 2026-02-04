# GLM 4.7 Integration Research

## API Endpoint Information

### Primary API Endpoint
- **Base URL**: `https://open.bigmodel.cn/oneapi/v1`
- **Chat Completions**: `https://open.bigmodel.cn/oneapi/v1/chat/completions`
- **Embeddings**: `https://open.bigmodel.cn/oneapi/v1/embeddings`

### Authentication
```typescript
headers: {
  "Authorization": "Bearer YOUR_ZHIPU_API_KEY",
  "Content-Type": "application/json"
}
```

## TypeScript SDK

### Official SDK (Recommended)
```bash
npm install zhipuai-sdk-nodejs-v4
```

```typescript
import { ZhipuAI } from 'zhipuai-sdk-nodejs-v4';

const ai = new ZhipuAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: 'https://open.bigmodel.cn/oneapi/v1'
});

// Chat completion
const response = await ai.chat.completions.create({
  model: "glm-4.7",
  messages: [{ role: "user", content: "Your message" }],
  temperature: 0.7,
  max_tokens: 2000
});
```

## Response Formats

### Chat Completion
```typescript
interface ChatResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### Embedding
```typescript
interface EmbeddingResponse {
  data: Array<{
    embedding: number[]; // 1536-dimensional vector
    index: number;
  }>;
}
```

## Common Gotchas

1. **Audio Transcription**: GLM doesn't directly support audio - use separate STT service
2. **Embedding Dimensions**: Verify model output dimension (typically 1536)
3. **Rate Limiting**: Implement exponential backoff for 429 errors
4. **JSON Parsing**: Always validate response structure before parsing
5. **Environment Variables**: Use `VITE_` prefix for Vite client access

## Implementation Example

```typescript
// src/services/glmService.ts
export class GLMService {
  private async makeRequest(endpoint: string, data: any) {
    const response = await fetch(`https://open.bigmodel.cn/oneapi/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_ZHIPU_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`GLM API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async analyzeConsultation(transcript: string) {
    return this.makeRequest('chat/completions', {
      model: 'glm-4.7',
      messages: [{
        role: 'system',
        content: 'You are a veterinary assistant. Extract structured data from consultations.'
      }, {
        role: 'user',
        content: transcript
      }],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const data = await this.makeRequest('embeddings', {
      model: 'embedding-3',
      input: text
    });
    return data.data[0].embedding;
  }
}
```

## Rate Limits
- Free tier: Limited requests per minute
- Pro tier: Higher limits based on subscription
- Context window: Up to 200K tokens for GLM-4.7
- Flash model available for faster/cheaper requests

## Sources
- [ZhipuAI GLM-4.7 Documentation](https://docs.z.ai/guides/llm/glm-4.7)
- [ZhipuAI TypeScript SDK](https://github.com/MetaGLM/zhipuai-sdk-nodejs-v4)
- [GLM Embedding API](https://docs.bigmodel.cn/api-reference/)
