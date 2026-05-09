"use client";
import React, { useState, useEffect } from "react";
import { FaPlus, FaTimes, FaEye, FaTrash, FaClipboardCheck, FaChevronDown, FaChevronUp, FaSave, FaFilePdf, FaPaperclip } from "react-icons/fa";
import { ASSESSMENT_TYPES, TEMPLATE_FIELDS } from "./assessmentTemplates";
import { useAuth } from "@/app/context/AuthContext";

const API = "https://admin-panel-backend-alpha.vercel.app";

const ResidentProfileAssessment = ({ clientId }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [viewAssessment, setViewAssessment] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [clientData, setClientData] = useState(null);
  const [assessmentFiles, setAssessmentFiles] = useState([]);

  // Dynamic data for special fields
  const [goals, setGoals] = useState([{ goal: "", timeframe: "", progress: "" }]);
  const [risks, setRisks] = useState([]);
  const [activities, setActivities] = useState([""]);
  const [medRows, setMedRows] = useState([{ medication: "", time: "", dose: "", staffInitials: "" }]);
  const [injuries, setInjuries] = useState([{ person: "", injury: "", treatment: "" }]);
  const [consents, setConsents] = useState([]);
  const [visits, setVisits] = useState([{ date: "", timeIn: "", timeOut: "", tasksCompleted: "", staffInitials: "" }]);
  const [checklistAreas, setChecklistAreas] = useState([]);
  const [marRows, setMarRows] = useState([{ medication: "", dose: "", time: "", mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "", notes: "" }]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // Fetch assessments
  useEffect(() => {
    if (!clientId) return;
    fetch(`${API}/assessment/client/${clientId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setAssessments(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));

    // Fetch client profile data for auto-filling forms
    fetch(`${API}/client/${clientId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setClientData(data))
      .catch(console.error);
  }, [clientId, token]);

  // Fetch staff members for CARE PROVIDER dropdown
  useEffect(() => {
    fetch(`${API}/hr`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setStaffMembers(data.allHr || data || []);
      })
      .catch(err => console.error(err));
  }, [token]);

  // Init special fields when type changes
  useEffect(() => {
    if (!selectedType) return;
    const tmpl = TEMPLATE_FIELDS[selectedType];
    if (!tmpl) return;

    // Auto-fill form data from client profile
    const initialData = {};
    if (clientData && tmpl.sections) {
      tmpl.sections.forEach(sec => {
        if (sec.fields) {
          sec.fields.forEach(f => {
            const fieldName = f.name.toLowerCase();
            const clientName = clientData.fullName || "";
            const gpDoc = `${clientData.gpDoctor || ''} ${clientData.gpSurgery || ''}`.trim();
            const nextOfKin = `${clientData.nokName || ''} - ${clientData.nokPhone || ''}`.trim();

            if (fieldName === "fullname" || fieldName === "clientname" || fieldName === "serviceusername" || fieldName === "personatrisk" || fieldName === "preferredname") {
              initialData[f.name] = clientName;
            } else if (fieldName.includes("dob") || fieldName.includes("dateofbirth")) {
              initialData[f.name] = clientData.dob ? clientData.dob.split('T')[0] : (clientData.dateOfBirth ? clientData.dateOfBirth.split('T')[0] : "");
            } else if (fieldName === "address") {
               initialData[f.name] = clientData.address || "";
            } else if (fieldName.includes("contactnumber") || fieldName.includes("phone")) {
               initialData[f.name] = clientData.phoneNumber || clientData.contactNumber || "";
            } else if (fieldName.includes("nextofkin")) {
               initialData[f.name] = nextOfKin !== "-" ? nextOfKin : "";
            } else if (fieldName.includes("gpupdoctor") || fieldName.includes("gpdoctor") || fieldName === "gp") {
               initialData[f.name] = gpDoc;
            } else if (fieldName.includes("nhsnumber") || fieldName === "nhsno") {
               initialData[f.name] = clientData.nhsNo || clientData.nhsNumber || "";
            } else if (fieldName === "allergies") {
               initialData[f.name] = clientData.allergies || "";
            } else if (fieldName === "diagnoses" || fieldName === "primarydiagnosis" || fieldName.includes("healthneeds")) {
               initialData[f.name] = clientData.primaryDiagnosis || "";
            } else if (fieldName === "personaldetails") {
               const dobStr = clientData.dob ? clientData.dob.split('T')[0] : (clientData.dateOfBirth ? clientData.dateOfBirth.split('T')[0] : "");
               initialData[f.name] = `Name: ${clientName}\nDOB: ${dobStr}\nGender: ${clientData.gender || "N/A"}\nReligion: ${clientData.religion || "N/A"}`;
            } else if (fieldName === "needspreferences" || fieldName === "likesdislikes") {
               initialData[f.name] = `Important To Me: ${clientData.importantToMe || "N/A"}\nPlease Do: ${clientData.pleaseDo || "N/A"}\nPlease Don't: ${clientData.pleaseDont || "N/A"}`;
            }
          });
        }
      });
    }
    setFormData(initialData);

    if (tmpl.hasRiskMatrix) {
      setRisks(tmpl.defaultRisks.map(r => ({ risk: r, likelihood: 1, impact: 1, score: 1, controls: "" })));
    }
    if (tmpl.hasConsents) {
      setConsents(tmpl.defaultConsents.map(c => ({ area: c, answer: "Yes", notes: "" })));
    }
    if (tmpl.hasChecklist) {
      setChecklistAreas(tmpl.defaultAreas.map(a => ({ area: a, safe: "", unsafe: "", notes: "" })));
    }
  }, [selectedType, clientData]);

  const handleFieldChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedType) return alert("Please select an assessment type");
    setSaving(true);
    const tmpl = TEMPLATE_FIELDS[selectedType];
    const payload = {
      client: clientId,
      staff: selectedStaff || undefined,
      assessmentType: selectedType,
      [tmpl.key]: { ...formData },
    };
    // Attach special fields
    if (tmpl.hasGoals) payload[tmpl.key].goals = goals;
    if (tmpl.hasRiskMatrix) payload[tmpl.key].risks = risks;
    if (tmpl.hasActivities) payload[tmpl.key].activitiesCompleted = activities;
    if (tmpl.hasMedTable) payload[tmpl.key].medications = medRows;
    if (tmpl.hasInjuries) payload[tmpl.key].injuries = injuries;
    if (tmpl.hasConsents) payload[tmpl.key].consents = consents;
    if (tmpl.hasVisits) payload[tmpl.key].visits = visits;
    if (tmpl.hasChecklist) payload[tmpl.key].areas = checklistAreas;
    if (tmpl.hasMARGrid) payload[tmpl.key].medications = marRows;

    try {
      const res = await fetch(`${API}/assessment`, { method: "POST", headers, body: JSON.stringify(payload) });
      const saved = await res.json();
      if (res.ok) {
        setAssessments(prev => [saved, ...prev]);
        setShowForm(false); setFormData({}); setSelectedType(""); setSelectedStaff("");
        setGoals([{ goal: "", timeframe: "", progress: "" }]);
        setRisks([]); setActivities([""]); setMedRows([{ medication: "", time: "", dose: "", staffInitials: "" }]);
      } else alert(saved.error || "Error saving");
    } catch { alert("Network error"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this assessment?")) return;
    await fetch(`${API}/assessment/${id}`, { method: "DELETE", headers });
    setAssessments(prev => prev.filter(a => a._id !== id));
  };

  const handleExportAssessment = async (a) => {
    try {
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      const tmpl = TEMPLATE_FIELDS[a.assessmentType];
      const data = a[tmpl?.key] || {};
      const clientName = clientData?.fullName || data.fullName || data.clientName || data.serviceUserName || "Client";
      const careProvider = a.staff ? (a.staff.fullName || a.staff.firstName || "N/A") : "N/A";
      const assessmentDateStr = new Date(a.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
      const generationDateStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
      const statusText = a.status || "Completed";

      // ─── Color palette ───
      const PRIMARY = [74, 73, 176];
      const PRIMARY_DARK = [55, 54, 140];
      const ACCENT = [99, 102, 241];
      const LIGHT_BG = [248, 248, 255];
      const LABEL_BG = [235, 235, 252];
      const TEXT_DARK = [30, 30, 50];
      const TEXT_MID = [80, 80, 100];
      const TEXT_LIGHT = [130, 130, 150];
      const SUCCESS = [34, 197, 94];
      const WARNING = [245, 158, 11];
      const DANGER = [239, 68, 68];
      const WHITE = [255, 255, 255];

      let yPos = 0;

      // ─── Helper: Check page overflow ───
      const checkPage = (needed = 30) => {
        if (yPos + needed > pageHeight - 25) {
          doc.addPage();
          yPos = 20;
          return true;
        }
        return false;
      };

      // ─── Helper: Wrapped text that handles multiline ───
      const addWrappedText = (text, x, y, maxWidth, fontSize = 10, font = "normal", color = TEXT_DARK) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", font);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(String(text || "N/A"), maxWidth);
        lines.forEach((line, idx) => {
          checkPage(6);
          doc.text(line, x, yPos);
          yPos += fontSize * 0.45;
        });
        return lines.length;
      };

      // ══════════════════════════════════════════════
      // PAGE 1: COVER PAGE
      // ══════════════════════════════════════════════

      // Full page gradient background
      doc.setFillColor(...PRIMARY);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Subtle darker overlay pattern at top
      doc.setFillColor(...PRIMARY_DARK);
      doc.rect(0, 0, pageWidth, 90, "F");

      // Decorative circles
      doc.setFillColor(255, 255, 255, 0.05);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.3);
      doc.circle(pageWidth - 30, 40, 50, "S");
      doc.circle(pageWidth - 15, 55, 30, "S");
      doc.circle(30, pageHeight - 50, 40, "S");

      // Company Name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("CARE MANAGEMENT SYSTEM", margin + 2, 35);

      // Divider line
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(margin, 42, margin + 50, 42);

      // Assessment Type Title
      doc.setFontSize(32);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(a.assessmentType.toUpperCase(), contentWidth - 20);
      let titleY = 120;
      titleLines.forEach(line => {
        doc.text(line, margin + 2, titleY);
        titleY += 14;
      });

      // Subtitle
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 255);
      doc.text("Professional Assessment Report", margin + 2, titleY + 8);

      // Info cards at bottom of cover
      const cardY = pageHeight - 85;
      const cardH = 55;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, cardY, contentWidth, cardH, 4, 4, "F");

      doc.setTextColor(...TEXT_LIGHT);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      const col1 = margin + 8;
      const col2 = margin + contentWidth / 3;
      const col3 = margin + (contentWidth / 3) * 2;

      // Column 1: Client
      doc.text("CLIENT NAME", col1, cardY + 12);
      doc.setTextColor(...TEXT_DARK);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(clientName, col1, cardY + 20);

      // Column 2: Date
      doc.setTextColor(...TEXT_LIGHT);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("ASSESSMENT DATE", col2, cardY + 12);
      doc.setTextColor(...TEXT_DARK);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(assessmentDateStr, col2, cardY + 20);

      // Column 3: Status
      doc.setTextColor(...TEXT_LIGHT);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("STATUS", col3, cardY + 12);
      const statusColor = statusText === "Completed" ? SUCCESS : statusText === "Reviewed" ? ACCENT : WARNING;
      doc.setTextColor(...statusColor);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(statusText.toUpperCase(), col3, cardY + 20);

      // Row 2 inside card
      doc.setTextColor(...TEXT_LIGHT);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("CARE PROVIDER", col1, cardY + 34);
      doc.setTextColor(...TEXT_DARK);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(careProvider, col1, cardY + 42);

      doc.setTextColor(...TEXT_LIGHT);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("GENERATED ON", col2, cardY + 34);
      doc.setTextColor(...TEXT_DARK);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(generationDateStr, col2, cardY + 42);

      doc.setTextColor(...TEXT_LIGHT);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("REFERENCE", col3, cardY + 34);
      doc.setTextColor(...TEXT_DARK);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`#${(a._id || "").slice(-8).toUpperCase()}`, col3, cardY + 42);

      // Confidential notice
      doc.setTextColor(200, 200, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text("CONFIDENTIAL — This document contains sensitive personal information and is intended for authorized personnel only.", pageWidth / 2, pageHeight - 12, { align: "center" });

      // ══════════════════════════════════════════════
      // CONTENT PAGES
      // ══════════════════════════════════════════════
      doc.addPage();
      yPos = 15;

      // ─── Page Header Bar (reusable for each new page) ───
      const drawPageHeader = () => {
        doc.setFillColor(...PRIMARY);
        doc.rect(0, 0, pageWidth, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(`${a.assessmentType} — ${clientName}`, margin, 7);
        doc.text(assessmentDateStr, pageWidth - margin, 7, { align: "right" });
      };
      drawPageHeader();

      // ─── Section Title Helper ───
      const addSectionTitle = (title) => {
        checkPage(25);
        // Section header with accent bar
        doc.setFillColor(...PRIMARY);
        doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), margin + 5, yPos + 7);
        yPos += 16;
      };

      // ─── Render Fields as Professional Table ───
      const renderFieldsTable = (fields, sectionData) => {
        if (!fields || fields.length === 0) return;
        const bodyData = fields.map(f => {
          let val = sectionData[f.name];
          if (val === undefined || val === null || val === "") val = "N/A";
          if (f.type === "date" && val !== "N/A") {
            try {
              const d = new Date(val);
              if (!isNaN(d)) val = d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
            } catch(e) {}
          }
          return [f.label, String(val)];
        });

        checkPage(20);
        autoTable(doc, {
          startY: yPos,
          body: bodyData,
          theme: "plain",
          styles: {
            fontSize: 9.5,
            cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
            lineColor: [220, 220, 240],
            lineWidth: 0.3,
            textColor: TEXT_DARK,
            overflow: "linebreak",
          },
          columnStyles: {
            0: {
              fontStyle: "bold",
              cellWidth: 55,
              fillColor: LABEL_BG,
              textColor: PRIMARY,
            },
            1: {
              cellWidth: "auto",
              fillColor: WHITE,
            }
          },
          didDrawPage: (data) => {
            drawPageHeader();
          },
          margin: { left: margin, right: margin },
        });
        yPos = doc.lastAutoTable.finalY + 10;
      };

      // ─── Render Special Table Helper ───
      const renderSpecialTable = (title, headers, bodyData, options = {}) => {
        if (!bodyData || bodyData.length === 0) return;
        addSectionTitle(title);
        checkPage(20);

        autoTable(doc, {
          startY: yPos,
          head: [headers],
          body: bodyData.map(row => row.map(cell => String(cell ?? "-"))),
          theme: "grid",
          headStyles: {
            fillColor: PRIMARY,
            textColor: WHITE,
            fontStyle: "bold",
            fontSize: 9,
            cellPadding: 4,
            halign: "left",
          },
          styles: {
            fontSize: 8.5,
            cellPadding: 3.5,
            textColor: TEXT_DARK,
            lineColor: [210, 210, 230],
            lineWidth: 0.3,
            overflow: "linebreak",
          },
          alternateRowStyles: { fillColor: [250, 250, 255] },
          didDrawPage: () => { drawPageHeader(); },
          margin: { left: margin, right: margin },
          ...options,
        });
        yPos = doc.lastAutoTable.finalY + 10;
      };

      // ─── No template? Show raw data ───
      if (!tmpl) {
        addSectionTitle("Assessment Data");
        doc.setFontSize(10);
        doc.setTextColor(...TEXT_DARK);
        doc.text("No template structure found for this assessment type.", margin, yPos);
        yPos += 10;
        // Show whatever raw data we can
        const rawData = a;
        Object.keys(rawData).forEach(key => {
          if (["_id", "__v", "client", "staff", "createdAt", "updatedAt", "assessmentType", "status"].includes(key)) return;
          const val = rawData[key];
          if (val && typeof val === "object" && !Array.isArray(val)) {
            addSectionTitle(key);
            const entries = Object.entries(val).filter(([k, v]) => v !== null && v !== undefined && v !== "");
            if (entries.length > 0) {
              renderFieldsTable(entries.map(([k]) => ({ name: k, label: k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()) })), val);
            }
          }
        });
      } else {
        // ─── Render all template sections ───
        for (const sec of tmpl.sections) {
          // Regular fields
          if (sec.fields && sec.fields.length > 0) {
            addSectionTitle(sec.title);
            renderFieldsTable(sec.fields, data);
          }

          // Assessment area table (Client Assessment type)
          if (sec.table && sec.areas) {
            addSectionTitle(sec.title);

            const bodyData = sec.areas.map(area => {
              const label = sec.areaLabels[area] || area;
              // Handle both flat format (area_notes) and nested format (area.notes)
              let notes = data[`${area}_notes`] || "-";
              let level = data[`${area}_level`] || "-";
              // Also check nested object format from DB
              if (notes === "-" && data[area] && typeof data[area] === "object") {
                notes = data[area].notes || "-";
              }
              if (level === "-" && data[area] && typeof data[area] === "object") {
                level = data[area].levelOfNeed || "-";
              }
              return [label, notes, level];
            });

            checkPage(20);
            autoTable(doc, {
              startY: yPos,
              head: [["Assessment Area", "Notes & Observations", "Level of Need"]],
              body: bodyData,
              theme: "grid",
              headStyles: {
                fillColor: PRIMARY,
                textColor: WHITE,
                fontStyle: "bold",
                fontSize: 9,
                cellPadding: 4,
              },
              styles: {
                fontSize: 8.5,
                cellPadding: 3.5,
                textColor: TEXT_DARK,
                lineColor: [210, 210, 230],
                lineWidth: 0.3,
                overflow: "linebreak",
              },
              columnStyles: {
                0: { cellWidth: 40, fontStyle: "bold", fillColor: LABEL_BG },
                2: { cellWidth: 30, halign: "center" },
              },
              didParseCell: (hookData) => {
                // Color-code the level column
                if (hookData.column.index === 2 && hookData.section === "body") {
                  const val = String(hookData.cell.raw).toLowerCase();
                  if (val === "critical") { hookData.cell.styles.textColor = DANGER; hookData.cell.styles.fontStyle = "bold"; }
                  else if (val === "high") { hookData.cell.styles.textColor = [234, 88, 12]; hookData.cell.styles.fontStyle = "bold"; }
                  else if (val === "medium") { hookData.cell.styles.textColor = WARNING; }
                  else if (val === "low") { hookData.cell.styles.textColor = SUCCESS; }
                }
              },
              didDrawPage: () => { drawPageHeader(); },
              margin: { left: margin, right: margin },
              alternateRowStyles: { fillColor: [250, 250, 255] },
            });
            yPos = doc.lastAutoTable.finalY + 10;
          }
        }

        // ─── Special Data: Goals ───
        if (data.goals && data.goals.length > 0) {
          renderSpecialTable(
            "Goals & Outcomes",
            ["#", "Goal Description", "Timeframe", "Status / Progress"],
            data.goals.map((g, i) => [i + 1, g.goal || "-", g.timeframe || "-", g.progress || "-"])
          );
        }

        // ─── Special Data: Risk Matrix ───
        if (data.risks && data.risks.length > 0) {
          addSectionTitle("Risk Matrix Assessment");
          checkPage(20);

          autoTable(doc, {
            startY: yPos,
            head: [["#", "Identified Risk", "Likelihood", "Impact", "Risk Score", "Control Measures"]],
            body: data.risks.map((r, i) => [
              i + 1,
              r.risk || "-",
              r.likelihood || "-",
              r.impact || "-",
              r.score || (r.likelihood && r.impact ? r.likelihood * r.impact : "-"),
              r.controls || "-",
            ]),
            theme: "grid",
            headStyles: {
              fillColor: PRIMARY,
              textColor: WHITE,
              fontStyle: "bold",
              fontSize: 9,
              cellPadding: 4,
            },
            styles: {
              fontSize: 8.5,
              cellPadding: 3.5,
              textColor: TEXT_DARK,
              lineColor: [210, 210, 230],
              lineWidth: 0.3,
              overflow: "linebreak",
            },
            columnStyles: {
              0: { cellWidth: 10, halign: "center" },
              4: { cellWidth: 22, halign: "center", fontStyle: "bold" },
            },
            didParseCell: (hookData) => {
              if (hookData.column.index === 4 && hookData.section === "body") {
                const score = parseInt(hookData.cell.raw);
                if (score >= 15) { hookData.cell.styles.textColor = DANGER; hookData.cell.styles.fillColor = [254, 226, 226]; }
                else if (score >= 8) { hookData.cell.styles.textColor = WARNING; hookData.cell.styles.fillColor = [254, 249, 195]; }
                else if (score > 0) { hookData.cell.styles.textColor = SUCCESS; hookData.cell.styles.fillColor = [220, 252, 231]; }
              }
            },
            didDrawPage: () => { drawPageHeader(); },
            margin: { left: margin, right: margin },
            alternateRowStyles: { fillColor: [250, 250, 255] },
          });
          yPos = doc.lastAutoTable.finalY + 10;
        }

        // ─── Special Data: Consent Declarations ───
        if (data.consents && data.consents.length > 0) {
          addSectionTitle("Consent Declarations");
          checkPage(20);

          autoTable(doc, {
            startY: yPos,
            head: [["Consent Area", "Client Response", "Additional Notes"]],
            body: data.consents.map(c => [c.area || "-", c.answer || "-", c.notes || "-"]),
            theme: "grid",
            headStyles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: "bold", fontSize: 9, cellPadding: 4 },
            styles: { fontSize: 8.5, cellPadding: 3.5, textColor: TEXT_DARK, lineColor: [210, 210, 230], lineWidth: 0.3, overflow: "linebreak" },
            didParseCell: (hookData) => {
              if (hookData.column.index === 1 && hookData.section === "body") {
                const val = String(hookData.cell.raw).toLowerCase();
                if (val === "yes") { hookData.cell.styles.textColor = SUCCESS; hookData.cell.styles.fontStyle = "bold"; }
                else if (val === "no") { hookData.cell.styles.textColor = DANGER; hookData.cell.styles.fontStyle = "bold"; }
              }
            },
            didDrawPage: () => { drawPageHeader(); },
            margin: { left: margin, right: margin },
            alternateRowStyles: { fillColor: [250, 250, 255] },
          });
          yPos = doc.lastAutoTable.finalY + 10;
        }

        // ─── Special Data: Activities Completed ───
        if (data.activitiesCompleted && data.activitiesCompleted.length > 0) {
          renderSpecialTable(
            "Activities Completed",
            ["#", "Activity Description"],
            data.activitiesCompleted.map((act, i) => [i + 1, act || "-"])
          );
        }

        // ─── Special Data: Medications (Daily Notes / MAR Chart) ───
        if (data.medications && data.medications.length > 0) {
          // Check if this is MAR Chart format (has day columns)
          const isMAR = data.medications[0] && ("mon" in data.medications[0] || "tue" in data.medications[0]);

          if (isMAR) {
            addSectionTitle("MAR Chart — Weekly Medication Administration Record");
            checkPage(20);

            autoTable(doc, {
              startY: yPos,
              head: [["Medication", "Dose", "Time", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Notes"]],
              body: data.medications.map(m => [
                m.medication || "-",
                m.dose || "-",
                m.time || "-",
                m.mon || "—",
                m.tue || "—",
                m.wed || "—",
                m.thu || "—",
                m.fri || "—",
                m.sat || "—",
                m.sun || "—",
                m.notes || "-",
              ]),
              theme: "grid",
              headStyles: {
                fillColor: PRIMARY,
                textColor: WHITE,
                fontStyle: "bold",
                fontSize: 7.5,
                cellPadding: 3,
                halign: "center",
              },
              styles: {
                fontSize: 7.5,
                cellPadding: 2.5,
                textColor: TEXT_DARK,
                lineColor: [210, 210, 230],
                lineWidth: 0.3,
                halign: "center",
                overflow: "linebreak",
              },
              columnStyles: {
                0: { cellWidth: 28, halign: "left", fontStyle: "bold" },
                1: { cellWidth: 15 },
                2: { cellWidth: 14 },
                3: { cellWidth: 11 }, 4: { cellWidth: 11 }, 5: { cellWidth: 11 },
                6: { cellWidth: 11 }, 7: { cellWidth: 11 }, 8: { cellWidth: 11 }, 9: { cellWidth: 11 },
                10: { cellWidth: "auto", halign: "left" },
              },
              didParseCell: (hookData) => {
                // Highlight administered days
                if (hookData.column.index >= 3 && hookData.column.index <= 9 && hookData.section === "body") {
                  const val = String(hookData.cell.raw).trim();
                  if (val && val !== "—" && val !== "-") {
                    hookData.cell.styles.fillColor = [220, 252, 231];
                    hookData.cell.styles.textColor = SUCCESS;
                    hookData.cell.styles.fontStyle = "bold";
                  }
                }
              },
              didDrawPage: () => { drawPageHeader(); },
              margin: { left: margin, right: margin },
              alternateRowStyles: { fillColor: [250, 250, 255] },
            });
            yPos = doc.lastAutoTable.finalY + 10;
          } else {
            renderSpecialTable(
              "Medication Administration Records",
              ["#", "Medication", "Dose", "Time Administered", "Staff Initials / Notes"],
              data.medications.map((m, i) => [
                i + 1,
                m.medication || m.medicationName || "-",
                m.dose || "-",
                m.time || "-",
                m.staffInitials || m.notes || "-",
              ])
            );
          }
        }

        // ─── Special Data: Injuries ───
        if (data.injuries && data.injuries.length > 0) {
          addSectionTitle("Injury & Treatment Details");
          checkPage(20);

          autoTable(doc, {
            startY: yPos,
            head: [["#", "Person Involved", "Nature of Injury", "Treatment Applied"]],
            body: data.injuries.map((inj, i) => [i + 1, inj.person || "-", inj.injury || "-", inj.treatment || "-"]),
            theme: "grid",
            headStyles: { fillColor: DANGER, textColor: WHITE, fontStyle: "bold", fontSize: 9, cellPadding: 4 },
            styles: { fontSize: 8.5, cellPadding: 3.5, textColor: TEXT_DARK, lineColor: [210, 210, 230], lineWidth: 0.3, overflow: "linebreak" },
            columnStyles: { 0: { cellWidth: 10, halign: "center" } },
            didDrawPage: () => { drawPageHeader(); },
            margin: { left: margin, right: margin },
            alternateRowStyles: { fillColor: [254, 242, 242] },
          });
          yPos = doc.lastAutoTable.finalY + 10;
        }

        // ─── Special Data: Visits ───
        if (data.visits && data.visits.length > 0) {
          renderSpecialTable(
            "Support Worker Visit Log",
            ["#", "Date", "Time In", "Time Out", "Tasks Completed", "Staff Initials"],
            data.visits.map((v, i) => [i + 1, v.date || "-", v.timeIn || "-", v.timeOut || "-", v.tasksCompleted || "-", v.staffInitials || "-"])
          );
        }

        // ─── Special Data: Home Environment Checklist ───
        if (data.areas && data.areas.length > 0 && tmpl.hasChecklist) {
          addSectionTitle("Home Environment Safety Checklist");
          checkPage(20);

          autoTable(doc, {
            startY: yPos,
            head: [["Area Inspected", "Safe ✓", "Unsafe ✗", "Inspector Notes"]],
            body: data.areas.map(area => [area.area || "-", area.safe || "—", area.unsafe || "—", area.notes || "-"]),
            theme: "grid",
            headStyles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: "bold", fontSize: 9, cellPadding: 4 },
            styles: { fontSize: 8.5, cellPadding: 3.5, textColor: TEXT_DARK, lineColor: [210, 210, 230], lineWidth: 0.3, overflow: "linebreak" },
            columnStyles: {
              1: { cellWidth: 20, halign: "center" },
              2: { cellWidth: 20, halign: "center" },
            },
            didParseCell: (hookData) => {
              if (hookData.section === "body") {
                if (hookData.column.index === 1) {
                  const val = String(hookData.cell.raw).trim();
                  if (val === "✓" || val.toLowerCase() === "yes" || val.toLowerCase() === "safe") {
                    hookData.cell.styles.textColor = SUCCESS;
                    hookData.cell.styles.fontStyle = "bold";
                    hookData.cell.styles.fillColor = [220, 252, 231];
                  }
                }
                if (hookData.column.index === 2) {
                  const val = String(hookData.cell.raw).trim();
                  if (val === "✗" || val.toLowerCase() === "no" || val.toLowerCase() === "unsafe") {
                    hookData.cell.styles.textColor = DANGER;
                    hookData.cell.styles.fontStyle = "bold";
                    hookData.cell.styles.fillColor = [254, 226, 226];
                  }
                }
              }
            },
            didDrawPage: () => { drawPageHeader(); },
            margin: { left: margin, right: margin },
            alternateRowStyles: { fillColor: [250, 250, 255] },
          });
          yPos = doc.lastAutoTable.finalY + 10;
        }
      }

      // ══════════════════════════════════════════════
      // SIGNATURE SECTION (if present in data)
      // ══════════════════════════════════════════════
      const signatureFields = [];
      if (tmpl) {
        tmpl.sections.forEach(sec => {
          if (sec.title && sec.title.toLowerCase().includes("sign")) {
            sec.fields?.forEach(f => {
              const val = data[f.name];
              if (val) signatureFields.push({ label: f.label, value: val });
            });
          }
        });
      }

      if (signatureFields.length > 0) {
        checkPage(40);
        yPos += 5;
        doc.setFillColor(...LABEL_BG);
        doc.roundedRect(margin, yPos, contentWidth, 8, 2, 2, "F");
        doc.setTextColor(...PRIMARY);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("SIGNATURES & AUTHORIZATION", margin + 5, yPos + 6);
        yPos += 16;

        signatureFields.forEach((sf) => {
          checkPage(20);
          doc.setTextColor(...TEXT_LIGHT);
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text(sf.label, margin, yPos);
          yPos += 5;

          doc.setDrawColor(...PRIMARY);
          doc.setLineWidth(0.5);
          doc.line(margin, yPos + 4, margin + 70, yPos + 4);
          doc.setTextColor(...TEXT_DARK);
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.text(sf.value, margin + 2, yPos + 2);
          yPos += 14;
        });
      }

      // ══════════════════════════════════════════════
      // FOOTER ON ALL PAGES
      // ══════════════════════════════════════════════
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        if (i === 1) continue; // Skip cover page footer

        // Footer bar
        doc.setFillColor(245, 245, 252);
        doc.rect(0, pageHeight - 18, pageWidth, 18, "F");
        doc.setDrawColor(...PRIMARY);
        doc.setLineWidth(0.4);
        doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

        // Left: System name
        doc.setTextColor(...TEXT_LIGHT);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text("Care Management System — Confidential Document", margin, pageHeight - 10);

        // Center: Generation date
        doc.text(`Generated: ${generationDateStr}`, pageWidth / 2, pageHeight - 10, { align: "center" });

        // Right: Page number
        doc.setTextColor(...PRIMARY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(`Page ${i - 1} of ${totalPages - 1}`, pageWidth - margin, pageHeight - 10, { align: "right" });
      }

      // ─── Save File ───
      const safeClientName = clientName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
      const safeType = a.assessmentType.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
      const dateStr = new Date(a.createdAt).toISOString().split("T")[0];
      doc.save(`${safeClientName}_${safeType}_${dateStr}.pdf`);

    } catch (e) {
      console.error("PDF Export Error:", e);
      alert("Failed to export PDF. Please check console for details.");
    }
  };

  // Render form fields from template
  const renderFields = (fields) => (
    <div className="grid sm:grid-cols-2 gap-4">
      {fields.map(f => (
        <div key={f.name} className={f.textarea ? "sm:col-span-2" : ""}>
          <label className="text-sm text-gray-400 mb-1 block">{f.label}</label>
          {f.textarea ? (
            <textarea className="w-full bg-[#2d3b4e] border border-gray-600 rounded p-2 text-white text-sm" rows={3}
              value={formData[f.name] || ""} onChange={e => handleFieldChange(f.name, e.target.value)} />
          ) : (
            <input type={f.type || "text"} className="w-full bg-[#2d3b4e] border border-gray-600 rounded p-2 text-white text-sm"
              value={formData[f.name] || ""} onChange={e => handleFieldChange(f.name, e.target.value)} />
          )}
        </div>
      ))}
    </div>
  );

  // Assessment area table (for Client Assessment type)
  const renderAssessmentAreas = (tmpl) => {
    const sec = tmpl.sections.find(s => s.table);
    if (!sec) return null;
    return (
      <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700 mb-4">
        <h4 className="text-white font-semibold mb-3">{sec.title}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead><tr className="bg-[#4A49B0]/30 text-gray-300">
              <th className="p-2">Area</th><th className="p-2">Assessment Notes</th><th className="p-2">Level of Need</th>
            </tr></thead>
            <tbody>
              {sec.areas.map(area => (
                <tr key={area} className="border-b border-gray-700">
                  <td className="p-2 text-gray-300 font-medium">{sec.areaLabels[area]}</td>
                  <td className="p-2"><textarea className="w-full bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs" rows={2}
                    value={formData[`${area}_notes`] || ""} onChange={e => handleFieldChange(`${area}_notes`, e.target.value)} /></td>
                  <td className="p-2">
                    <select className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs w-full"
                      value={formData[`${area}_level`] || ""} onChange={e => handleFieldChange(`${area}_level`, e.target.value)}>
                      <option value="">Select</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Risk Matrix
  const renderRiskMatrix = () => (
    <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700 mb-4">
      <h4 className="text-white font-semibold mb-3">Risk Matrix</h4>
      <table className="w-full text-sm"><thead><tr className="bg-[#4A49B0]/30 text-gray-300">
        <th className="p-2">Risk</th><th className="p-2">Likelihood(1-5)</th><th className="p-2">Impact(1-5)</th>
        <th className="p-2">Score</th><th className="p-2">Controls</th>
      </tr></thead><tbody>
        {risks.map((r, i) => (
          <tr key={i} className="border-b border-gray-700">
            <td className="p-2 text-gray-300">{r.risk}</td>
            <td className="p-2"><input type="number" min="1" max="5" className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs w-16"
              value={r.likelihood} onChange={e => { const n = [...risks]; n[i].likelihood = +e.target.value; n[i].score = n[i].likelihood * n[i].impact; setRisks(n); }} /></td>
            <td className="p-2"><input type="number" min="1" max="5" className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs w-16"
              value={r.impact} onChange={e => { const n = [...risks]; n[i].impact = +e.target.value; n[i].score = n[i].likelihood * n[i].impact; setRisks(n); }} /></td>
            <td className={`p-2 font-bold ${r.score >= 15 ? "text-red-400" : r.score >= 8 ? "text-yellow-400" : "text-green-400"}`}>{r.score}</td>
            <td className="p-2"><input className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs w-full"
              value={r.controls} onChange={e => { const n = [...risks]; n[i].controls = e.target.value; setRisks(n); }} /></td>
          </tr>
        ))}
      </tbody></table>
    </div>
  );

  // Goals table
  const renderGoals = () => (
    <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700 mb-4">
      <div className="flex justify-between mb-3"><h4 className="text-white font-semibold">Section 4: Goals & Outcomes</h4>
        <button onClick={() => setGoals(p => [...p, { goal: "", timeframe: "", progress: "" }])} className="text-xs bg-[#4A49B0] text-white px-2 py-1 rounded">+ Add Goal</button>
      </div>
      {goals.map((g, i) => (
        <div key={i} className="grid grid-cols-3 gap-2 mb-2">
          <input placeholder="Goal" className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs" value={g.goal} onChange={e => { const n = [...goals]; n[i].goal = e.target.value; setGoals(n); }} />
          <input placeholder="Timeframe" className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs" value={g.timeframe} onChange={e => { const n = [...goals]; n[i].timeframe = e.target.value; setGoals(n); }} />
          <input placeholder="Progress" className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs" value={g.progress} onChange={e => { const n = [...goals]; n[i].progress = e.target.value; setGoals(n); }} />
        </div>
      ))}
    </div>
  );

  // Consent table
  const renderConsents = () => (
    <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700 mb-4">
      <h4 className="text-white font-semibold mb-3">Consent Areas</h4>
      <table className="w-full text-sm"><thead><tr className="bg-[#4A49B0]/30 text-gray-300">
        <th className="p-2">Consent Area</th><th className="p-2">Yes/No</th><th className="p-2">Notes</th>
      </tr></thead><tbody>
        {consents.map((c, i) => (
          <tr key={i} className="border-b border-gray-700">
            <td className="p-2 text-gray-300">{c.area}</td>
            <td className="p-2"><select className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs"
              value={c.answer} onChange={e => { const n = [...consents]; n[i].answer = e.target.value; setConsents(n); }}>
              <option>Yes</option><option>No</option>
            </select></td>
            <td className="p-2"><input className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs w-full"
              value={c.notes} onChange={e => { const n = [...consents]; n[i].notes = e.target.value; setConsents(n); }} /></td>
          </tr>
        ))}
      </tbody></table>
    </div>
  );

  // Visit log
  const renderVisits = () => (
    <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700 mb-4">
      <div className="flex justify-between mb-3"><h4 className="text-white font-semibold">Visit Log</h4>
        <button onClick={() => setVisits(p => [...p, { date: "", timeIn: "", timeOut: "", tasksCompleted: "", staffInitials: "" }])} className="text-xs bg-[#4A49B0] text-white px-2 py-1 rounded">+ Add Row</button>
      </div>
      {visits.map((v, i) => (
        <div key={i} className="grid grid-cols-5 gap-2 mb-2">
          {["date", "timeIn", "timeOut", "tasksCompleted", "staffInitials"].map(k => (
            <input key={k} placeholder={k} className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs"
              value={v[k]} onChange={e => { const n = [...visits]; n[i][k] = e.target.value; setVisits(n); }} />
          ))}
        </div>
      ))}
    </div>
  );

  // Home Environment Checklist
  const renderChecklist = () => (
    <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700 mb-4">
      <h4 className="text-white font-semibold mb-3">Environment Checklist</h4>
      <table className="w-full text-sm"><thead><tr className="bg-[#4A49B0]/30 text-gray-300">
        <th className="p-2">Area</th><th className="p-2">Safe</th><th className="p-2">Unsafe</th><th className="p-2">Notes</th>
      </tr></thead><tbody>
        {checklistAreas.map((a, i) => (
          <tr key={i} className="border-b border-gray-700">
            <td className="p-2 text-gray-300">{a.area}</td>
            <td className="p-2"><select className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs"
              value={a.safe} onChange={e => { const n = [...checklistAreas]; n[i].safe = e.target.value; setChecklistAreas(n); }}>
              <option value="">-</option><option>✓</option>
            </select></td>
            <td className="p-2"><select className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs"
              value={a.unsafe} onChange={e => { const n = [...checklistAreas]; n[i].unsafe = e.target.value; setChecklistAreas(n); }}>
              <option value="">-</option><option>✗</option>
            </select></td>
            <td className="p-2"><input className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs w-full"
              value={a.notes} onChange={e => { const n = [...checklistAreas]; n[i].notes = e.target.value; setChecklistAreas(n); }} /></td>
          </tr>
        ))}
      </tbody></table>
    </div>
  );

  // Activities list
  const renderActivities = () => (
    <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700 mb-4">
      <div className="flex justify-between mb-3"><h4 className="text-white font-semibold">Activities Completed</h4>
        <button onClick={() => setActivities(p => [...p, ""])} className="text-xs bg-[#4A49B0] text-white px-2 py-1 rounded">+ Add</button>
      </div>
      {activities.map((a, i) => (
        <input key={i} className="w-full bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs mb-2" placeholder={`Activity ${i + 1}`}
          value={a} onChange={e => { const n = [...activities]; n[i] = e.target.value; setActivities(n); }} />
      ))}
    </div>
  );

  // Med table for daily notes
  const renderMedTable = () => (
    <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700 mb-4">
      <div className="flex justify-between mb-3"><h4 className="text-white font-semibold">Medication Given</h4>
        <button onClick={() => setMedRows(p => [...p, { medication: "", time: "", dose: "", staffInitials: "" }])} className="text-xs bg-[#4A49B0] text-white px-2 py-1 rounded">+ Add</button>
      </div>
      {medRows.map((m, i) => (
        <div key={i} className="grid grid-cols-4 gap-2 mb-2">
          {["medication", "time", "dose", "staffInitials"].map(k => (
            <input key={k} placeholder={k} className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs"
              value={m[k]} onChange={e => { const n = [...medRows]; n[i][k] = e.target.value; setMedRows(n); }} />
          ))}
        </div>
      ))}
    </div>
  );

  // Injury table
  const renderInjuries = () => (
    <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700 mb-4">
      <div className="flex justify-between mb-3"><h4 className="text-white font-semibold">Injury Details</h4>
        <button onClick={() => setInjuries(p => [...p, { person: "", injury: "", treatment: "" }])} className="text-xs bg-[#4A49B0] text-white px-2 py-1 rounded">+ Add</button>
      </div>
      {injuries.map((inj, i) => (
        <div key={i} className="grid grid-cols-3 gap-2 mb-2">
          {["person", "injury", "treatment"].map(k => (
            <input key={k} placeholder={k} className="bg-[#2d3b4e] border border-gray-600 rounded p-1 text-white text-xs"
              value={inj[k]} onChange={e => { const n = [...injuries]; n[i][k] = e.target.value; setInjuries(n); }} />
          ))}
        </div>
      ))}
    </div>
  );

  // VIEW Assessment Detail
  const renderViewDetail = (a) => {
    const tmpl = TEMPLATE_FIELDS[a.assessmentType];
    if (!tmpl) return <p className="text-gray-400">No template found</p>;
    const data = a[tmpl.key] || {};
    return (
      <div className="space-y-4">
        {tmpl.sections.map((sec, si) => (
          <div key={si}>
            {sec.fields && (
              <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700">
                <h4 className="text-indigo-400 font-semibold mb-3">{sec.title}</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {sec.fields.map(f => (
                    <div key={f.name} className={f.textarea ? "sm:col-span-2" : ""}>
                      <p className="text-xs text-gray-500">{f.label}</p>
                      <p className="text-white text-sm bg-[#2d3b4e] rounded p-2 border-l-4 border-[#4A49B0]">{data[f.name] || "N/A"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sec.table && sec.areas && (
              <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700 mt-3">
                <h4 className="text-indigo-400 font-semibold mb-3">{sec.title}</h4>
                <table className="w-full text-sm"><thead><tr className="bg-[#4A49B0]/20 text-gray-300">
                  <th className="p-2">Area</th><th className="p-2">Notes</th><th className="p-2">Level</th>
                </tr></thead><tbody>
                  {sec.areas.map(area => (
                    <tr key={area} className="border-b border-gray-700">
                      <td className="p-2 text-gray-300">{sec.areaLabels[area]}</td>
                      <td className="p-2 text-white text-xs">{data[`${area}_notes`] || "—"}</td>
                      <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs ${
                        data[`${area}_level`] === "Critical" ? "bg-red-500/20 text-red-400" :
                        data[`${area}_level`] === "High" ? "bg-orange-500/20 text-orange-400" :
                        data[`${area}_level`] === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-green-500/20 text-green-400"
                      }`}>{data[`${area}_level`] || "—"}</span></td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            )}
          </div>
        ))}
        {/* Show special data */}
        {data.goals && data.goals.length > 0 && (
          <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700">
            <h4 className="text-indigo-400 font-semibold mb-3">Goals & Outcomes</h4>
            <table className="w-full text-sm"><thead><tr className="bg-[#4A49B0]/20 text-gray-300">
              <th className="p-2">Goal</th><th className="p-2">Timeframe</th><th className="p-2">Progress</th>
            </tr></thead><tbody>
              {data.goals.map((g, i) => <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-white">{g.goal}</td><td className="p-2 text-gray-300">{g.timeframe}</td><td className="p-2 text-gray-300">{g.progress}</td>
              </tr>)}
            </tbody></table>
          </div>
        )}
        {data.risks && data.risks.length > 0 && (
          <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700">
            <h4 className="text-indigo-400 font-semibold mb-3">Risk Matrix</h4>
            <table className="w-full text-sm"><thead><tr className="bg-[#4A49B0]/20 text-gray-300">
              <th className="p-2">Risk</th><th className="p-2">L</th><th className="p-2">I</th><th className="p-2">Score</th><th className="p-2">Controls</th>
            </tr></thead><tbody>
              {data.risks.map((r, i) => <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-white">{r.risk}</td><td className="p-2 text-gray-300">{r.likelihood}</td>
                <td className="p-2 text-gray-300">{r.impact}</td>
                <td className={`p-2 font-bold ${r.score >= 15 ? "text-red-400" : r.score >= 8 ? "text-yellow-400" : "text-green-400"}`}>{r.score}</td>
                <td className="p-2 text-gray-300">{r.controls}</td>
              </tr>)}
            </tbody></table>
          </div>
        )}
        {data.consents && data.consents.length > 0 && (
          <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700">
            <h4 className="text-indigo-400 font-semibold mb-3">Consent Areas</h4>
            <table className="w-full text-sm"><thead><tr className="bg-[#4A49B0]/20 text-gray-300">
              <th className="p-2">Area</th><th className="p-2">Answer</th><th className="p-2">Notes</th>
            </tr></thead><tbody>
              {data.consents.map((c, i) => <tr key={i} className="border-b border-gray-700">
                <td className="p-2 text-white">{c.area}</td>
                <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs ${c.answer === "Yes" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{c.answer}</span></td>
                <td className="p-2 text-gray-300">{c.notes || "—"}</td>
              </tr>)}
            </tbody></table>
          </div>
        )}
      </div>
    );
  };

  // ======== MAIN RENDER ========
  if (loading) return <div className="text-white text-center py-10">Loading assessments...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaClipboardCheck className="text-[#4A49B0]" /> Assessment Records
        </h2>
        <button onClick={() => { setShowForm(!showForm); setViewAssessment(null); }}
          className="flex items-center gap-2 bg-[#4A49B0] hover:bg-[#5A58C9] text-white px-4 py-2 rounded-lg transition">
          {showForm ? <><FaTimes /> Cancel</> : <><FaPlus /> New Assessment</>}
        </button>
      </div>

      {/* VIEW Detail Modal */}
      {viewAssessment && (
        <div className="bg-[#243041] p-5 rounded-xl border border-[#4A49B0]/40 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">{viewAssessment.assessmentType}</h3>
              <p className="text-xs text-gray-400">Created: {new Date(viewAssessment.createdAt).toLocaleDateString()}</p>
              {viewAssessment.staff && (
                <p className="text-xs text-[#4A49B0] mt-1 font-semibold">
                  Care Provider: {viewAssessment.staff.fullName || viewAssessment.staff.firstName || "Unknown"}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleExportAssessment(viewAssessment)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition shadow">
                <FaFilePdf /> Export PDF
              </button>
              <button onClick={() => setViewAssessment(null)} className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded transition">
                <FaTimes /> Close
              </button>
            </div>
          </div>
          {renderViewDetail(viewAssessment)}
        </div>
      )}

      {/* CREATE FORM */}
      {showForm && !viewAssessment && (
        <div className="bg-[#243041] p-5 rounded-xl border border-[#4A49B0]/40 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Create New Assessment</h3>

          {/* Type Selector */}
          <div className="mb-5">
            <label className="text-sm text-gray-400 mb-1 block">Assessment Type</label>
            <select className="w-full bg-[#2d3b4e] border border-gray-600 rounded p-2 text-white"
              value={selectedType} onChange={e => { setSelectedType(e.target.value); setFormData({}); }}>
              <option value="">-- Select Template --</option>
              {ASSESSMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Dynamic Form */}
          {selectedType && TEMPLATE_FIELDS[selectedType] && (
            <div className="space-y-4">
              
              {/* Care Provider Selector (Now inside Assessment form) */}
              {TEMPLATE_FIELDS[selectedType].hasCareProviderDropdown && (
                <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700 mb-3">
                  <h4 className="text-indigo-400 font-semibold mb-3">Care Provider (Link Staff)</h4>
                  <label className="text-sm text-gray-400 mb-1 block">Select Staff Member</label>
                  <select className="w-full bg-[#2d3b4e] border border-gray-600 rounded p-2 text-white"
                    value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
                    <option value="">-- No Staff Linked --</option>
                    {staffMembers.map(staff => (
                      <option key={staff._id || staff.id} value={staff._id || staff.id}>
                        {staff.fullName || staff.firstName} - {staff.position || "Staff"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {TEMPLATE_FIELDS[selectedType].sections.map((sec, i) => (
                <div key={i}>
                  {sec.fields && (
                    <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700 mb-3">
                      <h4 className="text-indigo-400 font-semibold mb-3">{sec.title}</h4>
                      {renderFields(sec.fields)}
                    </div>
                  )}
                  {sec.table && renderAssessmentAreas(TEMPLATE_FIELDS[selectedType])}
                </div>
              ))}
              {TEMPLATE_FIELDS[selectedType].hasGoals && renderGoals()}
              {TEMPLATE_FIELDS[selectedType].hasRiskMatrix && renderRiskMatrix()}
              {TEMPLATE_FIELDS[selectedType].hasActivities && renderActivities()}
              {TEMPLATE_FIELDS[selectedType].hasMedTable && renderMedTable()}
              {TEMPLATE_FIELDS[selectedType].hasInjuries && renderInjuries()}
              {TEMPLATE_FIELDS[selectedType].hasConsents && renderConsents()}
              {TEMPLATE_FIELDS[selectedType].hasVisits && renderVisits()}
              {TEMPLATE_FIELDS[selectedType].hasChecklist && renderChecklist()}

              {/* ─── Supporting Documents ─── */}
              <div className="bg-[#1a2636] p-4 rounded-lg border border-gray-700 mb-4">
                <label className="text-sm text-gray-300 font-semibold flex items-center gap-2 mb-2">
                  <FaPaperclip /> Supporting Documents & Evidence
                </label>
                <p className="text-xs text-gray-400 mb-2">Attach scan results, external reports, body maps, referral letters, or any supporting documentation.</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={e => setAssessmentFiles(Array.from(e.target.files))}
                  className="w-full bg-[#2d3b4e] border border-gray-600 text-white rounded p-2 text-sm"
                />
                {assessmentFiles.length > 0 && <p className="text-xs text-green-400 mt-1">{assessmentFiles.length} file(s) ready to attach</p>}
              </div>

              <button onClick={handleSubmit} disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold transition">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaSave />}
                {saving ? "Saving..." : "Save Assessment"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ASSESSMENT LIST */}
      {!showForm && !viewAssessment && (
        <div className="space-y-3">
          {assessments.length === 0 ? (
            <div className="text-center py-16 bg-[#243041] rounded-xl border border-gray-700">
              <FaClipboardCheck className="text-5xl text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No assessments yet</p>
              <p className="text-gray-500 text-sm mt-1">Click &quot;New Assessment&quot; to create one</p>
            </div>
          ) : (
            assessments.map(a => (
              <div key={a._id} className="bg-[#243041] p-4 rounded-lg border border-gray-700 hover:border-[#4A49B0]/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-white font-semibold">{a.assessmentType}</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {new Date(a.createdAt).toLocaleDateString()} •
                    Status: <span className={`px-2 py-0.5 rounded text-xs ml-1 ${
                      a.status === "Completed" ? "bg-green-500/20 text-green-400" :
                      a.status === "Reviewed" ? "bg-blue-500/20 text-blue-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>{a.status}</span>
                  </p>
                  {a.staff && (
                    <p className="text-xs text-[#4A49B0] mt-1 font-medium">Link: {a.staff.fullName || a.staff.firstName}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setViewAssessment(a); setShowForm(false); }}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm transition">
                    <FaEye /> View
                  </button>
                  {isAdmin && (
                    <button onClick={() => handleDelete(a._id)}
                      className="flex items-center gap-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-3 py-1.5 rounded text-sm transition">
                      <FaTrash /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ResidentProfileAssessment;
