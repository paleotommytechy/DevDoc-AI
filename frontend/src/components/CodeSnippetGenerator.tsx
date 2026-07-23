import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2 } from 'lucide-react';

interface CodeSnippetGeneratorProps {
  method: string;
  route: string;
  sampleRequest?: any;
}

export const CodeSnippetGenerator: React.FC<CodeSnippetGeneratorProps> = ({
  method,
  route,
  sampleRequest,
}) => {
  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python' | 'go'>('curl');
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const fullUrl = `${baseUrl}${route.startsWith('/') ? route : '/' + route}`;
  const upperMethod = method.toUpperCase();
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(upperMethod) && sampleRequest && Object.keys(sampleRequest).length > 0;
  const jsonBody = hasBody ? JSON.stringify(sampleRequest, null, 2) : '';

  const generateSnippet = () => {
    switch (activeLang) {
      case 'curl': {
        let snippet = `curl -X ${upperMethod} "${fullUrl}" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer YOUR_API_TOKEN"`;
        if (hasBody) {
          snippet += ` \\\n  -d '${JSON.stringify(sampleRequest)}'`;
        }
        return snippet;
      }
      case 'js': {
        if (hasBody) {
          return `const response = await fetch("${fullUrl}", {
  method: "${upperMethod}",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_TOKEN"
  },
  body: JSON.stringify(${jsonBody})
});
const data = await response.json();
console.log(data);`;
        }
        return `const response = await fetch("${fullUrl}", {
  method: "${upperMethod}",
  headers: {
    "Authorization": "Bearer YOUR_API_TOKEN"
  }
});
const data = await response.json();
console.log(data);`;
      }
      case 'python': {
        if (hasBody) {
          return `import requests

url = "${fullUrl}"
headers = {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json"
}
payload = ${JSON.stringify(sampleRequest, null, 4)}

response = requests.${upperMethod.toLowerCase()}(url, headers=headers, json=payload)
print(response.json())`;
        }
        return `import requests

url = "${fullUrl}"
headers = {
    "Authorization": "Bearer YOUR_API_TOKEN"
}

response = requests.${upperMethod.toLowerCase()}(url, headers=headers)
print(response.json())`;
      }
      case 'go': {
        return `package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    url := "${fullUrl}"
    req, _ := http.NewRequest("${upperMethod}", url, nil)
    req.Header.Add("Authorization", "Bearer YOUR_API_TOKEN")

    res, err := http.DefaultClient.Do(req)
    if err != nil {
        panic(err)
    }
    defer res.Body.Close()

    body, _ := io.ReadAll(res.Body)
    fmt.Println(string(body))
}`;
      }
      default:
        return '';
    }
  };

  const currentSnippet = generateSnippet();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2.5">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Client Code Generator</span>
        </div>

        <div className="flex items-center space-x-1 rounded-lg bg-slate-950 p-1 border border-slate-800">
          {(['curl', 'js', 'python', 'go'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLang(lang)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                activeLang === lang
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang === 'curl' ? 'cURL' : lang === 'js' ? 'JavaScript' : lang === 'python' ? 'Python' : 'Go'}
            </button>
          ))}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 rounded-lg bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-400" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-4 bg-slate-950 overflow-x-auto">
        <pre className="text-xs font-mono leading-relaxed text-slate-300">
          <code>{currentSnippet}</code>
        </pre>
      </div>
    </div>
  );
};
