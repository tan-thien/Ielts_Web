import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { getAIHistory, getEvaluation, streamEvaluateWriting } from "../../services/ai.service";
import type { AIStreamEvent } from "../../services/ai.service";
import type { AICriterionResult, AIEvaluationResult, AIPracticeAttempt, WritingTaskType } from "../../types/ai";
import "./WritingPage.css";

const prompts: Record<WritingTaskType, string> = {
    task1: "The chart below shows information about a topic. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    task2: "Some people believe that online education is more effective than traditional classroom education. To what extent do you agree or disagree?",
};

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Cannot read image"));
    reader.readAsDataURL(file);
});

function Evaluation({ result }: { result: AIEvaluationResult }) {
    return <section className="ai-result">
        <div className="ai-result-heading"><div><span>AI estimated band</span><strong>{result.estimatedOverallBand.toFixed(1)}</strong></div><p>{result.disclaimer}</p></div>
        <div className="criterion-grid">{result.criteria.map((criterion) => <article key={criterion.name}><span>{criterion.name}</span><strong>{criterion.band.toFixed(1)}</strong><p>{criterion.weaknesses[0] || criterion.strengths[0] || "No detailed note returned."}</p></article>)}</div>
        <div className="feedback-grid"><div><h3>Strengths</h3><ul>{result.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3>Focus next</h3><ul>{(result.actionPlan.length ? result.actionPlan : result.weaknesses).map((item) => <li key={item}>{item}</li>)}</ul></div></div>
        {result.priorityErrors.length > 0 && <div className="error-list"><h3>Priority errors</h3>{result.priorityErrors.map((error, index) => <article key={`${error.quote}-${index}`}><b>{error.type || "Writing issue"}</b>{error.location && <small>Location: {error.location}</small>}{error.quote ? <blockquote>“{error.quote}”</blockquote> : <small>Exact sentence was not returned by AI.</small>}{error.explanation && <p>{error.explanation}</p>}{error.suggestion && <small>Suggestion: {error.suggestion}</small>}</article>)}</div>}
        {result.generalFeedback && <p className="general-feedback">{result.generalFeedback}</p>}
    </section>;
}

function WritingPage() {
    const [taskType, setTaskType] = useState<WritingTaskType>("task2");
    const [prompt, setPrompt] = useState(prompts.task2);
    const [answer, setAnswer] = useState("");
    const [image, setImage] = useState<{ mimeType: string; data: string }>();
    const [attempt, setAttempt] = useState<AIPracticeAttempt | null>(null);
    const [history, setHistory] = useState<AIPracticeAttempt[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [seconds, setSeconds] = useState(0);
    const [streamingFeedback, setStreamingFeedback] = useState("");
    const [streamingCriteria, setStreamingCriteria] = useState<AICriterionResult[]>([]);
    const streamController = useRef<AbortController | null>(null);
    const wordCount = useMemo(() => answer.trim() ? answer.trim().split(/\s+/).length : 0, [answer]);

    useEffect(() => { getAIHistory("Writing").then(setHistory).catch(() => undefined); }, []);
    useEffect(() => { const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000); return () => window.clearInterval(timer); }, []);
    useEffect(() => () => streamController.current?.abort(), []);
    const changeTask = (value: WritingTaskType) => { setTaskType(value); setPrompt(prompts[value]); setImage(undefined); };
    const handleImage = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { setError("Image must be smaller than 5 MB."); return; } setImage({ mimeType: file.type, data: await fileToDataUrl(file) }); };
    const submit = async () => { setError(""); if (answer.trim().split(/\s+/).filter(Boolean).length < 20) { setError("Please write at least 20 words before submitting."); return; } setBusy(true); setAttempt(null); setStreamingFeedback(""); setStreamingCriteria([]); const controller = new AbortController(); streamController.current = controller; try { const result = await streamEvaluateWriting({ taskType, prompt, answer, image }, (event: AIStreamEvent, data: unknown) => { if (event === "feedback" && typeof data === "object" && data && "text" in data) setStreamingFeedback((current) => current + String((data as { text: string }).text)); if (event === "criterion_score" && typeof data === "object" && data && "name" in data) { const criterion = data as AICriterionResult; setStreamingCriteria((current) => [...current.filter((item) => item.name !== criterion.name), criterion]); } if (event === "error" && typeof data === "object" && data && "message" in data) setError(String((data as { message: string }).message)); }, controller.signal); setAttempt(result); setHistory((items) => [result, ...items.filter((item) => item._id !== result._id)]); } catch (requestError) { if ((requestError as Error).name !== "AbortError") setError(requestError instanceof Error ? requestError.message : "Could not evaluate this response."); } finally { streamController.current = null; setBusy(false); } };
    const currentResult = getEvaluation(attempt);
    return <div className="ai-practice-page"><header className="ai-page-hero"><span>IELTS AI PRACTICE</span><h1>Writing feedback that you can act on.</h1><p>Submit an Academic Task 1 or Task 2 response and receive evidence-based, AI-estimated feedback.</p></header><div className="writing-layout"><main className="writing-card"><div className="task-switch"><button className={taskType === "task1" ? "active" : ""} onClick={() => changeTask("task1")}>Task 1</button><button className={taskType === "task2" ? "active" : ""} onClick={() => changeTask("task2")}>Task 2</button></div><label>Task prompt<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} /></label>{taskType === "task1" && <label className="upload-label">Task 1 chart/image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} />{image && <small>Image attached</small>}</label>}<label>Your response<textarea className="writing-editor" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Write your answer here..." /></label><div className="writing-meta"><span>{wordCount} words</span><span>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</span></div>{error && <p className="ai-error">{error}</p>}<button className="primary-ai-button" onClick={() => void submit()} disabled={busy}>{busy ? "AI is evaluating..." : "Submit for AI evaluation"}</button></main><aside className="writing-history"><h2>Recent attempts</h2>{history.length === 0 && <p>No Writing attempts yet.</p>}{history.map((item) => { const historyResult = getEvaluation(item); return <button key={item._id} onClick={() => setAttempt(item)}><span>{item.TaskType}</span><strong>{historyResult ? historyResult.estimatedOverallBand.toFixed(1) : "—"}</strong><small>{new Date(item.createdAt).toLocaleDateString()}</small></button>; })}</aside></div>{busy && <section className="ai-result stream-preview"><h3>Streaming feedback</h3>{streamingCriteria.length > 0 && <div className="criterion-grid">{streamingCriteria.map((criterion) => <article key={criterion.name}><span>{criterion.name}</span><strong>{criterion.band.toFixed(1)}</strong></article>)}</div>}{streamingFeedback && <p>{streamingFeedback}</p>}</section>}{attempt && !currentResult && !busy && <p className="ai-error">This attempt has no complete AI score and cannot be displayed as a valid band.</p>}{currentResult && <Evaluation result={currentResult} />}</div>;
}

export default WritingPage;
