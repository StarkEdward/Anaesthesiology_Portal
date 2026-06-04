import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FormData {
  facultyNameFirst: string;
  facultyNameMiddle: string;
  facultyNameLast: string;
  collegeName: string;
  designation: string;
  department: string;
}

interface FormContextType {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  updateField: (field: keyof FormData, value: string) => void;
}

const defaultFormData: FormData = {
  facultyNameFirst: '',
  facultyNameMiddle: '',
  facultyNameLast: '',
  collegeName: '',
  designation: '',
  department: '',
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <FormContext.Provider value={{ formData, setFormData, updateField }}>
      {children}
    </FormContext.Provider>
  );
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
};
