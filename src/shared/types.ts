export interface ResumeProfile {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
}

export interface ExperienceEntry {
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  description: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  graduationYear: number;
}

export interface DetectedField {
  label: string;
  placeholder: string | null;
  type: string;
  selector: string;
  required: boolean;
}


export interface FormField {
  selector: string;
  name: string;
  type: "text" | "textarea" | "select" | "checkbox" | "radio" | "file" | "email" | "tel" | "url" | "number" | "date";
}

export interface AutofillRequest {
  action: "fill" | "detect";
  fields?: FormField[];
}

export interface AutofillResponse {
  success: boolean;
  fieldsFilled?: number;
  error?: string;
}
