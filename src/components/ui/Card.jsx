export const Card = ({ children, className = "" }) => (
  <div className={`bg-white p-8 rounded-xl shadow-lg ${className}`}>
    {children}
  </div>
);
