"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// --- AUTH COMPONENTS ---
export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <button
      onClick={logout}
      className="px-5 py-2 border border-white/20 text-gray-300 font-mono text-xs uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300"
    >
      Terminate_Session
    </button>
  );
}

// --- 3D PARTICLE SYSTEM ---
const ParticleSwarm = ({ instantFormation }: { instantFormation: boolean }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 7000;

  const [positions, phases] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      phases[i] = Math.random() * Math.PI * 2;

      if (instantFormation) {
        const radius = 3 + Math.sin(0 * 0.5 + phases[i]) * 2;
        const theta = (i / count) * Math.PI * 2 * 50;
        const phi = Math.acos((i / count) * 2 - 1);
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
      } else {
        positions[i * 3] = (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
      }
    }
    return [positions, phases];
  }, [count, instantFormation]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const phase = phases[i];
      const radius = 3 + Math.sin(time * 0.5 + phase) * 2;
      const theta = (i / count) * Math.PI * 2 * 50;
      const phi = Math.acos((i / count) * 2 - 1);
      const targetX = radius * Math.sin(phi) * Math.cos(theta);
      const targetY = radius * Math.sin(phi) * Math.sin(theta);
      const targetZ = radius * Math.cos(phi);
      const speed = 0.02 + Math.sin(time + phase) * 0.01;
      positions[i3] += (targetX - positions[i3]) * speed;
      positions[i3 + 1] += (targetY - positions[i3 + 1]) * speed;
      positions[i3 + 2] += (targetZ - positions[i3 + 2]) * speed;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y = time * 0.05;
    pointsRef.current.rotation.x = time * 0.02;
  });

  return (
    <Points
      ref={pointsRef}
      positions={positions}
      stride={3}
      frustumCulled={false}
    >
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.025}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

// --- IMMERSIVE VISUAL COMPONENTS ---
const NodeGridVisual = () => (
  <div className="w-full h-full grid grid-cols-10 grid-rows-10 gap-1 p-4 opacity-70 mix-blend-screen">
    {Array.from({ length: 100 }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.1, Math.random() > 0.8 ? 1 : 0.2, 0.1] }}
        transition={{
          duration: Math.random() * 3 + 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="bg-white"
      />
    ))}
  </div>
);

const DataFlowVisual = () => (
  <svg
    className="w-full h-full opacity-60"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
  >
    <motion.path
      d="M 10 90 C 40 90, 60 10, 90 10"
      fill="transparent"
      stroke="#ffffff"
      strokeWidth="0.5"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: [0, 1, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    />
    <motion.path
      d="M 10 10 C 40 10, 60 90, 90 90"
      fill="transparent"
      stroke="#ffffff"
      strokeWidth="0.5"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: [0, 1, 0] }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "linear",
        delay: 0.5,
      }}
    />
    <circle cx="50" cy="50" r="3" fill="#fff" className="animate-pulse" />
  </svg>
);

const ZKRingsVisual = () => (
  <div className="relative w-full h-full flex items-center justify-center opacity-80">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute w-48 h-48 border-[1px] border-dashed border-white/50 rounded-full"
    />
    <motion.div
      animate={{ rotate: -360 }}
      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      className="absolute w-32 h-32 border-[2px] border-dotted border-white/70 rounded-full"
    />
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      className="absolute w-16 h-16 border-[1px] border-white rounded-full"
    />
    <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_15px_#fff]" />
  </div>
);

