import React, { useEffect, useState } from 'react';
import { defenseApi } from '../services/api/defenseApi';
import { RemediationPlan, RemediationTask } from '../types/defense';
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export const RemediationWorkspacePage: React.FC = () => {
  const [plans, setPlans] = useState<RemediationPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<RemediationPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form states for create plan
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPlanPriority, setNewPlanPriority] = useState('HIGH');
  const [newPlanOwner, setNewPlanOwner] = useState('SecOps Engineering');

  // Form states for add task
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('CODE');
  const [newTaskOwner, setNewTaskOwner] = useState('AppDev Team');

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await defenseApi.listRemediationPlans();
      setPlans(data);
      if (data.length > 0 && !selectedPlan) {
        setSelectedPlan(data[0]);
      }
    } catch (err) {
      console.error('Failed to load remediation plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;

    try {
      const created = await defenseApi.createRemediationPlan({
        title: newPlanTitle,
        description: newPlanDesc,
        priority: newPlanPriority,
        owner: newPlanOwner,
      });
      setPlans([created, ...plans]);
      setSelectedPlan(created);
      setShowCreateModal(false);
      setNewPlanTitle('');
      setNewPlanDesc('');
    } catch (err) {
      console.error('Failed to create remediation plan:', err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !newTaskTitle.trim()) return;

    try {
      const task = await defenseApi.addRemediationTask(selectedPlan.id, {
        title: newTaskTitle,
        taskType: newTaskType,
        owner: newTaskOwner,
        sequence: (selectedPlan.tasks?.length || 0) + 1,
      });

      const updatedPlan = {
        ...selectedPlan,
        tasks: [...(selectedPlan.tasks || []), task],
      };
      setSelectedPlan(updatedPlan);
      setPlans(plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));
      setNewTaskTitle('');
    } catch (err) {
      console.error('Failed to add remediation task:', err);
    }
  };

  const handleTaskStatusToggle = async (task: RemediationTask) => {
    if (!selectedPlan) return;
    const nextStatus = task.status === 'COMPLETED' ? 'OPEN' : 'COMPLETED';

    try {
      const updatedTask = await defenseApi.updateTaskStatus(task.id, nextStatus);
      const updatedTasks = selectedPlan.tasks?.map((t) => (t.id === task.id ? updatedTask : t));
      const updatedPlan = { ...selectedPlan, tasks: updatedTasks };
      setSelectedPlan(updatedPlan);
      setPlans(plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)));
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-7 h-7 text-purple-400" />
            Remediation Workspace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage remediation plans, sequence implementation tasks, and track human engineering progress.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-purple-600/20 transition"
          >
            <PlusIcon className="w-4 h-4" />
            New Remediation Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Plans List Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Remediation Plans ({plans.length})</h3>

          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm">
              Loading plans...
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-sm">
              No active remediation plans. Create a plan to begin task tracking.
            </div>
          ) : (
            plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`bg-slate-900 border p-4 rounded-xl cursor-pointer transition ${
                  selectedPlan?.id === plan.id
                    ? 'border-purple-500 shadow-lg shadow-purple-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{plan.title}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {plan.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{plan.description}</p>

                <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-slate-500" /> {plan.owner}
                  </span>
                  <span className="font-semibold text-purple-400">{plan.status}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Plan Details & Tasks Sequence */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          {selectedPlan ? (
            <>
              <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {selectedPlan.priority} PRIORITY
                  </span>
                  <h2 className="text-xl font-bold text-slate-100 mt-2">{selectedPlan.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">{selectedPlan.description}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div>Owner: <strong className="text-slate-200">{selectedPlan.owner}</strong></div>
                  <div className="mt-1">Status: <span className="text-purple-400 font-semibold">{selectedPlan.status}</span></div>
                </div>
              </div>

              {/* Tasks Sequence Header & List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Sequential Implementation Tasks ({selectedPlan.tasks?.length || 0})
                  </h3>
                </div>

                <div className="space-y-2">
                  {selectedPlan.tasks && selectedPlan.tasks.length > 0 ? (
                    selectedPlan.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-lg border flex items-center justify-between transition ${
                          task.status === 'COMPLETED'
                            ? 'bg-slate-950/60 border-slate-800/80 opacity-75'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleTaskStatusToggle(task)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition ${
                              task.status === 'COMPLETED'
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                : 'border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {task.status === 'COMPLETED' && <CheckCircleIcon className="w-4 h-4 font-bold" />}
                          </button>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-500 mr-2">STEP #{task.sequence}</span>
                            <span className={`text-xs font-semibold ${task.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                              {task.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                                {task.taskType}
                              </span>
                              <span className="text-[10px] text-slate-400">{task.owner}</span>
                            </div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                          task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic py-4">No tasks in sequence.</div>
                  )}
                </div>

                {/* Add Task Form */}
                <form onSubmit={handleAddTask} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 mt-4">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Add Task to Sequence</div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <input
                      type="text"
                      placeholder="Task title..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="sm:col-span-6 bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                    />
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value)}
                      className="sm:col-span-3 bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                    >
                      <option value="CODE">CODE</option>
                      <option value="CONFIGURATION">CONFIGURATION</option>
                      <option value="INFRASTRUCTURE">INFRASTRUCTURE</option>
                      <option value="PATCH">PATCH</option>
                      <option value="TESTING">TESTING</option>
                    </select>
                    <button
                      type="submit"
                      className="sm:col-span-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg py-2 transition"
                    >
                      Add Task
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-400 text-sm py-12">
              Select a remediation plan to view implementation tasks.
            </div>
          )}
        </div>
      </div>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Create Remediation Plan</h3>
            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Plan Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., SQL Injection Remediation on /api/login"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Details regarding technical fix scope..."
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    value={newPlanPriority}
                    onChange={(e) => setNewPlanPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Owner</label>
                  <input
                    type="text"
                    value={newPlanOwner}
                    onChange={(e) => setNewPlanOwner(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
