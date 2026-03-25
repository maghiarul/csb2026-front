import React, { createContext, useState, useContext } from 'react';

// Definim ce date salvăm
interface LocationContextType {
  coords: { lat: number; lng: number } | null;
  setCoords: (coords: { lat: number; lng: number } | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  return (
    <LocationContext.Provider value={{ coords, setCoords }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error("useLocation trebuie folosit în interiorul unui LocationProvider");
  return context;
};