export const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="block w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
  >
    {children}
  </select>
);
