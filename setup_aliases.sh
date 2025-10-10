#!/bin/bash
# File: /Users/shenseanchen/Desktop/Dev/yt-ZAI/test_claude/setup_aliases.sh
#
# Add these aliases to your ~/.zshrc for easy model switching

# Alias to use GLM-4.6 (Z.ai)
alias claude-glm='source /Users/shenseanchen/Desktop/Dev/yt-ZAI/test_claude/config_glm.txt && claude --model glm-4.6'

# Alias to use Claude Sonnet 4.5 (Anthropic)
alias claude-anthropic='source /Users/shenseanchen/Desktop/Dev/yt-ZAI/test_claude/config_claude.txt && claude --model claude-sonnet-4-5-20250929'

# Quick switcher functions
use-glm() {
    source /Users/shenseanchen/Desktop/Dev/yt-ZAI/test_claude/config_glm.txt
    echo "✓ Switched to GLM-4.6 (Z.ai API)"
    echo "Run 'claude --model glm-4.6' to start"
}

use-claude() {
    source /Users/shenseanchen/Desktop/Dev/yt-ZAI/test_claude/config_claude.txt
    echo "✓ Switched to Claude Sonnet 4.5 (Anthropic API)"
    echo "Run 'claude --model claude-sonnet-4-5-20250929' to start"
}

