import { useNavigate } from "react-router";
import Navbar from "../../components/Navbar";
import Button from "../../components/ui/Button";
import {
    Upload, PencilLine, Sparkles, Users, Download, Share2,
    ArrowRight, Check, Zap, Layers, RefreshCcw, Eye,
    ChevronRight
} from "lucide-react";

export function meta() {
    return [
        { title: "Features – ArcVis" },
        { name: "description", content: "Everything you need to visualize, render, and share stunning architectural spaces — powered by AI." },
    ];
}

const FEATURES = [
    {
        icon: <Upload className="ft-icon-svg" />,
        color: "#dbeafe",
        accent: "#3b82f6",
        title: "Blueprint Upload",
        desc: "Drop any floor plan image — hand-drawn sketch, CAD export, or photograph — and ArcVis will use it as the foundation for a stunning 3D render.",
        tags: ["JPG / PNG / WebP", "Up to 10 MB", "Instant preview"],
    },
    {
        icon: <PencilLine className="ft-icon-svg" />,
        color: "#d1fae5",
        accent: "#10b981",
        title: "In-Browser Blueprint Editor",
        desc: "No software to install. Draw rooms, walls, doors, and windows directly in your browser on a smart grid canvas that snaps every line perfectly to scale.",
        tags: ["Drag to draw rooms", "Grid snap", "Keyboard shortcuts"],
    },
    {
        icon: <Sparkles className="ft-icon-svg" />,
        color: "#fef3c7",
        accent: "#f59e0b",
        title: "AI-Powered 3D Rendering",
        desc: "Our AI transforms your flat floor plan into a breathtaking photorealistic 3D visualization in seconds. No 3D modeling skills required — just describe the style you want.",
        tags: ["Photorealistic", "Multiple styles", "Seconds, not hours"],
    },
    {
        icon: <Eye className="ft-icon-svg" />,
        color: "#ede9fe",
        accent: "#8b5cf6",
        title: "Before & After Comparison",
        desc: "Use the interactive drag slider to compare your original floor plan side-by-side with the AI-rendered result. Show clients exactly how a space will feel.",
        tags: ["Drag slider", "Full resolution", "Exportable"],
    },
    {
        icon: <Share2 className="ft-icon-svg" />,
        color: "#fce7f3",
        accent: "#ec4899",
        title: "One-Click Sharing",
        desc: "Toggle any project to public and it instantly appears in the Community Gallery for the world to explore. Or keep it private — you're always in control.",
        tags: ["Public / private", "Community gallery", "Direct link"],
    },
    {
        icon: <Download className="ft-icon-svg" />,
        color: "#e0f2fe",
        accent: "#0ea5e9",
        title: "Export & Download",
        desc: "Download your finished renders as high-quality PNG images, ready to drop into presentations, proposals, or mood boards without any watermarks.",
        tags: ["No watermarks", "High resolution", "PNG format"],
    },
];

const STEPS = [
    {
        num: "01",
        icon: <Upload size={22} />,
        title: "Upload or Draw",
        desc: "Start by uploading an existing floor plan image, or sketch one from scratch using our in-browser blueprint editor.",
    },
    {
        num: "02",
        icon: <Sparkles size={22} />,
        title: "AI Renders It",
        desc: "ArcVis's AI analyzes your floor plan and generates a photorealistic 3D visualization automatically — no input required.",
    },
    {
        num: "03",
        icon: <Share2 size={22} />,
        title: "Share & Export",
        desc: "Download your render, compare it to the original, and optionally share your project with the ArcVis design community.",
    },
];

const STATS = [
    { value: "< 30s", label: "Average render time" },
    { value: "100%", label: "Browser-based, no install" },
    { value: "∞", label: "Design possibilities" },
    { value: "Free", label: "To get started" },
];

