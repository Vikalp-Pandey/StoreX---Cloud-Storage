import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Database,
  Cpu,
  Lock,
  Zap,
  ChevronRight,
  Layers,
  Terminal,
  Activity,
  Globe,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const specifications = [
  {
    icon: <Lock className="text-sky-400" size={20} />,
    title: 'Secure Custody',
    description:
      'End-to-end encryption for assets at rest and in transit using AES-256-GCM protocols.',
  },
  {
    icon: <Layers className="text-sky-400" size={20} />,
    title: 'Recursive Architecture',
    description:
      'Hierarchical file systems with infinite nesting capabilities and zero-latency indexing.',
  },
  {
    icon: <Zap className="text-sky-400" size={20} />,
    title: 'Edge Ingestion',
    description:
      'Direct-to-cloud streaming uploads optimized for high-bandwidth asset deployment.',
  },
  {
    icon: <Cpu className="text-sky-400" size={20} />,
    title: 'Atomic Operations',
    description:
      'Synchronized database transactions ensuring directory integrity during mass modifications.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-sky-500/30">
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/5 blur-[120px] rounded-full" />
      </div>

      <main className="max-w-[1400px] mx-auto px-10 py-20 relative z-10">
        {/* SECTION 1: HERO / IDENTITY */}
        <section className="max-w-3xl space-y-8 mb-32">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02]"
          >
            <ShieldCheck size={14} className="text-sky-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              System_Manifest_v3.0
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl font-light leading-[1.1] text-white tracking-tight"
          >
            The architecture of <br />
            <span className="text-slate-500 font-medium italic">
              digital sovereignty.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 font-light leading-relaxed max-w-xl"
          >
            STOREX is a high-performance asset management console. It provides
            industrial-grade file infrastructure for users who demand precision,
            speed, and absolute data custody.
          </motion.p>
        </section>

        {/* SECTION 2: CORE SPECIFICATIONS GRID */}
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-40">
          {specifications.map((spec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2rem] border border-white/5 bg-[#080808]/50 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
            >
              <div className="mb-6 p-3 w-fit rounded-2xl bg-white/5 border border-white/5 group-hover:border-sky-500/30 transition-colors">
                {spec.icon}
              </div>
              <h3 className="text-white font-semibold mb-3 tracking-tight">
                {spec.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed font-light">
                {spec.description}
              </p>
            </motion.div>
          ))}
        </section>

        {/* SECTION 3: TECHNICAL PROTOCOLS */}
        <section className="grid lg:grid-cols-2 gap-24 items-start mb-40">
          <div className="space-y-12">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-sky-500 mb-4">
                Protocol_Overview
              </h2>
              <h3 className="text-4xl font-light text-white leading-snug">
                Advanced data management <br />
                for modern workloads.
              </h3>
            </div>

            <div className="space-y-10">
              <div className="flex gap-6">
                <div className="shrink-0 h-8 w-8 rounded-xl border border-sky-500/30 flex items-center justify-center text-[10px] font-mono text-sky-400 bg-sky-500/5 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                  01
                </div>
                <div>
                  <p className="text-white font-medium mb-1 uppercase tracking-wider text-xs">
                    Node Isolation
                  </p>
                  <p className="text-sm text-slate-500 font-light leading-relaxed">
                    Each user account operates as an independent node station.
                    Your assets are encapsulated within a private registry,
                    accessible only via verified access keys.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="shrink-0 h-8 w-8 rounded-xl border border-sky-500/30 flex items-center justify-center text-[10px] font-mono text-sky-400 bg-sky-500/5">
                  02
                </div>
                <div>
                  <p className="text-white font-medium mb-1 uppercase tracking-wider text-xs">
                    Dynamic Indexing
                  </p>
                  <p className="text-sm text-slate-500 font-light leading-relaxed">
                    STOREX utilizes a recursive directory engine. This allows
                    for deep nesting of folders while maintaining instant
                    response times during navigation and retrieval.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="shrink-0 h-8 w-8 rounded-xl border border-sky-500/30 flex items-center justify-center text-[10px] font-mono text-sky-400 bg-sky-500/5">
                  03
                </div>
                <div>
                  <p className="text-white font-medium mb-1 uppercase tracking-wider text-xs">
                    Distributed Storage
                  </p>
                  <p className="text-sm text-slate-500 font-light leading-relaxed">
                    Integrated with high-availability cloud providers (AWS S3),
                    ensuring your data is redundant, replicated, and available
                    24/7 with 99.9% durability.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group lg:sticky lg:top-32">
            <div className="absolute inset-0 bg-sky-500/10 blur-[100px] rounded-full group-hover:bg-sky-500/20 transition-all duration-700" />
            <div className="relative border border-white/10 bg-[#080808] rounded-[2.5rem] p-10 overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <Database size={20} className="text-sky-500" />
                  <span className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase text-white">
                    System_Status
                  </span>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="space-y-5 font-mono text-[10px]">
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-600">CORE_ENGINE</span>
                  <span className="text-white uppercase tracking-widest">
                    MERN_STACK_V4
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-600">ENCRYPTION</span>
                  <span className="text-emerald-500">AES_256_ACTIVE</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-600">STORAGE_NODE</span>
                  <span className="text-white">AWS_REGION_S3</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-slate-600">QUERY_LATENCY</span>
                  <span className="text-sky-400">&lt; 45MS</span>
                </div>
              </div>

              <div className="mt-12 p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-6 font-bold">
                  Initialize your custody
                </p>
                <Link
                  to="/signup"
                  className="flex items-center justify-center gap-2 w-full h-11 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-sky-900/20"
                >
                  Request Access <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: FOOTER / META */}
        <footer className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6 text-[10px] tracking-[0.3em] text-slate-600 font-bold uppercase">
            <span className="flex items-center gap-2">
              <Activity size={12} className="text-emerald-500" /> System_Online
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-800" />
            <span className="flex items-center gap-2">
              <Globe size={12} /> Global_Edge
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-[10px] font-mono text-slate-500 uppercase">
              STOREX_INFRASTRUCTURE_TERMINAL
            </p>
            <p className="text-[9px] font-mono text-slate-700 uppercase">
              © 2026. All operations are logged.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
