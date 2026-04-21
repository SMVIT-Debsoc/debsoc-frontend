"use client";

import React, {useState, useEffect} from "react";
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
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import Image from "next/image";
import {useSession, signOut} from "next-auth/react";

// ── Types ──────────────────────────────────────────────────────────────────
type Member = {id: string; name: string; email: string};
type CabinetMember = {
  id: string;
  name: string;
  email: string;
  position: string;
};
type President = {id: string; name: string; email: string};
type AttendanceRecord = {
  id: string;
  status: "Present" | "Absent" | "Excused";
  speakerScore?: number | null;
  session: {id: string; sessionDate: string; motiontype: string; Chair: string};
};
type Task = {
  id: string;
  name: string;
  description?: string;
  deadline: string;
  completed?: boolean;
  assignedToMemberId?: string;
  assignedToId?: string;
};
type Session = {
  id: string;
  sessionDate: string;
  motiontype: string;
  Chair: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return {
    month: d.toLocaleString("en-US", {month: "short"}).toUpperCase(),
    day: d.getDate(),
  };
};
const fmtDeadline = (dl: string) =>
  new Date(dl).toLocaleDateString("en-US", {month: "short", day: "numeric"});
const isOverdue = (dl: string) =>
  !new Date(dl).valueOf() || new Date(dl) < new Date();

