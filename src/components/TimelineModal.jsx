import { LocationDisplay } from "./LocationDisplay";

export const TimelineModal = ({ history, onClose }) => {
  if (!history) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">
            Package History: {history[0]?.package_id}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 text-2xl hover:text-gray-600"
          >
            &times;
          </button>
        </div>
        <div className="border-l-2 border-gray-200 pl-6">
          {history.map((event, index) => (
            <div key={event._id} className="relative mb-6">
              <div
                className={`absolute -left-[35px] top-1 h-3 w-3 rounded-full ${
                  index === 0 ? "bg-blue-500" : "bg-gray-400"
                }`}
              ></div>
              <p className="font-semibold text-gray-800">{event.status}</p>
              <p className="text-sm text-gray-500">
                {new Date(event.event_timestamp).toLocaleString()}
              </p>
              {event.lat && event.lon && (
                <div className="text-sm text-gray-600 mt-1">
                  <LocationDisplay lat={event.lat} lon={event.lon} />
                </div>
              )}
              {event.note && (
                <p className="text-sm text-gray-600 mt-1">Note: {event.note}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
