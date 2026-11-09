/**
 * Utilitarian Markdown & Syntax Renderer
 * Zero external dependencies. Fast, secure, and clean.
 * Enhanced for Agentic Coding (Thought traces, unified diffs, workspace extractors, interactive tasks).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MarkdownRenderer = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderInline(text) {
    if (!text) return '';

    // Inline code: `code`
    text = text.replace(/`([^`]+)`/g, function (_, code) {
      return '<code class="inline-code">' + escapeHtml(code) + '</code>';
    });

    // Bold + Italic: ***text*** or ___text___
    text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');

    // Bold: **text** or __text__
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Strikethrough: ~~text~~
    text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Links: [label](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, url) {
      var safeUrl = escapeHtml(url.trim());
      if (!/^https?:\/\/|^\/|^mailto:/i.test(safeUrl)) {
        return escapeHtml(label);
      }
      return '<a href="' + safeUrl + '" target="_blank" rel="noopener noreferrer" class="chat-link">' + label + '</a>';
    });

    return text;
  }

  function renderDiffCode(rawCode) {
    var lines = rawCode.split('\n');
    var renderedLines = lines.map(function (line) {
      var escaped = escapeHtml(line);
      if (line.startsWith('+') && !line.startsWith('+++')) {
        return '<span class="diff-line diff-add">' + escaped + '</span>';
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        return '<span class="diff-line diff-del">' + escaped + '</span>';
      } else if (line.startsWith('@@')) {
        return '<span class="diff-line diff-chunk">' + escaped + '</span>';
      }
      return '<span class="diff-line">' + escaped + '</span>';
    });
    return renderedLines.join('\n');
  }

  function renderMarkdown(md) {
    if (!md) return '';

    // Normalize newlines
    var text = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 1. Parse <think>...</think> Reasoning / Thought Traces (DeepSeek R1, Gemini Flash Thinking, Qwen)
    text = text.replace(/<think>([\s\S]*?)(?:<\/think>|$)/gi, function (_, thoughtContent) {
      var trimmed = thoughtContent.trim();
      if (!trimmed) return '';
      var renderedThought = renderMarkdownBody(trimmed);
      return '\n\n<details class="thinking-accordion">' +
        '<summary class="thinking-summary">' +
          '<svg class="thinking-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
          '<span>Reasoning & Thought Trace</span>' +
        '</summary>' +
        '<div class="thinking-body">' + renderedThought + '</div>' +
      '</details>\n\n';
    });

    // 2. Parse <tool_call name="...">...</tool_call>
    text = text.replace(/<tool_call\s+name="([^"]+)">([\s\S]*?)<\/tool_call>/gi, function (_, toolName, toolBody) {
      return renderToolCallCard(toolName, toolBody);
    });

    // 3. Parse <plan>...</plan>
    text = text.replace(/<plan>([\s\S]*?)<\/plan>/gi, function (_, planBody) {
      return renderPlanCard(planBody);
    });

    return renderMarkdownBody(text);
  }

  function renderToolCallCard(toolName, rawJson) {
    var cleanTool = escapeHtml(toolName.trim().toLowerCase());
    var parsed = {};
    try {
      parsed = JSON.parse(rawJson.trim());
    } catch (e) {
      parsed = { raw: rawJson.trim() };
    }

    var targetLabel = parsed.path || parsed.command || parsed.file || parsed.url || cleanTool;
    var encodedData = encodeURIComponent(rawJson.trim());

    var iconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>';
    var actionVerb = 'Execute Action';

    if (cleanTool === 'write_file') {
      iconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>';
      actionVerb = 'Write File to Workspace';
    } else if (cleanTool === 'edit_file') {
      iconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
      actionVerb = 'Apply Patch to File';
    } else if (cleanTool === 'execute_cmd') {
      iconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>';
      actionVerb = 'Run Shell Command';
    } else if (cleanTool === 'read_file') {
      iconSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      actionVerb = 'Read File from Workspace';
    }

    var snippet = parsed.content ? parsed.content.slice(0, 400) + (parsed.content.length > 400 ? '...' : '') : (parsed.command || rawJson);

    return '\n\n<div class="agent-tool-card" data-tool="' + cleanTool + '">' +
      '<div class="agent-tool-header">' +
        '<div class="agent-tool-title">' +
          iconSvg +
          '<span class="tool-tag">' + cleanTool + '</span>' +
          '<span class="tool-target">' + escapeHtml(targetLabel) + '</span>' +
        '</div>' +
        '<button type="button" class="btn-tool-apply" data-tool="' + cleanTool + '" data-payload="' + encodedData + '" onclick="window.applyAgentAction(this)">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
          '<span>' + actionVerb + '</span>' +
        '</button>' +
      '</div>' +
      '<pre class="agent-tool-preview"><code>' + escapeHtml(snippet) + '</code></pre>' +
    '</div>\n\n';
  }

  function renderPlanCard(planBody) {
    var renderedSteps = renderMarkdownBody(planBody.trim());
    return '\n\n<div class="agent-plan-card">' +
      '<div class="agent-plan-header">' +
        '<div class="agent-plan-title">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>' +
          '<span>Autonomous Project Plan</span>' +
        '</div>' +
        '<span class="agent-plan-badge">Active Roadmap</span>' +
      '</div>' +
      '<div class="agent-plan-body">' + renderedSteps + '</div>' +
    '</div>\n\n';
  }

  function renderMarkdownBody(text) {
    // Store code blocks to avoid inline processing inside code blocks
    var codeBlocks = [];
    text = text.replace(/```([a-zA-Z0-9_\-.:]*)\n([\s\S]*?)```/g, function (_, header, code) {
      var id = '___CODEBLOCK_' + codeBlocks.length + '___';
      var lang = 'text';
      var filename = '';

      if (header) {
        var parts = header.trim().split(/[:\s]+/);
        lang = parts[0].toLowerCase();
        if (parts.length > 1) {
          filename = parts.slice(1).join(' ');
        }
      }

      codeBlocks.push({
        lang: lang || 'code',
        filename: filename,
        code: code
      });
      return id;
    });

    var lines = text.split('\n');
    var html = [];
    var inList = false;
    var listType = null;
    var inBlockquote = false;
    var tableLines = [];

    function flushList() {
      if (inList) {
        html.push(listType === 'ol' ? '</ol>' : '</ul>');
        inList = false;
        listType = null;
      }
    }

    function flushBlockquote() {
      if (inBlockquote) {
        html.push('</blockquote>');
        inBlockquote = false;
      }
    }

    function flushTable() {
      if (tableLines.length > 0) {
        html.push(renderTable(tableLines));
        tableLines = [];
      }
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      // Check for Table line
      if (/^\s*\|.*\|\s*$/.test(line)) {
        flushList();
        flushBlockquote();
        tableLines.push(line);
        continue;
      } else if (tableLines.length > 0) {
        flushTable();
      }

      // Check for Code Block placeholder
      var codeMatch = line.match(/^___CODEBLOCK_(\d+)___$/);
      if (codeMatch) {
        flushList();
        flushBlockquote();
        var block = codeBlocks[parseInt(codeMatch[1], 10)];
        if (block) {
          var displayLang = block.lang || 'code';
          var displayTitle = block.filename ? (block.filename + ' (' + displayLang + ')') : displayLang;
          var encodedCode = encodeURIComponent(block.code);
          var lineCount = block.code.split('\n').length;
          
          var formattedCode = displayLang === 'diff' 
            ? renderDiffCode(block.code.replace(/\n$/, ''))
            : escapeHtml(block.code.replace(/\n$/, ''));

          html.push(
            '<div class="code-block-container" data-lang="' + escapeHtml(displayLang) + '">' +
              '<div class="code-block-header">' +
                '<div class="code-block-header-left">' +
                  '<span class="code-block-lang">' + escapeHtml(displayTitle) + '</span>' +
                  '<span class="code-block-meta">' + lineCount + ' lines</span>' +
                '</div>' +
                '<div class="code-block-header-actions">' +
                  '<button type="button" class="btn-copy-code" data-code="' + encodedCode + '" data-lang="' + escapeHtml(displayLang) + '" data-filename="' + escapeHtml(block.filename || ('snippet.' + (displayLang || 'txt'))) + '" onclick="window.sendToWorkspace(this)" title="Send to Code Workspace / Artifacts pane">' +
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>' +
                    '<span>Workspace</span>' +
                  '</button>' +
                  '<button type="button" class="btn-copy-code" data-code="' + encodedCode + '" onclick="window.copyCodeBlock(this)">' +
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
                    '<span>Copy</span>' +
                  '</button>' +
                '</div>' +
              '</div>' +
              '<pre class="code-pre"><code class="language-' + escapeHtml(displayLang) + '">' + formattedCode + '</code></pre>' +
            '</div>'
          );
        }
        continue;
      }

      // Check if line is raw HTML details (from think block)
      if (line.startsWith('<details') || line.startsWith('</details>') || line.startsWith('<summary') || line.startsWith('</div>')) {
        flushList();
        flushBlockquote();
        html.push(line);
        continue;
      }

      // Horizontal Rule: ---, ***, ___
      if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) {
        flushList();
        flushBlockquote();
        html.push('<hr class="divider" />');
        continue;
      }

      // Headings: # to ######
      var headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        flushList();
        flushBlockquote();
        var level = headingMatch[1].length;
        var headingText = renderInline(headingMatch[2].trim());
        html.push('<h' + level + ' class="chat-heading h' + level + '">' + headingText + '</h' + level + '>');
        continue;
      }

      // Blockquote: > text
      var bqMatch = line.match(/^>\s?(.*)$/);
      if (bqMatch) {
        flushList();
        if (!inBlockquote) {
          html.push('<blockquote class="chat-blockquote">');
          inBlockquote = true;
        }
        html.push('<p>' + renderInline(bqMatch[1]) + '</p>');
        continue;
      } else {
        flushBlockquote();
      }

      // Ordered list: 1. text
      var olMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);
      if (olMatch) {
        if (!inList || listType !== 'ol') {
          flushList();
          html.push('<ol class="chat-list chat-ol">');
          inList = true;
          listType = 'ol';
        }
        html.push('<li>' + renderInline(olMatch[2]) + '</li>');
        continue;
      }

      // Unordered list / task list
      var ulMatch = line.match(/^\s*[-*+]\s+(.*)$/);
      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          flushList();
          html.push('<ul class="chat-list chat-ul">');
          inList = true;
          listType = 'ul';
        }
        var itemContent = ulMatch[1];
        var taskMatch = itemContent.match(/^\[([ xX])\]\s+(.*)$/);
        if (taskMatch) {
          var checked = taskMatch[1].toLowerCase() === 'x';
          html.push('<li class="task-item"><input type="checkbox" ' + (checked ? 'checked' : '') + ' class="task-checkbox" onchange="window.toggleInteractiveTask(this)" /> <span>' + renderInline(taskMatch[2]) + '</span></li>');
        } else {
          html.push('<li>' + renderInline(itemContent) + '</li>');
        }
        continue;
      }

      flushList();

      if (line.trim() === '') {
        continue;
      }

      html.push('<p class="chat-p">' + renderInline(line) + '</p>');
    }

    flushList();
    flushBlockquote();
    flushTable();

    return html.join('\n');
  }

  function renderTable(lines) {
    if (lines.length < 2) return '';
    var headerRow = lines[0];
    var separatorRow = lines[1];
    var bodyRows = lines.slice(2);

    function splitCells(row) {
      var cells = row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
      return cells.map(function (c) { return c.trim(); });
    }

    var headers = splitCells(headerRow);
    var seps = splitCells(separatorRow);

    var alignments = seps.map(function (sep) {
      var left = sep.startsWith(':');
      var right = sep.endsWith(':');
      if (left && right) return 'center';
      if (right) return 'right';
      return 'left';
    });

    var out = ['<div class="table-wrapper"><table class="chat-table">'];
    out.push('<thead><tr>');
    headers.forEach(function (h, idx) {
      var align = alignments[idx] || 'left';
      out.push('<th style="text-align:' + align + '">' + renderInline(h) + '</th>');
    });
    out.push('</tr></thead>');

    if (bodyRows.length > 0) {
      out.push('<tbody>');
      bodyRows.forEach(function (row) {
        var cells = splitCells(row);
        out.push('<tr>');
        headers.forEach(function (_, idx) {
          var cell = cells[idx] || '';
          var align = alignments[idx] || 'left';
          out.push('<td style="text-align:' + align + '">' + renderInline(cell) + '</td>');
        });
        out.push('</tr>');
      });
      out.push('</tbody>');
    }

    out.push('</table></div>');
    return out.join('');
  }

  function estimateTokens(text) {
    if (!text || typeof text !== 'string') return 0;
    var trimmed = text.trim();
    if (!trimmed) return 0;
    var words = trimmed.split(/\s+/).length;
    var chars = trimmed.length;
    return Math.ceil(Math.max(words * 1.3, chars / 3.8));
  }

  return {
    render: renderMarkdown,
    renderInline: renderInline,
    estimateTokens: estimateTokens
  };
});