// --- SCROLL SECTION ---
const ScrollSection = ({
  title,
  subtitle,
  content,
  reverse = false,
  visual,
}: {
  title: string;
  subtitle: string;
  content: string;
  reverse?: boolean;
  visual: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8 }}
    className={`flex flex-col ${reverse ? "md:flex-row-reverse" : "md:flex-row"} gap-12 lg:gap-24 items-center py-32 border-b border-white/5`}
  >
    <div className="flex-1 space-y-8 z-10">
      <div className="space-y-2">
        <h3 className="text-xs tracking-[0.4em] text-white/40 uppercase">
          {subtitle}
        </h3>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
          {title}
        </h2>
      </div>
      <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-lg font-mono">
        {content}
      </p>
      <Link
        href="/dashboard/overview"
        className="inline-block px-8 py-3 border border-white/20 hover:border-white hover:bg-white hover:text-black transition-all duration-300 text-xs tracking-[0.2em] uppercase mt-4 text-center"
      >
        Initialize Protocol
      </Link>
    </div>
    <div className="flex-1 w-full aspect-square md:aspect-auto md:h-[400px] bg-black border border-white/10 relative overflow-hidden group flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
      <div className="absolute inset-4 border border-white/5 flex items-center justify-center overflow-hidden">
        {visual}
      </div>
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/50" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50" />
    </div>
  </motion.div>
);

