export const AlertBanner = ({ alert }) => (
  <div
    className="border-l-4 border-red-500 bg-red-100 p-4 mb-4 rounded-r-lg"
    role="alert"
  >
    <p className="font-bold text-red-800">Stuck Package Alert!</p>
    <p className="text-red-800">{alert.message}</p>
  </div>
);
