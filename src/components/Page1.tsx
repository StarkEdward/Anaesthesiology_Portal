import React, { useState } from "react";
import { DateInput } from "./DateInput";
import { useFormContext } from "../context/FormContext";

export default function Page1() {
  const { formData, updateField } = useFormContext();
  const [photo, setPhoto] = useState<string | null>(null);
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");

  const calcAge = (dateStr: string) => {
    if (!dateStr) return "";
    let birthDate: Date | null = null;
    const parts = dateStr.split(/[-\/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        birthDate = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
        );
      } else if (parts[2].length === 4) {
        birthDate = new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0]),
        );
      }
    } else {
      birthDate = new Date(dateStr);
    }

    if (!birthDate || isNaN(birthDate.getTime())) return "";

    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    if (calculatedAge < 0 || calculatedAge > 150) return "";
    return calculatedAge.toString();
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);
    if (val.length === 10) {
      const calculatedAge = calcAge(val);
      if (calculatedAge) {
        setAge(calculatedAge);
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="text-[12px] leading-[1.6] flex flex-col font-serif relative grow">
      <div className="flex flex-row items-end pb-4 pt-4 mb-2">
        <label className="text-[12px] whitespace-nowrap" htmlFor="collegeName">
          Name of the College:
        </label>
        <input
          type="text"
          id="collegeName"
          value={formData.collegeName}
          onChange={(e) => updateField("collegeName", e.target.value)}
          className="flex-grow border-b border-black ml-2 h-6 bg-transparent focus:outline-none focus:bg-gray-100"
        />
      </div>

      <div className="flex items-stretch border border-black max-w-full mb-4">
        <div className="py-1 px-3 border-r border-black w-40 shrink-0 flex items-center">
          <label className="text-[12px]" htmlFor="submissionDate">
            Submission date
          </label>
        </div>
        <div className="py-1 px-3 border-r border-black w-56 shrink-0 flex items-center justify-center text-[12px]">
          <DateInput
            id="submissionDate"
            className="w-[150px] bg-transparent text-center tracking-[0.1em] focus:outline-none focus:bg-gray-100"
          />
        </div>
        <div className="py-1 px-3 flex-grow"></div>
      </div>

      <div className="text-[12px] leading-snug mb-6">
        <span className="font-bold">Note:</span> It is the responsibility of the
        Dean to ensure that the submitted Declaration form is ONLY of a Faculty
        member who is working as a full-time employee of the college
      </div>

      <div className="flex relative min-h-[144px] mb-4">
        <div className="flex-grow pr-[140px]">
          <div className="grid grid-cols-[auto_1fr] gap-4 items-start mb-4">
            <span className="w-6">1.</span>
            <div className="flex flex-col">
              <div className="flex items-end flex-wrap gap-y-2">
                <span className="whitespace-nowrap mr-2">Name of Faculty:</span>
                <span className="flex-grow flex justify-between space-x-2 pb-0 max-w-[400px]">
                  <div className="flex flex-col items-center w-1/3">
                    <input
                      type="text"
                      id="faculty-last-name"
                      value={formData.facultyNameLast}
                      onChange={(e) =>
                        updateField("facultyNameLast", e.target.value)
                      }
                      className="w-full border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100"
                    />
                    <span className="text-[12px]">(Last name)</span>
                  </div>
                  <div className="flex flex-col items-center w-1/3">
                    <input
                      type="text"
                      id="faculty-first-name"
                      value={formData.facultyNameFirst}
                      onChange={(e) =>
                        updateField("facultyNameFirst", e.target.value)
                      }
                      className="w-full border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100"
                    />
                    <span className="text-[12px]">(First name)</span>
                  </div>
                  <div className="flex flex-col items-center w-1/3">
                    <input
                      type="text"
                      value={formData.facultyNameMiddle}
                      onChange={(e) =>
                        updateField("facultyNameMiddle", e.target.value)
                      }
                      className="w-full border-b border-black text-center bg-transparent focus:outline-none focus:bg-gray-100"
                    />
                    <span className="text-[12px]">(Middle name)</span>
                  </div>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-4 items-start mb-6">
            <span className="w-6">2.</span>
            <div className="flex items-end">
              <span className="whitespace-nowrap mr-2">
                Age & Date of birth:
              </span>
              <input
                type="text"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="border-b border-black w-24 px-2 text-center bg-transparent focus:outline-none focus:bg-gray-100"
              />
              <span className="mx-1">(Years),</span>
              <DateInput
                value={dob}
                onChange={handleDobChange}
                className="border-b border-black w-32 px-2 text-center bg-transparent tracking-[0.1em] focus:outline-none focus:bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-4 items-start mb-4">
            <span className="w-6">3.</span>
            <div className="flex items-end">
              <span className="whitespace-nowrap mr-2">
                Present Designation:
              </span>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => updateField("designation", e.target.value)}
                className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 border border-black h-36 w-[120px] p-2 text-[10px] leading-tight text-center flex items-center justify-center cursor-pointer overflow-hidden bg-gray-50 hover:bg-gray-100 group">
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer z-20 print:hidden"
            onChange={handlePhotoUpload}
          />
          <div
            className="absolute inset-0 z-10 bg-no-repeat bg-cover bg-center"
            style={{ backgroundImage: photo ? `url(${photo})` : "none" }}
          >
            {!photo && (
              <span className="absolute inset-0 flex items-center justify-center p-2 text-gray-500">
                Attach a recent passport size color photograph with signature
                and seal of the Principal / Dean across it
              </span>
            )}
            <span
              className="hidden group-hover:flex absolute inset-0 text-white items-center justify-center print:hidden z-30 font-sans text-sm"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              {photo ? "Change Photo" : "Upload Photo"}
            </span>
          </div>
        </div>
      </div>

      <div className="pl-10 space-y-4">
        <div className="flex items-end">
          <span className="w-6 shrink-0">a.</span>
          <span className="whitespace-nowrap mr-2">Appointment order:</span>
          <span>Certified copy of order at this institute attached:</span>
          <div className="ml-auto w-32 text-center flex justify-center space-x-2">
            <label className="cursor-pointer flex items-center">
              <input type="radio" name="appt_order" className="mr-1" />
              Yes
            </label>
            <label className="cursor-pointer flex items-center">
              <input type="radio" name="appt_order" className="mr-1" />
              No
            </label>
          </div>
        </div>

        <div className="flex items-end">
          <span className="w-6 shrink-0">b.</span>
          <span className="whitespace-nowrap mr-2">Department:</span>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => updateField("department", e.target.value)}
            className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100"
          />
        </div>

        <div className="flex items-end">
          <span className="w-6 shrink-0">c.</span>
          <span className="whitespace-nowrap mr-2">College/Institute:</span>
          <input
            type="text"
            className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100"
          />
        </div>

        <div className="flex items-end">
          <span className="w-6 shrink-0">d.</span>
          <span className="whitespace-nowrap mr-2">City / District:</span>
          <input
            type="text"
            className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100"
          />
        </div>

        <div className="flex items-start">
          <span className="w-6 shrink-0">e.</span>
          <span className="whitespace-nowrap mr-2 w-[120px]">Appointment:</span>
          <div className="flex flex-col space-y-3 pt-0">
            <div className="flex space-x-4">
              <span>(i)</span>
              <label className="cursor-pointer flex items-center">
                <input type="radio" name="appt_type_1" className="mr-1" />
                Regular
              </label>
              <label className="cursor-pointer flex items-center">
                <input type="radio" name="appt_type_1" className="mr-1" />
                Contractual
              </label>
              <label className="cursor-pointer flex items-center">
                <input type="radio" name="appt_type_1" className="mr-1" />
                Ad-hoc basis
              </label>
            </div>
            <div className="flex space-x-4">
              <span>(ii)</span>
              <label className="cursor-pointer flex items-center">
                <input type="radio" name="appt_type_2" className="mr-1" />
                Full time
              </label>
              <label className="cursor-pointer flex items-center">
                <input type="radio" name="appt_type_2" className="mr-1" />
                Part time
              </label>
            </div>
            <div className="flex space-x-4">
              <span>(iii)</span>
              <label className="cursor-pointer flex items-center">
                <input type="radio" name="appt_type_3" className="mr-1" />
                With Private practice
              </label>
              <label className="cursor-pointer flex items-center">
                <input type="radio" name="appt_type_3" className="mr-1" />
                Without Private practice
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-start">
          <span className="w-6 shrink-0">f.</span>
          <div className="flex flex-col w-full space-y-3 pt-0">
            <div>Date of appearance in last MCI/NMC assessment:</div>
            <div className="pl-8 space-y-3">
              <div className="flex items-end">
                <span className="w-[180px] shrink-0">
                  i. UG / PG / Any other:
                </span>
                <input
                  type="text"
                  className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100"
                />
              </div>
              <div className="flex items-end">
                <span className="w-[180px] shrink-0">ii. Name of College:</span>
                <input
                  type="text"
                  className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100"
                />
              </div>
              <div className="flex items-center">
                <span className="shrink-0 mr-4">
                  iii. Whether appeared and accepted at the same College:
                </span>
                <div className="ml-auto w-32 text-center flex justify-center space-x-2">
                  <label className="cursor-pointer flex items-center">
                    <input
                      type="radio"
                      name="app_accept_col"
                      className="mr-1"
                    />
                    Yes
                  </label>
                  <label className="cursor-pointer flex items-center">
                    <input
                      type="radio"
                      name="app_accept_col"
                      className="mr-1"
                    />
                    No
                  </label>
                </div>
              </div>
              <div className="flex items-center">
                <span className="shrink-0 mr-4">
                  iv. Whether appeared and accepted for the same designation:
                </span>
                <div className="ml-auto w-32 text-center flex justify-center space-x-2">
                  <label className="cursor-pointer flex items-center">
                    <input
                      type="radio"
                      name="app_accept_des"
                      className="mr-1"
                    />
                    Yes
                  </label>
                  <label className="cursor-pointer flex items-center">
                    <input
                      type="radio"
                      name="app_accept_des"
                      className="mr-1"
                    />
                    No
                  </label>
                </div>
              </div>
              <div className="flex items-center">
                <span className="shrink-0 mr-4">
                  v. Whether retired from Government Medical College:
                </span>
                <div className="ml-auto w-32 text-center flex justify-center space-x-2">
                  <label className="cursor-pointer flex items-center">
                    <input type="radio" name="ret_gov" className="mr-1" />
                    Yes
                  </label>
                  <label className="cursor-pointer flex items-center">
                    <input type="radio" name="ret_gov" className="mr-1" />
                    No
                  </label>
                </div>
              </div>
              <div className="flex items-end">
                <span className="shrink-0 mr-2">
                  vi. If yes, designation at the time of retirement:
                </span>
                <input
                  type="text"
                  className="flex-grow border-b border-black bg-transparent focus:outline-none focus:bg-gray-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Section - Positioned at bottom */}
      <div className="flex justify-between items-end mt-auto pt-24 pb-8">
        <div className="text-center w-64 border-t border-black pt-1">
          Signature of the Faculty
        </div>
        <div className="text-center w-64 border-t border-black pt-1">
          Signature & Seal of Dean
        </div>
      </div>
    </div>
  );
}
