import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import {
    Box, Eraser, Minus, PencilLine, RectangleHorizontal,
    DoorOpen, Undo2, Trash2, Zap, X, Type, Square
} from "lucide-react";
import Button from "../../components/ui/Button";
import { createProject } from "../../lib/puter.action";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tool = "room" | "wall" | "door" | "window" | "label" | "eraser";

interface Point { x: number; y: number; }

interface BaseShape { id: string; x: number; y: number; rotation: number; }
interface Room extends BaseShape { type: "room"; w: number; h: number; }
interface Wall extends BaseShape { type: "wall"; x1: number; y1: number; x2: number; y2: number; }
interface Door extends BaseShape { type: "door"; }
interface Window extends BaseShape { type: "window"; }
interface Label extends BaseShape { type: "label"; text: string; }

type Shape = Room | Wall | Door | Window | Label;

const GRID = 20;          // grid cell size px
const SNAP = (v: number, enabled: boolean = true) => enabled ? Math.round(v / GRID) * GRID : v;

// ─── Canvas drawing helpers ───────────────────────────────────────────────────

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, enabled: boolean) {
    if (!enabled) return;
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= w; x += GRID) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += GRID) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
}

function drawShapes(ctx: CanvasRenderingContext2D, shapes: Shape[], selectedId: string | null) {
    shapes.forEach(s => {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate((s.rotation * Math.PI) / 180);

        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = 2;
        ctx.fillStyle = "#f8f8f8";

        if (s.type === "room") {
            ctx.fillRect(0, 0, s.w, s.h);
            ctx.strokeRect(0, 0, s.w, s.h);
        } else if (s.type === "wall") {
            ctx.lineWidth = 4;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(s.x2 - s.x, s.y2 - s.y);
            ctx.stroke();
        } else if (s.type === "door") {
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(GRID * 2, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, GRID * 2, 0, Math.PI / 2);
            ctx.stroke();
        } else if (s.type === "window") {
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-GRID, 0);
            ctx.lineTo(GRID, 0);
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(-GRID, -6); ctx.lineTo(-GRID, 6); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(GRID, -6); ctx.lineTo(GRID, 6); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.stroke();
        } else if (s.type === "label") {
            ctx.fillStyle = "#1a1a1a";
            ctx.font = `bold ${GRID * 0.7}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText(s.text, 0, 0);
        }
        ctx.restore();

        if (s.id === selectedId) {
            drawSelection(ctx, s);
        }
    });
}

function drawSelection(ctx: CanvasRenderingContext2D, s: Shape) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate((s.rotation * Math.PI) / 180);

    let bounds = { x: 0, y: 0, w: 0, h: 0 };
    if (s.type === "room") bounds = { x: -4, y: -4, w: s.w + 8, h: s.h + 8 };
    else if (s.type === "wall") {
        const x2 = s.x2 - s.x, y2 = s.y2 - s.y;
        bounds = { x: Math.min(0, x2) - 8, y: Math.min(0, y2) - 8, w: Math.abs(x2) + 16, h: Math.abs(y2) + 16 };
    } else if (s.type === "door" || s.type === "window") bounds = { x: -GRID - 4, y: -GRID - 4, w: GRID * 2 + 8, h: GRID * 2 + 8 };
    else if (s.type === "label") bounds = { x: -GRID * 2, y: -GRID, w: GRID * 4, h: GRID * 2 };

    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    // Selection outlines & rotation handle
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(bounds.x, bounds.y, bounds.w, bounds.h);

    // Resize handles
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffffff";
    const drawHandle = (hx: number, hy: number) => {
        ctx.fillRect(hx - 4, hy - 4, 8, 8);
        ctx.strokeRect(hx - 4, hy - 4, 8, 8);
    };

    if (s.type === "room") {
        drawHandle(0, 0); drawHandle(s.w, 0);
        drawHandle(0, s.h); drawHandle(s.w, s.h);
    } else if (s.type === "wall") {
        drawHandle(0, 0); drawHandle(s.x2 - s.x, s.y2 - s.y);
    }

    // Rotation handle
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(bounds.x + bounds.w / 2, bounds.y - 20, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bounds.x + bounds.w / 2, bounds.y);
    ctx.lineTo(bounds.x + bounds.w / 2, bounds.y - 15);
    ctx.stroke();

    ctx.restore();
}

function hitTest(pt: Point, s: Shape): "move" | "rotate" | "nw" | "ne" | "sw" | "se" | "p1" | "p2" | null {
    // Check rotation handle first
    const rad = (s.rotation * Math.PI) / 180;
    const cos = Math.cos(-rad), sin = Math.sin(-rad);
    const dx = pt.x - s.x, dy = pt.y - s.y;
    const tx = dx * cos - dy * sin;
    const ty = dx * sin + dy * cos;

    let bounds = { x: 0, y: 0, w: 0, h: 0 };
    if (s.type === "room") bounds = { x: 0, y: 0, w: s.w, h: s.h };
    else if (s.type === "wall") {
        const x2 = s.x2 - s.x, y2 = s.y2 - s.y;
        bounds = { x: Math.min(0, x2), y: Math.min(0, y2), w: Math.abs(x2), h: Math.abs(y2) };
    } else if (s.type === "door" || s.type === "window") bounds = { x: -GRID, y: -GRID, w: GRID * 2, h: GRID * 2 };
    else if (s.type === "label") bounds = { x: -GRID * 2, y: -GRID, w: GRID * 4, h: GRID * 2 };

    const handleX = bounds.x + bounds.w / 2, handleY = bounds.y - 20;
    if (Math.hypot(tx - handleX, ty - handleY) < 10) return "rotate";

    // Resize handles for Room
    if (s.type === "room") {
        if (Math.hypot(tx, ty) < 8) return "nw";
        if (Math.hypot(tx - s.w, ty) < 8) return "ne";
        if (Math.hypot(tx, ty - s.h) < 8) return "sw";
        if (Math.hypot(tx - s.w, ty - s.h) < 8) return "se";
    }

    // Resize handles for Wall
    if (s.type === "wall") {
        if (Math.hypot(tx, ty) < 8) return "p1";
        if (Math.hypot(tx - (s.x2 - s.x), ty - (s.y2 - s.y)) < 8) return "p2";
    }

    if (tx >= bounds.x - 5 && tx <= bounds.x + bounds.w + 5 && ty >= bounds.y - 5 && ty <= bounds.y + bounds.h + 5) return "move";

    return null;
}



function drawPreview(ctx: CanvasRenderingContext2D, tool: Tool, start: Point | null, end: Point) {
    if (!start) return;
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);

    if (tool === "room") {
        const x = Math.min(start.x, end.x), y = Math.min(start.y, end.y);
        const w = Math.abs(end.x - start.x), h = Math.abs(end.y - start.y);
        ctx.strokeRect(x, y, w, h);
    } else if (tool === "wall") {
        ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    }
    ctx.setLineDash([]);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BlueprintNew() {
    const navigate = useNavigate();
    const { userId } = useOutletContext<AuthContext>();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [tool, setTool] = useState<Tool>("room");
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [history, setHistory] = useState<Shape[][]>([[]]);
    const [histIdx, setHistIdx] = useState(0);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSnapping, setIsSnapping] = useState(true);

    const [isDown, setIsDown] = useState(false);
    const [startPt, setStartPt] = useState<Point | null>(null);
    const [cursorPt, setCursorPt] = useState<Point>({ x: 0, y: 0 });

    const [dragOffset, setDragOffset] = useState<Point | null>(null);
    const [isRotating, setIsRotating] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);


    const [labelInput, setLabelInput] = useState("");
    const [labelPos, setLabelPos] = useState<Point | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [canvasSize, setCanvasSize] = useState({ w: 900, h: 600 });


    // Resize canvas to container
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new ResizeObserver(() => {
            setCanvasSize({ w: el.clientWidth, h: el.clientHeight });
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    // Re-render canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGrid(ctx, canvas.width, canvas.height, isSnapping);
        drawShapes(ctx, shapes, selectedId);
        if (isDown && startPt) drawPreview(ctx, tool, startPt, cursorPt);
    }, [shapes, isDown, startPt, cursorPt, tool, canvasSize, selectedId, isSnapping]);

    const getPosPt = (e: React.MouseEvent<HTMLCanvasElement>, snap: boolean = true): Point => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return {
            x: SNAP(e.clientX - rect.left, snap && isSnapping),
            y: SNAP(e.clientY - rect.top, snap && isSnapping),
        };
    };

    const pushHistory = useCallback((next: Shape[]) => {
        setHistory(prev => {
            const trimmed = prev.slice(0, histIdx + 1);
            return [...trimmed, next];
        });
        setHistIdx(prev => prev + 1);
        setShapes(next);
    }, [histIdx]);

    const undo = useCallback(() => {
        if (histIdx === 0) return;
        const prev = history[histIdx - 1];
        setHistIdx(h => h - 1);
        setShapes(prev);
    }, [histIdx, history]);

    const clearAll = () => {
        pushHistory([]);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return;

            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedId) {
                    pushHistory(shapes.filter(s => s.id !== selectedId));
                    setSelectedId(null);
                }
            } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
                undo();
            } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
                if (selectedId) {
                    e.preventDefault();
                    const dist = e.shiftKey ? GRID : 1;
                    const next = shapes.map(s => {
                        if (s.id !== selectedId) return s;
                        let dx = 0, dy = 0;
                        if (e.key === "ArrowLeft") dx = -dist;
                        if (e.key === "ArrowRight") dx = dist;
                        if (e.key === "ArrowUp") dy = -dist;
                        if (e.key === "ArrowDown") dy = dist;

                        if (s.type === "wall") {
                            return { ...s, x: s.x + dx, y: s.y + dy, x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy };
                        }
                        return { ...s, x: s.x + dx, y: s.y + dy };
                    });
                    setShapes(next);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedId, shapes, undo, pushHistory]);

    // ── Eraser: find and remove shape near click point
    const eraseAt = (pt: Point) => {
        const next = shapes.filter(s => {
            if (s.type === "room") {
                return !(pt.x >= s.x && pt.x <= s.x + s.w && pt.y >= s.y && pt.y <= s.y + s.h);
            }
            if (s.type === "wall") {
                // Distance from point to line segment
                const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
                const len2 = dx * dx + dy * dy;
                const t = Math.max(0, Math.min(1, ((pt.x - s.x1) * dx + (pt.y - s.y1) * dy) / len2));
                const nearX = s.x1 + t * dx, nearY = s.y1 + t * dy;
                return Math.hypot(pt.x - nearX, pt.y - nearY) > GRID * 1.5;
            }
            if (s.type === "door" || s.type === "window") {
                return Math.hypot(pt.x - s.x, pt.y - s.y) > GRID * 2;
            }
            if (s.type === "label") {
                return Math.hypot(pt.x - s.x, pt.y - s.y) > GRID * 2;
            }
            return true;
        });
        pushHistory(next);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pt = getPosPt(e);
        const rawPt = getPosPt(e, false);

        if (tool === "eraser") { eraseAt(pt); return; }

        setIsDown(true);
        setStartPt(pt);

        // Check for hits (iterate from top to bottom)
        for (let i = shapes.length - 1; i >= 0; i--) {
            const hit = hitTest(rawPt, shapes[i]);
            if (hit) {
                const shapeId = shapes[i].id;
                const isAlreadySelected = shapeId === selectedId;

                // If clicking a non-selected shape, just select it
                if (!isAlreadySelected) {
                    setSelectedId(shapeId);
                    setStartPt(null);
                    return;
                }

                // If clicking an already-selected shape, handle transformation
                if (hit === "rotate") {
                    setStartPt(null);
                    setIsRotating(true);
                    return;
                } else if (hit !== "move") {
                    // Resize handle
                    setStartPt(null);
                    setResizeHandle(hit);
                    return;
                } else {
                    // Move handle
                    setStartPt(null);
                    setDragOffset({ x: rawPt.x - shapes[i].x, y: rawPt.y - shapes[i].y });
                    return;
                }
            }
        }

        // If no hit, deselect
        setSelectedId(null);

        // If no priority hit, we allow startPt to remain, which will trigger drawing on Move
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pt = getPosPt(e);
        const rawPt = getPosPt(e, false);
        setCursorPt(pt);

        if (isDown) {
            // Transformation takes highest priority
            if (selectedId && (isRotating || dragOffset || resizeHandle)) {
                const index = shapes.findIndex(s => s.id === selectedId);
                if (index === -1) return;
                const s = shapes[index];

                if (isRotating) {
                    const angle = (Math.atan2(rawPt.y - s.y, rawPt.x - s.x) * 180) / Math.PI + 90;
                    const next = [...shapes];
                    next[index] = { ...s, rotation: SNAP(angle, isSnapping) };
                    setShapes(next);
                } else if (dragOffset) {
                    const nextX = SNAP(rawPt.x - dragOffset.x, isSnapping);
                    const nextY = SNAP(rawPt.y - dragOffset.y, isSnapping);
                    const dx = nextX - s.x, dy = nextY - s.y;

                    const next = [...shapes];
                    if (s.type === "wall") {
                        next[index] = { ...s, x: nextX, y: nextY, x1: nextX, y1: nextY, x2: s.x2 + dx, y2: s.y2 + dy };
                    } else {
                        next[index] = { ...s, x: nextX, y: nextY };
                    }
                    setShapes(next);
                } else if (resizeHandle) {
                    const rad = (s.rotation * Math.PI) / 180;
                    const cos = Math.cos(-rad), sin = Math.sin(-rad);
                    // Mouse movement in local space
                    const dx = rawPt.x - s.x, dy = rawPt.y - s.y;
                    const tx = SNAP(dx * cos - dy * sin, isSnapping);
                    const ty = SNAP(dx * sin + dy * cos, isSnapping);

                    const next = [...shapes];
                    if (s.type === "room") {
                        const room = s as Room;
                        if (resizeHandle === "se") {
                            next[index] = { ...room, w: Math.max(GRID, tx), h: Math.max(GRID, ty) };
                        } else if (resizeHandle === "nw") {
                            // Complex: change x, y AND w, h
                            const dw = -tx, dh = -ty;
                            const newW = Math.max(GRID, room.w + dw);
                            const newH = Math.max(GRID, room.h + dh);
                            // Corrected offset based on actually applied change in width/height
                            const actualDW = room.w - newW, actualDH = room.h - newH;
                            const ox = actualDW * Math.cos(rad) - actualDH * Math.sin(rad);
                            const oy = actualDW * Math.sin(rad) + actualDH * Math.cos(rad);
                            next[index] = { ...room, x: room.x - ox, y: room.y - oy, w: newW, h: newH };
                        } else if (resizeHandle === "ne") {
                            const newW = Math.max(GRID, tx);
                            const dh = -ty;
                            const newH = Math.max(GRID, room.h + dh);
                            const actualDH = room.h - newH;
                            const ox = -actualDH * Math.sin(rad), oy = actualDH * Math.cos(rad);
                            next[index] = { ...room, x: room.x - ox, y: room.y - oy, w: newW, h: newH };
                        } else if (resizeHandle === "sw") {
                            const dw = -tx;
                            const newW = Math.max(GRID, room.w + dw);
                            const newH = Math.max(GRID, ty);
                            const actualDW = room.w - newW;
                            const ox = actualDW * Math.cos(rad), oy = actualDW * Math.sin(rad);
                            next[index] = { ...room, x: room.x - ox, y: room.y - oy, w: newW, h: newH };
                        }
                    } else if (s.type === "wall") {
                        const wall = s as Wall;
                        if (resizeHandle === "p2") {
                            next[index] = { ...wall, x2: rawPt.x, y2: rawPt.y };
                        } else if (resizeHandle === "p1") {
                            next[index] = { ...wall, x: rawPt.x, y: rawPt.y, x1: rawPt.x, y1: rawPt.y };
                        }
                    }
                    setShapes(next);
                }
            } 
            // Drawing preview takes secondary priority
            else if (startPt) {
                // Moving the cursor updates the current preview automatically
            }
        }
    };

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDown) return;
        const rawPt = getPosPt(e, false);

        // State cleanup
        const wasTransforming = isRotating || dragOffset || resizeHandle;
        setIsRotating(false);
        setDragOffset(null);
        setResizeHandle(null);
        setIsDown(false);


        if (wasTransforming) {
            pushHistory(shapes);
            return;
        }

        if (startPt) {
            const end = getPosPt(e);
            const dist = Math.hypot(end.x - startPt.x, end.y - startPt.y);

            // If it was a CLICK (no significant movement), handle selection
            if (dist < 5) {
                let hitId: string | null = null;
                for (let i = shapes.length - 1; i >= 0; i--) {
                    if (hitTest(rawPt, shapes[i])) {
                        hitId = shapes[i].id;
                        break;
                    }
                }
                setSelectedId(hitId);
                setStartPt(null);
                return;
            }

            // If it was a DRAG, handle tool-specific creation
            if (tool === "room") {
                const x = Math.min(startPt.x, end.x), y = Math.min(startPt.y, end.y);
                const w = Math.abs(end.x - startPt.x), h = Math.abs(end.y - startPt.y);
                if (w >= GRID && h >= GRID) {
                    pushHistory([...shapes, { id: Math.random().toString(36).substr(2, 9), type: "room", x, y, w, h, rotation: 0 }]);
                }
            } else if (tool === "wall") {
                if (dist >= GRID) {
                    pushHistory([...shapes, { id: Math.random().toString(36).substr(2, 9), type: "wall", x: startPt.x, y: startPt.y, x1: startPt.x, y1: startPt.y, x2: end.x, y2: end.y, rotation: 0 }]);
                }
            } else if (tool === "door" || tool === "window") {
                // Click-to-place tools
                pushHistory([...shapes, { id: Math.random().toString(36).substr(2, 9), type: tool, x: end.x, y: end.y, rotation: 0 }]);
            } else if (tool === "label") {
                setLabelPos(end);
            }
            setStartPt(null);
        }
    };

    const submitLabel = () => {
        if (!labelPos || !labelInput.trim()) { setLabelPos(null); setLabelInput(""); return; }
        pushHistory([...shapes, { id: Math.random().toString(36).substr(2, 9), type: "label", x: labelPos.x, y: labelPos.y, text: labelInput.trim(), rotation: 0 }]);
        setLabelPos(null);
        setLabelInput("");
    };

    // ── Export & Convert
    const handleConvert = async () => {
        const canvas = canvasRef.current;
        if (!canvas || isSaving) return;

        // Re-draw without grid for cleaner AI input
        const offscreen = document.createElement("canvas");
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        const ctx = offscreen.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, offscreen.width, offscreen.height);
        drawShapes(ctx, shapes, null);

        const base64 = offscreen.toDataURL("image/png");

        setIsSaving(true);
        try {
            const newId = Date.now().toString();
            const saved = await createProject({
                item: {
                    id: newId,
                    name: `Blueprint ${newId}`,
                    sourceImage: base64,
                    timestamp: Date.now(),
                    ownerId: userId ?? null,
                },
                visibility: "private",
            });

            if (saved) {
                navigate(`/visualizer/${newId}`, {
                    state: { initialImage: saved.sourceImage, name: saved.name },
                });
            }
        } finally {
            setIsSaving(false);
        }
    };

    // ─── Tool definitions
    const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
        { id: "room", icon: <RectangleHorizontal size={18} />, label: "Room" },
        { id: "wall", icon: <Minus size={18} />, label: "Wall" },
        { id: "door", icon: <DoorOpen size={18} />, label: "Door" },
        { id: "window", icon: <Square size={18} />, label: "Window" },
        { id: "label", icon: <Type size={18} />, label: "Label" },
        { id: "eraser", icon: <Eraser size={18} />, label: "Eraser" },
    ];

    return (
        <div className="blueprint-page">
            {/* Top Bar */}
            <header className="bp-topbar">
                <div className="bp-brand" onClick={() => navigate("/")}>
                    <Box className="bp-logo" />
                    <span className="bp-name">ArcVis</span>
                    <span className="bp-divider">/</span>
                    <span className="bp-subtitle">
                        <PencilLine size={14} className="inline mr-1" />
                        Blueprint Editor
                    </span>
                </div>
                <div className="bp-topbar-actions">
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => navigate("/")}
                        className="bp-exit"
                    >
                        <X size={16} className="mr-1" /> Exit
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleConvert}
                        disabled={isSaving || shapes.length === 0}
                        className="bp-convert"
                    >
                        <Zap size={15} className="mr-1.5" />
                        {isSaving ? "Saving..." : "Convert to 3D"}
                    </Button>
                </div>
            </header>

            <div className="bp-body">
                {/* Canvas Area */}
                <div className="bp-canvas-area" ref={containerRef}>
                    <canvas
                        ref={canvasRef}
                        width={canvasSize.w}
                        height={canvasSize.h}
                        className="bp-canvas"
                        style={{ cursor: tool === "eraser" ? "cell" : tool === "label" ? "text" : "crosshair" }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={() => { setIsDown(false); setStartPt(null); }}
                    />

                    {/* Floating Toolbar */}
                    <div className="bp-floating-toolbar">
                        <div className="bp-tp-section">
                            {tools.map(t => (
                                <button
                                    key={t.id}
                                    className={`bp-tp-btn${tool === t.id ? " active" : ""}`}
                                    onClick={() => setTool(t.id)}
                                    data-tooltip={t.label}
                                >
                                    {t.icon}
                                </button>
                            ))}
                        </div>

                        <div className="bp-tp-divider" />

                        <div className="bp-tp-section">
                            <button
                                className={`bp-tp-btn ${isSnapping ? "active" : ""}`}
                                onClick={() => setIsSnapping(!isSnapping)}
                                data-tooltip="Toggle Snapping"
                            >
                                <Zap size={18} />
                            </button>
                            <button className="bp-tp-btn" onClick={undo} data-tooltip="Undo" disabled={histIdx === 0}>
                                <Undo2 size={18} />
                            </button>
                            <button className="bp-tp-btn bp-tp-danger" onClick={clearAll} data-tooltip="Clear All">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Subtle Tips Info */}
                    <div className="bp-tips-badge group">
                        <div className="bp-tips-icon">?</div>
                        <div className="bp-tips-content">
                            <strong>Room</strong>: drag to draw<br/>
                            <strong>Wall</strong>: click & drag<br/>
                            <strong>Labels</strong>: click to type<br/>
                            <strong>Shortcuts</strong>: Del, Ctrl+Z, Arrows
                        </div>
                    </div>


                    {/* Selection Properties Panel */}
                    {selectedId && (
                        <div className="bp-props-panel">
                            <header className="bp-props-header">
                                <span className="bp-props-title">
                                    {shapes.find(s => s.id === selectedId)?.type.toUpperCase()}
                                </span>
                                <button className="bp-props-close" onClick={() => setSelectedId(null)}>
                                    <X size={14} />
                                </button>
                            </header>
                            <div className="bp-props-body">
                                {shapes.find(s => s.id === selectedId)?.type === "label" && (
                                    <div className="bp-prop-item">
                                        <label>Text</label>
                                        <input
                                            type="text"
                                            value={(shapes.find(s => s.id === selectedId) as Label).text}
                                            onChange={e => {
                                                const next = shapes.map(s => s.id === selectedId ? { ...s, text: e.target.value } as Label : s);
                                                setShapes(next);
                                            }}
                                            onBlur={() => pushHistory(shapes)}
                                        />
                                    </div>
                                )}
                                <div className="bp-prop-item">
                                    <label>Rotation</label>
                                    <input
                                        type="number"
                                        value={Math.round(shapes.find(s => s.id === selectedId)?.rotation || 0)}
                                        onChange={e => {
                                            const next = shapes.map(s => s.id === selectedId ? { ...s, rotation: Number(e.target.value) } : s);
                                            setShapes(next);
                                        }}
                                        onBlur={() => pushHistory(shapes)}
                                    />
                                </div>
                                <div className="bp-prop-actions">
                                    <button className="bp-prop-del" onClick={() => { pushHistory(shapes.filter(s => s.id !== selectedId)); setSelectedId(null); }}>
                                        <Trash2 size={14} className="mr-1" /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Label Input Popup */}
                    {labelPos && (
                        <div
                            className="bp-label-popup"
                            style={{ left: labelPos.x, top: labelPos.y - 42 }}
                        >
                            <input
                                autoFocus
                                className="bp-label-input"
                                value={labelInput}
                                onChange={e => setLabelInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") submitLabel(); if (e.key === "Escape") { setLabelPos(null); setLabelInput(""); } }}
                                placeholder="Room name..."
                            />
                            <button className="bp-label-ok" onClick={submitLabel}>✓</button>
                        </div>
                    )}

                    {/* Empty State Hint */}
                    {shapes.length === 0 && !isDown && (
                        <div className="bp-empty-hint">
                            <RectangleHorizontal size={40} className="mb-3 opacity-30" />
                            <p>Select a tool and start drawing your floor plan</p>
                            <p className="text-sm mt-1 opacity-60">Shapes snap to the grid automatically</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
