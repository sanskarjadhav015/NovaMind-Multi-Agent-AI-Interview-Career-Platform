/**
 * @file CodeEditor.jsx (Frontend Component)
 * @description In-browser interactive live coding modal providing starter templates
 * for JavaScript, Python, TypeScript, Java, and C++, syntax indentation, and clipboard export.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  FiCode,
  FiX,
  FiCopy,
  FiCheck,
  FiRotateCcw,
  FiCornerDownLeft
} from 'react-icons/fi';

const TEMPLATES = {
  javascript: `// JavaScript Solution
function solution(input) {
  // Write your code here
  
  return null;
}

console.log(solution("test"));`,
  python: `# Python Solution
def solution(input_data):
    # Write your code here
    
    return None

print(solution("test"))`,
  typescript: `// TypeScript Solution
function solution(input: string): any {
  // Write your code here
  
  return null;
}

console.log(solution("test"));`,
  java: `// Java Solution
public class Solution {
    public static void main(String[] args) {
        // Write your code here
    }
}`,
  cpp: `// C++ Solution
#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    // Write your code here
    return 0;
}`
};

/**
 * Interactive code editor modal for coding questions during technical interviews.
 * 
 * @param {{ onClose: () => void, onInsertCode: (codeMarkdown: string) => void }} props
 */
function CodeEditor({ onClose, onInsertCode }) {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(TEMPLATES['javascript']);
  const [copied, setCopied] = useState(false);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(TEMPLATES[lang] || '');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(TEMPLATES[language] || '');
  };

  const handleInsert = () => {
    if (onInsertCode) {
      onInsertCode(`\n\`\`\`${language}\n${code}\n\`\`\`\n`);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const lineNumbers = code.split('\n').map((_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-4xl bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[75vh]"
      >
        {/* Editor Header */}
        <div className="h-12 bg-neutral-950 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-purple-600/30 text-purple-400 flex items-center justify-center text-xs">
              <FiCode />
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Live Coding Pad
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-neutral-800 text-xs font-semibold text-neutral-200 border border-neutral-700 rounded-lg px-2.5 py-1 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="typescript">TypeScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer text-xs flex items-center gap-1 px-2"
              title="Copy code"
            >
              {copied ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer text-xs flex items-center gap-1 px-2"
              title="Reset starter template"
            >
              <FiRotateCcw />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer ml-1"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="flex-1 flex overflow-hidden bg-[#0d1117] text-neutral-200 font-mono text-xs sm:text-sm">
          {/* Gutter */}
          <div className="w-12 bg-[#090d13] text-neutral-600 select-none py-4 text-right pr-3 font-mono border-r border-neutral-800/80 shrink-0 overflow-hidden leading-6">
            {lineNumbers.map((num) => (
              <div key={num}>{num}</div>
            ))}
          </div>

          {/* Text Area */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck="false"
            autoCapitalize="off"
            autoComplete="off"
            className="flex-1 p-4 bg-transparent text-neutral-100 font-mono resize-none focus:outline-none leading-6 selection:bg-purple-600/30 overflow-auto"
            placeholder="// Type your code here..."
          />
        </div>

        {/* Editor Footer */}
        <div className="h-14 bg-neutral-950 border-t border-neutral-800 px-4 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-neutral-400 hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px]">Tab</kbd> for 2 spaces indent. Code will be formatted into markdown.
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FiCornerDownLeft size={14} />
              <span>Insert into Answer Box</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default CodeEditor;
