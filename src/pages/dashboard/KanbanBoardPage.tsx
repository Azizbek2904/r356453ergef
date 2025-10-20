import { useEffect, useState } from "react";
import axios from "axios";
import {
    DndContext,
    closestCenter,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    arrayMove,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const API_BASE = "http://localhost:8080/api/kanban";

interface User {
    id: number;
    fullName: string;
    email: string;
    role: string;
    department?: string;
    active: boolean;
}

interface TaskCard {
    id: number;
    title: string;
    description: string;
    completed: boolean;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    assignedUser: User | null;
}

interface KanbanColumn {
    id: number;
    title: string;
    position: number;
    cards: TaskCard[];
}

interface KanbanBoard {
    id: number;
    name: string;
    columns: KanbanColumn[];
}

function SortableTask({
                          task,
                          onComplete,
                          isReadonly,
                      }: {
    task: TaskCard;
    onComplete: (id: number, completed: boolean) => void;
    isReadonly: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: task.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            {...(!isReadonly && { ...attributes, ...listeners })}
            style={style}
            className={`p-3 border rounded-md bg-white shadow-sm mb-2 ${
                task.completed ? "bg-green-50 border-green-400" : "border-gray-200"
            }`}
        >
            <div className="flex justify-between items-center">
                <span className="font-medium">{task.title}</span>
                <input
                    type="checkbox"
                    checked={task.completed}
                    disabled={isReadonly}
                    onChange={(e) => onComplete(task.id, e.target.checked)}
                />
            </div>
            {task.description && (
                <p className="text-sm text-gray-600">{task.description}</p>
            )}
            {task.assignedUser && (
                <p className="text-xs text-gray-500 mt-1">
                    👤 {task.assignedUser.fullName}{" "}
                    <span className="text-gray-400">({task.assignedUser.role})</span>
                </p>
            )}
        </div>
    );
}

export default function KanbanBoardPage() {
    const [boards, setBoards] = useState<KanbanBoard[]>([]);
    const [selectedBoard, setSelectedBoard] = useState<KanbanBoard | null>(null);
    const [newBoardName, setNewBoardName] = useState("");
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
    const [employees, setEmployees] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") || "ADMIN";
    const isReadonly = !["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES_MANAGER"].includes(role);

    const api = axios.create({
        baseURL: "http://localhost:8080",
        headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
        },
    });

    // ================= FETCH =================
    const fetchBoards = async () => {
        setLoading(true);
        try {
            const res = await api.get(`${API_BASE}/boards`);
            setBoards(res.data.data || []);
        } catch {
            toast.error("❌ Boardlarni olishda xato");
        } finally {
            setLoading(false);
        }
    };

    const fetchBoard = async (id: number) => {
        try {
            const res = await api.get(`${API_BASE}/board/${id}`);
            setSelectedBoard(res.data.data);
        } catch {
            toast.error("❌ Boardni yuklashda xato");
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get("/users"); // ✅ to‘g‘ridan-to‘g‘ri backenddan
            const list: User[] = res.data.data;
            // faqat active hodimlarni olish
            const activeOnly = list.filter((u) => u.active && u.role !== "SUPER_ADMIN");
            setEmployees(activeOnly);
        } catch {
            toast.error("❌ Hodimlarni olishda xato");
        }
    };

    useEffect(() => {
        fetchBoards();
        fetchUsers();
    }, []);

    // ================= BOARD CREATE =================
    const handleCreateBoard = async () => {
        if (!newBoardName.trim()) return toast.error("Board nomi kiriting!");
        try {
            const res = await api.post(`${API_BASE}/board`, null, {
                params: { name: newBoardName },
            });
            setBoards([...boards, res.data.data]);
            toast.success("✅ Board yaratildi");
            setNewBoardName("");
        } catch {
            toast.error("❌ Board yaratishda xato");
        }
    };

    // ================= BOARD DELETE =================
    const handleDeleteBoard = async (id: number) => {
        if (!window.confirm("❗ Siz bu boardni o‘chirmoqchimisiz?")) return;
        try {
            await api.delete(`${API_BASE}/board/${id}`);
            toast.success("🗑 Board o‘chirildi");
            setSelectedBoard(null);
            fetchBoards();
        } catch {
            toast.error("❌ Boardni o‘chirishda xato");
        }
    };

    // ================= TASK CREATE =================
    const handleAddTask = async () => {
        if (!selectedColumnId || !selectedUserId || !newTaskTitle.trim()) {
            return toast.error("⚠️ Ustun, hodim va task nomini kiriting!");
        }
        try {
            await api.post(`${API_BASE}/task`, null, {
                params: {
                    title: newTaskTitle,
                    description: "",
                    userId: selectedUserId,
                    columnId: selectedColumnId,
                },
            });
            toast.success("✅ Task yaratildi");
            setNewTaskTitle("");
            if (selectedBoard) fetchBoard(selectedBoard.id);
        } catch {
            toast.error("❌ Task yaratishda xato");
        }
    };

    // ================= COMPLETE =================
    const handleComplete = async (id: number, completed: boolean) => {
        try {
            await api.put(`${API_BASE}/task/${id}/complete`, null, { params: { completed } });
            if (selectedBoard) fetchBoard(selectedBoard.id);
        } catch {
            toast.error("❌ Task yangilashda xato");
        }
    };

    // ================= DRAG & DROP =================
    const handleDragEnd = async (event: DragEndEvent) => {
        if (isReadonly || !selectedBoard) return;
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const sourceColumn = selectedBoard.columns.find((c) =>
            c.cards.some((t) => t.id === active.id)
        );
        const targetColumn = selectedBoard.columns.find((c) =>
            c.cards.some((t) => t.id === over.id)
        );

        if (!sourceColumn || !targetColumn) return;
        const activeIndex = sourceColumn.cards.findIndex((t) => t.id === active.id);
        const overIndex = targetColumn.cards.findIndex((t) => t.id === over.id);

        try {
            await api.put(`${API_BASE}/task/${active.id}/move`, null, {
                params: {
                    newStatus: targetColumn.title.toUpperCase().replace(" ", "_"),
                    newPosition: overIndex + 1,
                },
            });
            fetchBoard(selectedBoard.id);
        } catch {
            toast.error("❌ Taskni ko‘chirishda xato");
        }
    };

    if (loading)
        return <p className="text-center text-gray-500 mt-10">⏳ Yuklanmoqda...</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">🗂️ Kanban Board</h1>

            {/* ===== Board tanlash ===== */}
            <div className="flex gap-3 mb-5">
                <select
                    className="border p-2 rounded-md"
                    onChange={(e) => fetchBoard(Number(e.target.value))}
                >
                    <option value="">Board tanlang</option>
                    {boards.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.name}
                        </option>
                    ))}
                </select>

                <Input
                    placeholder="Yangi board nomi"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    className="w-64"
                />
                <Button onClick={handleCreateBoard}>➕ Yaratish</Button>

                {selectedBoard && (
                    <Button
                        variant="destructive"
                        onClick={() => handleDeleteBoard(selectedBoard.id)}
                    >
                        🗑 O‘chirish
                    </Button>
                )}
            </div>

            {selectedBoard ? (
                <>
                    {/* ===== Task qo‘shish ===== */}
                    {!isReadonly && (
                        <div className="flex gap-3 mb-4">
                            <select
                                className="border p-2 rounded-md"
                                onChange={(e) => setSelectedColumnId(Number(e.target.value))}
                            >
                                <option value="">Ustun tanlang</option>
                                {selectedBoard.columns.map((col) => (
                                    <option key={col.id} value={col.id}>
                                        {col.title}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="border p-2 rounded-md"
                                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                            >
                                <option value="">Hodim tanlang</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.fullName} ({emp.role})
                                    </option>
                                ))}
                            </select>

                            <Input
                                placeholder="Task nomi..."
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                className="w-80"
                            />
                            <Button onClick={handleAddTask}>Add Task</Button>
                        </div>
                    )}

                    {/* ===== Board ko‘rinishi ===== */}
                    <DndContext
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToVerticalAxis]}
                    >
                        <div className="flex gap-5 overflow-x-auto">
                            {selectedBoard.columns.map((col) => (
                                <div
                                    key={col.id}
                                    className="w-80 bg-gray-50 p-3 rounded-lg border shadow-sm"
                                >
                                    <h2 className="font-semibold text-gray-700 mb-3 text-center">
                                        {col.title}
                                    </h2>
                                    <SortableContext
                                        items={col.cards.map((t) => t.id)}
                                        strategy={rectSortingStrategy}
                                    >
                                        {col.cards.length > 0 ? (
                                            col.cards.map((task) => (
                                                <SortableTask
                                                    key={task.id}
                                                    task={task}
                                                    onComplete={handleComplete}
                                                    isReadonly={isReadonly}
                                                />
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic text-center">
                                                Bo‘sh
                                            </p>
                                        )}
                                    </SortableContext>
                                </div>
                            ))}
                        </div>
                    </DndContext>
                </>
            ) : (
                <p className="text-gray-500">Board tanlang yoki yangi yarating</p>
            )}
        </div>
    );
}
