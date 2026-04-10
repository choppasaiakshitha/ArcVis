import { useEffect, useRef, useState } from "react";
import { Check, Copy, Globe, Lock, X } from "lucide-react";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName?: string | null;
    isPublic?: boolean;
    shareStatus: ShareStatus;
    onShare: (action: ShareAction) => Promise<void>;
}

const ShareModal = ({
    isOpen,
    onClose,
    projectId,
    projectName,
    isPublic = false,
    shareStatus,
    onShare,
}: ShareModalProps) => {
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const shareUrl =
        typeof window !== "undefined"
            ? `${window.location.origin}/visualizer/${projectId}`
            : `/visualizer/${projectId}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
        } catch {
            inputRef.current?.select();
            document.execCommand("copy");
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToggle = () => {
        onShare(isPublic ? "unshare" : "share");
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isSaving = shareStatus === "saving";
    const isDone = shareStatus === "done";

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            style={{ animation: "smFadeIn 0.15s ease" }}
            onClick={onClose}
        >
            {/* Panel */}
            <div
                className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden"
                style={{ animation: "smSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)" }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Share project"
            >
                {/* ── Header ───────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                                isPublic ? "bg-orange-50" : "bg-zinc-100"
                            }`}
                        >
                            {isPublic ? (
                                <Globe className={`w-5 h-5 transition-colors duration-300 text-orange-500`} />
                            ) : (
                                <Lock className="w-5 h-5 text-zinc-500" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-base font-serif font-bold text-black leading-tight">
                                Share Project
                            </h3>
                            <p className="text-xs text-zinc-400 font-mono truncate max-w-[180px] mt-0.5">
                                {projectName || `Project ${projectId}`}
                            </p>
                        </div>
                    </div>
                    <button
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Visibility tile ───────────────────────────── */}
                <div
                    className={`flex items-center justify-between gap-4 mx-5 my-4 p-4 rounded-xl border transition-colors duration-300 ${
                        isPublic
                            ? "border-orange-200 bg-orange-50/60"
                            : "border-zinc-200 bg-zinc-50"
                    }`}
                >
                    <div className="flex items-center gap-3">
                        {isPublic ? (
                            <Globe className="w-4 h-4 text-orange-500 shrink-0" />
                        ) : (
                            <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
                        )}
                        <div>
                            <p className="text-sm font-semibold text-zinc-800">
                                {isPublic ? "Public" : "Private"}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
                                {isPublic
                                    ? "Anyone with the link can view this project"
                                    : "Only you can see this project"}
                            </p>
                        </div>
                    </div>

                    {/* Toggle pill */}
                    <button
                        onClick={handleToggle}
                        disabled={isSaving}
                        aria-pressed={isPublic}
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 disabled:opacity-60 disabled:cursor-wait ${
                            isPublic ? "bg-orange-500" : "bg-zinc-300"
                        } ${isSaving ? "animate-pulse" : ""}`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                                isPublic ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                    </button>
                </div>

                {/* ── Status feedback ────────────────────────────── */}
                {isDone && (
                    <div
                        className="flex items-center gap-2 mx-5 mb-3 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-medium"
                        style={{ animation: "smFadeIn 0.2s ease" }}
                    >
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>
                            {isPublic ? "Project is now public" : "Project is now private"}
                        </span>
                    </div>
                )}

                {/* ── Shareable link ─────────────────────────────── */}
                <div className="px-5 pb-4">
                    <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">
                        Shareable link
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            readOnly
                            value={shareUrl}
                            className="flex-1 min-w-0 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-300 transition-colors"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                        <button
                            onClick={handleCopy}
                            aria-label="Copy link"
                            className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center transition-all duration-200 ${
                                copied
                                    ? "bg-green-50 border-green-300 text-green-600"
                                    : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-black"
                            }`}
                        >
                            {copied ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                    {copied && (
                        <p
                            className="text-xs text-green-600 font-medium mt-1.5"
                            style={{ animation: "smFadeIn 0.15s ease" }}
                        >
                            Link copied to clipboard!
                        </p>
                    )}
                </div>

                {/* ── Footer ─────────────────────────────────────── */}
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-zinc-100 bg-zinc-50/60">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-black transition-colors rounded-lg hover:bg-zinc-100"
                    >
                        Done
                    </button>
                    <button
                        onClick={handleCopy}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold uppercase tracking-wide rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5" /> Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" /> Copy Link
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Keyframe styles */}
            <style>{`
                @keyframes smFadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes smSlideUp {
                    from { opacity: 0; transform: translateY(14px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0)    scale(1); }
                }
            `}</style>
        </div>
    );
};

export default ShareModal;
