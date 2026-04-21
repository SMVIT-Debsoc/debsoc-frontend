"use client";

import React, { useState } from 'react';
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
} from 'lucide-react';
import Image from 'next/image';
import { signOut } from 'next-auth/react';

export default function CabinetDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');

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
            onClick={(e) => { e.preventDefault(); setActiveTab('Dashboard'); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'Dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('Sessions'); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'Sessions' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Calendar size={20} />
            <span>Sessions</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('Tasks'); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'Tasks' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <CheckSquare size={20} />
            <span>Tasks</span>
            <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">3</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('Analytics'); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'Analytics' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <BarChart2 size={20} />
            <span>Analytics</span>
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('Members'); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === 'Members' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={20} />
            <span>Members</span>
          </a>
        </nav>

        <div className="flex items-center gap-3 mt-auto pt-6">
          <img
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150"
            alt="Alex Morgan"
            className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
          />
          <div className="flex flex-col flex-1">
            <span className="font-semibold text-sm text-white">Alex Morgan</span>
            <span className="text-xs text-slate-400">Cabinet Secretary</span>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-slate-400 hover:text-white" title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        {activeTab === 'Dashboard' ? (
          <div className="max-w-6xl mx-auto">
            {/* HEADER */}
            <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Operational Dashboard</h1>
                <p className="text-slate-500 text-sm">Manage sessions, tasks, and reporting</p>
              </div>
              <div className="flex items-center gap-6">
                <button className="text-slate-400 hover:text-slate-600 relative">
                  <Bell size={24} />
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50"></span>
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-blue-200">
                  <Plus size={18} />
                  New Session
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
                  <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">My Attendance</div>
                  <div className="text-2xl font-bold text-slate-900">92%</div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Medal size={24} />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Avg. Speaker Score</div>
                  <div className="text-2xl font-bold text-slate-900">8.4<span className="text-slate-400 text-sm font-medium">/10</span></div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ListTodo size={24} />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Tasks Completed</div>
                  <div className="text-2xl font-bold text-slate-900">14 <span className="text-slate-400 text-sm font-medium normal-case">this term</span></div>
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
                      <h2 className="text-lg font-bold text-slate-900">Log New Session</h2>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">Drafting</span>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Session Date & Time</label>
                        <div className="relative">
                          <input type="datetime-local" className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" defaultValue="2023-10-24T18:00" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chair Name</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={16} className="text-slate-400" />
                          </div>
                          <input type="text" className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400" placeholder="e.g. Sarah Jenkins" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-8">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Motion / Topic</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MessageSquare size={16} className="text-slate-400" />
                        </div>
                        <input type="text" className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400" placeholder="e.g. THW ban all zoos" />
                      </div>
                    </div>

                    <div className="mb-4 flex justify-between items-end">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Member Roster & Scoring</label>
                      <span className="text-xs text-slate-400">12 Members Loaded</span>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden mb-8">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500">Member</th>
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500 text-center">Status</th>
                            <th className="py-3 px-4 text-xs font-semibold text-slate-500 text-center">Score (0-10)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {/* Row 1 */}
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">JD</div>
                                <span className="font-medium text-slate-700 text-sm">John Doe</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">Present</span>
                            </td>
                            <td className="py-3 px-4">
                              <input type="text" className="w-20 mx-auto block bg-white border border-slate-200 text-center text-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500" defaultValue="7.5" />
                            </td>
                          </tr>
                          
                          {/* Row 2 */}
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">AS</div>
                                <span className="font-medium text-slate-400 text-sm">Alice Smith</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full">Absent</span>
                            </td>
                            <td className="py-3 px-4">
                              <input type="text" className="w-20 mx-auto block bg-slate-50 border border-slate-200 text-center text-slate-400 rounded px-2 py-1.5 text-sm outline-none" defaultValue="-" disabled />
                            </td>
                          </tr>

                          {/* Row 3 */}
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">MK</div>
                                <span className="font-medium text-slate-700 text-sm">Marcus King</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">Present</span>
                            </td>
                            <td className="py-3 px-4">
                              <input type="text" className="w-20 mx-auto block bg-white border border-slate-200 text-center text-slate-700 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500" defaultValue="8.2" />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button className="px-5 py-2.5 text-slate-500 font-medium hover:bg-slate-100 rounded-lg transition-colors">
                        Cancel
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
                        <FileText size={18} />
                        Save Session Log
                      </button>
                    </div>

                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-6">
                
                {/* My Tasks Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900">My Tasks</h2>
                    <span className="text-xs text-slate-400">3 Pending</span>
                  </div>
                  <div className="p-5">
                    <div className="space-y-5">
                      
                        {/* Task 1 */}
                        <div className="pl-3 border-l-2 border-red-500">
                            <div className="flex justify-between items-start mb-1">
                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Overdue</span>
                                <span className="text-xs text-slate-400">Due Yesterday</span>
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900">Submit budget proposal</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Finance Committee</p>
                        </div>
                        
                        {/* Task 2 */}
                        <div className="pl-3 border-l-2 border-emerald-500">
                            <div className="flex justify-between items-start mb-1">
                                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Upcoming</span>
                                <span className="text-xs text-slate-400">Due Tomorrow</span>
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900">Confirm venue booking</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Logistics</p>
                        </div>
                        
                        {/* Task 3 */}
                        <div className="pl-3 border-l-2 border-slate-200">
                            <div className="flex justify-between items-start mb-1">
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Next Week</span>
                                <span className="text-xs text-slate-400">Oct 30</span>
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900">Draft term report</h3>
                            <p className="text-xs text-slate-500 mt-0.5">General</p>
                        </div>

                    </div>
                    
                    <div className="mt-6 text-center">
                        <a href="#" className="text-blue-600 text-sm font-medium hover:underline">View All Tasks</a>
                    </div>
                  </div>
                </div>

                {/* Report to President Card */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <User size={16} />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">Report to President</h2>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">Send an anonymous message directly to the President.</p>
                  
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all resize-none mb-3"
                    placeholder="Type your message here..."
                    rows={4}
                  ></textarea>
                  
                  <button className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm">
                    <Send size={16} />
                    Send Anonymously
                  </button>
                </div>

                {/* Peer Feedback Card */}
                <div className="bg-blue-600 rounded-xl shadow-md p-5 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={20} />
                    <h2 className="text-base font-bold">Peer Feedback</h2>
                  </div>
                  <p className="text-blue-100 text-xs mb-4">Send constructive tips to members after a session.</p>
                  <button className="w-full border border-blue-400 bg-blue-700/50 hover:bg-blue-700 text-white rounded-lg py-2.5 font-medium text-sm transition-colors">
                    Open Feedback Tool
                  </button>
                </div>

              </div>

            </div>

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
