import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { BookOpen, Award, Clock, CheckCircle, Play, ArrowRight, Star, Users, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';

export function TrainingPage() {
  const [courses, setCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentModule, setCurrentModule] = useState(0);
  const [quizScore, setQuizScore] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesRes, myRes, statsRes] = await Promise.all([
        api.getTrainingCourses(),
        api.getMyCourses().catch(() => ({ courses: [] })),
        api.getTrainingStats().catch(() => ({ stats: {} }))
      ]);
      if (coursesRes.success) setCourses(coursesRes.courses);
      if (myRes.success) setMyCourses(myRes.courses);
      if (statsRes.success) setStats(statsRes.stats);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  const handleEnroll = async (courseId) => {
    setEnrolling(true);
    try {
      const res = await api.enrollCourse(courseId);
      if (res.success) { setMessage(res.message); await loadData(); setActiveTab('my-courses'); }
    } catch (e) { setMessage(e.message); }
    setEnrolling(false);
  };

  const handleProgress = async (courseId, moduleId) => {
    try {
      const res = await api.updateTrainingProgress(courseId, moduleId);
      if (res.success) { setCurrentModule(moduleId); setMessage(`Module ${moduleId} completed!`); await loadData(); }
    } catch (e) { setMessage(e.message); }
  };

  const handleQuiz = async (courseId) => {
    const score = parseInt(quizScore);
    if (isNaN(score) || score < 0 || score > 100) { setMessage('Enter a valid score (0-100)'); return; }
    try {
      const res = await api.submitQuiz(courseId, score);
      if (res.success) { setMessage(res.message); await loadData(); }
    } catch (e) { setMessage(e.message); }
    setQuizScore('');
  };

  const categories = ['All', ...new Set(courses.map(c => c.category))];
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? courses : courses.filter(c => c.category === filter);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="text-center bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
        <BookOpen className="w-10 h-10 mx-auto mb-2 text-emerald-200" />
        <h1 className="text-2xl font-bold">Worker Training Platform</h1>
        <p className="text-emerald-100 text-sm mt-1">Upskill yourself with certified cooperative training courses</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Enrolled', value: stats.totalEnrolled, color: 'blue' },
            { label: 'Completed', value: stats.completed, color: 'green' },
            { label: 'In Progress', value: stats.inProgress, color: 'amber' },
            { label: 'Certificates', value: stats.certificatesEarned, color: 'purple' },
            { label: 'Avg Score', value: `${stats.averageScore}%`, color: 'indigo' }
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm text-center">
              <div className={`text-lg font-bold text-${s.color}-600`}>{s.value}</div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {message && <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3 text-sm">{message}</div>}

      {/* Tabs */}
      <div className="flex gap-2">
        {[{id:'courses',label:'All Courses'},{id:'my-courses',label:'My Courses'}].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedCourse(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* All Courses */}
      {activeTab === 'courses' && !selectedCourse && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === cat ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(course => (
              <div key={course.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-2xl">{course.icon}</span>
                    <h3 className="font-bold text-slate-800 mt-1">{course.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{course.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{course.category}</span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{course.level}</span>
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> {course.rating}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.enrolled} enrolled</span>
                  <span>{course.modules} modules</span>
                </div>
                <p className="text-[10px] text-slate-400">Instructor: {course.instructor}</p>
                <button onClick={() => setSelectedCourse(course)} className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2">
                  View Course <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Detail */}
      {selectedCourse && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <button onClick={() => setSelectedCourse(null)} className="text-sm text-emerald-600 hover:underline">&larr; Back to courses</button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedCourse.icon}</span>
            <div>
              <h2 className="font-bold text-xl text-slate-800">{selectedCourse.title}</h2>
              <p className="text-sm text-slate-500">{selectedCourse.instructor} &middot; {selectedCourse.duration} &middot; {selectedCourse.level}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">{selectedCourse.description}</p>
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-800">Modules</h3>
            {Array.from({length: selectedCourse.modules}, (_, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${i < currentModule ? 'bg-green-50 border-green-200' : i === currentModule ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < currentModule ? 'bg-green-500 text-white' : i === currentModule ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {i < currentModule ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-sm text-slate-700">Module {i + 1}: {['Introduction','Core Concepts','Practical Application','Advanced Techniques','Safety Protocols','Hands-on Practice','Final Review','Certification Prep'][i % 8]}</span>
                {i === currentModule && (
                  <button onClick={() => handleProgress(selectedCourse.id, i + 1)} className="ml-auto bg-emerald-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1">
                    <Play className="w-3 h-3" /> Complete
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-sm text-slate-800">Final Quiz</h3>
            <div className="flex gap-2">
              <input type="number" value={quizScore} onChange={e => setQuizScore(e.target.value)} placeholder="Score (0-100)" min={0} max={100} className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <button onClick={() => handleQuiz(selectedCourse.id)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700">Submit Quiz</button>
            </div>
            <p className="text-[10px] text-slate-400">Score 60% or above to earn your certificate.</p>
          </div>
          <button onClick={() => handleEnroll(selectedCourse.id)} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50" disabled={enrolling}>
            {enrolling ? 'Enrolling...' : 'Enroll in This Course'}
          </button>
        </div>
      )}

      {/* My Courses */}
      {activeTab === 'my-courses' && (
        <div className="space-y-4">
          {myCourses.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No courses enrolled yet. Browse courses to start learning!</p>
              <button onClick={() => setActiveTab('courses')} className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700">Browse Courses</button>
            </div>
          ) : myCourses.map(course => (
            <div key={course.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{course.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-800">{course.title}</h3>
                    <p className="text-xs text-slate-500">{course.category} &middot; {course.duration}</p>
                  </div>
                </div>
                {course.progress?.status === 'COMPLETED' ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Award className="w-3 h-3" /> Completed</span>
                ) : (
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">In Progress</span>
                )}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all" style={{width: `${course.progress?.percentComplete || 0}%`}} />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{course.progress?.completedModules || 0}/{course.progress?.totalModules || 0} modules</span>
                <span>{course.progress?.percentComplete || 0}% complete</span>
              </div>
              {course.progress?.certificate && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-bold text-green-800">Certificate Earned</p>
                    <p className="text-[10px] text-green-600">ID: {course.progress.certificate.id} &middot; Issued: {new Date(course.progress.certificate.issuedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              <button onClick={() => { setSelectedCourse(course); setActiveTab('courses'); setCurrentModule(course.progress?.completedModules || 0); }} className="w-full border border-emerald-600 text-emerald-600 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-50">
                {course.progress?.status === 'COMPLETED' ? 'Review Course' : 'Continue Learning'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TrainingPage;
