import React, { createContext, useContext, useState, ReactNode } from 'react';

type Persona = 'RETAIL' | 'BUSINESS';

interface PersonaContextProps {
  userPersona: Persona;
  setPersona: (persona: Persona) => void;
}

const PersonaContext = createContext<PersonaContextProps | undefined>(undefined);

export const PersonaProvider = ({ children }: { children: ReactNode }) => {
  const [userPersona, setPersona] = useState<Persona>('RETAIL'); // Defaults to Retail

  return (
    <PersonaContext.Provider value={{ userPersona, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
};
