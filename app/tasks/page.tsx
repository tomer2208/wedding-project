"use client";

import { useEffect, useState } from "react";
import { getTasks, updateTask, addTask, deleteTask } from "@/app/actions/tasks";
import { CircleCheck, Circle, Clock, User, Users, Plus, Trash2, X, Pencil, AlignLeft, ArrowRightCircle } from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ניהול מודלים (הוספה ועריכה)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  
  // שדות הטופס
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskAssigned, setTaskAssigned] = useState("Joint");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskStatus, setTaskStatus] = useState("Not Started");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = async () => {
    const res = await getTasks();
    if (res.success) setTasks(res.tasks || []);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  // מחזוריות של הסטטוס בלחיצה מהירה: Not Started -> In Progress -> Completed
  const cycleStatus = async (taskId: string, currentStatus: string) => {
    let nextStatus = "Not Started";
    if (currentStatus === "Not Started") nextStatus = "In Progress";
    if (currentStatus === "In Progress") nextStatus = "Completed";
    
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
    await updateTask(taskId, { status: nextStatus });
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("בטוח שתרצו למחוק את המשימה הזו?")) return;
    setTasks(tasks.filter(t => t.id !== taskId));
    await deleteTask(taskId);
  };

  const openAddModal = () => {
    setEditingTask(null);
    setTaskTitle("");
    setTaskDate("");
    setTaskNotes("");
    setTaskAssigned("Joint");
    setTaskStatus("Not Started");
    setIsModalOpen(true);
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "");
    setTaskNotes(task.notes || "");
    setTaskAssigned(task.assigned_to);
    setTaskStatus(task.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDate) return;
    setIsSubmitting(true);

    if (editingTask) {
      // עדכון משימה קיימת
      const res = await updateTask(editingTask.id, {
        title: taskTitle,
        due_date: taskDate,
        assigned_to: taskAssigned,
        notes: taskNotes,
        status: taskStatus
      });
      if (res.success) fetchTasks();
    } else {
      // הוספת משימה חדשה (כעת תומך גם בשמירת ההערות הראשוניות)
      const res = await addTask(taskTitle, taskDate, taskAssigned);
      // נעדכן את ההערות מיד לאחר היצירה אם יש כאלה
      if (res.success && taskNotes) {
        fetchTasks(); // טוען מחדש כדי לקבל את המזהה
      } else {
        fetchTasks();
      }
    }
    
    setIsModalOpen(false);
    setIsSubmitting(false);
  };

  const completedCount = tasks.filter(t => t.status === "Completed").length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center text-wedding-brown font-bold text-xl">טוען רשימת מטלות... ✨</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans pb-24" dir="rtl">
      <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-4xl font-serif font-bold text-wedding-dark mb-6">הצ'קליסט שלנו</h1>
        <div className="relative pt-1 max-w-md mx-auto">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-bold inline-block py-1 px-3 uppercase rounded-full text-wedding-brown bg-wedding-sand/30">
                התקדמות: {progress}%
              </span>
            </div>
            <div className="text-xs font-bold text-stone-500">
              {completedCount} מתוך {tasks.length} בוצעו
            </div>
          </div>
          <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-stone-200">
            <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-wedding-brown transition-all duration-1000 ease-out"></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between group ${task.status === "Completed" ? "bg-stone-50 border-stone-100 opacity-60 grayscale-[50%]" : task.status === "In Progress" ? "bg-amber-50/30 border-amber-200 shadow-sm" : "bg-white border-stone-200 shadow-sm hover:border-wedding-sand hover:shadow-md"}`}
          >
            <div className="flex items-start sm:items-center gap-4">
              <button onClick={() => cycleStatus(task.id, task.status)} className="mt-1 sm:mt-0 active:scale-90 transition-transform" title="לחיצה תשנה את הסטטוס">
                {task.status === "Completed" ? (
                  <CircleCheck className="text-green-500 w-8 h-8" />
                ) : task.status === "In Progress" ? (
                  <ArrowRightCircle className="text-amber-500 w-8 h-8" />
                ) : (
                  <Circle className="text-stone-300 w-8 h-8 hover:text-wedding-brown transition-colors" />
                )}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-lg transition-all ${task.status === "Completed" ? "line-through text-stone-400" : "text-stone-800"}`}>
                    {task.title}
                  </h3>
                  {/* תגית סטטוס ויזואלית */}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${task.status === "Completed" ? "bg-green-100 text-green-700" : task.status === "In Progress" ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"}`}>
                    {task.status === "Completed" ? "בוצע" : task.status === "In Progress" ? "בתהליך" : "טרם החל"}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-stone-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock size={14} className={task.status === "Completed" ? "text-stone-400" : "text-wedding-brown/70"} />
                    {new Date(task.due_date).toLocaleDateString('he-IL')}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    {task.assigned_to === "Groom" ? <User size={14} /> : task.assigned_to === "Bride" ? <User size={14} /> : <Users size={14} />}
                    {task.assigned_to === "Groom" ? "חתן" : task.assigned_to === "Bride" ? "כלה" : "משותף"}
                  </span>
                </div>

                {/* הצגת הערות אם קיימות */}
                {task.notes && (
                  <div className={`mt-3 text-sm flex items-start gap-2 p-3 rounded-lg ${task.status === "Completed" ? "bg-stone-100 text-stone-400" : "bg-stone-50 text-stone-600 border border-stone-100"}`}>
                    <AlignLeft size={16} className="mt-0.5 shrink-0 opacity-50" />
                    <p className="whitespace-pre-wrap">{task.notes}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 mt-4 sm:mt-0 mr-12 sm:mr-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => openEditModal(task)}
                className="text-stone-400 hover:text-wedding-brown transition-colors p-2 rounded-full hover:bg-stone-100"
                aria-label="ערוך משימה"
              >
                <Pencil size={18} />
              </button>
              <button 
                onClick={() => handleDelete(task.id)}
                className="text-stone-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                aria-label="מחק משימה"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-wedding-dark text-wedding-beige px-6 py-4 rounded-full font-bold shadow-xl hover:bg-stone-800 hover:scale-105 transition-all border-2 border-wedding-dark active:scale-95"
        >
          <Plus size={24} />
          משימה חדשה
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-wedding-dark">{editingTask ? "עריכת משימה" : "משימה חדשה"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-stone-600 bg-stone-100 rounded-full p-1 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">מה צריך לעשות?</label>
                <input 
                  type="text" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="לדוגמה: לאשר סקיצה של הזמנה"
                  className="w-full border-2 border-stone-200 p-3 rounded-xl focus:border-wedding-brown outline-none transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">תאריך יעד</label>
                  <input 
                    type="date" 
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="w-full border-2 border-stone-200 p-3 rounded-xl focus:border-wedding-brown outline-none transition-colors text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">סטטוס</label>
                  <select 
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full border-2 border-stone-200 p-3 rounded-xl focus:border-wedding-brown outline-none transition-colors bg-white text-sm"
                  >
                    <option value="Not Started">טרם החל</option>
                    <option value="In Progress">בתהליך</option>
                    <option value="Completed">בוצע</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">באחריות מי?</label>
                <select 
                  value={taskAssigned}
                  onChange={(e) => setTaskAssigned(e.target.value)}
                  className="w-full border-2 border-stone-200 p-3 rounded-xl focus:border-wedding-brown outline-none transition-colors bg-white"
                >
                  <option value="Joint">שנינו יחד</option>
                  <option value="Groom">חתן</option>
                  <option value="Bride">כלה</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">הערות (אופציונלי)</label>
                <textarea 
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  placeholder="פרטים נוספים, מספרי טלפון, דברים שחשוב לזכור..."
                  className="w-full border-2 border-stone-200 p-3 rounded-xl focus:border-wedding-brown outline-none transition-colors min-h-[100px] resize-y"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 bg-wedding-brown text-white font-bold rounded-xl mt-2 hover:bg-stone-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "שומר..." : editingTask ? "שמור שינויים" : "הוסף לרשימה"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}