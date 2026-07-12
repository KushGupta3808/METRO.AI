export default function GlowButton({ children, className = '', ...props }) {
  return (
    <button
      className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sapphireNeon to-emeraldNeon text-void font-display font-semibold py-2.5 px-5 shadow-glow-sapphire hover:brightness-110 transition disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
