# GLM-4.6 AI Agent Coding Test - Multi-Model Setup (Compared with Claude-4.5)

This setup allows you to easily switch between different AI models with Claude Code, with credentials stored securely in a separate file.

## Available Models

1. **GLM-4.6** (via Z.ai API)
2. **Claude Sonnet 4.5** (via Anthropic API)

## 🔐 First Time Setup

1. **Copy the example secrets file:**
   ```bash
   cp secrets.env.example secrets.env
   ```

2. **Edit `secrets.env` with your actual credentials:**
   ```bash
   nano secrets.env  # or use your preferred editor
   ```

3. **Make sure `secrets.env` is in `.gitignore` (already done!)**

## Quick Start

### Use GLM-4.6 (Z.ai)
```bash
source config_glm.txt && claude --model glm-4.6
```

### Use Claude Sonnet 4.5 (Anthropic)
```bash
source config_claude.txt && claude --model claude-sonnet-4-5-20250929
```

## Setup Aliases (Optional but Recommended)

Add these to your `~/.zshrc`:

```bash
source /Users/user_name/Desktop/Dev/yt-ZAI/test_claude/setup_aliases.sh
```

Then restart your terminal or run: `source ~/.zshrc`

After that, you can use:
- `claude-glm` - Start Claude Code with GLM-4.6
- `claude-anthropic` - Start Claude Code with Claude Sonnet 4.5

## 📁 File Structure

```
.
├── secrets.env              # Your API keys (DO NOT COMMIT!)
├── secrets.env.example      # Template for secrets.env
├── config_glm.txt          # GLM-4.6 configuration (sources secrets.env)
├── config_claude.txt       # Claude configuration (sources secrets.env)
├── setup_aliases.sh        # Shell aliases for easy switching
├── .gitignore              # Protects your secrets
└── README.md               # This file
```

## 🔒 Security Best Practices

✅ **DO:**
- Keep `secrets.env` in `.gitignore`
- Use `secrets.env.example` for sharing configuration structure
- Rotate your API keys periodically

❌ **DON'T:**
- Commit `secrets.env` to git
- Share your `secrets.env` file
- Hardcode credentials in config files

## How It Works

1. **`secrets.env`** - Stores all sensitive credentials
2. **`config_*.txt`** - Sources `secrets.env` and sets the appropriate environment variables
3. Config files automatically find `secrets.env` regardless of where you run them from

## Why the `--model` flag?

Claude Code caches your last model selection. Using the `--model` flag overrides this cache and ensures you're using the correct model for each API endpoint.

## Troubleshooting

**If you see "Auth conflict" warning:**
This happens when both `ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN` are set. This is normal when switching between configs. The `unset` commands in each config file handle this.

**If the wrong model shows at startup:**
Always use the `--model` flag when starting Claude Code to override the cached preference.

**If you get "secrets.env: No such file or directory":**
Make sure you've copied `secrets.env.example` to `secrets.env` and filled in your credentials.

---

## 🧪 AI Agent Project: Sales Email Classifier & Auto-Responder

### Standard Testing Prompt

Use this exact prompt in both Claude Code terminals (GLM-4.6 and Claude Sonnet 4.5) for consistent comparison:

```
I want you to build a Sales Email Response Classifier & Auto-Responder AI agent using FastAPI.

**Project Setup:**
1. Clone this FastAPI starter repo: https://github.com/ShenSeanChen/yt-fastapi-gcp-pro
2. Remove the .git folder and initialize a new git repo
3. Read the API credentials from secrets.env file (use the appropriate model key based on which model you are)

**Core Functionality:**
Build a FastAPI backend with these endpoints:

1. POST /classify-email
   - Input: { "email_body": "string", "subject": "string" }
   - Output: { "category": "interested|not_interested|question|meeting_request|other", "confidence": float, "reasoning": "string" }

2. POST /generate-response
   - Input: { "email_body": "string", "subject": "string", "category": "string", "sender_name": "string", "prospect_company": "string" }
   - Output: { "response": "string", "tone": "string", "next_steps": ["string"] }

3. POST /process-email (combined endpoint)
   - Input: { "email_body": "string", "subject": "string", "sender_name": "string", "prospect_company": "string" }
   - Output: { "classification": {}, "suggested_response": {}, "processing_time_ms": float }

4. GET /health
   - Returns API status and model information

**Requirements:**
- Use your current model (check secrets.env for credentials)
- Track and return token usage for each API call (input tokens, output tokens, total tokens)
- Include token usage in all endpoint responses: { ..., "token_usage": { "input_tokens": int, "output_tokens": int, "total_tokens": int } }
- Include proper error handling
- Add request/response logging with token counts
- Include 5 sample test emails in a separate test_emails.json file
- Write a simple test script (test_api.py) that calls all endpoints and reports total token usage
- Add clear documentation in README.md with:
  - Setup instructions
  - API endpoint documentation
  - How to run tests
  - Sample curl commands
  - How token tracking is implemented

**Deliverables:**
- Working FastAPI application
- Test suite with sample emails
- Documentation
- Requirements.txt with all dependencies

Please implement this step by step, and let me know when it's ready to test.
```

### Testing Methodology

After both models complete the implementation:

1. **Functional Testing:**
   - Run the test suite on both implementations
   - Verify all endpoints work correctly
   - Test with the same 5+ sample emails

2. **Quality Comparison:**
   - Classification accuracy
   - Response quality and personalization
   - Reasoning clarity
   - Code organization and documentation

3. **Performance Metrics:**
   - Response time per endpoint
   - **Token usage per endpoint and total**
   - **Cost efficiency (tokens per task)**
   - Error handling robustness
   - API documentation completeness

4. **Development Process:**
   - Time to completion
   - Number of iterations needed
   - Code quality and best practices

### Sample Test Emails (for consistency)

Use these emails for testing both implementations:

1. **Interested Response:**
   ```
   Subject: Re: Streamline Your Sales Process
   Body: Hi John, this looks interesting. Can you tell me more about pricing and implementation timeline? We're currently evaluating a few options.
   ```

2. **Not Interested:**
   ```
   Subject: Re: Increase Your Revenue by 30%
   Body: Thanks but we're not interested at this time. Please remove us from your list.
   ```

3. **Meeting Request:**
   ```
   Subject: Re: Quick Chat About Sales Automation
   Body: I'd love to learn more. Are you available for a call next Tuesday or Wednesday afternoon?
   ```

4. **Question:**
   ```
   Subject: Re: Demo Request
   Body: Before scheduling a demo, can you clarify if your solution integrates with Salesforce and HubSpot? Also, what's your typical ROI timeline?
   ```

5. **Out of Office:**
   ```
   Subject: Automatic reply: Re: Partnership Opportunity
   Body: I'm out of the office until March 15th with limited email access. For urgent matters, please contact sarah@company.com.
   ```

