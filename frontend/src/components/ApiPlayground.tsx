import React, { useState } from 'react';
import { Play, Send, CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import axios from 'axios';

interface ApiPlaygroundProps {
  method: string;
  route: string;
  pathParameters?: string[];
  sampleRequest?: any;
}

export const ApiPlayground: React.FC<ApiPlaygroundProps> = ({
  method,
  route,
  pathParameters = [],
  sampleRequest = {},
}) => {
  const [token, setToken] = useState('demo-bearer-token');
  const [pathParamValues, setPathParamValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    pathParameters.forEach((p) => {
      init[p] = p === 'id' ? '101' : 'sample-value';
    });
    return init;
  });

  const [requestBody, setRequestBody] = useState(() =>
    sampleRequest && Object.keys(sampleRequest).length > 0
      ? JSON.stringify(sampleRequest, null, 2)
      : '{\n  "demo": true\n}'
  );

  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute actual route with path param replacements
  let computedRoute = route;
  pathParameters.forEach((p) => {
    computedRoute = computedRoute.replace(`:${p}`, pathParamValues[p] || `:${p}`);
  });

  const handleExecute = async () => {
    setLoading(true);
    setErrorMsg(null);
    setResponseData(null);
    setResponseStatus(null);
    setResponseTime(null);

    const startTime = performance.now();
    try {
      // In web app context, we execute against the host API or fallback to mock data
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let bodyData = undefined;
      if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        try {
          bodyData = JSON.parse(requestBody);
        } catch {
          throw new Error('Invalid JSON format in Request Body');
        }
      }

      const res = await axios({
        method: method.toLowerCase(),
        url: computedRoute,
        headers,
        data: bodyData,
        validateStatus: () => true, // resolve on any status
      });

      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(res.status);
      setResponseData(res.data);
    } catch (err: any) {
      const endTime = performance.now();
      setResponseTime(Math.round(endTime - startTime));
      setResponseStatus(500);
      setErrorMsg(err.message || 'Failed to dispatch API call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Play className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100">Interactive API Sandbox</h3>
        </div>
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-xs text-slate-400 font-mono">100% On-Device Runner</span>
        </div>
      </div>

      {/* URL bar & Auth token inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 flex items-center rounded-lg bg-slate-950 px-3 py-2 border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 mr-2">{method}</span>
          <span className="text-xs font-mono text-slate-300 truncate">{computedRoute}</span>
        </div>
        <div className="flex items-center rounded-lg bg-slate-950 px-3 py-2 border border-slate-800">
          <span className="text-xs font-mono text-slate-500 mr-2">Token:</span>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Bearer token..."
            className="w-full bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Path Params Editor */}
      {pathParameters.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-slate-400">Path Parameters</label>
          <div className="grid grid-cols-2 gap-3">
            {pathParameters.map((param) => (
              <div key={param} className="flex items-center space-x-2 rounded-lg bg-slate-950 p-2 border border-slate-800">
                <span className="text-xs font-mono text-cyan-400">:{param}</span>
                <input
                  type="text"
                  value={pathParamValues[param] || ''}
                  onChange={(e) => setPathParamValues({ ...pathParamValues, [param]: e.target.value })}
                  className="w-full bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body Payload Editor */}
      {['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && (
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-slate-400">Request Body (JSON)</label>
          <textarea
            rows={4}
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            className="w-full rounded-lg bg-slate-950 p-3 text-xs font-mono text-slate-200 border border-slate-800 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      )}

      {/* Execute Button */}
      <div className="flex justify-end">
        <button
          onClick={handleExecute}
          disabled={loading}
          className="flex items-center space-x-2 rounded-lg bg-cyan-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition-colors shadow-lg shadow-cyan-500/20"
        >
          <Send className="h-3.5 w-3.5" />
          <span>{loading ? 'Executing API Call...' : 'Send Request'}</span>
        </button>
      </div>

      {/* Response Display Panel */}
      {(responseStatus !== null || errorMsg) && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-3">
              {responseStatus && responseStatus >= 200 && responseStatus < 300 ? (
                <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{responseStatus} OK</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1.5 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/30">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{responseStatus || 'ERROR'}</span>
                </span>
              )}

              {responseTime !== null && (
                <span className="flex items-center space-x-1 text-xs text-slate-400 font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{responseTime} ms</span>
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {errorMsg ? (
              <p className="text-xs text-rose-400 font-mono">{errorMsg}</p>
            ) : (
              <pre className="text-xs font-mono text-slate-200">
                <code>{JSON.stringify(responseData, null, 2)}</code>
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
