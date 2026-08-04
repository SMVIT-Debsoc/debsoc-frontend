"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, FileUp, Loader2, RefreshCw, XCircle } from "lucide-react";
import { debassClient } from "@/lib/debass/client";
import type { DebassDocumentStatusResponse } from "@/lib/debass/types";
import { useDebassWorkspace } from "./DebassWorkspaceProvider";
import { Card, Pill, PrimaryButton } from "./ui";

type DocumentJob = DebassDocumentStatusResponse;

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_TYPES = [".pdf", ".docx", ".md", ".markdown"];

export default function DebassDocumentsPanel() {
  const { developmentMockEnabled, acceptedKey, keyState, assistantSessionVersion } = useDebassWorkspace();
  const [jobs, setJobs] = useState<DocumentJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const uploadController = useRef<AbortController | null>(null);
  const pollControllers = useRef<Map<string, AbortController>>(new Map());
  const pollTimers = useRef<Map<string, number>>(new Map());
  const pollJobRef = useRef<(jobId: string) => Promise<void>>(async () => undefined);
  const mounted = useRef(true);
  const processing = jobs.some((job) => job.status === "queued" || job.status === "parsing" || job.status === "embedding");

  const cancelJob = useCallback((jobId: string) => {
    pollControllers.current.get(jobId)?.abort();
    pollControllers.current.delete(jobId);
    const timer = pollTimers.current.get(jobId);
    if (timer !== undefined) window.clearTimeout(timer);
    pollTimers.current.delete(jobId);
  }, []);

  const cancelAll = useCallback(() => {
    uploadController.current?.abort();
    uploadController.current = null;
    pollControllers.current.forEach((controller) => controller.abort());
    pollControllers.current.clear();
    pollTimers.current.forEach((timer) => window.clearTimeout(timer));
    pollTimers.current.clear();
  }, []);

  useEffect(() => () => {
    mounted.current = false;
    cancelAll();
  }, [cancelAll]);

  useEffect(() => {
    cancelAll();
    const resetTimer = window.setTimeout(() => {
      setJobs([]);
      setError(null);
    }, 0);
    return () => window.clearTimeout(resetTimer);
  }, [acceptedKey, assistantSessionVersion, cancelAll]);

  const pollJob = useCallback(async (jobId: string) => {
    if (!acceptedKey || !mounted.current) return;
    const controller = new AbortController();
    pollControllers.current.set(jobId, controller);
    try {
      const next = await debassClient.documentStatus(jobId, controller.signal);
      if (!mounted.current) return;
      setJobs((current) => current.map((job) => job.job_id === jobId ? next : job));
      if (next.status !== "done" && next.status !== "failed") {
        const timer = window.setTimeout(() => {
          if (pollTimers.current.get(jobId) === timer) pollTimers.current.delete(jobId);
          void pollJobRef.current(jobId);
        }, 2000);
        pollTimers.current.set(jobId, timer);
      }
    } catch (caught) {
      if (controller.signal.aborted || !mounted.current) return;
      setError(caught instanceof Error ? caught.message : "Document status could not be loaded.");
    } finally {
      if (pollControllers.current.get(jobId) === controller) pollControllers.current.delete(jobId);
    }
  }, [acceptedKey]);

  useEffect(() => {
    pollJobRef.current = pollJob;
  }, [pollJob]);

  const retryJob = useCallback((jobId: string) => {
    cancelJob(jobId);
    setError(null);
    void pollJob(jobId);
  }, [cancelJob, pollJob]);

  const upload = async (file: File) => {
    setError(null);
    const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!ACCEPTED_TYPES.includes(extension)) {
      setError("Upload a PDF, DOCX, Markdown, or MD file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Files must be 8 MB or smaller.");
      return;
    }
    if (!acceptedKey || keyState !== "valid") {
      setError("Validate your OpenRouter key before uploading a document.");
      return;
    }

    setUploading(true);
    const controller = new AbortController();
    uploadController.current = controller;
    try {
      const queued = await debassClient.uploadDocument(acceptedKey, file, controller.signal);
      const initial: DocumentJob = {
        job_id: queued.job_id,
        status: queued.status,
        filename: file.name,
        node_count: null,
        error: null,
      };
      if (mounted.current && !controller.signal.aborted) {
        setJobs((current) => [initial, ...current.filter((job) => job.job_id !== initial.job_id)]);
        void pollJob(initial.job_id);
      }
    } catch (caught) {
      if (!controller.signal.aborted && mounted.current) setError(caught instanceof Error ? caught.message : "Document upload failed.");
    } finally {
      if (uploadController.current === controller) uploadController.current = null;
      if (mounted.current) setUploading(false);
    }
  };

  return (
    <div aria-busy={uploading || processing} aria-label={uploading ? "Uploading research document" : processing ? "Processing research documents" : undefined}>
    <Card className="p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileUp size={16} className="text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">Research Documents</h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Upload PDF, DOCX, or Markdown files for Debass ingestion. Searchable means the job is complete.</p>
        </div>
        {developmentMockEnabled ? <Pill tone="amber">Local preview · uploads disabled</Pill> : <Pill tone="slate">Max 8 MB</Pill>}
      </div>

      {developmentMockEnabled ? (
        <p className="mt-4 rounded-xl border border-amber-300/60 bg-amber-50/70 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/[0.08] dark:text-amber-200">Document ingestion is available when the real Debass backend is connected. This development preview does not upload files or simulate searchable data.</p>
      ) : (
        <label className={`mt-4 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 focus-within:ring-2 focus-within:ring-indigo-500/40 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-indigo-400/50 dark:hover:bg-indigo-400/10 ${!acceptedKey || uploading ? "cursor-not-allowed opacity-60" : ""}`}>
          {uploading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <FileUp size={16} aria-hidden="true" />}
          {uploading ? "Uploading…" : acceptedKey ? "Choose a document" : "Validate a key to upload"}
          <input type="file" accept={ACCEPTED_TYPES.join(",")} className="sr-only" disabled={!acceptedKey || uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); event.currentTarget.value = ""; }} />
        </label>
      )}

      {error && <p className="mt-3 text-xs text-red-700 dark:text-red-300" role="alert">{error}</p>}
      {jobs.length > 0 && <div className="mt-4 max-h-[min(440px,50dvh)] space-y-2 overflow-y-auto pr-1">{jobs.map((job) => <DocumentRow key={job.job_id} job={job} onRetry={() => retryJob(job.job_id)} />)}</div>}
    </Card>
    </div>
  );
}

function DocumentRow({ job, onRetry }: { job: DocumentJob; onRetry: () => void }) {
  const terminal = job.status === "done" || job.status === "failed";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex min-w-0 items-center gap-2">
        {job.status === "done" ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden="true" /> : job.status === "failed" ? <XCircle size={16} className="shrink-0 text-red-600 dark:text-red-300" aria-hidden="true" /> : <Loader2 size={16} className="shrink-0 motion-safe:animate-spin text-indigo-600 dark:text-indigo-300" aria-hidden="true" />}
        <div className="min-w-0"><p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">{job.filename}</p><p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{job.status === "done" ? "Searchable" : job.status}{job.status === "failed" && job.error ? ` · ${job.error}` : ""}</p></div>
      </div>
      {terminal && job.status === "failed" && <PrimaryButton type="button" onClick={onRetry} variant="default" className="min-h-8 px-2 text-xs"><RefreshCw size={13} aria-hidden="true" /> Retry</PrimaryButton>}
    </div>
  );
}
