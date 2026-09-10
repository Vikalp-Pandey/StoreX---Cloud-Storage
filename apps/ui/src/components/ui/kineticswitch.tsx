import { motion } from 'framer-motion';

interface KineticSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const KineticSwitch = ({ checked, onChange }: KineticSwitchProps) => {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="relative w-14 h-7 bg-white/5 rounded-sm border border-white/10 cursor-pointer overflow-hidden group shadow-inner"
    >
      {/* Visual Track Glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${checked ? 'opacity-100' : 'opacity-0'} bg-sky-500/10`}
      />

      {/* The Kinetic "Key" */}
      <motion.div
        animate={{ x: checked ? 28 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className={`
          absolute top-0.5 left-0.5 w-[24px] h-[22px] rounded-[1px]
          flex items-center justify-center transition-colors duration-300
          ${
            checked
              ? 'bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]'
              : 'bg-zinc-700 shadow-lg'
          }
        `}
      >
        {/* Detail on the button (looks like a physical key) */}
        <div
          className={`w-0.5 h-3 rounded-full ${checked ? 'bg-sky-200' : 'bg-zinc-500'} opacity-50`}
        />
      </motion.div>
    </div>
  );
};