// --- MAIN PAGE ---
export default function Home() {
  const [stage, setStage] = useState(-1);
  const [introComplete, setIntroComplete] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [canvasKey, setCanvasKey] = useState<string | null>(null);

  // ✅ PATCH: Stable reference for R3F event binding to prevent unmount crashes
  const containerRef = useRef<HTMLDivElement>(null);

  // --- CANVAS KEY: Set once on client mount ---
  useEffect(() => {
    setCanvasKey(`hero-canvas-${performance.now()}`);
  }, []);

  // --- AUTHENTICATION LISTENER ---
  useEffect(() => {
    const supabase = createClient();
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- INTRO SEQUENCE ---
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("dotpt_intro_seen");
    if (hasSeenIntro === "true") {
      setStage(2);
      setIntroComplete(true);
      document.body.style.overflow = "";
    } else {
      setStage(0);
      document.body.style.overflow = "hidden";
      const timers = [
        setTimeout(() => setStage(1), 1000),
        setTimeout(() => setStage(2), 3500),
        setTimeout(() => {
          setIntroComplete(true);
          sessionStorage.setItem("dotpt_intro_seen", "true");
          document.body.style.overflow = "";
        }, 5000),
      ];
      return () => {
        timers.forEach(clearTimeout);
        document.body.style.overflow = "";
      };
    }
  }, []);

  if (stage === -1) {
    return <div className="w-screen h-[100dvh] bg-black" />;
  }

  return (
    <main className="w-full bg-black text-white selection:bg-white selection:text-black font-mono">
      {/* --- NAVBAR --- */}
      <AnimatePresence>
        {introComplete && (
          <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full flex justify-center border-b border-white/10 bg-black/80 backdrop-blur-md fixed top-0 z-50 h-16"
          >
            <div className="w-full max-w-7xl flex justify-between items-center p-3 px-6 text-sm">
              <div className="flex gap-8 items-center">
                <Link
                  href={"/"}
                  className="flex items-center gap-3 text-white font-black tracking-widest text-lg"
                >
                  <div className="w-3 h-3 bg-white animate-pulse" />
                  <span>DOTPT</span>
                </Link>
                <div className="hidden md:flex items-center gap-8 text-gray-500 font-medium tracking-widest text-xs uppercase">
                  <Link
                    href="/dashboard/models"
                    className="hover:text-white transition-colors"
                  >
                    Models
                  </Link>
                  <Link
                    href="/compute"
                    className="hover:text-white transition-colors"
                  >
                    Compute
                  </Link>
                  <Link
                    href="/nodes"
                    className="hover:text-white transition-colors"
                  >
                    Nodes
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {user ? (
                  <>
                    <LogoutButton />
                    <Link
                      href="/dashboard/overview"
                      className="px-5 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]"
                    >
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="px-5 py-2 text-gray-400 hover:text-white text-xs uppercase tracking-wider transition-colors"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/auth/sign-up"
                      className="px-5 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]"
                    >
                      Access_Terminal
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION --- */}
      <section className="w-full h-[100dvh] relative flex flex-col items-center justify-center bg-black">
        {/* ✅ PATCH: Attached ref for R3F event mapping */}
        <div className="absolute inset-0 z-0" ref={containerRef}>
          {canvasKey && (
            <Canvas
              key={canvasKey}
              eventSource={containerRef as React.RefObject<HTMLElement>}
              camera={{ position: [0, 0, 8], fov: 60 }}
            >
              <fog attach="fog" args={["#000000", 5, 15]} />
              <ParticleSwarm instantFormation={introComplete} />
            </Canvas>
          )}
        </div>

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none p-8">
          {stage === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-10 left-10 text-xs tracking-widest text-gray-500"
            >
              <motion.p
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5 }}
                className="overflow-hidden whitespace-nowrap"
              >
                &gt; SYSTEM_INIT... OK
              </motion.p>
              <motion.p
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="overflow-hidden whitespace-nowrap"
              >
                &gt; IPFS_FRAGMENTS_LOCATED...
              </motion.p>
              <motion.p
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1, duration: 0.5 }}
                className="overflow-hidden whitespace-nowrap text-white"
              >
                &gt; CONSENSUS REACHED.
              </motion.p>
            </motion.div>
          )}

          {stage >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="text-center mix-blend-difference flex flex-col items-center"
            >
              <h1 className="text-6xl md:text-[8rem] font-black uppercase tracking-tighter mb-6 leading-[0.85]">
                Sovereign <br /> Intelligence
              </h1>
              <p className="text-xs md:text-sm tracking-[0.5em] uppercase text-gray-400">
                Decentralized Models. Trustless Compute.
              </p>
              {introComplete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                  className="mt-20 pointer-events-auto"
                >
                  <div className="w-[1px] h-16 bg-gradient-to-b from-white to-transparent mx-auto animate-pulse" />
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* --- CONTENT SECTIONS --- */}
      {introComplete && (
        <section className="w-full max-w-7xl mx-auto px-6 relative z-20 pb-24 bg-black">
          <ScrollSection
            subtitle="01. The Architecture"
            title="Decentralized Storage"
            content="Break free from centralized silos. Models are cryptographically fragmented and distributed across the IPFS network. Compute execution is handled by a permissionless network of incentivized nodes, guaranteeing zero downtime and absolute censorship resistance."
            visual={<NodeGridVisual />}
          />
          <ScrollSection
            reverse
            subtitle="02. The Economy"
            title="Immutable Monetization"
            content="Your parameters, your sovereignty. Implement micro-transaction API access or fixed subscription tiers secured entirely by Layer-2 Solidity smart contracts. Revenue flows deterministically—eliminating intermediaries, platform cuts, and hidden fees."
            visual={<DataFlowVisual />}
          />
          <ScrollSection
            subtitle="03. The Verification"
            title="Zero-Knowledge Logic"
            content="Trust mathematics, not infrastructure providers. The network utilizes advanced Zero-Knowledge Proofs (zk-SNARKs) to mathematically guarantee model correctness and inference accuracy without ever exposing proprietary weights to the compute nodes."
            visual={<ZKRingsVisual />}
          />
        </section>
      )}

      {/* --- FOOTER --- */}
      {introComplete && (
        <footer className="w-full border-t border-white/10 bg-black py-16 text-center text-gray-600 text-xs uppercase tracking-[0.2em] relative z-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-6 gap-8">
            <div className="flex gap-4 items-center text-white/40">
              <div className="w-2 h-2 bg-white rounded-none" />
              <p>DOTPT Network © 2026. BORDERLAND V3.0</p>
            </div>
            <div className="flex gap-8">
              <Link href="#" className="hover:text-white transition-colors">
                Whitepaper
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Smart Contracts
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                GitHub
              </Link>
            </div>
          </div>
        </footer>
      )}
    </main>
  );
}
