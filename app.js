/**
 * Utilitarian LLM Chat Interface
 * Universal Provider Client, Dynamic Model Discovery, Context Engine, SSE Streaming.
 */

(function () {
  'use strict';

  // ==========================================================================
  // Default Catalog & Presets (Supporting Cloudflare Tunnels, Ollama, Google AI Studio, OpenRouter)
  // ==========================================================================

  const PROVIDER_PRESETS = {
    custom: {
      name: 'Custom / Cloudflare Tunnel (Ollama, vLLM)',
      baseUrl: 'https://dock-hide-jackson-simulations.trycloudflare.com/v1',
      modelsUrl: 'https://dock-hide-jackson-simulations.trycloudflare.com/v1/models',
      authHeader: 'none',
      format: 'openai',
      supportsFreeTag: true
    },
    gemini: {
      name: 'Google AI Studio (Gemini 2.0 / Experimental - Free Tier)',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      modelsUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      authHeader: 'key',
      format: 'gemini',
      supportsFreeTag: true
    },
    openrouter: {
      name: 'OpenRouter (Free Tier & Experimental Models)',
      baseUrl: 'https://openrouter.ai/api/v1',
      modelsUrl: 'https://openrouter.ai/api/v1/models',
      authHeader: 'Authorization',
      format: 'openai',
      supportsFreeTag: true
    },
    deepseek: {
      name: 'DeepSeek Direct (V3 & R1 Reasoning)',
      baseUrl: 'https://api.deepseek.com/v1',
      modelsUrl: 'https://api.deepseek.com/v1/models',
      authHeader: 'Authorization',
      format: 'openai',
      supportsFreeTag: false
    },
    xai: {
      name: 'xAI Grok (Beta / Experimental)',
      baseUrl: 'https://api.x.ai/v1',
      modelsUrl: 'https://api.x.ai/v1/models',
      authHeader: 'Authorization',
      format: 'openai',
      supportsFreeTag: false
    },
    cerebras: {
      name: 'Cerebras Fast (Llama 3.1 / 3.3 Free)',
      baseUrl: 'https://api.cerebras.ai/v1',
      modelsUrl: 'https://api.cerebras.ai/v1/models',
      authHeader: 'Authorization',
      format: 'openai',
      supportsFreeTag: true
    },
    openai: {
      name: 'OpenAI (api.openai.com)',
      baseUrl: 'https://api.openai.com/v1',
      modelsUrl: 'https://api.openai.com/v1/models',
      authHeader: 'Authorization',
      format: 'openai',
      supportsFreeTag: false
    },
    anthropic: {
      name: 'Anthropic Claude (api.anthropic.com)',
      baseUrl: 'https://api.anthropic.com/v1',
      modelsUrl: 'https://api.anthropic.com/v1/models',
      authHeader: 'x-api-key',
      format: 'anthropic',
      supportsFreeTag: false
    },
    groq: {
      name: 'Groq Cloud (Free Llama 3.3)',
      baseUrl: 'https://api.groq.com/openai/v1',
      modelsUrl: 'https://api.groq.com/openai/v1/models',
      authHeader: 'Authorization',
      format: 'openai',
      supportsFreeTag: true
    },
    ollama: {
      name: 'Ollama (Local / 100% Free)',
      baseUrl: 'http://localhost:11434/v1',
      modelsUrl: 'http://localhost:11434/api/tags',
      authHeader: 'none',
      format: 'ollama',
      supportsFreeTag: true
    }
  };

  const DEFAULT_MODELS = [
    // Self-Hosted Cloudflare Tunnel Models (Ollama)
    {
      id: 'agentic-uncensored-coder:latest',
      name: 'Agentic Uncensored Coder (Local)',
      provider: 'Self-Hosted Tunnel',
      isFree: true,
      pricing: { prompt: 0, completion: 0, label: 'Free (Local)' },
      contextLength: 32768,
      description: 'Fine-tuned coder running on self-hosted Ollama via Cloudflare Tunnel.'
    },
    {
      id: 'qwen2.5-coder:7b',
      name: 'Qwen 2.5 Coder 7B (Local)',
      provider: 'Self-Hosted Tunnel',
      isFree: true,
      pricing: { prompt: 0, completion: 0, label: 'Free (Local)' },
      contextLength: 32768,
      description: 'Specialized 7B coding model on self-hosted Ollama.'
    },
    {
      id: 'dolphin-llama3:8b',
      name: 'Dolphin Llama 3 8B (Local)',
      provider: 'Self-Hosted Tunnel',
      isFree: true,
      pricing: { prompt: 0, completion: 0, label: 'Free (Local)' },
      contextLength: 32768,
      description: 'Dolphin instruction-tuned 8B model on self-hosted Ollama.'
    },
    // Google AI Studio Experimental Models (Free Tier)
    {
      id: 'gemini-2.0-flash-exp',
      name: 'Google: Gemini 2.0 Flash Experimental',
      provider: 'Google AI Studio',
      isFree: true,
      pricing: { prompt: 0, completion: 0, label: 'Free Tier' },
      contextLength: 1048576,
      description: 'Next-gen experimental multimodal speed with 1,000,000+ token context window.'
    },
    {
      id: 'gemini-2.0-flash-thinking-exp-1219',
      name: 'Google: Gemini 2.0 Flash Thinking Experimental',
      provider: 'Google AI Studio',
      isFree: true,
      pricing: { prompt: 0, completion: 0, label: 'Free Tier' },
      contextLength: 1048576,
      description: 'Experimental reasoning model with live chain-of-thought visible thinking traces.'
    },
    {
      id: 'gemini-exp-1206',
      name: 'Google: Gemini Experimental 1206',
      provider: 'Google AI Studio',
      isFree: true,
      pricing: { prompt: 0, completion: 0, label: 'Free Tier' },
      contextLength: 2097152,
      description: 'Experimental flagship Gemini release with massive 2,000,000+ token context window.'
    },
    // OpenRouter Free Models
    {
      id: 'meta-llama/llama-3.3-70b-instruct:free',
      name: 'Meta: Llama 3.3 70B Instruct (free)',
      provider: 'OpenRouter',
      isFree: true,
      pricing: { prompt: 0, completion: 0, label: 'Free' },
      contextLength: 131072,
      description: 'Flagship open-weight model by Meta with nuanced coding and reasoning.'
    },
    {
      id: 'deepseek/deepseek-r1:free',
      name: 'DeepSeek: DeepSeek R1 (free)',
      provider: 'OpenRouter',
      isFree: true,
      pricing: { prompt: 0, completion: 0, label: 'Free' },
      contextLength: 64000,
      description: 'Open reasoning model with detailed chain-of-thought traces.'
    },
    {
      id: 'qwen/qwen-2.5-coder-32b-instruct:free',
      name: 'Qwen: Qwen 2.5 Coder 32B (free)',
      provider: 'OpenRouter',
      isFree: true,
      pricing: { prompt: 0, completion: 0, label: 'Free' },
      contextLength: 32768,
      description: 'Specialized code generation, debugging, and software architecture assistant.'
    },
    // Direct Paid / Frontier Models
    {
      id: 'deepseek-reasoner',
      name: 'DeepSeek: DeepSeek R1 (Direct)',
      provider: 'DeepSeek Direct',
      isFree: false,
      pricing: { prompt: 0.00000055, completion: 0.00000219, label: '$0.55 / $2.19 per 1M' },
      contextLength: 64000,
      description: 'DeepSeek R1 reasoning model with live chain-of-thought.'
    },
    {
      id: 'deepseek-chat',
      name: 'DeepSeek: DeepSeek V3 (Direct)',
      provider: 'DeepSeek Direct',
      isFree: false,
      pricing: { prompt: 0.00000014, completion: 0.00000028, label: '$0.14 / $0.28 per 1M' },
      contextLength: 64000,
      description: 'Ultra-efficient MoE architecture flagship model.'
    },
    {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Anthropic: Claude 3.5 Sonnet',
      provider: 'Anthropic / OpenRouter',
      isFree: false,
      pricing: { prompt: 0.000003, completion: 0.000015, label: '$3.00 / $15.00 per 1M' },
      contextLength: 200000,
      description: 'Industry-leading reasoning, coding, and architectural design capabilities.'
    },
    {
      id: 'openai/gpt-4o',
      name: 'OpenAI: GPT-4o',
      provider: 'OpenAI / OpenRouter',
      isFree: false,
      pricing: { prompt: 0.0000025, completion: 0.00001, label: '$2.50 / $10.00 per 1M' },
      contextLength: 128000,
      description: 'Omni-modal flagship model with balanced speed and multimodal comprehension.'
    }
  ];

  // ==========================================================================
  // SVG Icon Registry (Strictly Pure Geometric SVG - Zero Emojis)
  // ==========================================================================

  const SVG_ICONS = {
    code: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>',
    terminal: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>',
    cpu: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="15" x2="23" y2="15"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="15" x2="4" y2="15"></line></svg>',
    shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
    layers: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>',
    database: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>',
    box: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
    bug: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="8" height="14" x="8" y="5" rx="4"></rect><path d="m19 7-3 2"></path><path d="m5 7 3 2"></path><path d="m19 19-3-2"></path><path d="m5 19 3-2"></path><path d="M20 13h-4"></path><path d="M4 13h4"></path></svg>',
    wrench: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
    zap: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
    file: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
    git: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>',
    plan: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
    trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
    plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
    copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>'
  };

  function getSvgIcon(iconKey) {
    return SVG_ICONS[iconKey] || SVG_ICONS.code;
  }

  // ==========================================================================
  // Built-in Autonomous Agents (Customizable & Extendable)
  // ==========================================================================

  const BUILTIN_AGENTS = [
    {
      id: 'builder',
      name: 'Autonomous App Builder',
      role: 'Builder',
      icon: 'box',
      desc: 'Builds complete large-scale multi-file codebases and full-stack apps step-by-step using autonomous tools and plans.',
      modelOverride: '',
      temperature: 0.5,
      tools: { fileRead: true, fileWrite: true, fileEdit: true, cmdExec: true, planning: true, repoMap: true },
      systemPrompt: 'You are an autonomous Senior Full-Stack Software Engineer capable of building complete, large-scale multi-file codebases and applications from scratch. Follow this strict procedure:\n1. Plan First: Always begin complex projects by formulating an actionable roadmap enclosed in <plan>\n- [ ] Step 1: description\n- [ ] Step 2: description\n</plan>.\n2. Autonomous Execution: Execute files cleanly using structured tool tags: <tool_call name="write_file">{"path": "relative/path.ext", "content": "..."}</tool_call>.\n3. Modify Existing Code: For surgical edits, use <tool_call name="edit_file">{"path": "relative/path.ext", "target": "exact text", "replacement": "new text"}</tool_call>.\n4. Run Shell Commands: To run tests or installs, use <tool_call name="execute_cmd">{"command": "npm test"}</tool_call>.\n5. Zero Filler: Write production-grade, typed, modular code with defensive error boundaries and zero discursive small talk.'
    },
    {
      id: 'coder',
      name: 'Senior Pair Programmer',
      role: 'Coder',
      icon: 'code',
      desc: 'High-precision code implementation, minimal filler, production-grade error handling, and typed interfaces.',
      modelOverride: '',
      temperature: 0.6,
      tools: { fileRead: true, fileWrite: true, fileEdit: true, cmdExec: false, planning: true, repoMap: true },
      systemPrompt: 'You are an expert senior software engineer and pair programmer. Deliver complete, production-grade implementations. Always write defensively with proper error handling, explicit typing, and zero conversational pleasantries. Tag code blocks with file names and languages (e.g. ```javascript:app.js). To modify files on disk directly, use <tool_call name="write_file"> or <tool_call name="edit_file">.'
    },
    {
      id: 'architect',
      name: 'Systems Architect',
      role: 'Architect',
      icon: 'layers',
      desc: 'End-to-end distributed systems design, data contracts, resilience guarantees, and tradeoff matrices.',
      modelOverride: '',
      temperature: 0.7,
      tools: { fileRead: true, fileWrite: true, fileEdit: false, cmdExec: false, planning: true, repoMap: true },
      systemPrompt: 'You are a Senior Principal Systems Architect. Analyze technical problems from first principles: data models, concurrency limits, API boundaries, network failure domains, and scalability bottlenecks. Frame proposals with concrete tradeoff matrices, resilience guarantees, and clean architectural specifications.'
    },
    {
      id: 'debugger',
      name: 'Root-Cause Debugger',
      role: 'Debugger',
      icon: 'bug',
      desc: 'Surgical error diagnosis, reproducing hypotheses, stack trace isolation, and minimal regression-free diffs.',
      modelOverride: '',
      temperature: 0.3,
      tools: { fileRead: true, fileWrite: false, fileEdit: true, cmdExec: true, planning: false, repoMap: true },
      systemPrompt: 'You are a master Debugger and Systems Reliability Engineer. Formulate falsifiable hypotheses for bugs, trace execution pathways through call stacks, test edge conditions (nullability, race conditions, memory leaks), and propose minimal, surgical diff patches that avoid regressions.'
    },
    {
      id: 'auditor',
      name: 'Security & Code Auditor',
      role: 'Auditor',
      icon: 'shield',
      desc: 'Static analysis for vulnerabilities (OWASP top 10, sanitization, concurrency locks, memory safety).',
      modelOverride: '',
      temperature: 0.2,
      tools: { fileRead: true, fileWrite: false, fileEdit: false, cmdExec: false, planning: false, repoMap: true },
      systemPrompt: 'You are a rigorous Security and Performance Code Auditor. Review code against OWASP Top 10, CWE patterns, SQL injection, XSS, SSRF, memory leaks, event loop saturation, and authentication flaws. Point out exact risk severity with concrete proof-of-concept exploits and remediation code.'
    },
    {
      id: 'refactor',
      name: 'Refactoring Specialist',
      role: 'Refactor',
      icon: 'wrench',
      desc: 'Code modernization, DRY abstraction, idiomatic patterns, and unified diff output.',
      modelOverride: '',
      temperature: 0.4,
      tools: { fileRead: true, fileWrite: true, fileEdit: true, cmdExec: false, planning: false, repoMap: true },
      systemPrompt: 'You are an expert in code refactoring, modernization, and clean design patterns. Simplify overly complex abstractions, eliminate dead code, convert to idiomatic modern idioms, and provide unified diff format (diff with - and +) whenever modifying existing code.'
    }
  ];

  // ==========================================================================
  // Application State
  // ==========================================================================

  const state = {
    theme: 'dark',
    providerKey: 'custom',
    provider: { ...PROVIDER_PRESETS.custom },
    apiKey: '',
    baseUrl: 'https://dock-hide-jackson-simulations.trycloudflare.com/v1',
    customAuthHeader: 'none',
    useProxy: 'auto', // 'auto' | 'direct' | 'proxy'

    parameters: {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 4096
    },

    models: [...DEFAULT_MODELS],
    activeModel: DEFAULT_MODELS[0],
    modelTierFilter: 'all', // 'all' | 'free' | 'paid'
    modelSearch: '',

    conversations: [],
    activeConversationId: null,

    // Custom Agents state
    agents: [...BUILTIN_AGENTS],
    activeAgent: BUILTIN_AGENTS[0],
    systemPrompt: BUILTIN_AGENTS[0].systemPrompt,
    contextDocs: [],
    contextStrategy: 'all',

    // Real Workspace State
    workspaceTree: [],
    repoMapSummary: '',
    workspaceOpen: false,
    workspaceWrap: false,
    workspacePreview: false,
    workspaceTabs: [
      {
        id: 'scratchpad.js',
        name: 'scratchpad.js',
        lang: 'javascript',
        code: '// Agentic Code Workspace\n// Code blocks and extracted artifacts appear here.\nconsole.log("Agentic workspace ready.");'
      }
    ],
    activeWorkspaceTabId: 'scratchpad.js',
    attachedFiles: [],

    isStreaming: false,
    abortController: null,
    isDrawerOpen: false,
    isSidebarOpen: true
  };

  // ==========================================================================
  // Smart Provider Auto-Detection from Key or URL
  // ==========================================================================

  function detectProviderFromInput(input) {
    if (!input) return null;
    const trimmed = input.trim();

    // If input is an HTTP / HTTPS URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return { type: 'url', providerKey: 'custom', url: trimmed.replace(/\/+$/, '') };
    }

    // If input is an API key
    if (trimmed.startsWith('AIzaSy') || trimmed.startsWith('AIza')) {
      return { type: 'key', providerKey: 'gemini', key: trimmed };
    }
    if (trimmed.startsWith('sk-or-v1-') || trimmed.startsWith('sk-or-')) {
      return { type: 'key', providerKey: 'openrouter', key: trimmed };
    }
    if (trimmed.startsWith('sk-ant-')) {
      return { type: 'key', providerKey: 'anthropic', key: trimmed };
    }
    if (trimmed.startsWith('gsk_')) {
      return { type: 'key', providerKey: 'groq', key: trimmed };
    }
    if (trimmed.startsWith('xai-')) {
      return { type: 'key', providerKey: 'xai', key: trimmed };
    }
    return null;
  }

  // ==========================================================================
  // LocalStorage Persistence
  // ==========================================================================

  const STORAGE_KEYS = {
    THEME: 'util_chat_theme',
    CONFIG: 'util_chat_config',
    MODELS: 'util_chat_models',
    ACTIVE_MODEL: 'util_chat_active_model',
    CONVERSATIONS: 'util_chat_conversations',
    ACTIVE_CONV: 'util_chat_active_conv',
    SYSTEM_PROMPT: 'util_chat_system_prompt',
    CUSTOM_AGENTS: 'util_chat_custom_agents',
    ACTIVE_AGENT_ID: 'util_chat_active_agent_id',
    PERSONA: 'util_chat_persona',
    WORKSPACE_TABS: 'util_chat_ws_tabs',
    CONTEXT_DOCS: 'util_chat_context_docs',
    CONTEXT_STRATEGY: 'util_chat_context_strategy'
  };

  function loadPersistedState() {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme) state.theme = savedTheme;

      const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        state.providerKey = parsed.providerKey || state.providerKey;
        state.baseUrl = parsed.baseUrl || state.baseUrl;
        state.apiKey = parsed.apiKey || '';
        state.customAuthHeader = parsed.customAuthHeader || 'none';
        state.useProxy = parsed.useProxy || 'auto';
        if (parsed.parameters) state.parameters = { ...state.parameters, ...parsed.parameters };
        state.provider = { ...PROVIDER_PRESETS[state.providerKey] || PROVIDER_PRESETS.custom };
        if (state.baseUrl) state.provider.baseUrl = state.baseUrl;
      }

      const savedModels = localStorage.getItem(STORAGE_KEYS.MODELS);
      if (savedModels) {
        const parsed = JSON.parse(savedModels);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.models = parsed;
        }
      }

      const savedActiveModel = localStorage.getItem(STORAGE_KEYS.ACTIVE_MODEL);
      if (savedActiveModel) {
        const found = state.models.find(m => m.id === savedActiveModel);
        if (found) state.activeModel = found;
      }

      const savedConvs = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (savedConvs) {
        state.conversations = JSON.parse(savedConvs);
      }

      const savedActiveConv = localStorage.getItem(STORAGE_KEYS.ACTIVE_CONV);
      if (savedActiveConv && state.conversations.some(c => c.id === savedActiveConv)) {
        state.activeConversationId = savedActiveConv;
      } else if (state.conversations.length > 0) {
        state.activeConversationId = state.conversations[0].id;
      }

      const savedPrompt = localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT);
      if (savedPrompt !== null) state.systemPrompt = savedPrompt;

      const savedCustomAgents = localStorage.getItem(STORAGE_KEYS.CUSTOM_AGENTS);
      if (savedCustomAgents) {
        try {
          const parsedAgents = JSON.parse(savedCustomAgents);
          if (Array.isArray(parsedAgents) && parsedAgents.length > 0) {
            state.agents = [...BUILTIN_AGENTS, ...parsedAgents];
          }
        } catch (e) {}
      }

      const savedAgentId = localStorage.getItem(STORAGE_KEYS.ACTIVE_AGENT_ID) || localStorage.getItem(STORAGE_KEYS.PERSONA);
      if (savedAgentId) {
        const foundAgent = state.agents.find(a => a.id === savedAgentId);
        if (foundAgent) {
          state.activeAgent = foundAgent;
          if (!savedPrompt) state.systemPrompt = foundAgent.systemPrompt;
        }
      }

      const savedTabs = localStorage.getItem(STORAGE_KEYS.WORKSPACE_TABS);
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
        if (Array.isArray(parsedTabs) && parsedTabs.length > 0) {
          state.workspaceTabs = parsedTabs;
          state.activeWorkspaceTabId = parsedTabs[0].id;
        }
      }

      const savedDocs = localStorage.getItem(STORAGE_KEYS.CONTEXT_DOCS);
      if (savedDocs) state.contextDocs = JSON.parse(savedDocs);

      const savedStrat = localStorage.getItem(STORAGE_KEYS.CONTEXT_STRATEGY);
      if (savedStrat) state.contextStrategy = savedStrat;

    } catch (e) {
      console.warn('Failed to load local storage state:', e);
    }

    if (!state.activeConversationId || state.conversations.length === 0) {
      createConversation();
    }
  }

  function saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({
        providerKey: state.providerKey,
        baseUrl: state.baseUrl,
        apiKey: state.apiKey,
        customAuthHeader: state.customAuthHeader,
        useProxy: state.useProxy,
        parameters: state.parameters
      }));
    } catch (e) {}
  }

  function saveModels() {
    try {
      localStorage.setItem(STORAGE_KEYS.MODELS, JSON.stringify(state.models));
      if (state.activeModel) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_MODEL, state.activeModel.id);
      }
    } catch (e) {}
  }

  function saveConversations() {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(state.conversations));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONV, state.activeConversationId || '');
    } catch (e) {}
  }

  function saveContextState() {
    try {
      localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, state.systemPrompt);
      localStorage.setItem(STORAGE_KEYS.CONTEXT_DOCS, JSON.stringify(state.contextDocs));
      localStorage.setItem(STORAGE_KEYS.CONTEXT_STRATEGY, state.contextStrategy);
    } catch (e) {}
  }

  // ==========================================================================
  // Conversation Helpers
  // ==========================================================================

  function getActiveConversation() {
    return state.conversations.find(c => c.id === state.activeConversationId);
  }

  function createConversation(title = 'New Session') {
    const newConv = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      title: title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    state.conversations.unshift(newConv);
    state.activeConversationId = newConv.id;
    saveConversations();
    renderConversationsList();
    renderMessages();
    updateContextMetrics();
    return newConv;
  }

  function deleteConversation(id, event) {
    if (event) event.stopPropagation();
    state.conversations = state.conversations.filter(c => c.id !== id);
    if (state.conversations.length === 0) {
      createConversation();
    } else if (state.activeConversationId === id) {
      state.activeConversationId = state.conversations[0].id;
    }
    saveConversations();
    renderConversationsList();
    renderMessages();
    updateContextMetrics();
    showToast('Conversation deleted');
  }

  function renameConversation(id, event) {
    if (event) event.stopPropagation();
    const conv = state.conversations.find(c => c.id === id);
    if (!conv) return;
    const newTitle = prompt('Enter new conversation title:', conv.title);
    if (newTitle && newTitle.trim()) {
      conv.title = newTitle.trim();
      saveConversations();
      renderConversationsList();
    }
  }

  function clearActiveConversation() {
    const conv = getActiveConversation();
    if (!conv) return;
    if (confirm('Clear all messages in this conversation?')) {
      conv.messages = [];
      saveConversations();
      renderMessages();
      updateContextMetrics();
      showToast('Session cleared');
    }
  }

  // ==========================================================================
  // Dynamic Model Fetcher & Free / Paid Parser
  // ==========================================================================

  async function fetchModelsFromApi() {
    const btn = document.getElementById('btn-fetch-models');
    const statusText = document.getElementById('fetch-status-text');
    const spinner = document.getElementById('fetch-spinner');

    if (btn) btn.disabled = true;
    if (statusText) statusText.textContent = 'Fetching...';
    if (spinner) spinner.style.animation = 'cursorBlink 0.5s infinite';

    try {
      const preset = PROVIDER_PRESETS[state.providerKey] || PROVIDER_PRESETS.custom;
      let targetUrl = (state.baseUrl || preset.baseUrl || '').trim().replace(/\/+$/, '');

      if (!targetUrl && state.providerKey !== 'gemini' && state.providerKey !== 'openrouter' && state.providerKey !== 'anthropic') {
        throw new Error('Base URL cannot be empty. Please enter an API endpoint or tunnel URL.');
      }

      const headers = { 'Accept': 'application/json' };
      if (state.apiKey && state.apiKey.trim()) {
        if (state.providerKey === 'gemini') {
          headers['x-goog-api-key'] = state.apiKey.trim();
        } else if (state.providerKey === 'anthropic') {
          headers['x-api-key'] = state.apiKey.trim();
          headers['anthropic-version'] = '2023-06-01';
          headers['anthropic-dangerous-direct-browser-access'] = 'true';
        } else {
          headers['Authorization'] = `Bearer ${state.apiKey.trim()}`;
        }
      }

      // Build candidate endpoints in priority order
      const candidates = [];
      if (state.providerKey === 'gemini') {
        candidates.push(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(state.apiKey || '')}`);
      } else if (state.providerKey === 'openrouter') {
        candidates.push('https://openrouter.ai/api/v1/models');
      } else if (state.providerKey === 'anthropic') {
        candidates.push('https://api.anthropic.com/v1/models');
      } else {
        // OpenAI-compatible / Custom / Cloudflare Tunnel / Ollama / Local
        const cleanBase = targetUrl.replace(/\/models$/, '').replace(/\/chat\/completions$/, '');
        if (cleanBase.endsWith('/v1')) {
          candidates.push(`${cleanBase}/models`);
          candidates.push(`${cleanBase.replace(/\/v1$/, '')}/api/tags`);
          candidates.push(`${cleanBase.replace(/\/v1$/, '')}/models`);
        } else {
          // Check standard /v1/models first, then Ollama /api/tags, then bare /models
          candidates.push(`${cleanBase}/v1/models`);
          candidates.push(`${cleanBase}/api/tags`);
          candidates.push(`${cleanBase}/models`);
          candidates.push(`${cleanBase}/api/models`);
        }
      }

      let parsedModels = [];
      let successfulEndpoint = '';
      let lastError = null;

      for (const endpointUrl of candidates) {
        try {
          let response;
          const shouldTryProxy = state.useProxy === 'proxy' || 
            (state.useProxy === 'auto' && (state.providerKey === 'anthropic' || window.location.protocol === 'file:' || endpointUrl.includes('cloudflare') || endpointUrl.includes('localhost') || endpointUrl.includes('127.0.0.1')));

          if (shouldTryProxy) {
            try {
              response = await fetch('/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: endpointUrl,
                  method: 'GET',
                  headers: headers
                })
              });
            } catch (e) {
              console.warn(`Proxy fetch failed for ${endpointUrl}, trying direct:`, e);
            }
          }

          if (!response || !response.ok) {
            try {
              response = await fetch(endpointUrl, { method: 'GET', headers: headers });
            } catch (e) {
              lastError = e;
              continue;
            }
          }

          if (!response || !response.ok) {
            lastError = new Error(`HTTP ${response ? response.status : 'No response'} on ${endpointUrl}`);
            continue;
          }

          const rawText = await response.text();
          let json;
          try {
            json = JSON.parse(rawText);
          } catch (e) {
            lastError = new Error(`Non-JSON response on ${endpointUrl}: ${rawText.slice(0, 80)}`);
            continue;
          }

          const models = parseModelCatalog(json, state.providerKey);
          if (models.length > 0) {
            parsedModels = models;
            successfulEndpoint = endpointUrl;
            break;
          }
        } catch (candidateErr) {
          lastError = candidateErr;
        }
      }

      if (parsedModels.length === 0) {
        throw lastError || new Error(`Could not fetch models from ${targetUrl}. Tried: ${candidates.join(', ')}`);
      }

      // If /v1/models succeeded and state.baseUrl did not have /v1, normalize state.baseUrl to /v1
      if (successfulEndpoint.endsWith('/v1/models') && !state.baseUrl.endsWith('/v1')) {
        const cleanBase = targetUrl.replace(/\/models$/, '').replace(/\/chat\/completions$/, '');
        state.baseUrl = cleanBase + '/v1';
        saveConfig();
        const quickBaseInput = document.getElementById('quick-base-url-input');
        if (quickBaseInput) quickBaseInput.value = state.baseUrl;
        const cfgBaseInput = document.getElementById('cfg-base-url');
        if (cfgBaseInput) cfgBaseInput.value = state.baseUrl;
      }

      state.models = parsedModels;
      const existing = state.models.find(m => m.id === state.activeModel?.id);
      state.activeModel = existing || state.models[0];

      saveModels();
      renderModelList();
      updateHeaderModelDisplay();
      updateQuickSetupCard();
      updateContextMetrics();
      showToast(`Loaded ${parsedModels.length} models from endpoint!`);

    } catch (err) {
      console.error('Model fetch error:', err);
      let errorMsg = err.message || 'Network error';
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        errorMsg += ' (Check tunnel status or endpoint URL).';
      }
      showToast(`Fetch Failed: ${errorMsg}`, 'error');
    } finally {
      if (btn) btn.disabled = false;
      if (statusText) statusText.textContent = 'Fetch Models';
      if (spinner) spinner.style.animation = 'none';
    }
  }

  /**
   * Universal Model Parser
   */
  function parseModelCatalog(json, providerKey) {
    const list = [];
    const isSelfHosted = (state.baseUrl || '').includes('cloudflare') || 
      (state.baseUrl || '').includes('localhost') || 
      (state.baseUrl || '').includes('127.0.0.1') || 
      providerKey === 'custom' || 
      providerKey === 'ollama';

    // 1. Ollama /api/tags: { models: [...] } where models have digest, size or details without supportedGenerationMethods
    if (json.models && Array.isArray(json.models) && json.models.some(m => m.digest || m.details || (m.size !== undefined && !m.supportedGenerationMethods))) {
      json.models.forEach(item => {
        const id = item.name || item.model;
        if (!id) return;
        const sizeGb = item.size ? ` (${(item.size / (1024 * 1024 * 1024)).toFixed(1)} GB)` : '';
        const paramSize = item.details?.parameter_size ? ` - ${item.details.parameter_size}` : '';
        list.push({
          id: id,
          name: id,
          provider: isSelfHosted ? 'Self-Hosted (Ollama)' : 'Ollama',
          isFree: true,
          pricing: { prompt: 0, completion: 0, label: 'Free (Local)' },
          contextLength: 32768,
          description: `Self-hosted Ollama model${paramSize}${sizeGb}.`
        });
      });
    }
    // 2. Google Gemini models: { models: [...] }
    else if (json.models && Array.isArray(json.models)) {
      json.models.forEach(item => {
        const id = item.name.replace(/^models\//, '');
        const methods = item.supportedGenerationMethods || [];
        if (methods.length > 0 && !methods.includes('generateContent')) return;

        const isExp = id.includes('exp') || id.includes('flash') || id.includes('thinking') || id.includes('learnlm');
        list.push({
          id: id,
          name: item.displayName || id,
          provider: 'Google AI Studio',
          isFree: true,
          pricing: { prompt: 0, completion: 0, label: isExp ? 'Free (Exp)' : 'Free Tier' },
          contextLength: item.inputTokenLimit || 1048576,
          description: item.description || `Experimental Gemini model (${id}).`
        });
      });
    }
    // 3. OpenRouter / OpenAI / Ollama /v1/models standard structure: { data: [...] }
    else if (json.data && Array.isArray(json.data)) {
      json.data.forEach(item => {
        const id = item.id;
        if (!id) return;
        const name = item.name || item.id;
        let isFree = isSelfHosted;
        let pricingLabel = isSelfHosted ? 'Free (Local)' : 'Paid';
        let promptPrice = 0;
        let compPrice = 0;

        if (item.pricing) {
          promptPrice = parseFloat(item.pricing.prompt || 0);
          compPrice = parseFloat(item.pricing.completion || 0);

          if (promptPrice === 0 && compPrice === 0) {
            isFree = true;
            pricingLabel = 'Free';
          } else {
            const prompt1M = (promptPrice * 1000000).toFixed(2);
            const comp1M = (compPrice * 1000000).toFixed(2);
            pricingLabel = `$${prompt1M} / $${comp1M} per 1M`;
          }
        }

        if (id.endsWith(':free') || id.includes('-free') || id.includes('/free')) {
          isFree = true;
          pricingLabel = 'Free';
        }

        const contextLength = item.context_length || item.max_tokens || 32768;

        list.push({
          id: id,
          name: name,
          provider: isSelfHosted ? 'Self-Hosted Tunnel' : (item.owned_by || providerKey),
          isFree: isFree,
          pricing: {
            prompt: promptPrice,
            completion: compPrice,
            label: pricingLabel
          },
          contextLength: contextLength,
          description: item.description || `Model ${id} on ${isSelfHosted ? 'Self-Hosted Server' : 'API'}.`
        });
      });
    }
    // 4. Raw array format: [{ id: "...", ... }]
    else if (Array.isArray(json)) {
      json.forEach(item => {
        const id = typeof item === 'string' ? item : (item.id || item.name || item.model);
        if (!id) return;
        list.push({
          id: id,
          name: id,
          provider: isSelfHosted ? 'Self-Hosted Tunnel' : providerKey,
          isFree: isSelfHosted,
          pricing: { prompt: 0, completion: 0, label: isSelfHosted ? 'Free (Local)' : 'Custom' },
          contextLength: 32768,
          description: `Model ${id} on endpoint.`
        });
      });
    }

    // Sort: Free models first, then alphabetically
    list.sort((a, b) => {
      if (a.isFree && !b.isFree) return -1;
      if (!a.isFree && b.isFree) return 1;
      return a.name.localeCompare(b.name);
    });

    return list;
  }

  // ==========================================================================
  // Context Engine & Payload Assembly
  // ==========================================================================

  function calculateActiveTokens() {
    const systemTokens = MarkdownRenderer.estimateTokens(state.systemPrompt);

    let docTokens = 0;
    state.contextDocs.forEach(d => {
      if (d.active) {
        docTokens += (d.tokens || MarkdownRenderer.estimateTokens(d.content));
      }
    });

    const conv = getActiveConversation();
    let historyTokens = 0;
    if (conv && conv.messages) {
      conv.messages.forEach(m => {
        if (!m.excludeFromContext) {
          historyTokens += (m.tokens || MarkdownRenderer.estimateTokens(m.content));
        }
      });
    }

    const totalUsed = systemTokens + docTokens + historyTokens;
    const maxContext = state.activeModel?.contextLength || 32768;
    const percentage = Math.min(100, Math.round((totalUsed / maxContext) * 100));

    return {
      systemTokens,
      docTokens,
      historyTokens,
      totalUsed,
      maxContext,
      percentage
    };
  }

  function updateContextMetrics() {
    const metrics = calculateActiveTokens();

    const statsEl = document.getElementById('header-context-stats');
    const fillEl = document.getElementById('header-context-fill');
    if (statsEl) {
      const maxK = metrics.maxContext >= 1000000 
        ? (metrics.maxContext / 1000000).toFixed(1) + 'M' 
        : Math.round(metrics.maxContext / 1000) + 'k';
      statsEl.textContent = `${metrics.totalUsed.toLocaleString()} / ${maxK} (${metrics.percentage}%)`;
    }
    if (fillEl) {
      fillEl.style.width = Math.max(2, metrics.percentage) + '%';
      fillEl.classList.toggle('warn', metrics.percentage > 70 && metrics.percentage <= 90);
      fillEl.classList.toggle('danger', metrics.percentage > 90);
    }

    const dMax = document.getElementById('drawer-max-tokens');
    const dSys = document.getElementById('drawer-system-tokens');
    const dDocs = document.getElementById('drawer-docs-tokens');
    const dHist = document.getElementById('drawer-history-tokens');
    const dTotal = document.getElementById('drawer-total-usage');
    const sysPill = document.getElementById('system-token-pill');

    if (dMax) dMax.textContent = metrics.maxContext.toLocaleString() + ' tokens';
    if (dSys) dSys.textContent = `~${metrics.systemTokens.toLocaleString()} tokens`;
    if (dDocs) dDocs.textContent = `~${metrics.docTokens.toLocaleString()} tokens`;
    if (dHist) dHist.textContent = `~${metrics.historyTokens.toLocaleString()} tokens`;
    if (dTotal) dTotal.textContent = `${metrics.totalUsed.toLocaleString()} (${metrics.percentage}%)`;
    if (sysPill) sysPill.textContent = `~${metrics.systemTokens.toLocaleString()} tokens`;
  }

  function buildContextPayload() {
    const messages = [];
    let fullSystemInstructions = state.systemPrompt.trim();

    // 1. Attach Compact Repository Map (Zero Context Loss for Large Codebases)
    if (state.activeAgent?.tools?.repoMap && state.repoMapSummary) {
      fullSystemInstructions += `\n\n<current_workspace_map>\n${state.repoMapSummary}\n</current_workspace_map>\n`;
    }

    // 2. Attach Agent Autonomous Execution Protocol
    const activeTools = state.activeAgent?.tools || {};
    if (activeTools.fileWrite || activeTools.fileEdit || activeTools.cmdExec || activeTools.fileRead || activeTools.planning) {
      let protocol = '\n\n<agent_tool_protocol>\n';
      protocol += 'You have autonomous workspace tools enabled. When generating project files or changes, ALWAYS use structured tool tags so they can be executed directly to disk:\n';
      if (activeTools.planning) {
        protocol += '- To formulate project roadmaps: <plan>\n- [ ] Phase 1: description\n- [ ] Phase 2: description\n</plan>\n';
      }
      if (activeTools.fileWrite) {
        protocol += '- To create or write full files: <tool_call name="write_file">{"path": "relative/path.ext", "content": "..."}</tool_call>\n';
      }
      if (activeTools.fileEdit) {
        protocol += '- To surgically edit files: <tool_call name="edit_file">{"path": "relative/path.ext", "target": "exact text", "replacement": "new text"}</tool_call>\n';
      }
      if (activeTools.cmdExec) {
        protocol += '- To run terminal commands/tests: <tool_call name="execute_cmd">{"command": "command line"}</tool_call>\n';
      }
      if (activeTools.fileRead) {
        protocol += '- To inspect existing files: <tool_call name="read_file">{"path": "relative/path.ext"}</tool_call>\n';
      }
      protocol += '</agent_tool_protocol>\n';
      fullSystemInstructions += protocol;
    }

    const activeDocs = state.contextDocs.filter(d => d.active);
    if (activeDocs.length > 0) {
      let docBlocks = '\n\n<context_documents>\n';
      activeDocs.forEach((doc, idx) => {
        docBlocks += `--- [Document ${idx + 1}: ${doc.title}] ---\n${doc.content}\n\n`;
      });
      docBlocks += '</context_documents>\n';
      fullSystemInstructions += docBlocks;
    }

    if (fullSystemInstructions && state.providerKey !== 'anthropic' && state.providerKey !== 'gemini') {
      messages.push({
        role: 'system',
        content: fullSystemInstructions
      });
    }

    const conv = getActiveConversation();
    if (conv && conv.messages && conv.messages.length > 0) {
      let activeMsgs = conv.messages.filter(m => !m.excludeFromContext);

      if (state.contextStrategy === 'sliding-10') {
        activeMsgs = activeMsgs.slice(-10);
      } else if (state.contextStrategy === 'sliding-6') {
        activeMsgs = activeMsgs.slice(-6);
      } else if (state.contextStrategy === 'sliding-4') {
        activeMsgs = activeMsgs.slice(-4);
      } else if (state.contextStrategy.startsWith('budget-')) {
        const budget = state.contextStrategy === 'budget-16k' ? 16000 : 32000;
        let cumulativeTokens = 0;
        const kept = [];
        for (let i = activeMsgs.length - 1; i >= 0; i--) {
          const tok = activeMsgs[i].tokens || MarkdownRenderer.estimateTokens(activeMsgs[i].content);
          if (cumulativeTokens + tok > budget && kept.length > 0) break;
          cumulativeTokens += tok;
          kept.unshift(activeMsgs[i]);
        }
        activeMsgs = kept;
      }

      activeMsgs.forEach(m => {
        messages.push({
          role: m.role,
          content: m.content
        });
      });
    }

    return {
      systemText: fullSystemInstructions,
      messages: messages
    };
  }

  // ==========================================================================
  // Universal Streaming & Chat Runner
  // ==========================================================================

  async function sendMessage() {
    const textarea = document.getElementById('chat-textarea');
    const inputContent = textarea.value.trim();
    if (!inputContent || state.isStreaming) return;

    const conv = getActiveConversation();
    if (!conv) return;

    let finalContent = inputContent;
    if (state.attachedFiles && state.attachedFiles.length > 0) {
      let fileContext = '\n\n### Attached Files & Code Context:\n';
      state.attachedFiles.forEach(f => {
        fileContext += `\n\`\`\`${f.lang || ''}:${f.name}\n${f.content}\n\`\`\`\n`;
      });
      finalContent = inputContent + fileContext;
      state.attachedFiles = [];
      renderAttachedFiles();
    }

    const userTokens = MarkdownRenderer.estimateTokens(finalContent);
    const userMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: finalContent,
      tokens: userTokens,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      excludeFromContext: false
    };

    conv.messages.push(userMessage);
    conv.updatedAt = new Date().toISOString();
    if (conv.messages.length === 1) {
      conv.title = inputContent.slice(0, 32) + (inputContent.length > 32 ? '...' : '');
    }

    textarea.value = '';
    textarea.style.height = 'auto';
    document.getElementById('input-token-counter').textContent = '~0 tokens';

    saveConversations();
    renderConversationsList();
    renderMessages();
    updateContextMetrics();

    const assistantMessage = {
      id: 'msg_' + (Date.now() + 1),
      role: 'assistant',
      content: '',
      model: state.activeModel?.name || 'Model',
      tokens: 0,
      latency: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      excludeFromContext: false,
      isStreaming: true
    };
    conv.messages.push(assistantMessage);
    renderMessages();

    state.isStreaming = true;
    state.abortController = new AbortController();
    toggleStreamingControls(true);

    const startTime = performance.now();

    try {
      await executeApiStream(assistantMessage);
    } catch (err) {
      if (err.name === 'AbortError') {
        assistantMessage.content += '\n\n*(Generation stopped by user)*';
      } else {
        console.error('Chat generation error:', err);
        assistantMessage.content += `\n\n**Error:** ${err.message || 'Request failed'}`;
        showToast(err.message || 'Generation error', 'error');
      }
    } finally {
      if (assistantMessage._inReasoning) {
        assistantMessage.content += '\n</think>\n\n';
        assistantMessage._inReasoning = false;
      }
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      assistantMessage.latency = elapsed;
      assistantMessage.tokens = MarkdownRenderer.estimateTokens(assistantMessage.content);
      assistantMessage.isStreaming = false;

      state.isStreaming = false;
      state.abortController = null;
      toggleStreamingControls(false);

      saveConversations();
      renderMessages();
      updateContextMetrics();
    }
  }

  async function executeApiStream(assistantMessage) {
    const payloadInfo = buildContextPayload();
    const preset = PROVIDER_PRESETS[state.providerKey] || PROVIDER_PRESETS.custom;
    const targetUrl = (state.baseUrl || preset.baseUrl || '').replace(/\/+$/, '');

    let endpoint = '';
    let headers = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    };
    let requestBody = {};

    // 1. Google Gemini / AI Studio
    if (state.providerKey === 'gemini') {
      const cleanModelId = (state.activeModel?.id || 'gemini-2.0-flash-exp').replace(/^models\//, '');
      endpoint = `${targetUrl}/models/${cleanModelId}:streamGenerateContent?key=${encodeURIComponent(state.apiKey)}&alt=sse`;
      if (state.apiKey) headers['x-goog-api-key'] = state.apiKey;

      const geminiContents = [];
      payloadInfo.messages.forEach(m => {
        if (m.role === 'system') return;
        geminiContents.push({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content || ' ' }]
        });
      });

      if (geminiContents.length === 0 || geminiContents[0].role !== 'user') {
        geminiContents.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
      }

      requestBody = {
        contents: geminiContents,
        generationConfig: {
          temperature: state.parameters.temperature,
          topP: state.parameters.topP,
          maxOutputTokens: state.parameters.maxTokens
        }
      };

      if (payloadInfo.systemText && payloadInfo.systemText.trim()) {
        requestBody.systemInstruction = {
          parts: [{ text: payloadInfo.systemText.trim() }]
        };
      }
    }
    // 2. Anthropic Provider
    else if (state.providerKey === 'anthropic') {
      endpoint = targetUrl.endsWith('/') ? `${targetUrl}messages` : `${targetUrl}/messages`;
      headers['x-api-key'] = state.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      headers['anthropic-dangerous-direct-browser-access'] = 'true';

      requestBody = {
        model: state.activeModel?.id || 'claude-3-5-sonnet-20241022',
        system: payloadInfo.systemText,
        messages: payloadInfo.messages.filter(m => m.role !== 'system'),
        max_tokens: state.parameters.maxTokens,
        temperature: state.parameters.temperature,
        stream: true
      };
    }
    // 3. OpenAI / Cloudflare Tunnel / Ollama / DeepSeek / Custom
    else {
      let endpointUrl = targetUrl;
      if (!endpointUrl.endsWith('/chat/completions')) {
        if (endpointUrl.endsWith('/v1')) {
          endpointUrl += '/chat/completions';
        } else {
          endpointUrl += '/v1/chat/completions';
        }
      }
      endpoint = endpointUrl;
      
      // CRITICAL FIX: Only send Authorization header if apiKey is genuinely non-empty!
      if (state.apiKey && state.apiKey.trim()) {
        headers['Authorization'] = `Bearer ${state.apiKey.trim()}`;
      }
      if (state.providerKey === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin || 'http://localhost:3000';
        headers['X-Title'] = 'Utilitarian LLM Workspace';
      }

      // CRITICAL FIX: Ensure model field is always populated with a real model name
      const modelId = state.activeModel?.id || 'agentic-uncensored-coder:latest';

      requestBody = {
        model: modelId,
        messages: payloadInfo.messages,
        temperature: state.parameters.temperature,
        stream: true
      };

      if (state.parameters.maxTokens) {
        requestBody.max_tokens = state.parameters.maxTokens;
      }
    }

    // Proxy Routing check
    const shouldTryProxy = state.useProxy === 'proxy' || 
      (state.useProxy === 'auto' && (state.providerKey === 'anthropic' || window.location.protocol === 'file:'));

    let fetchResponse;
    if (shouldTryProxy) {
      try {
        fetchResponse = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: endpoint,
            method: 'POST',
            headers: headers,
            body: requestBody
          }),
          signal: state.abortController.signal
        });
      } catch (err) {
        console.warn('Proxy fetch failed, attempting direct fetch:', err);
      }
    }

    if (!fetchResponse) {
      fetchResponse = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        signal: state.abortController.signal
      });
    }

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      let msg = `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.error?.message) msg = `HTTP ${fetchResponse.status} - ${parsed.error.message}`;
      } catch (e) {
        if (errorText) msg += ` - ${errorText.slice(0, 150)}`;
      }
      throw new Error(msg);
    }

    // Stream Reader
    const reader = fetchResponse.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed.startsWith('data: ')) {
          const rawData = trimmed.slice(6);
          if (rawData === '[DONE]') break;

          try {
            const parsed = JSON.parse(rawData);

            // OpenAI / Ollama / Cloudflare tunnel chunk
            if (parsed.choices && parsed.choices[0]) {
              const delta = parsed.choices[0].delta;
              if (delta.reasoning_content) {
                if (!assistantMessage._inReasoning) {
                  assistantMessage.content += '<think>\n';
                  assistantMessage._inReasoning = true;
                }
                assistantMessage.content += delta.reasoning_content;
                renderLiveStreamingContent(assistantMessage);
              } else if (delta.content) {
                if (assistantMessage._inReasoning) {
                  assistantMessage.content += '\n</think>\n\n';
                  assistantMessage._inReasoning = false;
                }
                assistantMessage.content += delta.content;
                renderLiveStreamingContent(assistantMessage);
              }
            }
            // Anthropic chunk
            else if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              assistantMessage.content += parsed.delta.text;
              renderLiveStreamingContent(assistantMessage);
            }
            // Google Gemini chunk
            else if (parsed.candidates && parsed.candidates[0]?.content?.parts) {
              for (const part of parsed.candidates[0].content.parts) {
                if (part.text) {
                  assistantMessage.content += part.text;
                  renderLiveStreamingContent(assistantMessage);
                }
              }
            }
          } catch (e) {}
        }
      }
    }
  }

  function renderLiveStreamingContent(msg) {
    const msgEl = document.getElementById(`body-${msg.id}`);
    if (msgEl) {
      msgEl.innerHTML = MarkdownRenderer.render(msg.content) + '<span class="streaming-cursor"></span>';
      const scrollArea = document.getElementById('chat-scroll-area');
      if (scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < 120) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }

  function toggleStreamingControls(isStreaming) {
    const btnSend = document.getElementById('btn-send-message');
    const btnStop = document.getElementById('btn-stop-stream');
    if (btnSend && btnStop) {
      btnSend.style.display = isStreaming ? 'none' : 'inline-flex';
      btnStop.style.display = isStreaming ? 'inline-flex' : 'none';
    }
  }

  // ==========================================================================
  // UI Rendering Functions
  // ==========================================================================

  function renderConversationsList() {
    const list = document.getElementById('chat-history-list');
    if (!list) return;

    list.innerHTML = '';
    state.conversations.forEach(conv => {
      const li = document.createElement('li');
      li.className = `history-item ${conv.id === state.activeConversationId ? 'active' : ''}`;
      li.onclick = () => {
        state.activeConversationId = conv.id;
        saveConversations();
        renderConversationsList();
        renderMessages();
        updateContextMetrics();
      };

      const titleSpan = document.createElement('span');
      titleSpan.className = 'history-item-title';
      titleSpan.textContent = conv.title || 'Untitled Session';
      li.appendChild(titleSpan);

      const actions = document.createElement('div');
      actions.className = 'history-item-actions';

      const btnRename = document.createElement('button');
      btnRename.className = 'btn-icon-subtle';
      btnRename.title = 'Rename';
      btnRename.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
      btnRename.onclick = (e) => renameConversation(conv.id, e);
      actions.appendChild(btnRename);

      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn-icon-subtle';
      btnDelete.title = 'Delete';
      btnDelete.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
      btnDelete.onclick = (e) => deleteConversation(conv.id, e);
      actions.appendChild(btnDelete);

      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  function renderMessages() {
    const list = document.getElementById('messages-list');
    const emptyState = document.getElementById('chat-empty-state');
    if (!list) return;

    const conv = getActiveConversation();
    if (!conv || conv.messages.length === 0) {
      list.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      updateQuickSetupCard();
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    list.innerHTML = '';

    conv.messages.forEach(msg => {
      const row = document.createElement('div');
      row.className = `message-row ${msg.role} ${msg.excludeFromContext ? 'context-muted' : ''}`;
      row.id = `msg-row-${msg.id}`;
      row.setAttribute('data-message-id', msg.id);

      const header = document.createElement('div');
      header.className = 'message-header';

      const authorGroup = document.createElement('div');
      authorGroup.className = 'message-author-group';

      const roleSpan = document.createElement('span');
      roleSpan.className = `author-role ${msg.role}`;
      roleSpan.textContent = msg.role === 'user' ? 'You' : 'Assistant';
      authorGroup.appendChild(roleSpan);

      if (msg.role === 'assistant' && msg.model) {
        const modelTag = document.createElement('span');
        modelTag.className = 'message-model-tag';
        modelTag.textContent = msg.model;
        authorGroup.appendChild(modelTag);
      }

      header.appendChild(authorGroup);

      const meta = document.createElement('div');
      meta.className = 'message-meta-actions';

      if (msg.tokens) {
        const tokSpan = document.createElement('span');
        tokSpan.className = 'message-metric';
        tokSpan.textContent = `~${msg.tokens} tok`;
        meta.appendChild(tokSpan);
      }

      if (msg.latency) {
        const latSpan = document.createElement('span');
        latSpan.className = 'message-metric';
        latSpan.textContent = `${msg.latency}s`;
        meta.appendChild(latSpan);
      }

      const btnMute = document.createElement('button');
      btnMute.className = `btn-msg-action ${msg.excludeFromContext ? 'active-muted' : ''}`;
      btnMute.title = msg.excludeFromContext ? 'Click to include in prompt context' : 'Exclude from prompt context to save tokens';
      btnMute.innerHTML = msg.excludeFromContext 
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg> Muted`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> In Context`;
      btnMute.onclick = () => toggleMessageContextMute(msg.id);
      meta.appendChild(btnMute);

      const btnCopy = document.createElement('button');
      btnCopy.className = 'btn-msg-action';
      btnCopy.title = 'Copy text';
      btnCopy.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
      btnCopy.onclick = () => copyText(msg.content, btnCopy);
      meta.appendChild(btnCopy);

      header.appendChild(meta);
      row.appendChild(header);

      const body = document.createElement('div');
      body.className = 'message-body';
      body.id = `body-${msg.id}`;
      body.innerHTML = MarkdownRenderer.render(msg.content);
      if (msg.isStreaming) {
        body.innerHTML += '<span class="streaming-cursor"></span>';
      }
      row.appendChild(body);

      list.appendChild(row);
    });

    const scrollArea = document.getElementById('chat-scroll-area');
    scrollArea.scrollTop = scrollArea.scrollHeight;
  }

  function toggleMessageContextMute(msgId) {
    const conv = getActiveConversation();
    if (!conv) return;
    const msg = conv.messages.find(m => m.id === msgId);
    if (!msg) return;

    msg.excludeFromContext = !msg.excludeFromContext;
    saveConversations();
    renderMessages();
    updateContextMetrics();
    showToast(msg.excludeFromContext ? 'Excluded from context window' : 'Re-included in context window');
  }

  function updateHeaderModelDisplay() {
    const nameEl = document.getElementById('header-model-name');
    const badgeEl = document.getElementById('header-tier-badge');
    if (!nameEl || !badgeEl || !state.activeModel) return;

    nameEl.textContent = state.activeModel.name;
    badgeEl.textContent = state.activeModel.isFree ? 'Free' : 'Paid';
    badgeEl.className = `badge-tier ${state.activeModel.isFree ? 'free' : 'paid'}`;

    const providerLabel = document.getElementById('header-provider-label');
    const keyDot = document.getElementById('header-key-dot');
    const preset = PROVIDER_PRESETS[state.providerKey] || PROVIDER_PRESETS.custom;
    if (providerLabel) {
      providerLabel.textContent = (state.baseUrl && state.baseUrl.includes('cloudflare'))
        ? 'Cloudflare Tunnel' 
        : preset.name.split(' (')[0];
    }
    if (keyDot) {
      keyDot.className = `status-dot-sm active`;
    }
  }

  function updateQuickSetupCard() {
    const quickSelect = document.getElementById('quick-provider-select');
    const quickBaseUrlInput = document.getElementById('quick-base-url-input');
    const quickKeyInput = document.getElementById('quick-api-key-input');
    const quickDot = document.getElementById('quick-api-dot');
    const quickBadge = document.getElementById('quick-api-status-badge');
    const quickModelLabel = document.getElementById('quick-current-model-label');
    const quickTierLabel = document.getElementById('quick-current-tier-label');

    if (quickSelect) quickSelect.value = state.providerKey;
    if (quickBaseUrlInput) quickBaseUrlInput.value = state.baseUrl || '';
    if (quickKeyInput && state.apiKey) quickKeyInput.value = state.apiKey;

    if (quickDot) quickDot.className = `status-dot active`;
    if (quickBadge) {
      const isTunnel = (state.baseUrl || '').includes('cloudflare');
      quickBadge.textContent = isTunnel ? 'Tunnel Connected' : (state.apiKey ? 'Key Set' : 'Self-Hosted Ready');
      quickBadge.className = `badge-tier free`;
    }
    if (quickModelLabel && state.activeModel) {
      quickModelLabel.textContent = state.activeModel.name;
    }
    if (quickTierLabel && state.activeModel) {
      quickTierLabel.textContent = state.activeModel.isFree ? 'Free' : 'Paid';
    }
  }

  function renderModelList() {
    const container = document.getElementById('model-list-container');
    const countAll = document.getElementById('count-all');
    const countFree = document.getElementById('count-free');
    const countPaid = document.getElementById('count-paid');

    if (!container) return;

    const totalCount = state.models.length;
    const freeCount = state.models.filter(m => m.isFree).length;
    const paidCount = totalCount - freeCount;

    if (countAll) countAll.textContent = totalCount;
    if (countFree) countFree.textContent = freeCount;
    if (countPaid) countPaid.textContent = paidCount;

    let filtered = state.models.filter(m => {
      if (state.modelTierFilter === 'free' && !m.isFree) return false;
      if (state.modelTierFilter === 'paid' && m.isFree) return false;
      if (state.modelSearch) {
        const q = state.modelSearch.toLowerCase();
        const matchesId = m.id.toLowerCase().includes(q);
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesDesc = (m.description || '').toLowerCase().includes(q);
        return matchesId || matchesName || matchesDesc;
      }
      return true;
    });

    container.innerHTML = '';

    if (filtered.length === 0) {
      container.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">No models match your filter. Use the input bar above to inject any model ID!</div>`;
      return;
    }

    filtered.forEach(model => {
      const isSelected = state.activeModel && state.activeModel.id === model.id;
      const card = document.createElement('div');
      card.className = `model-card-item ${isSelected ? 'selected' : ''}`;
      card.onclick = () => {
        state.activeModel = model;
        saveModels();
        updateHeaderModelDisplay();
        updateQuickSetupCard();
        updateContextMetrics();
        renderModelList();
      };

      const main = document.createElement('div');
      main.className = 'model-card-main';

      const titleRow = document.createElement('div');
      titleRow.className = 'model-card-title-row';

      const tierBadge = document.createElement('span');
      tierBadge.className = `badge-tier ${model.isFree ? 'free' : 'paid'}`;
      tierBadge.textContent = model.isFree ? 'Free' : 'Paid';
      titleRow.appendChild(tierBadge);

      const nameSpan = document.createElement('span');
      nameSpan.className = 'model-card-name';
      nameSpan.textContent = model.name;
      titleRow.appendChild(nameSpan);

      main.appendChild(titleRow);

      const idSpan = document.createElement('span');
      idSpan.className = 'model-card-id';
      idSpan.textContent = model.id;
      main.appendChild(idSpan);

      if (model.description) {
        const descSpan = document.createElement('span');
        descSpan.className = 'model-card-desc';
        descSpan.textContent = model.description;
        main.appendChild(descSpan);
      }

      card.appendChild(main);

      const meta = document.createElement('div');
      meta.className = 'model-card-meta';

      const priceInfo = document.createElement('span');
      priceInfo.className = 'model-pricing-info';
      priceInfo.textContent = model.pricing?.label || (model.isFree ? 'Free' : 'Standard');
      meta.appendChild(priceInfo);

      const ctxBadge = document.createElement('span');
      ctxBadge.className = 'model-context-badge';
      const ctxK = model.contextLength >= 1000000 
        ? (model.contextLength / 1000000).toFixed(1) + 'M ctx' 
        : Math.round(model.contextLength / 1000) + 'k ctx';
      ctxBadge.textContent = ctxK;
      meta.appendChild(ctxBadge);

      card.appendChild(meta);
      container.appendChild(card);
    });
  }

  function renderContextDocs() {
    const list = document.getElementById('drawer-docs-list');
    const bar = document.getElementById('attached-context-bar');
    if (!list) return;

    list.innerHTML = '';
    if (bar) bar.innerHTML = '';

    const activeDocs = state.contextDocs.filter(d => d.active);
    if (bar) {
      bar.style.display = activeDocs.length > 0 ? 'flex' : 'none';
      activeDocs.forEach(doc => {
        const chip = document.createElement('span');
        chip.className = 'context-chip';
        chip.innerHTML = `
          <span>${escapeXml(doc.title)}</span>
          <span class="context-chip-remove" title="Detach">&times;</span>
        `;
        chip.querySelector('.context-chip-remove').onclick = () => {
          doc.active = false;
          saveContextState();
          renderContextDocs();
          updateContextMetrics();
        };
        bar.appendChild(chip);
      });
    }

    if (state.contextDocs.length === 0) {
      list.innerHTML = `<span style="font-size: 12px; color: var(--text-muted);">No documents attached. Click '+ Add Doc' to attach persistent context.</span>`;
      return;
    }

    state.contextDocs.forEach(doc => {
      const card = document.createElement('div');
      card.className = 'doc-card';

      const info = document.createElement('div');
      info.className = 'doc-info';

      const title = document.createElement('span');
      title.className = 'doc-title';
      title.textContent = doc.title;
      info.appendChild(title);

      const meta = document.createElement('span');
      meta.className = 'doc-meta';
      meta.textContent = `~${doc.tokens || MarkdownRenderer.estimateTokens(doc.content)} tokens`;
      info.appendChild(meta);

      card.appendChild(info);

      const actions = document.createElement('div');
      actions.className = 'doc-actions';

      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = doc.active;
      check.title = 'Toggle active in context';
      check.onchange = () => {
        doc.active = check.checked;
        saveContextState();
        renderContextDocs();
        updateContextMetrics();
      };
      actions.appendChild(check);

      const btnDel = document.createElement('button');
      btnDel.className = 'btn-icon-subtle';
      btnDel.title = 'Delete Document';
      btnDel.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
      btnDel.onclick = () => {
        state.contextDocs = state.contextDocs.filter(d => d.id !== doc.id);
        saveContextState();
        renderContextDocs();
        updateContextMetrics();
      };
      actions.appendChild(btnDel);

      card.appendChild(actions);
      list.appendChild(card);
    });
  }

  // ==========================================================================
  // Helper Utilities & Toast
  // ==========================================================================

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${escapeXml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 3200);
  }

  function copyText(text, btnElement) {
    navigator.clipboard.writeText(text).then(() => {
      if (btnElement) {
        const orig = btnElement.innerHTML;
        btnElement.innerHTML = `<span>Copied!</span>`;
        setTimeout(() => { btnElement.innerHTML = orig; }, 1500);
      }
      showToast('Copied to clipboard');
    });
  }

  window.copyCodeBlock = function (btn) {
    const code = decodeURIComponent(btn.getAttribute('data-code') || '');
    navigator.clipboard.writeText(code).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Copied!</span>`;
      setTimeout(() => { btn.innerHTML = orig; }, 1600);
    });
  };

  function escapeXml(str) {
    if (!str) return '';
    return str.replace(/[<>&'"]/g, c => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;'
    }[c]));
  }

  // ==========================================================================
  // Custom Agent Studio & Agent Lifecycle Engine (Strictly Zero Emojis)
  // ==========================================================================

  let selectedStudioAgentId = 'builder';
  let selectedStudioIcon = 'box';

  function updateAgentPillDisplay() {
    const iconEl = document.getElementById('persona-icon');
    const nameEl = document.getElementById('persona-name');
    const agent = state.activeAgent || state.agents[0];
    if (iconEl && agent) {
      iconEl.innerHTML = getSvgIcon(agent.icon || 'code');
    }
    if (nameEl && agent) {
      nameEl.textContent = agent.role || agent.name.split(' ')[0];
    }
  }

  function activateAgent(agentId) {
    const agent = state.agents.find(a => a.id === agentId) || state.agents[0];
    state.activeAgent = agent;
    state.systemPrompt = agent.systemPrompt;
    if (agent.temperature !== undefined) {
      state.parameters.temperature = agent.temperature;
      const tSlider = document.getElementById('cfg-temperature');
      const tVal = document.getElementById('val-temp');
      if (tSlider) tSlider.value = agent.temperature;
      if (tVal) tVal.textContent = agent.temperature;
    }

    updateAgentPillDisplay();
    const sysInput = document.getElementById('system-prompt-input');
    if (sysInput) sysInput.value = state.systemPrompt;

    saveContextState();
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_AGENT_ID, agent.id);
    } catch (e) {}

    updateContextMetrics();
    const modal = document.getElementById('modal-agent-studio');
    if (modal) modal.classList.remove('open');
    showToast(`Active Agent: ${agent.name}`);
  }

  function renderAgentStudio() {
    const listContainer = document.getElementById('studio-agent-items-container');
    const iconSelector = document.getElementById('agent-icon-selector');
    const modelSelector = document.getElementById('agent-select-model');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    // 1. Populate Agent List
    state.agents.forEach(agent => {
      const isCurrentActive = state.activeAgent?.id === agent.id;
      const isSelected = selectedStudioAgentId === agent.id;
      const item = document.createElement('div');
      item.className = `agent-list-item ${isSelected ? 'active' : ''}`;
      item.innerHTML = `
        <div class="agent-item-icon">${getSvgIcon(agent.icon || 'code')}</div>
        <div class="agent-item-info">
          <div class="agent-item-name">${escapeXml(agent.name)}</div>
          <div class="agent-item-role">${escapeXml(agent.role || 'Agent')}${isCurrentActive ? ' • Active' : ''}</div>
        </div>
      `;
      item.onclick = () => {
        selectedStudioAgentId = agent.id;
        renderAgentStudio();
      };
      listContainer.appendChild(item);
    });

    // 2. Populate Model Selection Dropdown
    if (modelSelector) {
      modelSelector.innerHTML = '<option value="">Inherit Active Workspace Model</option>';
      state.models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.name} (${m.isFree ? 'Free' : 'Paid'})`;
        modelSelector.appendChild(opt);
      });
    }

    // 3. Populate Icon Picker (Zero Emojis - Pure SVG Glyphs)
    if (iconSelector) {
      iconSelector.innerHTML = '';
      const availableIcons = ['box', 'code', 'layers', 'bug', 'shield', 'wrench', 'terminal', 'cpu', 'database', 'zap', 'git', 'search'];
      availableIcons.forEach(iconKey => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `icon-option-btn ${selectedStudioIcon === iconKey ? 'selected' : ''}`;
        btn.innerHTML = getSvgIcon(iconKey);
        btn.title = iconKey;
        btn.onclick = () => {
          selectedStudioIcon = iconKey;
          renderAgentStudio();
        };
        iconSelector.appendChild(btn);
      });
    }

    // 4. Fill Right Column Form for Selected Agent
    const currentAgent = state.agents.find(a => a.id === selectedStudioAgentId);
    const isNew = selectedStudioAgentId === 'new';

    const inputName = document.getElementById('agent-input-name');
    const inputRole = document.getElementById('agent-input-role');
    const inputDesc = document.getElementById('agent-input-desc');
    const inputTemp = document.getElementById('agent-input-temp');
    const tempVal = document.getElementById('agent-temp-val');
    const inputPrompt = document.getElementById('agent-input-prompt');
    const btnDelete = document.getElementById('btn-studio-delete-agent');

    const checkFsRead = document.getElementById('agent-tool-fs-read');
    const checkFsWrite = document.getElementById('agent-tool-fs-write');
    const checkFsEdit = document.getElementById('agent-tool-fs-edit');
    const checkFsExec = document.getElementById('agent-tool-fs-exec');
    const checkPlan = document.getElementById('agent-tool-plan');
    const checkRepoMap = document.getElementById('agent-tool-repomap');

    if (isNew) {
      if (inputName) inputName.value = '';
      if (inputRole) inputRole.value = '';
      if (inputDesc) inputDesc.value = '';
      if (inputTemp) inputTemp.value = 0.7;
      if (tempVal) tempVal.textContent = '0.7';
      if (inputPrompt) inputPrompt.value = 'You are a specialized autonomous engineering agent...';
      if (btnDelete) btnDelete.style.display = 'none';
      if (modelSelector) modelSelector.value = '';
      selectedStudioIcon = 'code';
    } else if (currentAgent) {
      if (inputName) inputName.value = currentAgent.name;
      if (inputRole) inputRole.value = currentAgent.role;
      if (inputDesc) inputDesc.value = currentAgent.desc || '';
      if (inputTemp) inputTemp.value = currentAgent.temperature !== undefined ? currentAgent.temperature : 0.7;
      if (tempVal) tempVal.textContent = currentAgent.temperature !== undefined ? currentAgent.temperature : 0.7;
      if (inputPrompt) inputPrompt.value = currentAgent.systemPrompt;
      if (modelSelector) modelSelector.value = currentAgent.modelOverride || '';
      selectedStudioIcon = currentAgent.icon || 'code';

      const isBuiltin = BUILTIN_AGENTS.some(b => b.id === currentAgent.id);
      if (btnDelete) btnDelete.style.display = isBuiltin ? 'none' : 'inline-block';

      const tools = currentAgent.tools || {};
      if (checkFsRead) checkFsRead.checked = !!tools.fileRead;
      if (checkFsWrite) checkFsWrite.checked = !!tools.fileWrite;
      if (checkFsEdit) checkFsEdit.checked = !!tools.fileEdit;
      if (checkFsExec) checkFsExec.checked = !!tools.cmdExec;
      if (checkPlan) checkPlan.checked = !!tools.planning;
      if (checkRepoMap) checkRepoMap.checked = !!tools.repoMap;
    }
  }

  function saveCurrentAgentFromForm() {
    const inputName = document.getElementById('agent-input-name');
    const inputRole = document.getElementById('agent-input-role');
    const inputDesc = document.getElementById('agent-input-desc');
    const inputTemp = document.getElementById('agent-input-temp');
    const inputPrompt = document.getElementById('agent-input-prompt');
    const modelSelector = document.getElementById('agent-select-model');

    const name = inputName ? inputName.value.trim() : '';
    const role = inputRole ? inputRole.value.trim() : '';
    if (!name) {
      alert('Agent Name is required.');
      return;
    }

    const tools = {
      fileRead: !!document.getElementById('agent-tool-fs-read')?.checked,
      fileWrite: !!document.getElementById('agent-tool-fs-write')?.checked,
      fileEdit: !!document.getElementById('agent-tool-fs-edit')?.checked,
      cmdExec: !!document.getElementById('agent-tool-fs-exec')?.checked,
      planning: !!document.getElementById('agent-tool-plan')?.checked,
      repoMap: !!document.getElementById('agent-tool-repomap')?.checked
    };

    const isNew = selectedStudioAgentId === 'new';
    const agentId = isNew ? ('custom_' + Date.now()) : selectedStudioAgentId;

    const agentData = {
      id: agentId,
      name: name,
      role: role || 'Agent',
      icon: selectedStudioIcon || 'code',
      desc: inputDesc ? inputDesc.value.trim() : '',
      temperature: inputTemp ? parseFloat(inputTemp.value) : 0.7,
      systemPrompt: inputPrompt ? inputPrompt.value.trim() : '',
      modelOverride: modelSelector ? modelSelector.value : '',
      tools: tools,
      isCustom: true
    };

    if (isNew) {
      state.agents.push(agentData);
      selectedStudioAgentId = agentId;
    } else {
      const idx = state.agents.findIndex(a => a.id === agentId);
      if (idx !== -1) {
        state.agents[idx] = { ...state.agents[idx], ...agentData };
      }
    }

    saveCustomAgents();
    renderAgentStudio();
    if (state.activeAgent?.id === agentId) {
      activateAgent(agentId);
    }
    showToast(`Saved agent: ${name}`);
  }

  function saveCustomAgents() {
    try {
      const customOnly = state.agents.filter(a => a.isCustom || !BUILTIN_AGENTS.some(b => b.id === a.id));
      localStorage.setItem(STORAGE_KEYS.CUSTOM_AGENTS, JSON.stringify(customOnly));
    } catch (e) {}
  }

  function deleteSelectedCustomAgent() {
    const isBuiltin = BUILTIN_AGENTS.some(b => b.id === selectedStudioAgentId);
    if (isBuiltin) {
      alert('Built-in system agents cannot be deleted.');
      return;
    }
    state.agents = state.agents.filter(a => a.id !== selectedStudioAgentId);
    saveCustomAgents();
    selectedStudioAgentId = state.agents[0]?.id || 'builder';
    if (state.activeAgent?.id === selectedStudioAgentId) {
      activateAgent(state.agents[0]?.id);
    }
    renderAgentStudio();
    showToast('Agent deleted');
  }

  function exportAgentJson() {
    const agent = state.agents.find(a => a.id === selectedStudioAgentId);
    if (!agent) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(agent, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `agent_${agent.id}.json`;
    a.click();
    showToast(`Exported ${agent.name} config`);
  }

  function importAgentJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.name || !parsed.systemPrompt) {
          throw new Error('Invalid agent JSON: missing name or systemPrompt');
        }
        parsed.id = 'imported_' + Date.now();
        parsed.isCustom = true;
        state.agents.push(parsed);
        saveCustomAgents();
        selectedStudioAgentId = parsed.id;
        renderAgentStudio();
        showToast(`Imported ${parsed.name}`);
      } catch (err) {
        alert('Failed to import agent: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ==========================================================================
  // Real Workspace Integration & Autonomous Action Engine
  // ==========================================================================

  async function fetchWorkspaceTree() {
    try {
      const res = await fetch('/api/workspace/tree');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        state.workspaceTree = data.tree || [];
        renderWorkspaceTree();
      }
    } catch (e) {
      // Fallback: virtual files in state
      renderWorkspaceTree();
    }

    try {
      const resPrompt = await fetch('/api/workspace/repoprompt');
      if (resPrompt.ok) {
        const dataPrompt = await resPrompt.json();
        if (dataPrompt.success) {
          state.repoMapSummary = dataPrompt.summary || '';
        }
      }
    } catch (e) {}
  }

  function renderWorkspaceTree() {
    const container = document.getElementById('workspace-tree-content');
    if (!container) return;
    container.innerHTML = '';

    if (!state.workspaceTree || state.workspaceTree.length === 0) {
      container.innerHTML = `<span style="font-size: 11px; color: var(--text-muted); padding: 4px 8px;">No files on disk yet. Click '+' or run /build to create project files.</span>`;
      return;
    }

    function appendItems(items, depth) {
      items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'ws-tree-item';
        el.style.paddingLeft = (8 + depth * 14) + 'px';

        if (item.type === 'directory') {
          el.innerHTML = `
            <svg class="ws-tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            <span>${escapeXml(item.name)}/</span>
          `;
          container.appendChild(el);
          if (item.children) appendItems(item.children, depth + 1);
        } else {
          el.innerHTML = `
            <svg class="ws-tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <span>${escapeXml(item.name)}</span>
          `;
          el.onclick = () => fetchWorkspaceFileAndOpen(item.path);
          container.appendChild(el);
        }
      });
    }

    appendItems(state.workspaceTree, 0);
  }

  async function fetchWorkspaceFileAndOpen(relPath) {
    try {
      const res = await fetch(`/api/workspace/file?path=${encodeURIComponent(relPath)}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      openInWorkspace(data.content, data.path, getLangFromFilename(data.path));
    } catch (e) {
      showToast(`Cannot open file: ${e.message}`, 'error');
    }
  }

  window.applyAgentAction = async function (btn) {
    if (btn.classList.contains('applied')) return;
    const tool = btn.getAttribute('data-tool');
    const rawPayload = decodeURIComponent(btn.getAttribute('data-payload') || '');
    let payload = {};
    try {
      payload = JSON.parse(rawPayload);
    } catch (e) {
      payload = { raw: rawPayload };
    }

    btn.disabled = true;
    const origHtml = btn.innerHTML;
    btn.innerHTML = '<span>Executing...</span>';

    try {
      if (tool === 'write_file') {
        const res = await fetch('/api/workspace/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: payload.path, content: payload.content })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to write file');

        openInWorkspace(payload.content, payload.path, getLangFromFilename(payload.path));
        await fetchWorkspaceTree();
        showToast(`Wrote ${payload.path} (${data.lines} lines) to workspace`);
      } else if (tool === 'edit_file') {
        const res = await fetch('/api/workspace/edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: payload.path, target: payload.target, replacement: payload.replacement })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to edit file');

        await fetchWorkspaceFileAndOpen(payload.path);
        await fetchWorkspaceTree();
        showToast(`Applied patch to ${payload.path}`);
      } else if (tool === 'execute_cmd') {
        const res = await fetch('/api/workspace/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: payload.command })
        });
        const data = await res.json();
        const output = (data.stdout || '') + (data.stderr ? '\n[stderr]: ' + data.stderr : '');
        openInWorkspace(output || '[Command executed with no output]', `exec_${Date.now()}.log`, 'text');
        showToast(`Command executed: exit code ${data.exitCode}`);
      } else if (tool === 'read_file') {
        await fetchWorkspaceFileAndOpen(payload.path);
      }

      btn.classList.add('applied');
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Applied</span>';
    } catch (err) {
      console.error('Agent action failed:', err);
      showToast(`Action failed: ${err.message}`, 'error');
      btn.innerHTML = origHtml;
      btn.disabled = false;
    }
  };

  // ==========================================================================
  // Agentic Code Workspace (Split-Pane Artifact Viewer)
  // ==========================================================================

  function toggleWorkspace(forceState) {
    const drawer = document.getElementById('code-workspace-drawer');
    const btn = document.getElementById('btn-toggle-workspace-drawer');
    if (!drawer) return;

    if (forceState !== undefined) {
      state.workspaceOpen = forceState;
    } else {
      state.workspaceOpen = !state.workspaceOpen;
    }

    if (state.workspaceOpen) {
      drawer.classList.remove('closed');
      if (btn) btn.classList.add('active');
      renderWorkspaceTabs();
      renderWorkspaceEditor();
    } else {
      drawer.classList.add('closed');
      if (btn) btn.classList.remove('active');
    }
  }

  function openInWorkspace(code, filename, lang) {
    toggleWorkspace(true);

    const safeName = filename || `snippet.${lang || 'txt'}`;
    let existingTab = state.workspaceTabs.find(t => t.name === safeName);
    if (existingTab) {
      existingTab.code = code;
      existingTab.lang = lang;
      state.activeWorkspaceTabId = existingTab.id;
    } else {
      const newTab = {
        id: 'tab_' + Date.now(),
        name: safeName,
        lang: lang || 'text',
        code: code
      };
      state.workspaceTabs.push(newTab);
      state.activeWorkspaceTabId = newTab.id;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.WORKSPACE_TABS, JSON.stringify(state.workspaceTabs));
    } catch (e) {}

    renderWorkspaceTabs();
    renderWorkspaceEditor();
    showToast(`Opened ${safeName} in Workspace`);
  }

  function renderWorkspaceTabs() {
    const bar = document.getElementById('workspace-tabs-bar');
    if (!bar) return;
    bar.innerHTML = '';

    state.workspaceTabs.forEach(tab => {
      const tabEl = document.createElement('div');
      tabEl.className = `workspace-tab ${tab.id === state.activeWorkspaceTabId ? 'active' : ''}`;
      tabEl.innerHTML = `
        <span class="tab-title">${escapeXml(tab.name)}</span>
        ${state.workspaceTabs.length > 1 ? `<span class="workspace-tab-close" title="Close">&times;</span>` : ''}
      `;

      tabEl.onclick = (e) => {
        if (e.target.classList.contains('workspace-tab-close')) return;
        state.activeWorkspaceTabId = tab.id;
        state.workspacePreview = false;
        renderWorkspaceTabs();
        renderWorkspaceEditor();
      };

      const closeBtn = tabEl.querySelector('.workspace-tab-close');
      if (closeBtn) {
        closeBtn.onclick = (e) => {
          e.stopPropagation();
          state.workspaceTabs = state.workspaceTabs.filter(t => t.id !== tab.id);
          if (state.activeWorkspaceTabId === tab.id) {
            state.activeWorkspaceTabId = state.workspaceTabs[0]?.id || null;
          }
          try {
            localStorage.setItem(STORAGE_KEYS.WORKSPACE_TABS, JSON.stringify(state.workspaceTabs));
          } catch (err) {}
          renderWorkspaceTabs();
          renderWorkspaceEditor();
        };
      }

      bar.appendChild(tabEl);
    });

    const btnNewTab = document.createElement('button');
    btnNewTab.className = 'btn-icon-subtle';
    btnNewTab.style.fontSize = '14px';
    btnNewTab.style.padding = '3px 8px';
    btnNewTab.title = 'New Scratchpad Tab';
    btnNewTab.textContent = '+';
    btnNewTab.onclick = () => {
      const scratchNum = state.workspaceTabs.length + 1;
      const newTab = {
        id: 'tab_' + Date.now(),
        name: `scratch_${scratchNum}.js`,
        lang: 'javascript',
        code: `// Scratch file #${scratchNum}\n`
      };
      state.workspaceTabs.push(newTab);
      state.activeWorkspaceTabId = newTab.id;
      renderWorkspaceTabs();
      renderWorkspaceEditor();
    };
    bar.appendChild(btnNewTab);
  }

  function renderWorkspaceEditor() {
    const activeTab = state.workspaceTabs.find(t => t.id === state.activeWorkspaceTabId) || state.workspaceTabs[0];
    const nameEl = document.getElementById('ws-current-filename');
    const metaEl = document.getElementById('ws-current-meta');
    const preEl = document.getElementById('workspace-code-pre');
    const iframeEl = document.getElementById('workspace-preview-frame');
    const btnPreview = document.getElementById('btn-ws-toggle-preview');
    const btnWrap = document.getElementById('btn-ws-toggle-wrap');

    if (!activeTab || !preEl) return;

    if (nameEl) nameEl.textContent = activeTab.name;
    const lines = activeTab.code ? activeTab.code.split('\n').length : 0;
    const tokens = MarkdownRenderer.estimateTokens(activeTab.code);
    if (metaEl) metaEl.textContent = `${lines} lines · ~${tokens} tokens`;

    preEl.textContent = activeTab.code || '';
    if (state.workspaceWrap) {
      preEl.classList.add('wrap');
      if (btnWrap) btnWrap.classList.add('active');
    } else {
      preEl.classList.remove('wrap');
      if (btnWrap) btnWrap.classList.remove('active');
    }

    const isPreviewable = /^(html|svg|markdown|md)$/i.test(activeTab.lang) || 
      /\.(html|htm|svg|md)$/i.test(activeTab.name);

    if (btnPreview) {
      btnPreview.style.display = isPreviewable ? 'inline-block' : 'none';
      btnPreview.textContent = state.workspacePreview ? 'Show Code' : 'Live Preview';
    }

    if (state.workspacePreview && isPreviewable && iframeEl) {
      preEl.style.display = 'none';
      iframeEl.style.display = 'block';

      if (activeTab.name.endsWith('.md') || activeTab.lang === 'markdown') {
        iframeEl.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:18px;color:#171920;background:#ffffff;line-height:1.55;}pre{background:#f0f2f5;padding:10px;border-radius:4px;overflow-x:auto;}code{font-family:monospace;}</style></head><body>${MarkdownRenderer.render(activeTab.code)}</body></html>`;
      } else {
        iframeEl.srcdoc = activeTab.code;
      }
    } else {
      preEl.style.display = 'block';
      if (iframeEl) iframeEl.style.display = 'none';
    }
  }

  function downloadWorkspaceFile() {
    const activeTab = state.workspaceTabs.find(t => t.id === state.activeWorkspaceTabId) || state.workspaceTabs[0];
    if (!activeTab) return;
    const blob = new Blob([activeTab.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab.name || 'code.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${activeTab.name}`);
  }

  function copyWorkspaceCode() {
    const activeTab = state.workspaceTabs.find(t => t.id === state.activeWorkspaceTabId) || state.workspaceTabs[0];
    if (!activeTab) return;
    const btn = document.getElementById('btn-ws-copy');
    copyText(activeTab.code, btn);
  }

  window.sendToWorkspace = function (button) {
    const encoded = button.getAttribute('data-code');
    const filename = button.getAttribute('data-filename') || 'snippet.txt';
    const lang = button.getAttribute('data-lang') || 'text';
    const code = decodeURIComponent(encoded || '');
    openInWorkspace(code, filename, lang);
  };

  // ==========================================================================
  // Interactive Task Checklist Handler
  // ==========================================================================

  window.toggleInteractiveTask = function (checkbox) {
    const row = checkbox.closest('.message-row');
    if (!row) return;
    const msgId = row.getAttribute('data-message-id') || row.id.replace('msg-row-', '');
    const conv = getActiveConversation();
    if (!conv) return;
    const msg = conv.messages.find(m => m.id === msgId);
    if (!msg) return;

    const body = row.querySelector('.message-body');
    if (!body) return;
    const checkboxes = Array.from(body.querySelectorAll('input.task-checkbox'));
    const index = checkboxes.indexOf(checkbox);
    if (index === -1) return;

    let taskIdx = 0;
    msg.content = msg.content.replace(/^(\s*[-*+]\s+)\[([ xX])\]/gm, (match, prefix, checkVal) => {
      if (taskIdx === index) {
        taskIdx++;
        return `${prefix}[${checkbox.checked ? 'x' : ' '}]`;
      }
      taskIdx++;
      return match;
    });

    saveConversations();
    showToast('Task checklist updated');
  };

  // ==========================================================================
  // File Drag & Drop + Code Attachments
  // ==========================================================================

  function getLangFromFilename(name) {
    if (!name) return 'text';
    const ext = name.split('.').pop().toLowerCase();
    const map = {
      js: 'javascript', ts: 'typescript', jsx: 'jsx', tsx: 'tsx',
      py: 'python', rb: 'ruby', rs: 'rust', go: 'go',
      java: 'java', c: 'c', cpp: 'cpp', cs: 'csharp',
      html: 'html', htm: 'html', css: 'css', scss: 'scss',
      json: 'json', xml: 'xml', yaml: 'yaml', yml: 'yaml',
      sh: 'bash', bash: 'bash', zsh: 'bash', ps1: 'powershell',
      sql: 'sql', md: 'markdown', env: 'shell', toml: 'toml'
    };
    return map[ext] || ext || 'text';
  }

  function handleFiles(files) {
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        showToast(`File ${file.name} is too large (>2MB).`, 'warn');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const lang = getLangFromFilename(file.name);
        const tokens = MarkdownRenderer.estimateTokens(text);
        const lineCount = text.split('\n').length;

        state.attachedFiles.push({
          id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: file.name,
          lang: lang,
          lines: lineCount,
          tokens: tokens,
          content: text
        });

        renderAttachedFiles();
        updateInputTokenCounter();
        showToast(`Attached ${file.name}`);
      };

      reader.onerror = () => {
        showToast(`Failed to read ${file.name}`, 'error');
      };

      reader.readAsText(file);
    });
  }

  function renderAttachedFiles() {
    const bar = document.getElementById('attached-files-bar');
    if (!bar) return;
    bar.innerHTML = '';

    if (state.attachedFiles.length === 0) {
      bar.style.display = 'none';
      return;
    }

    bar.style.display = 'flex';
    state.attachedFiles.forEach(f => {
      const chip = document.createElement('span');
      chip.className = 'file-attachment-chip';
      chip.innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 5px;">
          ${getSvgIcon('file')}
          <span>${escapeXml(f.name)} (${f.lines}L · ~${f.tokens}tok)</span>
        </span>
        <span class="btn-remove-file" title="Remove">&times;</span>
      `;
      chip.querySelector('.btn-remove-file').onclick = () => {
        state.attachedFiles = state.attachedFiles.filter(item => item.id !== f.id);
        renderAttachedFiles();
        updateInputTokenCounter();
      };
      bar.appendChild(chip);
    });
  }

  function updateInputTokenCounter() {
    const textarea = document.getElementById('chat-textarea');
    const tokenCounter = document.getElementById('input-token-counter');
    if (!tokenCounter) return;

    let baseText = textarea ? textarea.value : '';
    let tokens = MarkdownRenderer.estimateTokens(baseText);
    state.attachedFiles.forEach(f => {
      tokens += f.tokens + 15; // overhead for code fence
    });
    tokenCounter.textContent = `~${tokens} tokens`;
  }

  // ==========================================================================
  // Command Palette (Ctrl+K) - Strictly Pure SVG Icons
  // ==========================================================================

  function getCommandItems() {
    const baseCommands = [
      { id: 'new_chat', title: 'New Conversation Session', shortcut: 'Ctrl+Shift+N', icon: 'plus', action: () => createConversation() },
      { id: 'toggle_ws', title: 'Toggle Code Workspace & Project Files', shortcut: 'Ctrl+Shift+W', icon: 'box', action: () => toggleWorkspace() },
      { id: 'open_studio', title: 'Open Custom Agents Studio', shortcut: 'Agents', icon: 'wrench', action: () => {
          renderAgentStudio();
          document.getElementById('modal-agent-studio')?.classList.add('open');
        }
      },
      { id: 'refresh_ws', title: 'Refresh Workspace File Tree on Disk', shortcut: 'Workspace', icon: 'search', action: () => fetchWorkspaceTree() }
    ];

    // Add all registered agents (built-in and custom)
    state.agents.forEach((ag, idx) => {
      baseCommands.push({
        id: `agent_${ag.id}`,
        title: `Activate Agent: ${ag.name} (${ag.role})`,
        shortcut: `Agent ${idx + 1}`,
        icon: ag.icon || 'code',
        action: () => activateAgent(ag.id)
      });
    });

    baseCommands.push(
      { id: 'models_free', title: 'Filter Models: Free Only', shortcut: 'Filter', icon: 'search', action: () => {
          state.modelTierFilter = 'free';
          document.querySelectorAll('#model-tier-filter .segmented-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-tier') === 'free'));
          renderModelList();
          document.getElementById('modal-model-selector')?.classList.add('open');
        }
      },
      { id: 'models_all', title: 'Filter Models: All Models', shortcut: 'Filter', icon: 'layers', action: () => {
          state.modelTierFilter = 'all';
          document.querySelectorAll('#model-tier-filter .segmented-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-tier') === 'all'));
          renderModelList();
          document.getElementById('modal-model-selector')?.classList.add('open');
        }
      },
      { id: 'quick_tunnel', title: 'Reconnect to Cloudflare Tunnel (agentic-uncensored-coder)', shortcut: 'Self-Hosted', icon: 'terminal', action: async () => {
          state.providerKey = 'custom';
          state.baseUrl = 'https://dock-hide-jackson-simulations.trycloudflare.com/v1';
          saveConfig();
          updateHeaderModelDisplay();
          updateQuickSetupCard();
          await fetchModelsFromApi();
          showToast('Connected to self-hosted Ollama tunnel');
        }
      },
      { id: 'toggle_theme', title: 'Toggle Dark / Light Theme', shortcut: 'Theme', icon: 'zap', action: () => {
          state.theme = state.theme === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', state.theme);
          localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
          const iconDark = document.getElementById('theme-icon-dark');
          const iconLight = document.getElementById('theme-icon-light');
          if (iconDark && iconLight) {
            iconDark.style.display = state.theme === 'dark' ? 'block' : 'none';
            iconLight.style.display = state.theme === 'light' ? 'block' : 'none';
          }
        }
      },
      { id: 'raw_context', title: 'Inspect Raw Context JSON Payload', shortcut: 'JSON', icon: 'search', action: () => {
          document.getElementById('btn-view-raw-context')?.click();
        }
      },
      { id: 'clear_chat', title: 'Clear Current Session Messages', shortcut: 'Clear', icon: 'trash', action: () => clearActiveConversation() },
      { id: 'export_chats', title: 'Export All Chats as JSON', shortcut: 'Export', icon: 'download', action: () => {
          document.getElementById('btn-export-chats')?.click();
        }
      }
    );

    return baseCommands;
  }

  let selectedCmdIndex = 0;

  function openCommandPalette() {
    const modal = document.getElementById('modal-command-palette');
    const input = document.getElementById('command-palette-input');
    if (!modal) return;

    modal.classList.add('open');
    if (input) {
      input.value = '';
      input.focus();
    }
    selectedCmdIndex = 0;
    renderCommandPalette('');
  }

  function closeCommandPalette() {
    const modal = document.getElementById('modal-command-palette');
    if (modal) modal.classList.remove('open');
  }

  function renderCommandPalette(query) {
    const list = document.getElementById('command-palette-list');
    if (!list) return;
    list.innerHTML = '';

    const allCommands = getCommandItems();
    const q = (query || '').toLowerCase().trim();
    const filtered = allCommands.filter(c => 
      !q || c.title.toLowerCase().includes(q) || (c.shortcut && c.shortcut.toLowerCase().includes(q))
    );

    if (filtered.length === 0) {
      list.innerHTML = `<div style="padding: 12px; font-size: 12px; color: var(--text-muted); text-align: center;">No matching actions</div>`;
      return;
    }

    if (selectedCmdIndex >= filtered.length) selectedCmdIndex = 0;

    filtered.forEach((cmd, idx) => {
      const item = document.createElement('div');
      item.className = `command-palette-item ${idx === selectedCmdIndex ? 'active' : ''}`;
      item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>${getSvgIcon(cmd.icon || 'code')}</span>
          <span>${escapeXml(cmd.title)}</span>
        </div>
        ${cmd.shortcut ? `<span class="command-palette-shortcut">${escapeXml(cmd.shortcut)}</span>` : ''}
      `;
      item.onclick = () => {
        closeCommandPalette();
        cmd.action();
      };
      item.onmouseenter = () => {
        selectedCmdIndex = idx;
        renderCommandPalette(query);
      };
      list.appendChild(item);
    });
  }

  // ==========================================================================
  // Event Listeners Setup
  // ==========================================================================

  function setupEventListeners() {
    // Theme Toggle
    const btnTheme = document.getElementById('btn-toggle-theme');
    const iconDark = document.getElementById('theme-icon-dark');
    const iconLight = document.getElementById('theme-icon-light');
    if (btnTheme) {
      btnTheme.onclick = () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
        if (iconDark && iconLight) {
          iconDark.style.display = state.theme === 'dark' ? 'block' : 'none';
          iconLight.style.display = state.theme === 'light' ? 'block' : 'none';
        }
      };
    }

    // Sidebar Toggles
    const sidebar = document.getElementById('sidebar');
    const btnCollapse = document.getElementById('btn-collapse-sidebar');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    if (btnCollapse) btnCollapse.onclick = () => sidebar.classList.add('collapsed');
    if (btnToggleSidebar) btnToggleSidebar.onclick = () => sidebar.classList.toggle('collapsed');

    // Context Drawer Toggles
    const drawer = document.getElementById('context-drawer');
    const btnOpenDrawer = document.getElementById('btn-open-context-drawer');
    const btnToggleDrawer = document.getElementById('btn-toggle-context-drawer');
    const btnCloseDrawer = document.getElementById('btn-close-context-drawer');
    const toggleDrawer = () => {
      drawer.classList.toggle('closed');
      state.isDrawerOpen = !drawer.classList.contains('closed');
      btnToggleDrawer.classList.toggle('active', state.isDrawerOpen);
    };
    if (btnOpenDrawer) btnOpenDrawer.onclick = toggleDrawer;
    if (btnToggleDrawer) btnToggleDrawer.onclick = toggleDrawer;
    if (btnCloseDrawer) btnCloseDrawer.onclick = toggleDrawer;

    // Header API Pill Click -> Opens Settings
    const btnHeaderKey = document.getElementById('btn-header-api-key');
    if (btnHeaderKey) {
      btnHeaderKey.onclick = () => {
        const modal = document.getElementById('modal-settings');
        if (modal) {
          syncSettingsForm();
          modal.classList.add('open');
        }
      };
    }

    // New Chat Button
    const btnNewChat = document.getElementById('btn-new-chat');
    if (btnNewChat) btnNewChat.onclick = () => createConversation();

    // Clear Chat Button
    const btnClear = document.getElementById('btn-clear-chat');
    if (btnClear) btnClear.onclick = () => clearActiveConversation();

    // Export Chats
    const btnExport = document.getElementById('btn-export-chats');
    if (btnExport) {
      btnExport.onclick = () => {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.conversations, null, 2));
        const a = document.createElement('a');
        a.href = dataStr;
        a.download = `llm_chat_export_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
      };
    }

    // Input Textarea Auto-expand & Send
    const textarea = document.getElementById('chat-textarea');
    const tokenCounter = document.getElementById('input-token-counter');
    if (textarea) {
      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(200, textarea.scrollHeight) + 'px';
        const tok = MarkdownRenderer.estimateTokens(textarea.value);
        if (tokenCounter) tokenCounter.textContent = `~${tok} tokens`;
      });

      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    // Send and Stop Buttons
    const btnSend = document.getElementById('btn-send-message');
    if (btnSend) btnSend.onclick = sendMessage;

    const btnStop = document.getElementById('btn-stop-stream');
    if (btnStop) {
      btnStop.onclick = () => {
        if (state.abortController) {
          state.abortController.abort();
        }
      };
    }

    // Quick Prompts on Empty State
    document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const promptText = btn.getAttribute('data-prompt');
        if (textarea && promptText) {
          textarea.value = promptText + ' ';
          textarea.focus();
          const tok = MarkdownRenderer.estimateTokens(textarea.value);
          if (tokenCounter) tokenCounter.textContent = `~${tok} tokens`;
        }
      });
    });

    // Quick Setup Card in Empty State
    const quickSelect = document.getElementById('quick-provider-select');
    const quickBaseUrlInput = document.getElementById('quick-base-url-input');
    const quickKeyInput = document.getElementById('quick-api-key-input');
    const btnQuickSave = document.getElementById('btn-quick-save-key');
    const btnQuickOpenModels = document.getElementById('btn-quick-open-models');

    // Base URL input listener
    if (quickBaseUrlInput) {
      quickBaseUrlInput.value = state.baseUrl || '';
      quickBaseUrlInput.addEventListener('input', () => {
        const val = quickBaseUrlInput.value.trim();
        if (val) {
          state.baseUrl = val.replace(/\/+$/, '');
          state.providerKey = 'custom';
          if (quickSelect) quickSelect.value = 'custom';
          saveConfig();
        }
      });
    }

    // API Key input listener with auto-detection for URLs or Key Prefixes
    if (quickKeyInput) {
      quickKeyInput.addEventListener('input', () => {
        const detected = detectProviderFromInput(quickKeyInput.value);
        if (detected) {
          if (detected.type === 'url') {
            state.baseUrl = detected.url;
            state.providerKey = 'custom';
            state.apiKey = '';
            quickKeyInput.value = '';
            if (quickBaseUrlInput) quickBaseUrlInput.value = state.baseUrl;
            if (quickSelect) quickSelect.value = 'custom';
            saveConfig();
            showToast(`Detected endpoint URL! Connecting to ${state.baseUrl}...`);
            fetchModelsFromApi();
          } else if (detected.type === 'key') {
            state.providerKey = detected.providerKey;
            const preset = PROVIDER_PRESETS[detected.providerKey];
            state.baseUrl = preset.baseUrl;
            if (quickSelect) quickSelect.value = detected.providerKey;
            if (quickBaseUrlInput) quickBaseUrlInput.value = state.baseUrl;
            showToast(`Auto-detected ${preset.name.split(' (')[0]} API key!`);
          }
        }
      });
    }

    if (quickSelect) {
      quickSelect.addEventListener('change', () => {
        state.providerKey = quickSelect.value;
        const preset = PROVIDER_PRESETS[state.providerKey] || PROVIDER_PRESETS.custom;
        state.baseUrl = preset.baseUrl;
        if (quickBaseUrlInput) quickBaseUrlInput.value = state.baseUrl;
        saveConfig();
        updateHeaderModelDisplay();
        updateQuickSetupCard();
      });
    }

    if (btnQuickSave) {
      btnQuickSave.onclick = async () => {
        if (quickBaseUrlInput && quickBaseUrlInput.value.trim()) {
          state.baseUrl = quickBaseUrlInput.value.trim().replace(/\/+$/, '');
        }
        if (quickKeyInput) {
          state.apiKey = quickKeyInput.value.trim();
        }
        saveConfig();
        updateHeaderModelDisplay();
        updateQuickSetupCard();
        showToast(`Connecting to ${state.baseUrl || 'endpoint'}...`);
        await fetchModelsFromApi();
      };
    }

    if (btnQuickOpenModels) {
      btnQuickOpenModels.onclick = () => {
        const modal = document.getElementById('modal-model-selector');
        if (modal) {
          renderModelList();
          modal.classList.add('open');
        }
      };
    }

    // Direct Quick-Inject Experimental Model in Model Selector
    const directModelInput = document.getElementById('direct-model-input');
    const directModelTier = document.getElementById('direct-model-tier');
    const btnApplyDirect = document.getElementById('btn-apply-direct-model');

    if (btnApplyDirect && directModelInput) {
      btnApplyDirect.onclick = () => {
        const id = directModelInput.value.trim();
        if (!id) {
          alert('Enter a model ID (e.g. agentic-uncensored-coder:latest).');
          return;
        }
        const isFree = directModelTier ? directModelTier.value === 'free' : true;
        const newModel = {
          id: id,
          name: id,
          provider: 'Self-Hosted / Custom',
          isFree: isFree,
          pricing: { prompt: 0, completion: 0, label: isFree ? 'Free (Local)' : 'Custom' },
          contextLength: 32768,
          description: `Custom model (${id}) injected directly.`
        };

        state.models.unshift(newModel);
        state.activeModel = newModel;
        saveModels();
        renderModelList();
        updateHeaderModelDisplay();
        updateQuickSetupCard();
        updateContextMetrics();
        directModelInput.value = '';

        const modal = document.getElementById('modal-model-selector');
        if (modal) modal.classList.remove('open');
        showToast(`Selected model: ${id}`);
      };
    }

    // System Prompt Textarea & Presets
    const sysInput = document.getElementById('system-prompt-input');
    if (sysInput) {
      sysInput.value = state.systemPrompt;
      sysInput.addEventListener('input', () => {
        state.systemPrompt = sysInput.value;
        saveContextState();
        updateContextMetrics();
      });
    }

    document.querySelectorAll('.btn-preset-chip[data-preset]').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.getAttribute('data-preset');
        if (SYSTEM_PRESETS[key] !== undefined) {
          state.systemPrompt = SYSTEM_PRESETS[key];
          if (sysInput) sysInput.value = state.systemPrompt;
          saveContextState();
          updateContextMetrics();
          showToast(`Applied preset: ${chip.textContent}`);
        }
      });
    });

    // Context Retention Strategy
    const stratSelect = document.getElementById('context-strategy-select');
    if (stratSelect) {
      stratSelect.value = state.contextStrategy;
      stratSelect.addEventListener('change', () => {
        state.contextStrategy = stratSelect.value;
        saveContextState();
        updateContextMetrics();
      });
    }

    // Model Selector Modal
    const modalModel = document.getElementById('modal-model-selector');
    const btnOpenModel = document.getElementById('btn-open-model-selector');
    const btnCloseModel = document.getElementById('btn-close-model-modal');
    const btnConfirmModel = document.getElementById('btn-confirm-model-selection');
    if (btnOpenModel) btnOpenModel.onclick = () => {
      renderModelList();
      modalModel.classList.add('open');
    };
    if (btnCloseModel) btnCloseModel.onclick = () => modalModel.classList.remove('open');
    if (btnConfirmModel) btnConfirmModel.onclick = () => modalModel.classList.remove('open');

    // Model Search & Filter Toggles
    const searchInput = document.getElementById('model-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        state.modelSearch = searchInput.value.trim();
        renderModelList();
      });
    }

    document.querySelectorAll('#model-tier-filter .segmented-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#model-tier-filter .segmented-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.modelTierFilter = btn.getAttribute('data-tier') || 'all';
        renderModelList();
      });
    });

    // Dynamic Fetch Buttons
    const btnFetch = document.getElementById('btn-fetch-models');
    if (btnFetch) btnFetch.onclick = fetchModelsFromApi;
    const btnFetchSettings = document.getElementById('btn-fetch-models-settings');
    if (btnFetchSettings) btnFetchSettings.onclick = fetchModelsFromApi;

    // Settings Modal
    const modalSettings = document.getElementById('modal-settings');
    const btnOpenSettings = document.getElementById('btn-open-settings');
    const btnCloseSettings = document.getElementById('btn-close-settings-modal');
    const btnSaveSettings = document.getElementById('btn-save-settings');

    function syncSettingsForm() {
      const providerSelect = document.getElementById('provider-preset-select');
      const baseUrlInput = document.getElementById('cfg-base-url');
      const apiKeyInput = document.getElementById('cfg-api-key');
      const customHeaderGroup = document.getElementById('group-custom-headers');
      const authHeaderInput = document.getElementById('cfg-auth-header');
      const proxySelect = document.getElementById('cfg-use-proxy');
      const tempSlider = document.getElementById('cfg-temperature');
      const tempVal = document.getElementById('val-temp');
      const toppSlider = document.getElementById('cfg-topp');
      const toppVal = document.getElementById('val-topp');
      const maxTokensInput = document.getElementById('cfg-max-tokens');

      if (providerSelect) providerSelect.value = state.providerKey;
      if (baseUrlInput) baseUrlInput.value = state.baseUrl;
      if (apiKeyInput) apiKeyInput.value = state.apiKey;
      if (authHeaderInput) authHeaderInput.value = state.customAuthHeader;
      if (proxySelect) proxySelect.value = state.useProxy;
      if (tempSlider) tempSlider.value = state.parameters.temperature;
      if (tempVal) tempVal.textContent = state.parameters.temperature;
      if (toppSlider) toppSlider.value = state.parameters.topP;
      if (toppVal) toppVal.textContent = state.parameters.topP;
      if (maxTokensInput) maxTokensInput.value = state.parameters.maxTokens;
      if (customHeaderGroup) {
        customHeaderGroup.style.display = state.providerKey === 'custom' ? 'block' : 'none';
      }
    }

    if (btnOpenSettings) {
      btnOpenSettings.onclick = () => {
        syncSettingsForm();
        modalSettings.classList.add('open');
      };
    }
    if (btnCloseSettings) btnCloseSettings.onclick = () => modalSettings.classList.remove('open');

    const providerSelect = document.getElementById('provider-preset-select');
    const baseUrlInput = document.getElementById('cfg-base-url');
    const authHeaderInput = document.getElementById('cfg-auth-header');
    const customHeaderGroup = document.getElementById('group-custom-headers');

    if (providerSelect) {
      providerSelect.addEventListener('change', () => {
        const key = providerSelect.value;
        const preset = PROVIDER_PRESETS[key] || PROVIDER_PRESETS.custom;
        if (baseUrlInput) baseUrlInput.value = preset.baseUrl;
        if (authHeaderInput) authHeaderInput.value = preset.authHeader;
        if (customHeaderGroup) customHeaderGroup.style.display = key === 'custom' ? 'block' : 'none';
      });
    }

    const tempSlider = document.getElementById('cfg-temperature');
    const tempVal = document.getElementById('val-temp');
    const toppSlider = document.getElementById('cfg-topp');
    const toppVal = document.getElementById('val-topp');
    if (tempSlider) tempSlider.oninput = () => { tempVal.textContent = tempSlider.value; };
    if (toppSlider) toppSlider.oninput = () => { toppVal.textContent = toppSlider.value; };

    if (btnSaveSettings) {
      btnSaveSettings.onclick = () => {
        state.providerKey = providerSelect.value;
        state.baseUrl = baseUrlInput.value.trim().replace(/\/+$/, '');
        state.apiKey = document.getElementById('cfg-api-key').value.trim();
        state.customAuthHeader = authHeaderInput.value.trim() || 'none';
        state.useProxy = document.getElementById('cfg-use-proxy').value;
        state.parameters.temperature = parseFloat(tempSlider.value);
        state.parameters.topP = parseFloat(toppSlider.value);
        state.parameters.maxTokens = parseInt(document.getElementById('cfg-max-tokens').value, 10) || 4096;

        saveConfig();
        modalSettings.classList.remove('open');
        updateHeaderModelDisplay();
        updateQuickSetupCard();
        showToast('Settings saved');
      };
    }

    // Settings Tabs
    document.querySelectorAll('.settings-tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.settings-tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.settings-tab-pane').forEach(p => p.style.display = 'none');
        tab.classList.add('active');
        const pane = document.getElementById(tab.getAttribute('data-tab'));
        if (pane) pane.style.display = 'block';
      });
    });

    // Test Connection Button
    const btnTestConn = document.getElementById('btn-test-connection');
    if (btnTestConn) {
      btnTestConn.onclick = async () => {
        btnTestConn.textContent = 'Testing...';
        btnTestConn.disabled = true;
        try {
          await fetchModelsFromApi();
          showToast('Connection verified successfully!');
        } catch (e) {
          showToast('Connection failed: ' + e.message, 'error');
        } finally {
          btnTestConn.textContent = 'Test Connection';
          btnTestConn.disabled = false;
        }
      };
    }

    // Attached Context Document Modal
    const modalDoc = document.getElementById('modal-context-doc');
    const btnAddDoc = document.getElementById('btn-add-context-snippet');
    const btnDrawerAddDoc = document.getElementById('btn-drawer-add-doc');
    const btnCloseDoc = document.getElementById('btn-close-doc-modal');
    const btnCancelDoc = document.getElementById('btn-cancel-doc-modal');
    const btnSaveDoc = document.getElementById('btn-save-context-doc');
    const docTitle = document.getElementById('doc-title-input');
    const docContent = document.getElementById('doc-content-input');
    const docTokensPill = document.getElementById('doc-tokens-estimate');

    const openDocModal = () => {
      docTitle.value = '';
      docContent.value = '';
      docTokensPill.textContent = '~0 tokens';
      modalDoc.classList.add('open');
    };
    if (btnAddDoc) btnAddDoc.onclick = openDocModal;
    if (btnDrawerAddDoc) btnDrawerAddDoc.onclick = openDocModal;
    if (btnCloseDoc) btnCloseDoc.onclick = () => modalDoc.classList.remove('open');
    if (btnCancelDoc) btnCancelDoc.onclick = () => modalDoc.classList.remove('open');

    if (docContent) {
      docContent.addEventListener('input', () => {
        const tok = MarkdownRenderer.estimateTokens(docContent.value);
        docTokensPill.textContent = `~${tok} tokens`;
      });
    }

    if (btnSaveDoc) {
      btnSaveDoc.onclick = () => {
        const title = docTitle.value.trim() || 'Untitled Reference';
        const content = docContent.value.trim();
        if (!content) {
          alert('Document content cannot be empty.');
          return;
        }
        const tokens = MarkdownRenderer.estimateTokens(content);
        state.contextDocs.push({
          id: 'doc_' + Date.now(),
          title: title,
          content: content,
          tokens: tokens,
          active: true
        });
        saveContextState();
        renderContextDocs();
        updateContextMetrics();
        modalDoc.classList.remove('open');
        showToast('Document attached to active context');
      };
    }

    // Raw Context Payload Inspector Modal
    const modalRaw = document.getElementById('modal-raw-context');
    const btnViewRaw = document.getElementById('btn-view-raw-context');
    const btnCloseRaw = document.getElementById('btn-close-raw-context-modal');
    const btnCloseRawBtn = document.getElementById('btn-close-raw-modal-btn');
    const btnCopyRaw = document.getElementById('btn-copy-raw-context');
    const rawViewer = document.getElementById('raw-context-json-viewer');

    if (btnViewRaw) {
      btnViewRaw.onclick = () => {
        const payload = buildContextPayload();
        const fullRequestInspection = {
          provider: state.providerKey,
          model: state.activeModel?.id,
          parameters: state.parameters,
          contextBreakdown: calculateActiveTokens(),
          payload: payload
        };
        rawViewer.textContent = JSON.stringify(fullRequestInspection, null, 2);
        modalRaw.classList.add('open');
      };
    }
    if (btnCloseRaw) btnCloseRaw.onclick = () => modalRaw.classList.remove('open');
    if (btnCloseRawBtn) btnCloseRawBtn.onclick = () => modalRaw.classList.remove('open');
    if (btnCopyRaw) {
      btnCopyRaw.onclick = () => {
        copyText(rawViewer.textContent, btnCopyRaw);
      };
    }

    // Add Custom Model Modal
    const modalCustom = document.getElementById('modal-custom-model');
    const btnOpenCustom = document.getElementById('btn-add-custom-model-trigger');
    const btnCloseCustom = document.getElementById('btn-close-custom-model-modal');
    const btnCancelCustom = document.getElementById('btn-cancel-custom-model');
    const btnSaveCustom = document.getElementById('btn-save-custom-model');
    const customId = document.getElementById('custom-model-id');
    const customName = document.getElementById('custom-model-name');
    const customTier = document.getElementById('custom-model-tier');
    const customCtx = document.getElementById('custom-model-context');

    if (btnOpenCustom) {
      btnOpenCustom.onclick = () => {
        customId.value = '';
        customName.value = '';
        modalCustom.classList.add('open');
      };
    }
    if (btnCloseCustom) btnCloseCustom.onclick = () => modalCustom.classList.remove('open');
    if (btnCancelCustom) btnCancelCustom.onclick = () => modalCustom.classList.remove('open');

    if (btnSaveCustom) {
      btnSaveCustom.onclick = () => {
        const id = customId.value.trim();
        if (!id) {
          alert('Model ID is required.');
          return;
        }
        const name = customName.value.trim() || id;
        const isFree = customTier.value === 'free';
        const ctx = parseInt(customCtx.value, 10) || 32768;

        const newModel = {
          id: id,
          name: name,
          provider: state.providerKey,
          isFree: isFree,
          pricing: { prompt: 0, completion: 0, label: isFree ? 'Free (Local)' : 'Custom' },
          contextLength: ctx,
          description: `Custom model added manually.`
        };

        state.models.unshift(newModel);
        state.activeModel = newModel;
        saveModels();
        renderModelList();
        updateHeaderModelDisplay();
        updateQuickSetupCard();
        updateContextMetrics();
        modalCustom.classList.remove('open');
        showToast(`Added model ${id}`);
      };
    }

    // ========================================================================
    // Agentic Coding Listeners: Persona, Workspace, Files, Slash & Command Palette
    // ========================================================================

    // Agent Studio Modal (Custom Agents & Autonomous Capabilities)
    const btnOpenPersona = document.getElementById('btn-open-persona-menu');
    const modalAgentStudio = document.getElementById('modal-agent-studio');
    const btnCloseAgent = document.getElementById('btn-close-agent-modal');
    const btnStudioCreate = document.getElementById('btn-studio-create-agent');
    const btnStudioSave = document.getElementById('btn-studio-save-agent');
    const btnStudioActivate = document.getElementById('btn-studio-activate-agent');
    const btnStudioDelete = document.getElementById('btn-studio-delete-agent');
    const btnStudioExport = document.getElementById('btn-studio-export-agent');
    const btnStudioImport = document.getElementById('btn-studio-import-agent');
    const agentImportFileInput = document.getElementById('agent-import-file');
    const agentInputTemp = document.getElementById('agent-input-temp');
    const agentTempVal = document.getElementById('agent-temp-val');

    if (btnOpenPersona && modalAgentStudio) {
      btnOpenPersona.onclick = () => {
        renderAgentStudio();
        modalAgentStudio.classList.add('open');
      };
    }
    if (btnCloseAgent && modalAgentStudio) {
      btnCloseAgent.onclick = () => modalAgentStudio.classList.remove('open');
    }
    if (btnStudioCreate) {
      btnStudioCreate.onclick = () => {
        selectedStudioAgentId = 'new';
        renderAgentStudio();
      };
    }
    if (btnStudioSave) {
      btnStudioSave.onclick = () => {
        saveCurrentAgentFromForm();
      };
    }
    if (btnStudioActivate) {
      btnStudioActivate.onclick = () => {
        if (selectedStudioAgentId && selectedStudioAgentId !== 'new') {
          activateAgent(selectedStudioAgentId);
          if (modalAgentStudio) modalAgentStudio.classList.remove('open');
        } else {
          showToast('Save the agent before activating.', 'error');
        }
      };
    }
    if (btnStudioDelete) {
      btnStudioDelete.onclick = () => {
        deleteSelectedCustomAgent();
      };
    }
    if (btnStudioExport) {
      btnStudioExport.onclick = () => {
        exportAgentJson();
      };
    }
    if (btnStudioImport && agentImportFileInput) {
      btnStudioImport.onclick = () => agentImportFileInput.click();
      agentImportFileInput.onchange = () => {
        if (agentImportFileInput.files && agentImportFileInput.files[0]) {
          importAgentJson(agentImportFileInput.files[0]);
          agentImportFileInput.value = '';
        }
      };
    }
    if (agentInputTemp && agentTempVal) {
      agentInputTemp.addEventListener('input', () => {
        agentTempVal.textContent = agentInputTemp.value;
      });
    }

    // Code Workspace Drawer Toggles & Actions
    const btnToggleWs = document.getElementById('btn-toggle-workspace-drawer');
    const btnCloseWs = document.getElementById('btn-close-workspace-drawer');
    const btnWsCopy = document.getElementById('btn-ws-copy');
    const btnWsDownload = document.getElementById('btn-ws-download');
    const btnWsWrap = document.getElementById('btn-ws-toggle-wrap');
    const btnWsPreview = document.getElementById('btn-ws-toggle-preview');
    const btnWsRefreshTree = document.getElementById('btn-ws-refresh-tree');
    const btnWsNewFile = document.getElementById('btn-ws-new-file');

    if (btnToggleWs) btnToggleWs.onclick = () => toggleWorkspace();
    if (btnCloseWs) btnCloseWs.onclick = () => toggleWorkspace(false);
    if (btnWsCopy) btnWsCopy.onclick = copyWorkspaceCode;
    if (btnWsDownload) btnWsDownload.onclick = downloadWorkspaceFile;

    if (btnWsWrap) {
      btnWsWrap.onclick = () => {
        state.workspaceWrap = !state.workspaceWrap;
        renderWorkspaceEditor();
      };
    }

    if (btnWsPreview) {
      btnWsPreview.onclick = () => {
        state.workspacePreview = !state.workspacePreview;
        renderWorkspaceEditor();
      };
    }

    if (btnWsRefreshTree) {
      btnWsRefreshTree.onclick = () => fetchWorkspaceTree();
    }

    if (btnWsNewFile) {
      btnWsNewFile.onclick = async () => {
        const filePath = prompt('Enter relative path for new file (e.g. src/index.js):');
        if (!filePath || !filePath.trim()) return;
        const normalized = filePath.trim().replace(/\\/g, '/');
        try {
          const res = await fetch('/api/workspace/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: normalized, content: '' })
          });
          const data = await res.json();
          if (data.success) {
            showToast(`Created ${normalized}`);
            await fetchWorkspaceTree();
            const fileName = normalized.split('/').pop();
            const existing = state.workspaceFiles.find(f => f.path === normalized || f.name === fileName);
            if (!existing) {
              const newTab = {
                id: 'ws_tab_' + Date.now(),
                name: fileName,
                path: normalized,
                lang: fileName.split('.').pop() || 'txt',
                content: ''
              };
              state.workspaceFiles.push(newTab);
              state.activeWorkspaceFileId = newTab.id;
            } else {
              state.activeWorkspaceFileId = existing.id;
            }
            renderWorkspaceTabs();
            renderWorkspaceEditor();
            toggleWorkspace(true);
          } else {
            showToast(data.error || 'Failed to create file', 'error');
          }
        } catch (err) {
          showToast(`Error creating file: ${err.message}`, 'error');
        }
      };
    }

    // Quick Slash Command Chips
    document.querySelectorAll('.btn-slash-chip[data-template]').forEach(chip => {
      chip.addEventListener('click', () => {
        const tmpl = chip.getAttribute('data-template');
        const txt = document.getElementById('chat-textarea');
        if (txt && tmpl) {
          if (txt.value.startsWith('/')) {
            txt.value = tmpl;
          } else if (txt.value.trim().length > 0) {
            txt.value = tmpl + txt.value;
          } else {
            txt.value = tmpl;
          }
          txt.focus();
          txt.setSelectionRange(txt.value.length, txt.value.length);
          updateInputTokenCounter();
        }
      });
    });

    // File Attachments & Drag-and-Drop
    const btnAttachFile = document.getElementById('btn-attach-code-file');
    const fileUploadInput = document.getElementById('file-upload-input');
    const dropOverlay = document.getElementById('file-drop-overlay');
    const mainWorkspace = document.getElementById('main-workspace');

    if (btnAttachFile && fileUploadInput) {
      btnAttachFile.onclick = () => fileUploadInput.click();
      fileUploadInput.onchange = () => {
        handleFiles(fileUploadInput.files);
        fileUploadInput.value = '';
      };
    }

    if (mainWorkspace && dropOverlay) {
      ['dragenter', 'dragover'].forEach(eventName => {
        mainWorkspace.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropOverlay.classList.add('active');
        });
      });

      ['dragleave', 'dragend'].forEach(eventName => {
        mainWorkspace.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!e.relatedTarget || !mainWorkspace.contains(e.relatedTarget)) {
            dropOverlay.classList.remove('active');
          }
        });
      });

      mainWorkspace.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropOverlay.classList.remove('active');
        if (e.dataTransfer && e.dataTransfer.files) {
          handleFiles(e.dataTransfer.files);
        }
      });
    }

    // Command Palette Trigger & Keyboard Listeners (Ctrl+K)
    const btnOpenCmd = document.getElementById('btn-open-command-palette');
    const cmdInput = document.getElementById('command-palette-input');
    const modalCmd = document.getElementById('modal-command-palette');

    if (btnOpenCmd) btnOpenCmd.onclick = openCommandPalette;

    if (modalCmd) {
      modalCmd.addEventListener('click', (e) => {
        if (e.target === modalCmd) closeCommandPalette();
      });
    }

    if (cmdInput) {
      cmdInput.addEventListener('input', () => {
        renderCommandPalette(cmdInput.value);
      });

      cmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedCmdIndex++;
          renderCommandPalette(cmdInput.value);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedCmdIndex = Math.max(0, selectedCmdIndex - 1);
          renderCommandPalette(cmdInput.value);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const activeItem = document.querySelector('.command-palette-item.active');
          if (activeItem) activeItem.click();
        } else if (e.key === 'Escape') {
          closeCommandPalette();
        }
      });
    }

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const modal = document.getElementById('modal-command-palette');
        if (modal?.classList.contains('open')) {
          closeCommandPalette();
        } else {
          openCommandPalette();
        }
      }
      // Ctrl+Shift+W to toggle workspace
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        toggleWorkspace();
      }
      // Escape closes open modals
      else if (e.key === 'Escape') {
        closeCommandPalette();
        document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
      }
    });
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  function init() {
    loadPersistedState();

    document.documentElement.setAttribute('data-theme', state.theme);
    const iconDark = document.getElementById('theme-icon-dark');
    const iconLight = document.getElementById('theme-icon-light');
    if (iconDark && iconLight) {
      iconDark.style.display = state.theme === 'dark' ? 'block' : 'none';
      iconLight.style.display = state.theme === 'light' ? 'block' : 'none';
    }

    setupEventListeners();
    updateAgentPillDisplay();
    fetchWorkspaceTree();
    renderAttachedFiles();
    renderWorkspaceTabs();
    renderWorkspaceEditor();

    renderConversationsList();
    renderMessages();
    renderContextDocs();
    updateHeaderModelDisplay();
    updateQuickSetupCard();
    renderModelList();
    updateContextMetrics();

    if (window.innerWidth > 1400) {
      const drawer = document.getElementById('context-drawer');
      const btnToggleDrawer = document.getElementById('btn-toggle-context-drawer');
      if (drawer && btnToggleDrawer) {
        drawer.classList.remove('closed');
        btnToggleDrawer.classList.add('active');
        state.isDrawerOpen = true;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
