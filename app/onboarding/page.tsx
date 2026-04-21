"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Camera, ChevronRight, AtSign, Check, Loader2, 
  ShieldCheck, Layout, Database, Cpu, User 
} from 'lucide-react';
import { createClient } from "../../lib/supabase/client"; 

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    avatarFile: null as File | null,
    avatarPreview: null as string | null,
    intent: "deployment"
  });

  // 1. Initial Status Check
// 1. Initial Status Check
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      console.log("--- ONBOARDING: Initial Check Start ---");
      
      // Get current user session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.warn("No user found in session, redirecting to login.");
        router.push("/auth/login");
        return;
      }

      console.log("Current User ID:", user.id);

      // Query the profiles table (Removed 'public.' prefix)
      const { data, error } = await supabase
        .from('profiles') // Just use the table name
        .select('isonboarded')
        .eq('id', user.id)
        .single();

      if (error) {
        // PGRST116 means the row doesn't exist yet, which is fine for a new user
        if (error.code === 'PGRST116') {
          console.log("Profile not found in DB. Showing Onboarding UI.");
          setIsLoading(false);
        } else {
          console.error("DB Fetch Error:", error.message);
          setIsLoading(false);
        }
        return;
      }

      console.log("DB Result for isonboarded:", data?.isonboarded);

      if (data?.isonboarded === true) {
        console.log("User is already onboarded. Redirecting to Dashboard...");
        router.push('/dashboard/overview');
        // We do NOT set isLoading to false here to avoid a UI flicker
      } else {
        console.log("User is not onboarded. Showing Onboarding UI.");
        setIsLoading(false); 
      }
      
      console.log("--- ONBOARDING: Initial Check End ---");
    };

    checkOnboardingStatus();
  }, [router, supabase]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Avatar selected:", file.name);
      setFormData({ 
        ...formData, 
        avatarFile: file, 
        avatarPreview: URL.createObjectURL(file) 
      });
    }
  };

  const nextStep = () => {
    console.log(`Moving from Step ${step} to ${step + 1}`);
    setStep(prev => prev + 1);
  };

  // 2. Data Submission
// 2. Final Submission Logic
const handleComplete = async () => {
  console.log("--- ONBOARDING: Final Submission Start ---");
  setIsSubmitting(true);
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No user found");

    // We use UPSERT instead of UPDATE
    // We must include the 'id' so Supabase knows which row to target/create
    const upsertPayload = {
      id: user.id, // CRITICAL: You must include the ID for upsert
      username: formData.username,
      isonboarded: true
    };

    console.log("Sending Upsert Payload to DB:", upsertPayload);

    const { error: upsertError } = await supabase
      .from('profiles') 
      .upsert(upsertPayload); // Changed from .update to .upsert

    if (upsertError) {
      throw upsertError;
    }

    console.log("DB Upsert Successful. Redirecting...");
    router.push('/dashboard/overview');

  } catch (error: any) {
    console.error("Submission Error:", error.message);
    alert("Critical Error: " + error.message);
  } finally {
    setIsSubmitting(false);
    console.log("--- ONBOARDING: Submission Attempt Finished ---");
  }
};
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader2 className="animate-spin text-black" size={40} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa] font-sans antialiased text-black">
      <aside className="hidden lg:flex w-80 bg-white border-r border-gray-200 p-12 flex-col justify-between">
        <div className="space-y-12">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-black rounded flex items-center justify-center">
              <span className="text-white font-black text-[10px] uppercase">HF</span>
            </div>
            <span className="font-bold tracking-tight text-sm">Platform AI</span>
          </div>
          <nav className="space-y-6">
            <StepIndicator number={1} title="Identity" active={step === 1} completed={step > 1} />
            <StepIndicator number={2} title="Work Context" active={step === 2} completed={step > 2} />
            <StepIndicator number={3} title="Finalize" active={step === 3} completed={step > 3} />
          </nav>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <ShieldCheck size={14} /> End-to-End Encrypted
        </div>
      </aside>

      <main className="flex-1 flex flex-col items-center justify-center px-6 lg:px-20">
        <div className="w-full max-w-xl">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-10">
                <h2 className="text-3xl font-black tracking-tighter uppercase">Initialize Profile</h2>
                <p className="text-gray-500 mt-2 text-sm">Every developer needs a unique handle on the network.</p>
              </header>
              <div className="space-y-8 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-6 pb-6 border-b border-gray-50">
                  <div className="relative group">
                    <div className="h-20 w-20 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden ring-4 ring-white">
                      {formData.avatarPreview ? (
                        <img src={formData.avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <User size={32} className="text-gray-300" />
                      )}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 h-8 w-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <Camera size={14} />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageChange} accept="image/*" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black">Workspace Avatar</h3>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG or SVG. Max 2MB.</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Unique Username</label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                      <input type="text" placeholder="superman" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().trim()})} className="w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2.5 text-sm font-bold focus:border-black focus:outline-none transition-all" />
                    </div>
                  </div>
                </div>
                <button onClick={nextStep} disabled={!formData.username} className="w-full bg-black text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-30 transition-all shadow-lg shadow-black/5">
                  Continue to Workspace <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
               <header className="mb-10">
                <h2 className="text-3xl font-black tracking-tighter uppercase">Primary Usage</h2>
                <p className="text-gray-500 mt-2 text-sm">Help us optimize your node clusters based on your workload.</p>
              </header>
              <div className="grid grid-cols-1 gap-3 mb-8">
                <OptionCard icon={<Cpu size={20}/>} title="Inference & Deployment" desc="I want to deploy and scale model endpoints." active={formData.intent === 'deployment'} onClick={() => setFormData({...formData, intent: 'deployment'})} />
                <OptionCard icon={<Database size={20}/>} title="Dataset Curation" desc="I focus on data cleaning and labeling." active={formData.intent === 'dataset'} onClick={() => setFormData({...formData, intent: 'dataset'})} />
              </div>
              <button onClick={nextStep} className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                Setup Technical Hub <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in zoom-in-95 duration-500 text-center space-y-10">
              <div className="relative mx-auto h-24 w-24">
                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                <div className="relative h-24 w-24 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                   {formData.avatarPreview ? <img src={formData.avatarPreview} className="h-full w-full object-cover rounded-full" /> : <User size={40} className="text-gray-200" />}
                   <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white">
                      <Check size={12} strokeWidth={4} />
                   </div>
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter uppercase italic text-black">Finalize Onboarding</h2>
                <p className="text-gray-500 text-sm">Click below to initialize your profile as <span className="text-black font-bold">@{formData.username}</span></p>
              </div>
              <button onClick={handleComplete} disabled={isSubmitting} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Go to Dashboard"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const StepIndicator = ({ number, title, active, completed }: any) => (
  <div className={`flex items-center gap-4 transition-all ${active ? 'opacity-100 translate-x-1' : 'opacity-40'}`}>
    <div className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold border ${completed ? 'bg-black border-black text-white' : 'border-gray-200'}`}>
      {completed ? <Check size={12} strokeWidth={3} /> : number}
    </div>
    <span className={`text-xs font-bold uppercase tracking-widest ${active ? 'text-black' : 'text-gray-400'}`}>
      {title}
    </span>
  </div>
);

const OptionCard = ({ icon, title, desc, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-all ${active ? 'border-black bg-white shadow-md' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
    <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${active ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'}`}>
      {icon}
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-bold text-black">{title}</h4>
      <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
    </div>
    {active && <Check size={16} className="text-black" strokeWidth={3} />}
  </button>
);