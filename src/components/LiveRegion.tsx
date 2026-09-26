import React, { createContext, useContext, useState, useCallback } from 'react';

interface LiveRegionContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const LiveRegionContext = createContext<LiveRegionContextType>({
  announce: () => {},
});

export const useLiveAnnouncement = () => useContext(LiveRegionContext);

export const LiveRegionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [politeMessage, setPoliteMessage] = useState<string>('');
  const [assertiveMessage, setAssertiveMessage] = useState<string>('');

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveMessage(message);
      setTimeout(() => setAssertiveMessage(''), 3000);
    } else {
      setPoliteMessage(message);
      setTimeout(() => setPoliteMessage(''), 3000);
    }
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      {/* Screen Reader Live Regions */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="a11y-live-polite"
      >
        {politeMessage}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        id="a11y-live-assertive"
      >
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  );
};
