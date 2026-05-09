"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FiEdit2, FiSave } from "react-icons/fi";
import { toast } from "react-toastify";

/* ─── EDITABLE FIELD — must live OUTSIDE parent to keep stable identity ─── */
const dropdownOptions = {
  department: ["Nursing", "Care", "Administration", "Management", "Support"],
  careSetting: [
    "Residential Care", "Nursing Homes", "Learning Disabilities",
    "Supported Living", "Mental Health Support", "Domiciliary Care", "Other Services",
  ],
};

const EditableField = ({ label, dbField, value: initialValue, onSave }) => {
  const [value, setValue] = useState(initialValue || "");
  const [isEditing, setIsEditing] = useState(false);

  // Sync when the parent prop changes (e.g. after save), but only while NOT editing
  useEffect(() => {
    if (!isEditing) setValue(initialValue || "");
  }, [initialValue, isEditing]);

  const isDropdown = !!dropdownOptions[dbField];
  const isDateField = ["dob", "startDate", "passportExpiry", "visaExpiry"].includes(dbField);

  const handleSave = async () => {
    await onSave(dbField, value);
    setIsEditing(false);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm text-gray-400">{label}</label>
        <button
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-white ${
            isEditing ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
        >
          {isEditing ? <FiSave size={16} /> : <FiEdit2 size={16} />}
          <span className="ml-1">{isEditing ? "Save" : "Edit"}</span>
        </button>
      </div>

      {isEditing ? (
        isDropdown ? (
          <select
            className="w-full bg-[#2d3b4e] border-l-4 border-[#5A58C9] rounded-r p-2 text-white"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          >
            {dropdownOptions[dbField].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : isDateField ? (
          <input
            type="date"
            className="w-full bg-[#2d3b4e] border-l-4 border-[#5A58C9] rounded-r p-2 text-white"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        ) : (
          <input
            type="text"
            className="w-full bg-[#2d3b4e] border-l-4 border-[#5A58C9] rounded-r p-2 text-white"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )
      ) : (
        <div className="bg-[#2d3b4e] border-l-4 border-[#5A58C9] rounded-r p-2 text-white">
          {value || "N/A"}
        </div>
      )}
    </div>
  );
};

/* ─── MAIN COMPONENT ─── */
const StafProfilePersonalEmp = ({ staff }) => {
  const [staffInfo, setStaffInfo] = useState(null);

  useEffect(() => {
    if (!staff) return;
    const token = localStorage.getItem("token");
    fetch(`https://admin-panel-backend-alpha.vercel.app/hr/${staff}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setStaffInfo(data))
      .catch((err) => console.log("Staff Fetch Error:", err));
  }, [staff]);

  const updateField = useCallback(
    async (field, value) => {
      try {
        await fetch(`https://admin-panel-backend-alpha.vercel.app/hr/${staff}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ [field]: value }),
        });
        setStaffInfo((prev) => ({ ...prev, [field]: value }));
        toast.success(`${field} updated successfully`);
      } catch (err) {
        console.error(err);
        toast.error("Update failed");
      }
    },
    [staff]
  );

  if (!staffInfo) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Primary Identity */}
      <div className="bg-[#243041] p-4 rounded-lg">
        <h2 className="text-white text-xl font-semibold mb-4">👤 Primary Identity</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <EditableField label="Full Name"           dbField="fullName"   value={staffInfo.fullName || ""}   onSave={updateField} />
          <EditableField label="Date of Birth"       dbField="dob"        value={staffInfo.dob || ""}        onSave={updateField} />
          <EditableField label="National Insurance"  dbField="niNumber"   value={staffInfo.niNumber || ""}   onSave={updateField} />
        </div>
      </div>

      {/* Contact & Address */}
      <div className="bg-[#243041] p-4 rounded-lg">
        <h2 className="text-white text-xl font-semibold mb-4">📞 Contact & Home Address</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <EditableField label="Contact Number" dbField="contactNumber" value={staffInfo.contactNumber || ""} onSave={updateField} />
          <EditableField label="Email"           dbField="email"         value={staffInfo.email || ""}         onSave={updateField} />
        </div>
        <EditableField label="Home Address" dbField="address" value={staffInfo.address || ""} onSave={updateField} />
      </div>

      {/* Next of Kin */}
      <div className="bg-[#243041] p-4 rounded-lg">
        <h2 className="text-white text-xl font-semibold mb-4">🚨 Next of Kin</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <EditableField label="Full Name"     dbField="nextOfKinName"         value={staffInfo.nextOfKinName || ""}         onSave={updateField} />
          <EditableField label="Relationship"  dbField="nextOfKinRelationship"  value={staffInfo.nextOfKinRelationship || ""} onSave={updateField} />
          <EditableField label="Email"         dbField="nextOfKinEmail"         value={staffInfo.nextOfKinEmail || ""}        onSave={updateField} />
        </div>
        <EditableField label="Address" dbField="nextOfKinAddress" value={staffInfo.nextOfKinAddress || ""} onSave={updateField} />
      </div>

      {/* Employment Details */}
      <div className="bg-[#243041] p-4 rounded-lg">
        <h2 className="text-white text-xl font-semibold mb-4">💼 Employment Details</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <EditableField label="Department"          dbField="department"        value={staffInfo.department || ""}                  onSave={updateField} />
          <EditableField label="Service Type"        dbField="careSetting"       value={staffInfo.careSetting || ""}                 onSave={updateField} />
          <EditableField label="Position"            dbField="position"          value={staffInfo.position || ""}                    onSave={updateField} />
          <EditableField label="Start Date"          dbField="startDate"         value={staffInfo.startDate?.slice(0, 10) || ""}    onSave={updateField} />
          <EditableField label="Termination Status"  dbField="terminationStatus" value={staffInfo.terminationStatus || ""}           onSave={updateField} />
          <EditableField label="Contract Details"    dbField="contractDetails"   value={staffInfo.contractDetails || ""}             onSave={updateField} />
        </div>
      </div>

      {/* Compliance */}
      <div className="bg-[#243041] p-4 rounded-lg">
        <h2 className="text-white text-xl font-semibold mb-4">🛡️ Compliance & Eligibility</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <EditableField label="DBS Status"                dbField="dbsStatus"               value={staffInfo.dbsStatus || ""}               onSave={updateField} />
          <EditableField label="Professional Registration" dbField="professionalRegistration" value={staffInfo.professionalRegistration || ""} onSave={updateField} />
          <EditableField label="Right to Work"             dbField="rightToWorkStatus"        value={staffInfo.rightToWorkStatus || ""}        onSave={updateField} />
        </div>
      </div>

      {/* Passport & Visa */}
      <div className="bg-[#243041] p-4 rounded-lg">
        <h2 className="text-white text-xl font-semibold mb-4">📄 Passport & Visa</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <EditableField label="Passport Number"  dbField="passportNumber"  value={staffInfo.passportNumber || ""}  onSave={updateField} />
          <EditableField label="Passport Country" dbField="passportCountry" value={staffInfo.passportCountry || ""} onSave={updateField} />
          <EditableField label="Passport Expiry"  dbField="passportExpiry"  value={staffInfo.passportExpiry || ""}  onSave={updateField} />
          <EditableField label="Visa Required"    dbField="visaRequired"    value={staffInfo.visaRequired || ""}    onSave={updateField} />
          <EditableField label="Visa Number"      dbField="visaNumber"      value={staffInfo.visaNumber || ""}      onSave={updateField} />
          <EditableField label="Visa Expiry"      dbField="visaExpiry"      value={staffInfo.visaExpiry || ""}      onSave={updateField} />
        </div>
      </div>
    </div>
  );
};

export default StafProfilePersonalEmp;
