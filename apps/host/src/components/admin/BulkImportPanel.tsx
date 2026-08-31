import { useState, useRef, useEffect } from "react";
import { useAdminStore } from "../../store/adminStore";
import { CheckCircle2 } from "lucide-react";
import { RippleButton } from "../RippleButton";

interface BulkImportPanelProps {
  quizId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export function BulkImportPanel({ quizId, onSuccess, onClose }: BulkImportPanelProps) {
  const [jsonContent, setJsonContent] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<any[] | null>(null);
  const [importErrors, setImportErrors] = useState<any[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<{ count: number } | null>(null);

  useEffect(() => {
    if (importSuccess) {
      const timer = setTimeout(() => {
        setImportSuccess(null);
        onSuccess();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [importSuccess, onSuccess]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkImportQuestions = useAdminStore(state => state.bulkImportQuestions);

  const handleDownloadTemplate = () => {
    const template = {
      questions: [
        {
          text: "Which keyword is used to prevent a class from being subclassed in Java?",
          durationSeconds: 20,
          points: 1000,
          explanation: "'final' prevents a class from being subclassed, which is useful for immutable or security-critical classes.",
          options: [
            { text: "final", isCorrect: true },
            { text: "static", isCorrect: false },
            { text: "const", isCorrect: false },
            { text: "sealed", isCorrect: false }
          ]
        },
        {
          text: "What does the 'transient' keyword indicate for a field?",
          durationSeconds: 25,
          points: 1000,
          options: [
            { text: "It will not be serialized", isCorrect: true },
            { text: "It cannot be modified", isCorrect: false },
            { text: "It is thread-local", isCorrect: false },
            { text: "It is loaded lazily", isCorrect: false }
          ]
        }
      ]
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz-template.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setJsonContent(event.target.result);
        setParseError(null);
        setPreviewQuestions(null);
        setImportErrors(null);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleValidate = () => {
    setParseError(null);
    setImportErrors(null);
    setPreviewQuestions(null);
    
    if (!jsonContent.trim()) {
      setParseError("Please enter some JSON content");
      return;
    }

    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed || !Array.isArray(parsed.questions)) {
        setParseError("JSON must contain a top-level 'questions' array");
        return;
      }
      if (parsed.questions.length === 0) {
        setParseError("The 'questions' array is empty");
        return;
      }
      setPreviewQuestions(parsed.questions);
    } catch (e: any) {
      setParseError("Invalid JSON syntax: " + e.message);
    }
  };

  const handleImport = async () => {
    if (!previewQuestions) return;
    setIsImporting(true);
    setImportErrors(null);
    
    const result = await bulkImportQuestions(quizId, previewQuestions);
    setIsImporting(false);
    
    if (result.success) {
      setImportSuccess({ count: result.count || 0 });
      setJsonContent("");
      setPreviewQuestions(null);
    } else {
      if (result.details) {
        setImportErrors(result.details);
      } else {
        setParseError(result.error || "Import failed");
      }
    }
  };

  return (
    <div className="bg-[var(--color-surface-elevated)] p-6 rounded-2xl border-2 border-[var(--color-border)] mb-8 shadow-premium animate-[screenEnter_300ms_var(--ease-out-expo)]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-heading font-bold text-[var(--color-text-primary)]">Bulk Import Questions</h3>
        <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-2xl leading-none">
          &times;
        </button>
      </div>

      {importSuccess && (
        <div className="mb-6 bg-[var(--color-success-bg)] border border-[var(--color-success)] rounded-2xl p-4 flex items-center justify-between shadow-sm animate-[screenEnter_300ms_var(--ease-out-expo)]">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[var(--color-success)]" />
            <span className="font-bold text-[var(--color-success)] text-lg">
              🎉 {importSuccess.count} questions imported successfully!
            </span>
          </div>
          <button 
            onClick={() => {
              setImportSuccess(null);
              onSuccess();
            }}
            className="text-[var(--color-success)] opacity-70 hover:opacity-100 text-2xl leading-none"
          >
            &times;
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-4">
        <RippleButton 
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl font-bold text-sm text-[var(--color-text-primary)] hover:opacity-80 transition-opacity"
        >
          Download Sample Template
        </RippleButton>
        <div className="relative inline-block">
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileChange}
            ref={fileInputRef}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <button className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl font-bold text-sm text-[var(--color-text-primary)] pointer-events-none hover:opacity-80 transition-opacity">
            Upload JSON File
          </button>
        </div>
      </div>

      <textarea
        value={jsonContent}
        onChange={(e) => {
          setJsonContent(e.target.value);
          setPreviewQuestions(null);
          setImportErrors(null);
          setParseError(null);
        }}
        placeholder='{ "questions": [ ... ] }'
        className="w-full h-80 p-4 font-mono text-sm bg-white dark:bg-[#1A1814] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] mb-4 shadow-inner"
      />

      {parseError && (
        <div className="mb-4 p-4 bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-xl border border-red-200 dark:border-red-900 font-medium">
          {parseError}
        </div>
      )}

      {importErrors && (
        <div className="mb-4 p-4 bg-[var(--color-error-bg)] rounded-xl border border-red-200 dark:border-red-900">
          <h4 className="font-bold text-[var(--color-error)] mb-2">Validation Errors Found:</h4>
          <ul className="space-y-3">
            {importErrors.map((err, i) => (
              <li key={i} className="text-sm">
                <span className="font-bold text-[var(--color-text-primary)]">Question {err.index + 1}: "{err.questionText}"</span>
                <ul className="list-disc ml-5 mt-1 text-[var(--color-error)]">
                  {err.errors.map((msg: string, j: number) => (
                    <li key={j}>{msg}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {previewQuestions && !importErrors && (
        <div className="mb-4 p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] max-h-60 overflow-y-auto">
          <h4 className="font-bold text-[var(--color-text-primary)] mb-3">Preview ({previewQuestions.length} questions):</h4>
          <ul className="space-y-2">
            {previewQuestions.map((q, i) => {
              const optCount = Array.isArray(q.options) ? q.options.length : 0;
              const correctCount = Array.isArray(q.options) ? q.options.filter((o:any) => o.isCorrect).length : 0;
              const hasExactlyOneCorrect = correctCount === 1;
              const hasFourOptions = optCount === 4;
              
              return (
                <li key={i} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm py-2 border-b border-[var(--color-border)] last:border-0">
                  <span className="font-medium text-[var(--color-text-primary)] truncate max-w-md pr-4">
                    {i + 1}. {q.text || "(empty)"}
                  </span>
                  <div className="flex gap-3 text-xs mt-1 sm:mt-0 font-bold">
                    <span className={hasFourOptions ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}>
                      {optCount} options
                    </span>
                    <span className={hasExactlyOneCorrect ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}>
                      {correctCount} correct
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex gap-4 justify-end">
        {!previewQuestions ? (
          <RippleButton
            onClick={handleValidate}
            className="px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold rounded-xl shadow-md transition-colors"
          >
            Validate & Preview
          </RippleButton>
        ) : (
          <RippleButton
            onClick={handleImport}
            disabled={isImporting}
            className="px-6 py-3 bg-[var(--color-success)] hover:bg-[#16a34a] text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            {isImporting ? "Importing..." : "Import Questions"}
          </RippleButton>
        )}
      </div>
    </div>
  );
}
