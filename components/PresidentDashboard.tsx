"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BarChart2,
  Users,
  Bell,
  Plus,
  CheckCircle2,
  Medal,
  ListTodo,
  FileText,
  CalendarDays,
  User,
  MessageSquare,
  Send,
  LogOut,
  Gavel,
  Megaphone,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  Menu,
} from 'lucide-react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';

// ── Types ──────────────────────────────────────────────────────────────────
type Member = { id: string; name: string; email: string; role: string };
type Task = { 
  id: string; 
  name: string; 
  description?: string; 
  deadline: string; 
  completed: boolean; 
  assignedToId?: string;
  assignedTo?: { name: string };
};
type Session = { id: string; sessionDate: string; motiontype: string; Chair: string };

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return { month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(), day: d.getDate() };
};
const fmtDeadline = (dl: string) =>
  new Date(dl).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const isOverdue = (dl: string) => !new Date(dl).valueOf() || new Date(dl) < new Date();

export default function PresidentDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats State
  const [totalMembers, setTotalMembers] = useState(0);
  const [avgSpeakerScore, setAvgSpeakerScore] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);

  // Data Lists
  const [members, setMembers] = useState<Member[]>([]);
  const [cabinet, setCabinet] = useState<Member[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);

  // Form States - Log Session
  const [sessionDate, setSessionDate] = useState("");
  const [chairName, setChairName] = useState(session?.user?.name || '');
  const [sessionMotion, setSessionMotion] = useState('');
  const [memberAttendance, setMemberAttendance] = useState<Record<string, { status: string; score: string }>>({});
  const [savingSession, setSavingSession] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState(false);

  // Form States - Assign Task
  const [taskName, setTaskName] = useState('');
  const [taskDL, setTaskDL] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const userName = session?.user?.name || "President";
  const userRole = "Society President";
  const userImage = session?.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0f172a&color=fff`;

  useEffect(() => {
    loadDashboardData();
    setSessionDate(new Date().toISOString().slice(0, 16));
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, sessionsRes, tasksRes, msgRes] = await Promise.all([
        fetch('/api/president/dashboard'),
        fetch('/api/president/sessions'),
        fetch('/api/president/tasks'),
        fetch('/api/president/messages')
      ]);

      if (!dashRes.ok || !sessionsRes.ok || !tasksRes.ok) {
        throw new Error('Failed to synchronize dashboard data.');
      }

      const dashData = await dashRes.json();
      const sessionsData = await sessionsRes.json();
      const tasksData = await tasksRes.json();
      const msgData = msgRes.ok ? await msgRes.json() : { messages: [] };

      const roster = dashData.members || [];
      const cabList = dashData.cabinet || [];
      
      setMembers(roster);
      setCabinet(cabList);
      setSessions(sessionsData.sessions || []);
      setReceivedMessages(msgData.messages || []);
      
      const tasksList = tasksData.tasks || [];
      setAllTasks(tasksList);
      setPendingTasksCount(tasksList.filter((t: Task) => !t.completed).length);

      // Derived Stats
      setTotalMembers(roster.length + cabList.length);
      setCompletedTasks(tasksList.filter((t: Task) => t.completed).length);
      
      // Society average score placeholder
      setAvgSpeakerScore(0); 

      // Initialize attendance state for all members
      const initialAttendance: Record<string, { status: string; score: string }> = {};
      roster.forEach((m: Member) => {
        initialAttendance[m.id] = { status: 'Absent', score: '' };
      });
      setMemberAttendance(initialAttendance);

    } catch (err: any) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (memberId: string, field: string, value: string) => {
    setMemberAttendance(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], [field]: value }
    }));
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSession(true);
    setSessionSuccess(false);

    try {
      const sessionRes = await fetch('/api/cabinet/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionDate, motiontype: sessionMotion, Chair: chairName })
      });

      if (!sessionRes.ok) throw new Error('Could not create session.');
      const sessionData = await sessionRes.json();
      const newSessionId = sessionData.session.id;

      const attendanceData = Object.entries(memberAttendance).map(([memberId, data]) => ({
        memberId,
        status: data.status,
        speakerScore: data.status === 'Present' ? parseInt(data.score) || 0 : 0
      }));

      const markRes = await fetch('/api/cabinet/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: newSessionId, attendanceData })
      });

      if (!markRes.ok) throw new Error('Could not mark attendance.');

      setSessionSuccess(true);
      setSessionMotion('');
      loadDashboardData();
      setTimeout(() => setSessionSuccess(false), 5000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingSession(false);
    }
  };


  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTo) return alert("Please select an assignee.");
    
    setAssigning(true);
    setAssignSuccess(false);

    try {
      // Determine if assignee is cabinet or member
      const isCabinet = cabinet.some(c => c.id === assignTo);
      
      const res = await fetch('/api/president/tasks/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: taskName, 
          description: "Administrative task assigned by President.",
          deadline: taskDL, 
          assignedToId: isCabinet ? assignTo : undefined,
          assignedToMemberId: isCabinet ? undefined : assignTo
        })
      });
      if (!res.ok) throw new Error('Could not assign task.');
      
      setAssignSuccess(true);
      setTaskName('');
      setTaskDL('');
      setAssignTo('');
      loadDashboardData();
      setTimeout(() => setAssignSuccess(false), 5000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* SIDEBAR OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: typeof window !== 'undefined' && window.innerWidth < 1024 
            ? (isSidebarOpen ? 0 : -256) 
            : 0 
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col p-6 lg:translate-x-0 lg:sticky lg:h-screen"
      >
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3 font-bold text-xl text-white tracking-widest">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white p-1">
              <Image src="/logo.png" alt="Debsoc" width={32} height={32} className="object-contain" />
            </div>
            <span>DEBSOC</span>
          </div>
          <button 
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <Plus size={24} className="rotate-45" />
          </button>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('Dashboard'); setIsSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'Dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('Sessions'); setIsSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'Sessions' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Calendar size={20} />
            <span>Sessions</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('Tasks'); setIsSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'Tasks' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <CheckSquare size={20} />
            <span>Tasks</span>
            {pendingTasksCount > 0 && (
              <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingTasksCount}</span>
            )}
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('Analytics'); setIsSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'Analytics' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <BarChart2 size={20} />
            <span>Analytics</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('Members'); setIsSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'Members' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={20} />
            <span>Members</span>
          </a>
        </nav>

        <div className="flex items-center gap-3 mt-auto pt-6 border-t border-slate-800">
          <img
            src={userImage}
            alt={userName}
            className="w-10 h-10 rounded-full border-2 border-slate-700 object-cover"
          />
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="font-semibold text-sm text-white truncate">{userName}</span>
            <span className="text-xs text-slate-400 truncate">{userRole}</span>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-slate-400 hover:text-white" title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto relative">
        {/* MOBILE TOP BAR */}
        <div className="flex lg:hidden items-center justify-between mb-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Debsoc" width={28} height={28} className="object-contain" />
              <span className="font-bold text-slate-900 tracking-wide">DEBSOC</span>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 relative p-1">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="font-medium">Syncing society records...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-500 gap-4">
            <AlertCircle size={40} />
            <p className="font-medium">{error}</p>
            <button 
              onClick={loadDashboardData}
              className="flex items-center gap-2 bg-red-100 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
            >
              <RefreshCw size={18} /> Retry
            </button>
          </div>
        ) : activeTab === 'Dashboard' ? (
          <div className="max-w-6xl mx-auto">
            {/* HEADER */}
            <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">Executive Dashboard</h1>
                  <p className="text-slate-500 text-xs md:text-sm">Oversee society operations, sessions, and member performance</p>
                </div>
              </div>
              <div className="flex items-center gap-3 md:gap-6">
                <button className="hidden lg:flex text-slate-400 hover:text-slate-600 relative p-1">
                  <Bell size={24} />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50"></span>
                </button>
                <button 
                  onClick={() => document.getElementById('log-session-card')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors shadow-sm shadow-blue-200"
                >
                  <Plus size={18} />
                  <span className="hidden xs:inline">New Session</span>
                  <span className="xs:hidden">New</span>
                </button>
              </div>
            </header>


            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Stat 1 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Total Members</div>
                  <div className="text-2xl font-bold text-slate-900">{totalMembers}</div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Medal size={24} />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Avg. Speaker Score</div>
                  <div className="text-2xl font-bold text-slate-900">{avgSpeakerScore}<span className="text-slate-400 text-sm font-medium">/100</span></div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ListTodo size={24} />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Tasks Completed</div>
                  <div className="text-2xl font-bold text-slate-900">{completedTasks} <span className="text-slate-400 text-sm font-medium normal-case">this term</span></div>
                </div>
              </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN (WIDER) */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Log New Session Card */}
                <div id="log-session-card" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-8">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-500" size={24} />
                      <h2 className="text-lg font-bold text-slate-900">Quick Log New Session</h2>
                    </div>
                    {sessionSuccess ? (
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} /> Saved Successfully
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">Drafting</span>
                    )}
                  </div>
                  
                  <form onSubmit={handleSaveSession} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Session Date & Time</label>
                        <div className="relative">
                          <input 
                            type="datetime-local" 
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                            value={sessionDate}
                            onChange={(e) => setSessionDate(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chair Name</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={16} className="text-slate-400" />
                          </div>
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400" 
                            placeholder="e.g. Sarah Jenkins" 
                            value={chairName}
                            onChange={(e) => setChairName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-8">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Motion / Topic</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MessageSquare size={16} className="text-slate-400" />
                        </div>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400" 
                          placeholder="e.g. THW ban all zoos" 
                          value={sessionMotion}
                          onChange={(e) => setSessionMotion(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-4 flex justify-between items-end">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Member Roster & Scoring</label>
                      <span className="text-xs text-slate-400">{members.length} Members Loaded</span>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-x-auto mb-8 max-h-[400px] overflow-y-auto">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500">Member</th>
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500 text-center">Status</th>
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500 text-center">Score (0-100)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {members.map((member) => (
                            <tr key={member.id} className="hover:bg-slate-50/50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </div>
                                  <span className="font-medium text-slate-700 text-sm truncate max-w-[120px] md:max-w-[200px]">{member.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <select 
                                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                  value={memberAttendance[member.id]?.status || 'Absent'}
                                  onChange={(e) => handleAttendanceChange(member.id, 'status', e.target.value)}
                                >
                                  <option value="Present">Present</option>
                                  <option value="Absent">Absent</option>
                                  <option value="Excused">Excused</option>
                                </select>
                              </td>
                              <td className="py-3 px-4">
                                <input 
                                  type="number" 
                                  placeholder="0"
                                  className="w-16 md:w-20 mx-auto block bg-white border border-slate-200 text-center text-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400" 
                                  value={memberAttendance[member.id]?.score || ''}
                                  onChange={(e) => handleAttendanceChange(member.id, 'score', e.target.value)}
                                  disabled={memberAttendance[member.id]?.status !== 'Present'}
                                  min="0"
                                  max="100"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button 
                        type="button"
                        onClick={() => {
                          setSessionMotion('');
                          const initial: any = {};
                          members.forEach(m => initial[m.id] = { status: 'Absent', score: '' });
                          setMemberAttendance(initial);
                        }}
                        className="px-5 py-2.5 text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Reset
                      </button>
                      <button 
                        disabled={savingSession || members.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
                      >
                        {savingSession ? (
                          <><Loader2 className="animate-spin" size={18} /> Saving...</>
                        ) : (
                          <><FileText size={18} /> Save Session Log</>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                
                {/* Executive Tasks Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">Executive Tasks</h2>
                    <span className="text-xs text-slate-400">5 Pending</span>
                  </div>
                    <div className="space-y-5">
                      {allTasks.length > 0 ? (
                        allTasks.slice(0, 4).map((task) => (
                          <div key={task.id} className={`pl-3 border-l-2 ${task.completed ? 'border-emerald-500' : isOverdue(task.deadline) ? 'border-red-500' : 'border-blue-500'}`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                task.completed ? 'bg-emerald-100 text-emerald-700' : 
                                isOverdue(task.deadline) ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {task.completed ? 'Completed' : isOverdue(task.deadline) ? 'Overdue' : 'Active'}
                              </span>
                              <span className="text-xs text-slate-400">{fmtDeadline(task.deadline)}</span>
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900 truncate">{task.name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{task.assignedTo?.name || 'Unassigned'}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-slate-400 text-sm">No tasks found</div>
                      )}
                    </div>
                    
                    <div className="mt-6 text-center">
                        <button 
                          onClick={() => setActiveTab('Tasks')}
                          className="text-blue-600 text-sm font-medium hover:underline"
                        >
                          View All Tasks
                        </button>
                    </div>
                </div>

                {/* Received Messages Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">Received Messages</h2>
                    <span className="text-xs text-slate-400">{receivedMessages.length} New</span>
                  </div>
                  <div className="p-5 max-h-[400px] overflow-y-auto">
                    <div className="space-y-4">
                      {receivedMessages.length > 0 ? (
                        receivedMessages.map((msg) => (
                          <div key={msg.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-blue-600 uppercase">From {msg.senderType || 'Anonymous'}</span>
                              <span className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-slate-700 italic">"{msg.message}"</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-slate-400 text-sm">No messages received.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cabinet Feedback Card (Placeholder for visual consistency) */}
                <div className="bg-blue-600 rounded-xl shadow-md p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={20} />
                    <h2 className="text-base font-bold">Feedback Hub</h2>
                  </div>
                  <p className="text-blue-100 text-xs mb-4">Send constructive evaluations to cabinet members securely.</p>
                  <button className="w-full border border-blue-400 bg-blue-700/50 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium text-sm transition-colors">
                    Open Evaluation Tool
                  </button>
                </div>

              </div>

            </div>

          </div>
        ) : activeTab === 'Sessions' ? (
          <div className="max-w-6xl mx-auto">
            <header className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Session History</h2>
              <p className="text-slate-500 text-sm">Review past motions, attendance, and speaker performances.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-700 w-12 h-12 rounded-lg font-bold">
                       <span className="text-[10px] leading-tight">{fmtDate(s.sessionDate).month}</span>
                       <span className="text-lg leading-tight">{fmtDate(s.sessionDate).day}</span>
                    </div>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                      Chair: {s.Chair}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 min-h-[40px]">{s.motiontype}</h3>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <CalendarDays size={14} /> {new Date(s.sessionDate).toLocaleDateString()}
                    </div>
                    <button className="text-blue-600 font-semibold hover:underline">View Ledger</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'Tasks' ? (
          <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Executive Taskboard</h2>
                <p className="text-slate-500 text-sm">Assign and track deliverables across the society cabinet.</p>
              </div>
              <div className="flex gap-3 text-xs bg-white border border-slate-200 rounded-lg p-1">
                <span className="px-3 py-1.5 bg-blue-600 text-white rounded-md font-bold">All</span>
                <span className="px-3 py-1.5 text-slate-500 font-medium hover:bg-slate-100 rounded-md cursor-pointer transition-colors">Pending</span>
                <span className="px-3 py-1.5 text-slate-500 font-medium hover:bg-slate-100 rounded-md cursor-pointer transition-colors">Completed</span>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {allTasks.map((t) => (
                  <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-start">
                    <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.completed ? 'bg-emerald-50 text-emerald-600' : isOverdue(t.deadline) ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {t.completed ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-900">{t.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${t.completed ? 'bg-emerald-100 text-emerald-700' : isOverdue(t.deadline) ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {t.completed ? 'Done' : isOverdue(t.deadline) ? 'Overdue' : 'Due ' + fmtDeadline(t.deadline)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-3">{t.description || 'Deliverable for cabinet operations.'}</p>
                      <div className="flex items-center justify-between text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <User size={14} /> Assigned to: <span className="text-slate-700">{t.assignedTo?.name || 'All Members'}</span>
                        </div>
                        <button className="text-blue-600 hover:underline">Update Status</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-blue-400" /> Assign New Task
                  </h3>
                  <form onSubmit={handleAssignTask} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Task Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Prepare Newsletter" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assign To</label>
                      <select 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                        value={assignTo}
                        onChange={(e) => setAssignTo(e.target.value)}
                      >
                        <option value="">Whole Society</option>
                        {members.filter(m => m.role !== 'President').map(m => (
                          <option key={m.id} value={m.id}>{m.name} (Member)</option>
                        ))}
                        {cabinet.map(m => (
                          <option key={m.id} value={m.id}>{m.name} (Cabinet)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Deadline</label>
                      <input 
                        type="date" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-blue-500"
                        value={taskDL}
                        onChange={(e) => setTaskDL(e.target.value)}
                        required
                      />
                    </div>
                    {assignSuccess && (
                      <p className="text-xs text-emerald-400 font-medium">Task assigned successfully!</p>
                    )}
                    <button 
                      disabled={assigning}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors mt-2"
                    >
                      {assigning ? 'Assigning...' : 'Assign Task'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'Members' ? (
          <div className="max-w-6xl mx-auto">
            <header className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Society Roster</h2>
                <p className="text-slate-500 text-sm">Management and oversight of all registered debaters.</p>
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Search members..." className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-blue-500" />
                <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium">Filter</button>
              </div>
            </header>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Member</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Role</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">Engagement</th>
                      <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                           <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs capitalize">
                                {m.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                                <div className="text-xs text-slate-400">{m.email}</div>
                              </div>
                           </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${m.role === 'President' ? 'bg-purple-100 text-purple-700' : m.role === 'cabinet' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                            {m.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                           <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{width: '75%'}}></div>
                           </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                           <button className="text-blue-600 font-bold text-xs hover:underline">Evaluation</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        ) : activeTab === 'Analytics' ? (
          <div className="max-w-6xl mx-auto space-y-8 text-center py-20">
             <BarChart2 className="mx-auto text-slate-200 mb-4" size={64} />
             <h2 className="text-2xl font-bold text-slate-900">Advanced Analytics Hub</h2>
             <p className="text-slate-500 max-w-md mx-auto">This section will include comprehensive data visualizations of speaker score trends, participation heatmaps, and competitive rankings.</p>
             <button className="mt-8 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-100">Request Custom Report</button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{activeTab}</h1>
            <p>This section is coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}
