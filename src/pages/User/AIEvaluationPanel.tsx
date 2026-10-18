import type { AIEvaluationResult } from "../../types/ai";

interface Props {
    result: AIEvaluationResult;
}

function AIEvaluationPanel({ result }: Props) {
    const isWriting = result.kind === "writing";
    const criterionLabels: Record<string, string> = {
        "Task Response": "Đáp ứng yêu cầu đề bài",
        "Task Achievement": "Hoàn thành yêu cầu đề bài",
        "Coherence and Cohesion": "Mạch lạc và liên kết",
        "Coherence & Cohesion": "Mạch lạc và liên kết",
        "Lexical Resource": "Vốn từ vựng",
        "Grammatical Range and Accuracy": "Độ đa dạng và chính xác ngữ pháp",
        "Grammatical Range & Accuracy": "Độ đa dạng và chính xác ngữ pháp",
        "Fluency and Coherence": "Độ trôi chảy và mạch lạc",
        Pronunciation: "Phát âm",
    };
    const getCriterionLabel = (name: string) => criterionLabels[name] || name;

    return (
        <section className="ai-result" aria-label="Báo cáo đánh giá bằng AI">
            <header className="ai-report-heading">
                <div>
                    <span>ƯỚC LƯỢNG BAND ĐIỂM</span>
                    <strong>{result.estimatedOverallBand.toFixed(1)}</strong>
                </div>
                <p>Band điểm do AI ước lượng, không phải kết quả IELTS chính thức.</p>
            </header>

            <section className="ai-band-table-section">
                <h2>Bảng điểm theo tiêu chí</h2>
                <div className="ai-band-table-wrap">
                    <table className="ai-band-table">
                        <thead>
                            <tr><th>Tiêu chí</th><th>Band</th><th>Nhận xét trọng tâm</th></tr>
                        </thead>
                        <tbody>
                            {result.criteria.map((criterion) => (
                                <tr key={criterion.name}>
                                    <th>{getCriterionLabel(criterion.name)}</th>
                                    <td>{criterion.band.toFixed(1)}</td>
                                    <td>{criterion.weaknesses[0] || criterion.strengths[0] || "Chưa có nhận xét chi tiết."}</td>
                                </tr>
                            ))}
                            <tr className="ai-band-overall">
                                <th>Tổng điểm</th>
                                <td>{result.estimatedOverallBand.toFixed(1)}</td>
                                <td>Trung bình bốn tiêu chí, làm tròn theo nửa band IELTS.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {result.bandRationale && (
                <div className="ai-band-rationale">
                    <h2>Vì sao bài ở band này?</h2>
                    <p>{result.bandRationale}</p>
                </div>
            )}

            {result.generalFeedback && (
                <div className="general-feedback">
                    <h2>Nhận xét tổng quan</h2>
                    <p>{result.generalFeedback}</p>
                </div>
            )}

            <section className="ai-criterion-details">
                <h2>Phân tích theo tiêu chí</h2>
                <div className="ai-criterion-list">
                    {result.criteria.map((criterion) => (
                        <article className="ai-criterion-card" key={criterion.name}>
                            <header>
                                <h3>{getCriterionLabel(criterion.name)}</h3>
                                <strong>{criterion.band.toFixed(1)}</strong>
                            </header>
                            <div className="ai-criterion-columns">
                                <div>
                                    <h4>Điểm tốt</h4>
                                    {criterion.strengths.length ? (
                                        <ul>{criterion.strengths.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                                    ) : <p className="ai-muted">Chưa có điểm mạnh cụ thể được ghi nhận.</p>}
                                </div>
                                <div>
                                    <h4>Cần cải thiện</h4>
                                    {criterion.weaknesses.length ? (
                                        <ul>{criterion.weaknesses.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                                    ) : <p className="ai-muted">Chưa ghi nhận điểm yếu cụ thể.</p>}
                                </div>
                            </div>
                            {criterion.evidence.length > 0 && (
                                <div className="ai-evidence">
                                    <h4>{isWriting ? "Dẫn chứng trong bài" : "Dẫn chứng từ câu trả lời"}</h4>
                                    <ul>{criterion.evidence.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                                </div>
                            )}
                            {criterion.improvements.length > 0 && (
                                <div className="ai-improvements">
                                    <h4>Cách nâng điểm</h4>
                                    <ul>{criterion.improvements.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            </section>

            {result.priorityErrors.length > 0 && (
                <section className="ai-priority-errors">
                    <h2>{isWriting ? "Lỗi ưu tiên cần sửa" : "Ví dụ cần luyện tập"}</h2>
                    <div className="ai-error-list">
                        {result.priorityErrors.map((item, index) => (
                            <article className="ai-error-card" key={`${item.quote}-${index}`}>
                                <div className="ai-error-card-heading">
                                    <strong>{({
                                        Grammar: "Ngữ pháp",
                                        Lexical: "Từ vựng",
                                        Coherence: "Mạch lạc",
                                        Task: "Đáp ứng đề bài",
                                        "Writing issue": "Lỗi bài viết",
                                        speaking: "Luyện nói",
                                    } as Record<string, string>)[item.type] || item.type || "Cần cải thiện"}</strong>
                                    {item.location && <span>{item.location}</span>}
                                </div>
                                {item.quote && <blockquote>{item.quote}</blockquote>}
                                {item.explanation && <p>{item.explanation}</p>}
                                {item.suggestion && (
                                    <p className="ai-correction"><b>Gợi ý:</b> {item.suggestion}</p>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {isWriting && result.correctedResponse && (
                <section className="ai-corrected-response">
                    <h2>Bài viết tham khảo đã chỉnh sửa</h2>
                    <p className="ai-muted">
                        Bản chỉnh sửa giữ lại ý chính của bạn; hãy dùng để học cách diễn đạt, không học thuộc máy móc.
                    </p>
                    <div>{result.correctedResponse}</div>
                </section>
            )}

            {result.transcript && (
                <section className="transcript">
                    <h2>Bản ghi lời nói</h2>
                    <p>{result.transcript}</p>
                </section>
            )}

            {!isWriting && result.limitation && (
                <p className="ai-note"><b>Lưu ý về đánh giá:</b> {result.limitation}</p>
            )}

            {result.actionPlan.length > 0 && (
                <section className="ai-action-plan">
                    <h2>Kế hoạch luyện tập tiếp theo</h2>
                    <ol>{result.actionPlan.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol>
                </section>
            )}
        </section>
    );
}

export default AIEvaluationPanel;