export default function CabinetDashboard() {
  const {data: session} = useSession();
  const [activeTab, setActiveTab] = useState("Dashboard");

  // Dashboard Data
  const [members, setMembers] = useState<Member[]>([]);
  const [cabinet, setCabinet] = useState<CabinetMember[]>([]);
  const [presidents, setPresidents] = useState<President[]>([]);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form States - Session Log
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [chairName, setChairName] = useState(session?.user?.name || "");
  const [motion, setMotion] = useState("");
  const [memberAttendance, setMemberAttendance] = useState<
    Record<string, {status: string; score: string}>
  >({});
  const [savingSession, setSavingSession] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState(false);

  // Form States - Report to President
  const [selectedPresidentId, setSelectedPresidentId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  const userName = session?.user?.name || "Cabinet Member";
  const userRole = (session?.user as any)?.position || "Cabinet";
  const userImage =
    session?.user?.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2563eb&color=fff`;

  async function loadDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, attRes, taskRes, sessRes] = await Promise.all([
        fetch("/api/cabinet/dashboard"),
        fetch("/api/cabinet/attendance/my"),
        fetch("/api/cabinet/tasks"),
        fetch("/api/cabinet/sessions"),
      ]);

      if (!dashRes.ok || !attRes.ok || !taskRes.ok || !sessRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const dashData = await dashRes.json();
      const attData = await attRes.json();
      const taskData = await taskRes.json();
      const sessData = await sessRes.json();

      setMembers(dashData.members || []);
      setCabinet(dashData.cabinet || []);
      setPresidents(dashData.presidents || []);
      setMyAttendance(attData.attendance || []);
      setMyTasks(taskData.tasks || []);
      setSessions(sessData.sessions || []);

      if (dashData.presidents?.length > 0) {
        setSelectedPresidentId(dashData.presidents[0].id);
      }

      // Initialize attendance state for all members
      const initialAttendance: Record<string, {status: string; score: string}> =
        {};
      dashData.members?.forEach((m: Member) => {
        initialAttendance[m.id] = {status: "Absent", score: ""};
      });
      setMemberAttendance(initialAttendance);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (session?.user?.name && !chairName) {
      setChairName(session.user.name);
    }
  }, [session, chairName]);

  const handleAttendanceChange = (
    memberId: string,
    field: "status" | "score",
    value: string,
  ) => {
    setMemberAttendance((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value,
      },
    }));
  };

  async function handleSaveSession(e: React.FormEvent) {
    e.preventDefault();
    if (!motion || !chairName || !sessionDate) return;

    setSavingSession(true);
    try {
      // 1. Create Session
      const createRes = await fetch("/api/cabinet/session/create", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          sessionDate,
          motiontype: motion,
          Chair: chairName,
        }),
      });

      if (!createRes.ok) throw new Error("Failed to create session");
      const {session: newSession} = await createRes.json();

      // 2. Mark Attendance
      const attendanceData = Object.entries(memberAttendance).map(
        ([memberId, data]) => ({
          memberId,
          status: data.status,
          speakerScore:
            data.status === "Present" ? parseFloat(data.score) || 0 : undefined,
        }),
      );

      const markRes = await fetch("/api/cabinet/attendance/mark", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({sessionId: newSession.id, attendanceData}),
      });

      if (!markRes.ok) throw new Error("Failed to mark attendance");

      setSessionSuccess(true);
      setMotion("");
      setTimeout(() => setSessionSuccess(false), 5000);
      loadDashboardData(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingSession(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim() || !selectedPresidentId) return;

    setSendingMessage(true);
    setMessageError(null);
    try {
      const res = await fetch("/api/cabinet/messages/president", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          message: messageText,
          presidentId: selectedPresidentId,
        }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      setMessageSent(true);
      setMessageText("");
      setTimeout(() => setMessageSent(false), 5000);
    } catch (err: any) {
      setMessageError(err.message);
    } finally {
      setSendingMessage(false);
    }
  }

  const attendanceRate =
    myAttendance.length > 0
      ? Math.round(
          (myAttendance.filter((a) => a.status === "Present").length /
            myAttendance.length) *
            100,
        )
      : 0;

  const avgSpeakerScore =
    myAttendance.length > 0
      ? (
          myAttendance.reduce(
            (acc, curr) => acc + (curr.speakerScore || 0),
            0,
          ) / myAttendance.filter((a) => a.speakerScore !== null).length
        ).toFixed(1)
      : "0.0";

  const completedTasks = myTasks.filter((t) => t.completed).length;
  const pendingTasksCount = myTasks.filter((t) => !t.completed).length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 font-bold text-xl mb-10 text-white">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Gavel size={20} />
          </div>
          <span>DebateCab</span>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Dashboard");
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === "Dashboard" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Sessions");
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === "Sessions" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}
          >
            <Calendar size={20} />
            <span>Sessions</span>
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Tasks");
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === "Tasks" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}
          >
            <CheckSquare size={20} />
            <span>Tasks</span>
            {pendingTasksCount > 0 && (
              <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingTasksCount}
              </span>
            )}
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Analytics");
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === "Analytics" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}
          >
            <BarChart2 size={20} />
            <span>Analytics</span>
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab("Members");
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === "Members" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}
          >
            <Users size={20} />
            <span>Members</span>
          </a>
        </nav>

        <div className="flex items-center gap-3 mt-auto pt-6">
          <img
            src={userImage}
            alt={userName}
            className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
          />
          <div className="flex flex-col flex-1 overflow-hidden">
            <span className="font-semibold text-sm text-white truncate">
              {userName}
            </span>
            <span className="text-xs text-slate-400 truncate">{userRole}</span>
          </div>
          <button
            onClick={() => signOut({callbackUrl: "/login"})}
            className="text-slate-400 hover:text-white"
            title="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="font-medium">Loading dashboard data...</p>
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
        ) : activeTab === "Dashboard" ? (
          <div className="max-w-6xl mx-auto">
            {/* HEADER */}
            <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">
                  Operational Dashboard
                </h1>
                <p className="text-slate-500 text-sm">
                  Manage sessions, tasks, and reporting
                </p>
              </div>
              <div className="flex items-center gap-6">
                <button className="text-slate-400 hover:text-slate-600 relative">
                  <Bell size={24} />
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50"></span>
                </button>
              </div>
            </header>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Stat 1 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
                    My Attendance
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {attendanceRate}%
                  </div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Medal size={24} />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
                    Avg. Speaker Score
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {avgSpeakerScore}
                    <span className="text-slate-400 text-sm font-medium">
                      /100
                    </span>
                  </div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ListTodo size={24} />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">
                    Tasks Completed
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {completedTasks}{" "}
                    <span className="text-slate-400 text-sm font-medium normal-case">
                      this term
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LEFT COLUMN (WIDER) */}
              <div className="lg:col-span-2 space-y-8">
                {/* Log New Session Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-500" size={24} />
                      <h2 className="text-lg font-bold text-slate-900">
                        Log New Session
                      </h2>
                    </div>
                    {sessionSuccess ? (
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} /> Saved Successfully
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                        Drafting
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSaveSession} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Session Date & Time
                        </label>
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
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Chair Name
                        </label>
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
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Motion / Topic
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MessageSquare size={16} className="text-slate-400" />
                        </div>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400"
                          placeholder="e.g. THW ban all zoos"
                          value={motion}
                          onChange={(e) => setMotion(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-4 flex justify-between items-end">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Member Roster & Scoring
                      </label>
                      <span className="text-xs text-slate-400">
                        {members.length} Members Loaded
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden mb-8 max-h-[400px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500">
                              Member
                            </th>
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500 text-center">
                              Status
                            </th>
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500 text-center">
                              Score (0-100)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {members.map((member) => (
                            <tr
                              key={member.id}
                              className="hover:bg-slate-50/50"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                                    {member.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </div>
                                  <span className="font-medium text-slate-700 text-sm truncate max-w-[150px]">
                                    {member.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <select
                                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                  value={
                                    memberAttendance[member.id]?.status ||
                                    "Absent"
                                  }
                                  onChange={(e) =>
                                    handleAttendanceChange(
                                      member.id,
                                      "status",
                                      e.target.value,
                                    )
                                  }
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
                                  className="w-20 mx-auto block bg-white border border-slate-200 text-center text-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                                  value={
                                    memberAttendance[member.id]?.score || ""
                                  }
                                  onChange={(e) =>
                                    handleAttendanceChange(
                                      member.id,
                                      "score",
                                      e.target.value,
                                    )
                                  }
                                  disabled={
                                    memberAttendance[member.id]?.status !==
                                    "Present"
                                  }
                                  min="0"
                                  max="100"
                                />
                              </td>
                            </tr>
                          ))}
                          {members.length === 0 && (
                            <tr>
                              <td
                                colSpan={3}
                                className="py-8 text-center text-slate-500 text-sm italic"
                              >
                                No members available to load.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setMotion("");
                          const initial: any = {};
                          members.forEach(
                            (m) =>
                              (initial[m.id] = {status: "Absent", score: ""}),
                          );
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
                          <>
                            <Loader2 className="animate-spin" size={18} />{" "}
                            Saving...
                          </>
                        ) : (
                          <>
                            <FileText size={18} /> Save Session Log
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                {/* My Tasks Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">
                      My Tasks
                    </h2>
                    <span className="text-xs text-slate-400">
                      {pendingTasksCount} Pending
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="space-y-5 max-h-[300px] overflow-y-auto pr-1">
                      {myTasks.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 italic text-sm">
                          No tasks assigned yet.
                        </div>
                      ) : (
                        myTasks.map((task) => {
                          const overdue =
                            !task.completed && isOverdue(task.deadline);
                          return (
                            <div
                              key={task.id}
                              className={`pl-3 border-l-2 ${task.completed ? "border-slate-200" : overdue ? "border-red-500" : "border-emerald-500"}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span
                                  className={`${task.completed ? "bg-slate-100 text-slate-600" : overdue ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"} text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider`}
                                >
                                  {task.completed
                                    ? "Completed"
                                    : overdue
                                      ? "Overdue"
                                      : "Upcoming"}
                                </span>
                                <span className="text-xs text-slate-400">
                                  Due {fmtDeadline(task.deadline)}
                                </span>
                              </div>
                              <h3
                                className={`text-sm font-semibold ${task.completed ? "text-slate-500 line-through" : "text-slate-900"}`}
                              >
                                {task.name}
                              </h3>
                              {task.description && (
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="mt-6 text-center">
                      <button
                        onClick={() => setActiveTab("Tasks")}
                        className="text-blue-600 text-sm font-medium hover:underline"
                      >
                        View All Tasks
                      </button>
                    </div>
                  </div>
                </div>

                {/* Report to President Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <User size={16} />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      Report to President
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Send an anonymous message directly to the President.
                  </p>

                  <form onSubmit={handleSendMessage}>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none mb-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      value={selectedPresidentId}
                      onChange={(e) => setSelectedPresidentId(e.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Select Recipient
                      </option>
                      {presidents.map((p) => (
                        <option key={p.id} value={p.id}>
                          To: {p.name}
                        </option>
                      ))}
                    </select>

                    <textarea
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none mb-3"
                      placeholder="Type your message here..."
                      rows={4}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      required
                    ></textarea>

                    {messageError && (
                      <p className="text-xs text-red-500 mb-3 flex items-center gap-1">
                        <AlertCircle size={12} /> {messageError}
                      </p>
                    )}
                    {messageSent && (
                      <p className="text-xs text-emerald-600 mb-3 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Message sent anonymously!
                      </p>
                    )}

                    <button
                      disabled={
                        sendingMessage ||
                        !messageText.trim() ||
                        !selectedPresidentId
                      }
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                    >
                      {sendingMessage ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />{" "}
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Send Anonymously
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Peer Feedback Card */}
                <div className="bg-blue-600 rounded-xl shadow-md p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={20} />
                    <h2 className="text-base font-bold">Peer Feedback</h2>
                  </div>
                  <p className="text-blue-100 text-xs mb-4">
                    Send constructive tips to members after a session.
                  </p>
                  <button
                    onClick={() => setActiveTab("Members")}
                    className="w-full border border-blue-400 bg-blue-700/50 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium text-sm transition-colors"
                  >
                    Open Feedback Tool
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "Sessions" ? (
          <div className="max-w-6xl mx-auto">
            <header className="mb-8 border-b border-slate-200 pb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                Debate Sessions
              </h1>
              <p className="text-slate-500 text-sm">
                View all recorded sessions and their motions
              </p>
            </header>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Motion
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Chair
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-12 text-center text-slate-400 italic"
                      >
                        No sessions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => {
                      const {month, day} = fmtDate(s.sessionDate);
                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded flex flex-col items-center justify-center font-bold text-[10px]">
                                <span>{month}</span>
                                <span className="text-sm">{day}</span>
                              </div>
                              <span className="text-sm text-slate-600">
                                {new Date(s.sessionDate).toLocaleTimeString(
                                  [],
                                  {hour: "2-digit", minute: "2-digit"},
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-900 text-sm">
                            {s.motiontype}
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600">
                            {s.Chair}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "Members" ? (
          <div className="max-w-6xl mx-auto">
            <header className="mb-8 border-b border-slate-200 pb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                Society Members
              </h1>
              <p className="text-slate-500 text-sm">
                View members and give anonymous feedback
              </p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-300">
                  No members found.
                </div>
              ) : (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-lg">
                        {m.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{m.name}</h3>
                        <p className="text-xs text-slate-500 truncate w-40">
                          {m.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const feedback = prompt(
                          `Give anonymous feedback to ${m.name}:`,
                        );
                        if (feedback?.trim()) {
                          fetch("/api/cabinet/feedback/give", {
                            method: "POST",
                            headers: {"Content-Type": "application/json"},
                            body: JSON.stringify({feedback, memberId: m.id}),
                          }).then((res) => {
                            if (res.ok) alert("Feedback sent!");
                            else alert("Failed to send feedback.");
                          });
                        }
                      }}
                      className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={16} /> Give Feedback
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'Tasks' ? (
          <div className="max-w-6xl mx-auto">
            <header className="mb-8 border-b border-slate-200 pb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">My Task List</h1>
                <p className="text-slate-500 text-sm">Tasks assigned to you by the President</p>
              </div>
              <div className="flex gap-2">
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{myTasks.length} Total</span>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{completedTasks} Done</span>
              </div>
            </header>
            
            <div className="grid grid-cols-1 gap-6">
              {myTasks.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
                  <ListTodo size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium">No tasks found in your log.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myTasks.slice().sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).map((task) => {
                    const overdue = !task.completed && isOverdue(task.deadline);
                    return (
                      <div key={task.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${task.completed ? 'bg-emerald-100 text-emerald-600' : overdue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {task.completed ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className={`font-bold text-slate-900 ${task.completed ? 'line-through text-slate-400' : ''}`}>{task.name}</h3>
                            <span className="text-xs font-medium text-slate-400">{fmtDeadline(task.deadline)}</span>
                          </div>
                          {task.description && <p className="text-sm text-slate-600 mb-3">{task.description}</p>}
                          <div className="flex gap-2">
                            {task.completed ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded uppercase tracking-wider">Completed</span>
                            ) : overdue ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-600 rounded uppercase tracking-wider">Overdue</span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded uppercase tracking-wider">Pending</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'Analytics' ? (
          <div className="max-w-6xl mx-auto">
            <header className="mb-8 border-b border-slate-200 pb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Performance Analytics</h1>
              <p className="text-slate-500 text-sm">Deep dive into your session and task metrics</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Attendance Breakdown */}
              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Attendance Breakdown</h3>
                <div className="flex items-end gap-3 h-40 mb-6">
                  {['Present', 'Absent', 'Excused'].map((status) => {
                    const count = myAttendance.filter(a => a.status === status).length;
                    const total = myAttendance.length || 1;
                    const pct = Math.round((count / total) * 100);
                    const color = status === 'Present' ? 'bg-blue-500' : status === 'Absent' ? 'bg-red-500' : 'bg-slate-400';
                    return (
                      <div key={status} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">{pct}%</div>
                        <div className={`w-full ${color} rounded-t-lg transition-all duration-500`} style={{ height: `${Math.max(pct, 5)}%` }}></div>
                        <div className="text-xs font-semibold text-slate-600 mt-2">{status}</div>
                        <div className="text-xs text-slate-400">{count} sessions</div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 text-center italic">Calculated from your {myAttendance.length} most recent sessions.</p>
              </div>

              {/* Task Completion Progress */}
              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Task Progress</h3>
                <div className="flex flex-col items-center justify-center h-40 mb-6 relative">
                  <div className="w-32 h-32 rounded-full border-8 border-slate-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900">{Math.round((completedTasks / (myTasks.length || 1)) * 100)}%</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Complete</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-emerald-600">{completedTasks}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Done</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{pendingTasksCount}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Pending</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-blue-200">
                <div className="w-20 h-20 bg-blue-500/30 rounded-2xl flex items-center justify-center shrink-0">
                  <Medal size={40} />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold mb-2">Speaker Performance Leader</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">Your average score is in the top 15% of active cabinet members this term. Keep refining your arguments and structure!</p>
                </div>
                <div className="bg-white/10 px-6 py-4 rounded-xl text-center backdrop-blur-sm border border-white/20">
                  <div className="text-3xl font-bold">{avgSpeakerScore}/100</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Avg Score</div>
                </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {activeTab}
            </h1>
            <p>This section is coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}
