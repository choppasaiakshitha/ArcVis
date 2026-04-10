import { useNavigate, useOutletContext, useParams} from "react-router";
import {useEffect, useRef, useState} from "react";
import {generate3DView} from "../../lib/ai.action";
import {ArrowLeft, Box, CheckCircle, ChevronLeft, Download, RefreshCcw, Share2, Sparkles, Wand2, X, Zap} from "lucide-react";
import Button from "../../components/ui/Button";
import {createProject, getProjectById, shareProject} from "../../lib/puter.action";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";
import ShareModal from "../../components/ShareModal";
import {SHARE_STATUS_RESET_DELAY_MS} from "../../lib/constants";

const VisualizerId = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userId } = useOutletContext<AuthContext>()

    const hasInitialGenerated = useRef(false);

    const [project, setProject] = useState<DesignItem | null>(null);
    const [isProjectLoading, setIsProjectLoading] = useState(true);

    const [isProcessing, setIsProcessing] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);

    // Share state
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");

    const handleBack = () => navigate('/');

    const handleExport = () => {
        if (!currentImage) return;

        const link = document.createElement('a');
        link.href = currentImage;
        link.download = `arcvis-${id || 'design'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const handleShare = async (action: ShareAction) => {
        if (!id || shareStatus === "saving") return;

        setShareStatus("saving");

        try {
            const updated = await shareProject({ id, action });

            if (updated) {
                setProject(updated);
            }

            setShareStatus("done");
            setTimeout(() => setShareStatus("idle"), SHARE_STATUS_RESET_DELAY_MS);
        } catch (error) {
            console.error("Share action failed:", error);
            setShareStatus("idle");
        }
    };

    const runGeneration = async (item: DesignItem) => {
        if(!id || !item.sourceImage) return;

        try {
            setIsProcessing(true);
            const result = await generate3DView({ sourceImage: item.sourceImage });

            if(result.renderedImage) {
                setCurrentImage(result.renderedImage);

                const updatedItem = {
                    ...item,
                    renderedImage: result.renderedImage,
                    renderedPath: result.renderedPath,
                    timestamp: Date.now(),
                    ownerId: item.ownerId ?? userId ?? null,
                    isPublic: item.isPublic ?? false,
                }

                const saved = await createProject({ item: updatedItem, visibility: "private" })

                if(saved) {
                    setProject(saved);
                    setCurrentImage(saved.renderedImage || result.renderedImage);
                }
            }
        } catch (error) {
            console.error('Generation failed: ', error)
        } finally {
            setIsProcessing(false);
        }
    }

    useEffect(() => {
        let isMounted = true;

        const loadProject = async () => {
            if (!id) {
                setIsProjectLoading(false);
                return;
            }

            setIsProjectLoading(true);

            const fetchedProject = await getProjectById({ id });

            if (!isMounted) return;

            setProject(fetchedProject);
            setCurrentImage(fetchedProject?.renderedImage || null);
            setIsProjectLoading(false);
            hasInitialGenerated.current = false;
        };

        loadProject();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        if (
            isProjectLoading ||
            hasInitialGenerated.current ||
            !project?.sourceImage
        )
            return;

        if (project.renderedImage) {
            setCurrentImage(project.renderedImage);
            hasInitialGenerated.current = true;
            return;
        }

        hasInitialGenerated.current = true;
        void runGeneration(project);
    }, [project, isProjectLoading]);

    return (
        <div className="viz-page">
            {/* Ambient background glows */}
            <div className="viz-glow viz-glow--a" />
            <div className="viz-glow viz-glow--b" />

            {/* Top navigation bar */}
            <nav className="viz-topbar">
                <div className="viz-topbar__left">
                    <button onClick={handleBack} className="viz-back-btn" id="viz-back-btn">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="viz-brand">
                        <Box className="viz-brand__logo" />
                        <span className="viz-brand__name">ArcVis</span>
                        <span className="viz-brand__sep">/</span>
                        <span className="viz-brand__project">
                            {isProjectLoading ? (
                                <span className="viz-skeleton viz-skeleton--name" />
                            ) : (
                                project?.name || `Residence ${id?.slice(0, 8)}`
                            )}
                        </span>
                    </div>
                </div>

                <div className="viz-topbar__right">
                    {currentImage && (
                        <div className="viz-status-pill">
                            <span className="viz-status-dot" />
                            Rendered
                        </div>
                    )}
                    <button
                        id="viz-regenerate-btn"
                        className="viz-icon-btn"
                        onClick={() => project && runGeneration(project)}
                        disabled={isProcessing || !project?.sourceImage}
                        title="Regenerate"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        id="viz-export-btn"
                        className="viz-icon-btn"
                        onClick={handleExport}
                        disabled={!currentImage}
                        title="Export PNG"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        id="viz-share-btn"
                        className="viz-share-btn"
                        onClick={() => setIsShareOpen(true)}
                    >
                        <Share2 className="w-4 h-4" />
                        <span>Share</span>
                    </button>
                </div>
            </nav>

            {/* Main content area */}
            <main className="viz-main">

                {/* Left column: Live Comparison */}
                <div className="viz-col viz-col--render">
                    {/* Compare slider card */}
                    <div className="viz-card viz-card--compare">
                        <div className="viz-card__header">
                            <div className="viz-card__badge viz-card__badge--purple">
                                <Zap className="w-3 h-3" />
                                Before &amp; After
                            </div>
                            <div className="viz-card__meta">
                                <h3 className="viz-card__title">Live Comparison</h3>
                                <p className="viz-card__sub">Drag the slider to compare</p>
                            </div>
                        </div>

                        <div className="viz-compare">
                            {project?.sourceImage && currentImage ? (
                                <ReactCompareSlider
                                    defaultValue={50}
                                    style={{ width: '100%', height: '100%' }}
                                    itemOne={
                                        <ReactCompareSliderImage
                                            src={project.sourceImage}
                                            alt="Blueprint"
                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                        />
                                    }
                                    itemTwo={
                                        <ReactCompareSliderImage
                                            src={currentImage || project?.renderedImage || undefined}
                                            alt="3D Render"
                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                        />
                                    }
                                />
                            ) : (
                                <div className="viz-compare__empty">
                                    {project?.sourceImage ? (
                                        <img
                                            src={project.sourceImage}
                                            alt="Blueprint"
                                            className="viz-compare__ghost"
                                        />
                                    ) : (
                                        <div className="viz-compare__placeholder">
                                            <p className="text-white/30 text-xs font-medium">Comparison available after rendering</p>
                                        </div>
                                    )}
                                    {!currentImage && !isProcessing && project?.sourceImage && (
                                        <div className="viz-compare__await">
                                            <span className="viz-compare__await-label">3D render pending</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right column: Compare + Info */}
                <div className="viz-col viz-col--side">

                    {/* 3D Rendered output card */}
                    <div className="viz-card">
                        <div className="viz-card__header">
                            <div className="viz-card__badge">
                                <Sparkles className="w-3 h-3" />
                                AI Visualization
                            </div>
                            <div className="viz-card__meta">
                                <p className="viz-card__sub">3D Rendered View</p>
                            </div>
                        </div>

                        <div className={`viz-render ${isProcessing ? 'viz-render--processing' : ''}`}>
                            {/* The image or fallback */}
                            {currentImage ? (
                                <img
                                    src={currentImage}
                                    alt="AI 3D Render"
                                    className="viz-render__img"
                                />
                            ) : (
                                <div className="viz-render__empty">
                                    {project?.sourceImage && !isProcessing ? (
                                        <img
                                            src={project.sourceImage}
                                            alt="Blueprint Source"
                                            className="viz-render__ghost"
                                        />
                                    ) : !isProcessing ? (
                                        <div className="viz-render__placeholder">
                                            <Wand2 className="w-10 h-10 text-white/20 mb-3" />
                                            <p className="text-white/30 text-sm font-medium">No image yet</p>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {/* Processing overlay */}
                            {isProcessing && (
                                <div className="viz-render__overlay">
                                    <div className="viz-processing-card">
                                        <div className="viz-processing-card__icon">
                                            <Wand2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="viz-processing-card__dots">
                                            <span /><span /><span />
                                        </div>
                                        <p className="viz-processing-card__title">Generating visualization</p>
                                        <p className="viz-processing-card__sub">AI is rendering your 3D space…</p>
                                        <div className="viz-processing-card__bar">
                                            <div className="viz-processing-card__bar-fill" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer actions */}
                        <div className="viz-card__footer">
                            <button
                                className="viz-footer-btn viz-footer-btn--ghost"
                                onClick={() => project && runGeneration(project)}
                                disabled={isProcessing || !project?.sourceImage}
                                id="viz-regen-footer-btn"
                            >
                                <RefreshCcw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                                {isProcessing ? 'Rendering…' : 'Regenerate'}
                            </button>
                            <button
                                className="viz-footer-btn viz-footer-btn--primary"
                                onClick={handleExport}
                                disabled={!currentImage}
                                id="viz-export-footer-btn"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export PNG
                            </button>
                        </div>
                    </div>

                    {/* Project details card */}
                    <div className="viz-card viz-card--info">
                        <div className="viz-info-grid">
                            <div className="viz-info-item">
                                <span className="viz-info-item__label">Project</span>
                                <span className="viz-info-item__value">
                                    {isProjectLoading ? <span className="viz-skeleton viz-skeleton--sm" /> : (project?.name || '—')}
                                </span>
                            </div>
                            <div className="viz-info-item">
                                <span className="viz-info-item__label">Status</span>
                                <span className={`viz-info-item__badge ${isProcessing ? 'viz-info-item__badge--processing' : currentImage ? 'viz-info-item__badge--done' : 'viz-info-item__badge--idle'}`}>
                                    {isProcessing ? 'Processing' : currentImage ? 'Rendered' : 'Awaiting'}
                                </span>
                            </div>
                            <div className="viz-info-item">
                                <span className="viz-info-item__label">Visibility</span>
                                <span className="viz-info-item__value">
                                    {project?.isPublic ? 'Public' : 'Private'}
                                </span>
                            </div>
                            <div className="viz-info-item">
                                <span className="viz-info-item__label">ID</span>
                                <span className="viz-info-item__value viz-info-item__value--mono">
                                    {id?.slice(0, 12)}…
                                </span>
                            </div>
                        </div>
                        <button
                            className="viz-share-card-btn"
                            onClick={() => setIsShareOpen(true)}
                            id="viz-share-card-btn"
                        >
                            <Share2 className="w-4 h-4" />
                            Share this project
                        </button>
                    </div>
                </div>
            </main>

            {/* Share Modal */}
            {id && (
                <ShareModal
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    projectId={id}
                    projectName={project?.name}
                    isPublic={project?.isPublic ?? false}
                    shareStatus={shareStatus}
                    onShare={handleShare}
                />
            )}
        </div>
    )
}

export default VisualizerId
