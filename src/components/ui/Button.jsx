export const Button = ({ children, variant = "primary", ...props }) => {
  const baseClasses =
    "w-full font-medium py-2.5 px-4 rounded-lg text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-emerald-500 text-white hover:bg-emerald-600",
  };

  return (
    <button {...props} className={`${baseClasses} ${variants[variant]}`}>
      {children}
    </button>
  );
};