export default function Features() {
    const navigate = useNavigate();

    return (
        <div className="features-page">
            <Navbar />

            {/* ── HERO */}
            <section className="ft-hero">
                <div className="ft-hero-badge">
                    <Sparkles size={13} className="mr-1.5 text-primary" />
                    Now with In-Browser Blueprint Drawing
                </div>

                <h1 className="ft-hero-title">
                    Everything you need to<br />
                    <span className="ft-hero-accent">visualize any space</span>
                </h1>

                <p className="ft-hero-sub">
                    From a rough sketch to a photorealistic 3D render in under 30 seconds.
                    ArcVis combines an AI rendering engine with an intuitive browser-based
                    design toolkit — no software, no learning curve.
                </p>

                <div className="ft-hero-actions">
                    <a href="/#upload" className="ft-hero-cta">
                        Start for free <ArrowRight size={16} className="ml-2" />
                    </a>
                    <Button variant="outline" size="lg" onClick={() => navigate("/community")} className="ft-hero-ghost">
                        See community renders
                    </Button>
                </div>

                {/* Stats strip */}
                <div className="ft-stats">
                    {STATS.map(s => (
                        <div key={s.label} className="ft-stat">
                            <span className="ft-stat-value">{s.value}</span>
                            <span className="ft-stat-label">{s.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HOW IT WORKS */}
            <section className="ft-steps-section">
                <div className="ft-section-header">
                    <p className="ft-eyebrow"><Zap size={12} className="inline mr-1" />How it works</p>
                    <h2 className="ft-section-title">Three steps from idea to render</h2>
                </div>

                <div className="ft-steps">
                    {STEPS.map((s, i) => (
                        <div key={s.num} className="ft-step">
                            <div className="ft-step-num">{s.num}</div>
                            <div className="ft-step-icon-wrap">
                                {s.icon}
                            </div>
                            <h3 className="ft-step-title">{s.title}</h3>
                            <p className="ft-step-desc">{s.desc}</p>
                            {i < STEPS.length - 1 && (
                                <div className="ft-step-arrow"><ChevronRight size={20} /></div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES GRID */}
            <section className="ft-features-section">
                <div className="ft-section-header">
                    <p className="ft-eyebrow"><Layers size={12} className="inline mr-1" />What's inside</p>
                    <h2 className="ft-section-title">Built for designers, architects & dreamers</h2>
                    <p className="ft-section-sub">Every feature works together so you can go from idea to presentation-ready render without leaving your browser.</p>
                </div>

                <div className="ft-grid">
                    {FEATURES.map((f, i) => (
                        <div
                            key={f.title}
                            className={`ft-card${i === 0 ? " ft-card-wide" : ""}`}
                            style={{ "--ft-accent": f.accent, "--ft-color": f.color } as React.CSSProperties}
                        >
                            <div className="ft-card-icon">
                                {f.icon}
                            </div>
                            <h3 className="ft-card-title">{f.title}</h3>
                            <p className="ft-card-desc">{f.desc}</p>
                            <ul className="ft-card-tags">
                                {f.tags.map(t => (
                                    <li key={t}>
                                        <Check size={10} className="mr-1 shrink-0" style={{ color: f.accent }} />
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── EDITOR SPOTLIGHT */}
            <section className="ft-spotlight">
                <div className="ft-spotlight-text">
                    <p className="ft-eyebrow"><PencilLine size={12} className="inline mr-1" />Blueprint Editor</p>
                    <h2 className="ft-spotlight-title">Draw your floor plan<br /><span>right here, right now</span></h2>
                    <p className="ft-spotlight-desc">
                        No Figma, no AutoCAD, no PDF exports. ArcVis's built-in blueprint editor lets you sketch rooms, drop doors and windows, label spaces, and convert the whole thing to a 3D render with a single click.
                    </p>
                    <ul className="ft-spotlight-list">
                        {["Grid-snap canvas with zoom & pan", "Room, Wall, Door, Window & Label tools", "Live dimension preview while drawing", "Undo history · Keyboard shortcuts", "Exports directly to AI renderer"].map(item => (
                            <li key={item}>
                                <span className="ft-check"><Check size={12} /></span>
                                {item}
                            </li>
                        ))}
                    </ul>
                    <Button size="lg" onClick={() => navigate("/blueprint/new")} className="ft-spotlight-cta">
                        <PencilLine size={15} className="mr-2" /> Open Blueprint Editor
                    </Button>
                </div>

                <div className="ft-spotlight-canvas">
                    <div className="ft-canvas-mock">
                        {/* Mock grid */}
                        <div className="ft-mock-grid" />
                        {/* Mock room shapes */}
                        <div className="ft-mock-room" style={{ left: "10%", top: "12%", width: "42%", height: "38%", background: "#dbeafe" }}>
                            <span>Living Room</span>
                        </div>
                        <div className="ft-mock-room" style={{ left: "54%", top: "12%", width: "36%", height: "38%", background: "#d1fae5" }}>
                            <span>Kitchen</span>
                        </div>
                        <div className="ft-mock-room" style={{ left: "10%", top: "52%", width: "30%", height: "35%", background: "#fef3c7" }}>
                            <span>Bedroom</span>
                        </div>
                        <div className="ft-mock-room" style={{ left: "42%", top: "52%", width: "22%", height: "35%", background: "#ede9fe" }}>
                            <span>Bath</span>
                        </div>
                        <div className="ft-mock-room" style={{ left: "66%", top: "52%", width: "24%", height: "35%", background: "#fce7f3" }}>
                            <span>Office</span>
                        </div>
                        {/* Mock toolbar */}
                        <div className="ft-mock-toolbar">
                            {["Room", "Wall", "Door", "Label"].map(t => (
                                <div key={t} className={`ft-mock-tool${t === "Room" ? " active" : ""}`}>{t}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA BANNER */}
            <section className="ft-cta-banner">
                <div className="ft-cta-glow" />
                <RefreshCcw size={48} className="ft-cta-icon" />
                <h2 className="ft-cta-title">Ready to bring your spaces to life?</h2>
                <p className="ft-cta-sub">Upload a blueprint or start drawing — your first render is completely free.</p>
                <div className="ft-cta-actions">
                    <a href="/#upload" className="ft-cta-hero">
                        Get started free <ArrowRight size={16} className="ml-2" />
                    </a>
                    <Button variant="ghost" size="lg" onClick={() => navigate("/community")} className="ft-cta-ghost">
                        Explore community
                    </Button>
                </div>
            </section>
        </div>
    );
}
