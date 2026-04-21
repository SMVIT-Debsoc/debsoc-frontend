"use client";

import React, { useState } from 'react';
import styles from './index.module.css';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  MessageSquare,
  MessageSquarePlus,
  LogOut,
  Trophy,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Percent,
  Check,
  Send,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';

export default function MemberDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  return (
    <div className={styles.container}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <span>DebateSoc</span>
        </div>

        <nav className={styles.nav}>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('Dashboard'); }} className={`${styles.navItem} ${activeTab === 'Dashboard' ? styles.active : ''}`}>
            <LayoutDashboard className={styles.navItemIcon} />
            <span>Dashboard</span>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('Schedule'); }} className={`${styles.navItem} ${activeTab === 'Schedule' ? styles.active : ''}`}>
            <Calendar className={styles.navItemIcon} />
            <span>Schedule</span>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('Tasks'); }} className={`${styles.navItem} ${activeTab === 'Tasks' ? styles.active : ''}`}>
            <CheckSquare className={styles.navItemIcon} />
            <span>Tasks</span>
            <span className={`${styles.badge} ${styles.badgeOrange}`}>3</span>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('Feedback'); }} className={`${styles.navItem} ${activeTab === 'Feedback' ? styles.active : ''}`}>
             <MessageSquare className={styles.navItemIcon} />
            <span>Feedback</span>
            <span className={`${styles.badge} ${styles.badgeGrey}`}>New</span>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('Suggestions'); }} className={`${styles.navItem} ${activeTab === 'Suggestions' ? styles.active : ''}`}>
            <MessageSquarePlus className={styles.navItemIcon} />
            <span>Suggestions</span>
          </a>
        </nav>

        <div className={styles.profileArea}>
          <img 
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150" 
            alt="Alex Morgan" 
            className={styles.profileImg} 
          />
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>Alex Morgan</span>
            <span className={styles.profileRole}>Active Member</span>
          </div>
          <button className={styles.logoutBtn} title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={styles.main}>
        {activeTab === 'Dashboard' ? (
          <>
            {/* HEADER */}
            <header className={styles.header}>
          <div>
            <h1 className={styles.greeting}>Welcome back, Alex! 👋</h1>
            <p className={styles.subtitle}>Here's your growth overview for this semester.</p>
          </div>
          <div className={styles.rankBadge}>
            <span className={styles.rankLabel}>Current Rank:</span>
            <Trophy size={16} />
            <span>Gold Tier</span>
          </div>
        </header>

        {/* STATS GRID */}
        <div className={styles.statsGrid}>
          {/* Card 1 */}
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                <CalendarDays size={18} />
              </div>
              <span className={styles.statLabel}>Total</span>
            </div>
            <div className={styles.statValueContainer}>
              <span className={styles.statValue}>24</span>
              <span className={styles.statSubtext}>Sessions</span>
            </div>
          </div>
          {/* Card 2 */}
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                <CheckCircle2 size={18} />
              </div>
              <span className={styles.statLabel}>Present</span>
            </div>
            <div className={styles.statValueContainer}>
              <span className={styles.statValue}>21</span>
              <span className={styles.statSubtextGreen}>+2 this week</span>
            </div>
          </div>
          {/* Card 3 */}
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={`${styles.statIcon} ${styles.statIconRed}`}>
                <XCircle size={18} />
              </div>
              <span className={styles.statLabel}>Absent</span>
            </div>
            <div className={styles.statValueContainer}>
              <span className={styles.statValue}>3</span>
              <span className={styles.statSubtext}>Missed</span>
            </div>
          </div>
          {/* Card 4 */}
          <div className={styles.statCard}>
            <div className={styles.statCardHeader}>
              <div className={`${styles.statIcon} ${styles.statIconOrange}`}>
                <Percent size={18} />
              </div>
              <span className={styles.statLabel}>Rate</span>
            </div>
            <div className={styles.statValueContainer}>
              <span className={styles.statValue}>87.5%</span>
              <span className={styles.statSubtextOrange}>Excellent</span>
            </div>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBarFill} style={{ width: '87.5%' }}></div>
            </div>
          </div>
        </div>

        {/* CONTENT GRID */}
        <div className={styles.contentGrid}>
          {/* LEFT COLUMN */}
          <div className={styles.columnLeft}>
            {/* Recent Sessions */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Recent Sessions</h2>
                <a href="#" className={styles.cardLink}>View All</a>
              </div>
              
              <div className={styles.sessionList}>
                {/* Session 1 */}
                <div className={styles.sessionItem}>
                  <div className={styles.sessionDate}>
                    <span className={styles.sessionMonth}>Oct</span>
                    <span className={styles.sessionDay}>24</span>
                  </div>
                  <div className={styles.sessionContent}>
                    <div className={styles.sessionHeader}>
                      <h3 className={styles.sessionTitle}>Weekly Debate: AI Ethics</h3>
                      <span className={`${styles.sessionStatus} ${styles.statusPresent}`}>Present</span>
                    </div>
                    <p className={styles.sessionDesc}>Motion: This House Believes That AI development should be paused.</p>
                    <div className={styles.sessionDetails}>
                      <div className={styles.detailBox}>
                        <div className={styles.detailBoxLabel}>Chair</div>
                        <div className={styles.detailBoxValue}>Sarah Jenkins</div>
                      </div>
                      <div className={styles.detailBox}>
                        <div className={styles.detailBoxLabel}>Role</div>
                        <div className={styles.detailBoxValue}>Prop. Whip</div>
                      </div>
                      <div className={styles.detailBoxOrange}>
                        <div className={styles.detailBoxLabel}>Speaker Score</div>
                        <div className={styles.detailBoxValueOrange}>78/100</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session 2 */}
                <div className={styles.sessionItem}>
                  <div className={styles.sessionDate}>
                    <span className={styles.sessionMonth}>Oct</span>
                    <span className={styles.sessionDay}>17</span>
                  </div>
                  <div className={styles.sessionContent}>
                    <div className={styles.sessionHeader}>
                      <h3 className={styles.sessionTitle}>Inter-Varsity Prep</h3>
                      <span className={`${styles.sessionStatus} ${styles.statusPresent}`}>Present</span>
                    </div>
                    <p className={styles.sessionDesc}>Motion: THW ban private schools.</p>
                  </div>
                </div>

                {/* Session 3 */}
                <div className={styles.sessionItem}>
                  <div className={styles.sessionDate}>
                    <span className={styles.sessionMonth}>Oct</span>
                    <span className={styles.sessionDay}>10</span>
                  </div>
                  <div className={styles.sessionContent}>
                    <div className={styles.sessionHeader}>
                      <h3 className={styles.sessionTitle}>Public Speaking Workshop</h3>
                      <span className={`${styles.sessionStatus} ${styles.statusAbsent}`}>Absent</span>
                    </div>
                    <p className={styles.sessionDesc}>Reason: Medical (Excused)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* My Tasks */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>My Tasks</h2>
                <button className={styles.cardAction}>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>

              <div className={styles.taskList}>
                {/* Task 1 */}
                <div className={styles.taskItem}>
                  <div className={styles.checkbox}></div>
                  <div className={styles.taskContent}>
                    <h3 className={styles.taskTitle}>Submit topic proposals for next month</h3>
                    <div className={styles.taskMetaWarning}>Due Today, 5:00 PM</div>
                  </div>
                </div>
                
                {/* Task 2 */}
                <div className={styles.taskItem}>
                  <div className={styles.checkbox}></div>
                  <div className={styles.taskContent}>
                    <h3 className={styles.taskTitle}>Review adjudication guidelines</h3>
                    <div className={styles.taskMeta}>Due Oct 28</div>
                  </div>
                </div>

                {/* Task 3 */}
                <div className={styles.taskItem}>
                  <div className={`${styles.checkbox} ${styles.checkboxChecked}`}>
                    <Check size={14} />
                  </div>
                  <div className={styles.taskContent}>
                    <h3 className={`${styles.taskTitle} ${styles.taskTitleCompleted}`}>Register for Regionals</h3>
                    <div className={styles.taskMeta}>Completed Oct 22</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className={styles.columnRight}>
            
            {/* Suggestion Box */}
            <div className={styles.suggestionCard}>
              <div className={styles.suggestionHeader}>
                <div className={styles.suggestionHeaderIcon}>
                  <Send size={16} color="white" />
                </div>
                <span>Suggestion Box</span>
              </div>
              <p className={styles.suggestionText}>
                Send an anonymous message to the leadership team regarding society affairs.
              </p>
              
              <form className={styles.suggestionForm}>
                <div className={styles.suggestionSelectWrapper}>
                  <select className={styles.suggestionSelect}>
                    <option>To: President</option>
                    <option>To: Cabinet</option>
                    <option>To: Logistics</option>
                  </select>
                  <ChevronDown className={styles.suggestionSelectIcon} size={16} />
                </div>
                
                <textarea 
                  className={styles.suggestionTextarea}
                  placeholder="Type your suggestion here..."
                  rows={4}
                ></textarea>
                
                <button type="button" className={styles.submitBtn}>
                  Send Anonymously
                </button>
              </form>
            </div>

            {/* Feedback Inbox */}
            <div className={styles.feedbackCard}>
              <div className={styles.cardHeader} style={{ marginBottom: "16px" }}>
                <h2 className={styles.cardTitle} style={{ fontSize: "16px" }}>Feedback Inbox</h2>
                <span className={`${styles.badge} ${styles.badgeOrange}`} style={{ margin: 0 }}>2 New</span>
              </div>

              <div className={styles.feedbackListWrapper}>
                <div className={styles.feedbackList}>
                  {/* Feedback 1 */}
                  <div className={styles.feedbackItem} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "8px" }}>
                    <div className={styles.feedbackItemHeader}>
                      <span className={`${styles.feedbackFrom} ${styles.feedbackFromPresident}`}>President</span>
                      <span className={styles.feedbackTime}>2h ago</span>
                    </div>
                    <h4 className={styles.feedbackTitle}>Great performance today!</h4>
                    <p className={styles.feedbackDesc}>
                      "Your rebuttal in the second half was particularly strong. Try to work on your pacing..."
                    </p>
                  </div>
                  
                  {/* Feedback 2 */}
                  <div className={styles.feedbackItem}>
                    <div className={styles.feedbackItemHeader} style={{ marginBottom: "8px" }}>
                      <span className={`${styles.feedbackFrom} ${styles.feedbackFromCabinet}`}>Cabinet</span>
                      <span className={styles.feedbackTime}>Yesterday</span>
                    </div>
                    <h4 className={styles.feedbackTitle}>Mentorship Session Notes</h4>
                    <p className={styles.feedbackDesc}>
                      "Here are the points we discussed regarding your POI strategy. Keep up the good work!"
                    </p>
                  </div>
                </div>

                {/* Vertical Scrollbar Mockup */}
                <div className={styles.scrollTrack}>
                  <ChevronUp size={16} className={styles.scrollArrowVertical} />
                  <div className={styles.scrollThumb}></div>
                  <ChevronDown size={16} className={styles.scrollArrowVertical} />
                </div>
              </div>

              <div className={styles.feedbackFooter}>
                <div className={styles.scrollArrows}>
                  <ChevronLeft size={16} className={styles.scrollArrow} />
                  <div className={styles.scrollDots}>
                    <div className={styles.scrollDotActive}></div>
                  </div>
                  <ChevronRight size={16} className={styles.scrollArrow} />
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: "12px" }}>
                 <a href="#" className={styles.feedbackAllLink}>View All Messages</a>
              </div>
            </div>

          </div>
        </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
            <h1 className={styles.greeting} style={{ color: '#1e293b', marginBottom: '8px' }}>{activeTab}</h1>
            <p className={styles.subtitle}>This section is coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
}
