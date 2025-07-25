import { useState, useRef } from "react";
import { useOnClickOutside } from "../hooks/useOnClickOutside";
import { AlertBanner } from "./AlertBanner";

// A simple Bell Icon component
const BellIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-gray-600 group-hover:text-gray-800"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

export const AlertsPopover = ({ alerts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef();

  // Close popover when clicking outside
  useOnClickOutside(popoverRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={popoverRef}>
      {/* Alert Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative rounded-full p-2 hover:bg-gray-200 transition-colors"
      >
        <BellIcon />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {alerts.length}
          </span>
        )}
      </button>

      {/* Popover Div */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20">
          <div className="p-4 font-bold border-b">Notifications</div>
          <div className="py-1 max-h-96 overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert._id} className="px-4 py-2">
                  <AlertBanner alert={alert} />
                </div>
              ))
            ) : (
              <p className="px-4 py-4 text-sm text-gray-500">No new alerts.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};