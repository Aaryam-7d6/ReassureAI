import React from "react";

export const CrisisCard = () => {
  return (
    <div className="w-full bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-6 my-4 shadow-md">
      {/* Empathetic Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-red-700 mb-2">
          💙 You're Not Alone
        </h3>
        <p className="text-gray-700 text-sm leading-relaxed">
          I'm really concerned about what you're sharing. Your wellbeing matters
          deeply, and help is available right now. Please reach out to someone
          you trust or contact one of the resources below.
        </p>
      </div>

      {/* Crisis Hotlines */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-red-200">
        <h4 className="font-semibold text-gray-800 mb-3 text-sm">
          📞 Immediate Support (Call or SMS)
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 text-sm">
              <strong>MANAS Helpline:</strong>
            </span>
            <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono text-red-700">
              14416
            </code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 text-sm">
              <strong>MANAS Toll-Free:</strong>
            </span>
            <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono text-red-700">
              1-800-891-4416
            </code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 text-sm">
              <strong>iCall:</strong>
            </span>
            <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono text-red-700">
              9152987821
            </code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 text-sm">
              <strong>Vandrevala Foundation:</strong>
            </span>
            <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono text-red-700">
              1860-2662-345
            </code>
          </div>
        </div>
      </div>

      {/* Affirmation */}
      <div className="bg-gradient-to-r from-red-100 to-rose-100 rounded-lg p-4 border border-red-200">
        <p className="text-center font-semibold text-red-700 text-base">
          ❤️ Your life matters. You matter. 💙
        </p>
      </div>

      {/* Info Note */}
      <p className="text-xs text-gray-600 mt-4 italic">
        This card will remain visible during this conversation. Start a new chat
        when you're ready.
      </p>
    </div>
  );
};
