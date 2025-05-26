import React, { useState, useEffect } from "react";
import { database } from "../../firebase/config";
import { ref, push, get, set, update } from "firebase/database";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, User } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import StateSelect from "./SubComponents/ComboBox";
import StaffSearch from "./SubComponents/StaffSearch";
import CampStatusView from "./IncompleteCamps";

const ScheduledCamp = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isExistingClinic, setIsExistingClinic] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [campKey, setCampKey] = useState(null);
  const [selectedCampCode, setSelectedCampCode] = useState("");
  const [originalClinicData, setOriginalClinicData] = useState(null);
  const [hasChangedClinicData, setHasChangedClinicData] = useState(false);
  const [phleboDetails, setPhleboDetails] = useState({
    phleboName: "",
    phleboMobileNo: "",
  });
  const [isAlreadyScheduled, setIsAlreadyScheduled] = useState(false);

  const [isVendorConfirmed, setIsVendorConfirmed] = useState(false);
  const [isSchedulingEnabled, setIsSchedulingEnabled] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    campCode: "",
    clinicCode: "",
    address: "",
    district: "",
    state: "",
    pinCode: "",
    mobileNo: "",
    nurseName: "",
    teamLeader: "",
    dcName: "",
    agentName: "",
    roName: "",
    somName: "",
  });

  // Generate camp code when date changes
  useEffect(() => {
    if (formData.date && !formData.campCode) {
      const generateCampCode = () => {
        const dateStr = formData.date.replace(/-/g, "");
        const uniqueNum = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0");
        return `MSHC${dateStr}${uniqueNum}`;
      };
      setFormData((prev) => ({ ...prev, campCode: generateCampCode() }));
    }
  }, [formData.date]);

  const resetForm = () => {
    setFormData({
      date: "",
      campCode: "",
      clinicCode: "",
      address: "",
      district: "",
      state: "",
      pinCode: "",
      mobileNo: "",
      nurseName: "",
      teamLeader: "",
      dcName: "",
      agentName: "",
      roName: "",
      somName: "",
    });
    setPhleboDetails({
      phleboName: "",
      phleboMobileNo: "",
    });
    setIsExistingClinic(false);
    setError("");
    setFormErrors({});
    setShowForm(false);
    setSelectedCampCode("");
    setHasChangedClinicData(false);
    setOriginalClinicData(null);
    setCampKey(null);
    setIsVendorConfirmed(false);
    setIsSchedulingEnabled(false);
  };

  // Helper function to validate staff entry
  const validateStaffEntry = (value, field) => {
    if (!value) return false;
    if (value === "N/A (NA)") return true;
    const match = value.match(/^(.+)\s*\(([A-Z0-9]+)\)$/i);
    return !!match;
  };

  const addNewStaffMember = async (staffValue, role) => {
    const match = staffValue.match(/^(.+)\s*\(([A-Z0-9]+)\)$/i);
    if (!match) return false;
    const [_, name, empCode] = match;
    const roleType = role.replace(/s$/, "").toUpperCase();
    const displayName = `${name.trim()} (${empCode.toUpperCase()})`;

    try {
      const newStaffMember = {
        name: name.trim(),
        empCode: empCode.toUpperCase(),
        role: roleType,
        displayName,
      };

      // Add to role-specific collection
      const roleRef = ref(database, `staffData/${role}/${empCode}`);
      await set(roleRef, newStaffMember);

      // Add to flattened collection
      const flattenedRef = ref(database, `staffFlattened/${empCode}`);
      await set(flattenedRef, newStaffMember);
      return true;
    } catch (error) {
      console.error("Error adding staff member:", error);
      return false;
    }
  };

  // Fetch camp data when selected from CampStatusView
  const fetchCampData = async (campCode) => {
    if (!campCode) return;

    setLoading(true);
    setError("");
    setOriginalClinicData(null);
    setHasChangedClinicData(false);
    setIsAlreadyScheduled(false); // Reset the scheduled status

    try {
      // Get camp data first
      const campsRef = ref(database, "healthCamps");
      const campsSnapshot = await get(campsRef);

      if (campsSnapshot.exists()) {
        const camps = Object.entries(campsSnapshot.val());
        const [key, camp] = camps.find(
          ([_, camp]) => camp.campCode?.toUpperCase() === campCode.toUpperCase()
        ) || [null, null];

        if (camp) {
          setCampKey(key);
          setIsVendorConfirmed(camp.isConfirmed || false);
          setIsSchedulingEnabled(!!camp.phleboName && !!camp.phleboMobileNo);

          // Check if the camp is already scheduled
          setIsAlreadyScheduled(camp.status === "scheduled");

          // Set form data with existing camp data
          setFormData({
            date: camp.date || "",
            campCode: camp.campCode || "",
            clinicCode: camp.clinicCode || "",
            address: (camp.address || "").toUpperCase(),
            district: (camp.district || "").toUpperCase(),
            state: (camp.state || "").toUpperCase(),
            pinCode: (camp.pinCode || "").toUpperCase(),
            mobileNo: (camp.mobileNo || "").toUpperCase(),
            nurseName: camp.nurseName || "",
            teamLeader: camp.teamLeader || "",
            dcName: camp.dcName || "",
            agentName: camp.agentName || "",
            roName: camp.roName || "",
            somName: camp.somName || "",
          });

          setPhleboDetails({
            phleboName: camp.phleboName || "",
            phleboMobileNo: camp.phleboMobileNo || "",
          });

          // Check if this is an existing clinic
          const clinicRef = ref(database, `clinics/${camp.clinicCode}`);
          const clinicSnapshot = await get(clinicRef);

          if (clinicSnapshot.exists()) {
            setIsExistingClinic(true);
            setOriginalClinicData(clinicSnapshot.val());
          } else {
            setIsExistingClinic(false);
          }

          setShowForm(true);
        } else {
          setError("Camp not found");
          resetForm();
        }
      }
    } catch (err) {
      console.error("Error fetching camp data:", err);
      setError("Failed to fetch camp data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update the updateClinicAndCamps function
  const updateClinicAndAllCamps = async (clinicCode, updatedClinicData) => {
    try {
      // First update the clinic data
      const clinicRef = ref(database, `clinics/${clinicCode}`);
      const clinicSnapshot = await get(clinicRef);

      if (clinicSnapshot.exists()) {
        const clinicData = clinicSnapshot.val();
        await set(clinicRef, {
          ...clinicData,
          ...updatedClinicData,
          lastUpdated: new Date().toISOString(),
        });
      }

      // Then update ALL health camps with this clinic code, regardless of status
      const campsRef = ref(database, "healthCamps");
      const campsSnapshot = await get(campsRef);

      if (campsSnapshot.exists()) {
        const updates = {};
        Object.entries(campsSnapshot.val()).forEach(([campId, camp]) => {
          if (camp.clinicCode?.toUpperCase() === clinicCode.toUpperCase()) {
            updates[`/healthCamps/${campId}`] = {
              ...camp,
              ...updatedClinicData,
              lastModified: new Date().toISOString(),
            };
          }
        });

        if (Object.keys(updates).length > 0) {
          await update(ref(database), updates);
          console.log(
            `Updated ${
              Object.keys(updates).length
            } camps for clinic ${clinicCode}`
          );
          return Object.keys(updates).length; // Return number of camps updated
        }
      }

      return 0; // Return 0 if no camps were updated
    } catch (error) {
      console.error("Error updating clinic and camps:", error);
      throw error; // Rethrow to handle in calling function
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const upperValue = value.toUpperCase();

    // Check if this is a clinic field that's being changed
    if (
      isExistingClinic &&
      ["address", "district", "state", "pinCode", "mobileNo"].includes(name)
    ) {
      // Check if the value actually changed from the original
      if (originalClinicData && upperValue !== originalClinicData[name]) {
        setHasChangedClinicData(true);
      } else if (
        originalClinicData &&
        upperValue === originalClinicData[name]
      ) {
        // Check if this was the only changed field
        const tempFormData = { ...formData, [name]: upperValue };
        const stillHasChanges = [
          "address",
          "district",
          "state",
          "pinCode",
          "mobileNo",
        ].some((field) => originalClinicData[field] !== tempFormData[field]);
        setHasChangedClinicData(stillHasChanges);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: upperValue,
    }));
  };

  const validateForm = () => {
    const errors = {};
    // Required field validation
    const requiredFields = [
      "date",
      "clinicCode",
      "address",
      "district",
      "state",
      "pinCode",
      "mobileNo",
    ];
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        errors[field] = "This field is required";
      }
    });

    // Pin code validation
    if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
      errors.pinCode = "Pin code must be 6 digits";
    }

    // Mobile number validation
    if (formData.mobileNo && !/^\d{10}$/.test(formData.mobileNo)) {
      errors.mobileNo = "Mobile number must be 10 digits";
    }

    // Staff validation
    const staffFields = {
      nurseName: "nurses",
      teamLeader: "teamLeaders",
      dcName: "districtCoordinators",
      agentName: "agents",
      roName: "regionalOfficers",
      somName: "salesOfficerManagers",
    };

    for (const [field, role] of Object.entries(staffFields)) {
      if (!formData[field]) {
        errors[field] = "Staff member is required";
      } else if (!validateStaffEntry(formData[field], field)) {
        errors[field] = "Invalid staff format. Use: NAME (CODE)";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePhleboDetailsSubmit = async () => {
    if (!phleboDetails.phleboName || !phleboDetails.phleboMobileNo) {
      toast({
        title: "Error",
        description: "Please provide both phlebotomist name and mobile number",
        variant: "destructive",
      });
      return;
    }

    // Validate mobile number
    if (!/^\d{10}$/.test(phleboDetails.phleboMobileNo)) {
      toast({
        title: "Error",
        description: "Mobile number must be 10 digits",
        variant: "destructive",
      });
      return;
    }

    try {
      // If we have a campKey, update the existing camp with phlebo details
      if (campKey) {
        const campRef = ref(database, `healthCamps/${campKey}`);
        await update(campRef, {
          phleboName: phleboDetails.phleboName,
          phleboMobileNo: phleboDetails.phleboMobileNo,
          lastModified: new Date().toISOString(),
          lastModifiedBy: currentUser.email,
        });
      }

      // Here you would typically also send an email to the vendor
      console.log("Email sent to vendor with phlebo details:", phleboDetails);

      setIsSchedulingEnabled(true);
      toast({
        title: "Success",
        description: isSchedulingEnabled
          ? "Phlebotomist details updated successfully."
          : "Phlebotomist details submitted. Scheduling is now enabled.",
      });
    } catch (error) {
      console.error("Error updating phlebotomist details:", error);
      toast({
        title: "Error",
        description: "Failed to update phlebotomist details",
        variant: "destructive",
      });
    }
  };

  const confirmVendor = () => {
    // Set the vendor as confirmed and update database if needed
    setIsVendorConfirmed(true);
    setShowConfirmDialog(false);

    // You may want to update the database here
    if (campKey) {
      const campRef = ref(database, `healthCamps/${campKey}`);
      update(campRef, {
        isConfirmed: true,
        vendorConfirmedAt: new Date().toISOString(),
        vendorConfirmedBy: currentUser.email,
      }).catch((error) => {
        console.error("Error updating vendor confirmation:", error);
        toast({
          title: "Error",
          description: "Failed to update vendor confirmation status",
          variant: "destructive",
        });
      });
    }

    // Show success message
    toast({
      title: "Success",
      description:
        "Vendor confirmed successfully. Now you can add phlebotomist details.",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate form
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const staffFields = {
        nurseName: "nurses",
        teamLeader: "teamLeaders",
        dcName: "districtCoordinators",
        agentName: "agents",
        roName: "regionalOfficers",
        somName: "salesOfficerManagers",
      };

      // Handle staff updates and additions
      for (const [field, role] of Object.entries(staffFields)) {
        // Skip if the field is empty or N/A
        if (!formData[field] || formData[field] === "N/A (NA)") continue;

        // Validate staff entry
        if (!validateStaffEntry(formData[field], field)) {
          setError(`Invalid ${field} format. Use: NAME (CODE)`);
          setLoading(false);
          return;
        }

        // Add new staff member if not N/A
        if (formData[field] !== "N/A (NA)") {
          try {
            await addNewStaffMember(formData[field], role);
          } catch (error) {
            console.error(`Error adding new staff member for ${field}:`, error);
            setError(`Failed to add new staff member for ${field}`);
            setLoading(false);
            return;
          }
        }
      }

      // Check for changes in clinic data fields
      let hasClinicChanges = false;
      let updatedClinicData = {};

      if (isExistingClinic) {
        // Fields to compare for clinic data updates
        const clinicFields = [
          "address",
          "district",
          "state",
          "pinCode",
          "mobileNo",
          "nurseName",
          "teamLeader",
          "dcName",
          "agentName",
          "roName",
          "somName",
        ];

        for (const field of clinicFields) {
          if (formData[field] !== originalClinicData?.[field]) {
            updatedClinicData[field] = formData[field];
            hasClinicChanges = true;
          }
        }

        // Update clinic and related camps if there are changes
        if (hasClinicChanges) {
          try {
            const updatedCampsCount = await updateClinicAndAllCamps(
              formData.clinicCode,
              updatedClinicData
            );

            toast({
              title: "Success",
              description: `Updated clinic and ${updatedCampsCount} related health camps`,
            });
          } catch (error) {
            console.error("Error updating records:", error);
            setError("Failed to update clinic and camp records");
            setLoading(false);
            return;
          }
        }
      } else {
        // Save new clinic data for non-existing clinics
        const clinicData = {
          clinicCode: formData.clinicCode,
          address: formData.address,
          district: formData.district,
          state: formData.state,
          pinCode: formData.pinCode,
          mobileNo: formData.mobileNo,
          nurseName: formData.nurseName,
          teamLeader: formData.teamLeader,
          dcName: formData.dcName,
          agentName: formData.agentName,
          roName: formData.roName,
          somName: formData.somName,
          lastUpdated: new Date().toISOString(),
        };

        try {
          const newClinicRef = ref(database, `clinics/${formData.clinicCode}`);
          await set(newClinicRef, clinicData);
        } catch (err) {
          console.error("Error saving clinic data:", err);
          setError("Failed to save clinic data: " + err.message);
          setLoading(false);
          return;
        }
      }

      // Update existing camp or create new one
      if (campKey) {
        // Update existing camp
        const campRef = ref(database, `healthCamps/${campKey}`);
        await update(campRef, {
          ...formData,
          ...phleboDetails,
          status: "scheduled",
          isConfirmed: true,
          lastModified: new Date().toISOString(),
          lastModifiedBy: currentUser.email,
        });

        toast({
          title: "Success",
          description: "Camp scheduled successfully!",
        });
      } else {
        // Create new camp
        const newCamp = {
          ...formData,
          ...phleboDetails,
          status: "scheduled",
          isConfirmed: true,
          createdBy: currentUser.email,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };

        // Save new camp data
        const campRef = ref(database, "healthCamps");
        await push(campRef, newCamp);

        toast({
          title: "Success",
          description: "New camp scheduled successfully!",
        });
      }

      // Additional alert for immediate feedback
      alert("Camp scheduled successfully!");
      resetForm();
    } catch (err) {
      console.error("Error scheduling camp:", err);
      setError("Failed to schedule camp: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <CampStatusView
          activeContext="schedule"
          onCampCodeClick={(campCode) => {
            setSelectedCampCode(campCode);
            fetchCampData(campCode);
          }}
        />
      </div>
      <Card className="w-full max-w-8xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Schedule Health Camp
          </CardTitle>
          <CardDescription>
            {!showForm
              ? "Select a camp from above or fill in details for a new camp"
              : "Complete all required details to schedule the health camp"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Camp Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Calendar className="mr-2 text-primary" />
                  Camp Details
                </h3>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className={formErrors.date ? "border-red-500" : ""}
                  />
                  {formErrors.date && (
                    <span className="text-xs text-red-500">
                      {formErrors.date}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Camp Code</Label>
                  <Input
                    type="text"
                    value={formData.campCode}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center">
                    Clinic Code
                    {isExistingClinic && (
                      <span className="ml-2 text-green-600 text-xs">
                        ✓ Clinic Found
                      </span>
                    )}
                  </Label>
                  <Input
                    type="text"
                    name="clinicCode"
                    value={formData.clinicCode}
                    onChange={handleChange}
                    required
                    className={formErrors.clinicCode ? "border-red-500" : ""}
                  />
                  {formErrors.clinicCode && (
                    <span className="text-xs text-red-500">
                      {formErrors.clinicCode}
                    </span>
                  )}
                </div>
              </div>

              {/* Location Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <MapPin className="mr-2 text-primary" />
                  Location Details
                  {isExistingClinic && hasChangedClinicData && (
                    <span className="ml-2 text-amber-600 text-xs">
                      (Clinic data will be updated)
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className={formErrors.address ? "border-red-500" : ""}
                  />
                  {formErrors.address && (
                    <span className="text-xs text-red-500">
                      {formErrors.address}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>District</Label>
                    <Input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      required
                      className={formErrors.district ? "border-red-500" : ""}
                    />
                    {formErrors.district && (
                      <span className="text-xs text-red-500">
                        {formErrors.district}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <StateSelect
                      value={formData.state}
                      onChange={(value) => {
                        const prevState = formData.state;
                        setFormData((prev) => ({
                          ...prev,
                          state: value,
                        }));

                        // Check if this is a change to an existing clinic
                        if (
                          isExistingClinic &&
                          originalClinicData &&
                          value !== originalClinicData.state
                        ) {
                          setHasChangedClinicData(true);
                        } else if (
                          isExistingClinic &&
                          originalClinicData &&
                          value === originalClinicData.state &&
                          prevState !== value
                        ) {
                          // Check if other fields still have changes
                          const stillHasChanges = [
                            "address",
                            "district",
                            "pinCode",
                            "mobileNo",
                          ].some(
                            (field) =>
                              originalClinicData[field] !== formData[field]
                          );
                          setHasChangedClinicData(stillHasChanges);
                        }
                      }}
                      error={!!formErrors.state}
                    />
                    {formErrors.state && (
                      <span className="text-xs text-red-500">
                        {formErrors.state}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pin Code</Label>
                    <Input
                      type="text"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handleChange}
                      required
                      pattern="[0-9]{6}"
                      className={formErrors.pinCode ? "border-red-500" : ""}
                    />
                    {formErrors.pinCode && (
                      <span className="text-xs text-red-500">
                        {formErrors.pinCode}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number</Label>
                    <Input
                      type="tel"
                      name="mobileNo"
                      value={formData.mobileNo}
                      onChange={handleChange}
                      required
                      pattern="[0-9]{10}"
                      className={formErrors.mobileNo ? "border-red-500" : ""}
                    />
                    {formErrors.mobileNo && (
                      <span className="text-xs text-red-500">
                        {formErrors.mobileNo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Details Section */}
            <div className="space-y-4 pt-6">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="mr-2 text-primary" />
                Staff Details
                {isExistingClinic && (
                  <span className="ml-2 text-xs text-blue-600">
                    (Update staff assignments as needed)
                  </span>
                )}
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nurse Name</Label>
                  <StaffSearch
                    value={formData.nurseName}
                    onSelect={(value) => {
                      setFormData((prev) => ({ ...prev, nurseName: value }));

                      // Check if this is a change to an existing clinic
                      if (
                        isExistingClinic &&
                        originalClinicData &&
                        value !== originalClinicData.nurseName
                      ) {
                        setHasChangedClinicData(true);
                      }
                    }}
                    role="nurses"
                    label="Select Nurse"
                    error={!!formErrors.nurseName}
                  />
                  {formErrors.nurseName && (
                    <span className="text-xs text-red-500">
                      {formErrors.nurseName}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Team Leader</Label>
                  <StaffSearch
                    value={formData.teamLeader}
                    onSelect={(value) => {
                      setFormData((prev) => ({ ...prev, teamLeader: value }));

                      // Check if this is a change to an existing clinic
                      if (
                        isExistingClinic &&
                        originalClinicData &&
                        value !== originalClinicData.teamLeader
                      ) {
                        setHasChangedClinicData(true);
                      }
                    }}
                    role="teamLeaders"
                    label="Select Team Leader"
                    error={!!formErrors.teamLeader}
                  />
                  {formErrors.teamLeader && (
                    <span className="text-xs text-red-500">
                      {formErrors.teamLeader}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>DC Name</Label>
                  <StaffSearch
                    value={formData.dcName}
                    onSelect={(value) => {
                      setFormData((prev) => ({ ...prev, dcName: value }));

                      // Check if this is a change to an existing clinic
                      if (
                        isExistingClinic &&
                        originalClinicData &&
                        value !== originalClinicData.dcName
                      ) {
                        setHasChangedClinicData(true);
                      }
                    }}
                    role="districtCoordinators"
                    label="Select DC"
                    error={!!formErrors.dcName}
                  />
                  {formErrors.dcName && (
                    <span className="text-xs text-red-500">
                      {formErrors.dcName}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Agent Name</Label>
                  <StaffSearch
                    value={formData.agentName}
                    onSelect={(value) => {
                      setFormData((prev) => ({ ...prev, agentName: value }));

                      // Check if this is a change to an existing clinic
                      if (
                        isExistingClinic &&
                        originalClinicData &&
                        value !== originalClinicData.agentName
                      ) {
                        setHasChangedClinicData(true);
                      }
                    }}
                    role="agents"
                    label="Select Agent"
                    error={!!formErrors.agentName}
                  />
                  {formErrors.agentName && (
                    <span className="text-xs text-red-500">
                      {formErrors.agentName}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>RO Name</Label>
                  <StaffSearch
                    value={formData.roName}
                    onSelect={(value) => {
                      setFormData((prev) => ({ ...prev, roName: value }));

                      // Check if this is a change to an existing clinic
                      if (
                        isExistingClinic &&
                        originalClinicData &&
                        value !== originalClinicData.roName
                      ) {
                        setHasChangedClinicData(true);
                      }
                    }}
                    role="regionalOfficers"
                    label="Select RO"
                    error={!!formErrors.roName}
                  />
                  {formErrors.roName && (
                    <span className="text-xs text-red-500">
                      {formErrors.roName}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>SOM Name</Label>
                  <StaffSearch
                    value={formData.somName}
                    onSelect={(value) => {
                      setFormData((prev) => ({ ...prev, somName: value }));

                      // Check if this is a change to an existing clinic
                      if (
                        isExistingClinic &&
                        originalClinicData &&
                        value !== originalClinicData.somName
                      ) {
                        setHasChangedClinicData(true);
                      }
                    }}
                    role="salesOfficerManagers"
                    label="Select SOM"
                    error={!!formErrors.somName}
                  />
                  {formErrors.somName && (
                    <span className="text-xs text-red-500">
                      {formErrors.somName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Vendor Confirmation Section */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="mr-2 text-primary" />
                Vendor Management
              </h3>

              <div className="flex items-center space-x-2 mb-4">
                <div className="flex-1">
                  <Label className="text-md">Vendor Confirmation Status</Label>
                  <p className="text-sm text-gray-500">
                    Confirm vendor before assigning phlebotomist details
                  </p>
                </div>
                <Button
                  type="button"
                  variant={isVendorConfirmed ? "default" : "outline"}
                  onClick={() => {
                    if (!isVendorConfirmed) {
                      setShowConfirmDialog(true);
                    }
                    // No action if already confirmed - cannot unconfirm
                  }}
                  className="min-w-[130px]"
                  disabled={isVendorConfirmed}
                >
                  {isVendorConfirmed ? "Confirmed ✓" : "Confirm Vendor"}
                </Button>
              </div>
            </div>

            {/* Phlebo Details Section */}
            {isVendorConfirmed && (
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="mr-2 text-primary" />
                  Phlebotomist Details
                  <span
                    className={`ml-2 text-xs ${
                      isSchedulingEnabled ? "text-green-600" : "text-amber-600"
                    }`}
                  >
                    {isSchedulingEnabled
                      ? "(Details Submitted)"
                      : "(Required for Scheduling)"}
                  </span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phlebotomist Name</Label>
                    <Input
                      type="text"
                      value={phleboDetails.phleboName}
                      onChange={(e) =>
                        setPhleboDetails((prev) => ({
                          ...prev,
                          phleboName: e.target.value,
                        }))
                      }
                      className={
                        !phleboDetails.phleboName && !isSchedulingEnabled
                          ? "border-amber-300"
                          : ""
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phlebotomist Mobile No</Label>
                    <Input
                      type="tel"
                      value={phleboDetails.phleboMobileNo}
                      onChange={(e) =>
                        setPhleboDetails((prev) => ({
                          ...prev,
                          phleboMobileNo: e.target.value,
                        }))
                      }
                      className={
                        !phleboDetails.phleboMobileNo && !isSchedulingEnabled
                          ? "border-amber-300"
                          : ""
                      }
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant={isSchedulingEnabled ? "outline" : "default"}
                  onClick={handlePhleboDetailsSubmit}
                >
                  {isSchedulingEnabled
                    ? "Update Phlebotomist Details"
                    : "Submit Phlebotomist Details"}
                </Button>
              </div>
            )}

            {/* Form Controls */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  navigate("/health-camp");
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !isSchedulingEnabled || isAlreadyScheduled}
                className={cn("flex items-center", {
                  "opacity-50 cursor-not-allowed":
                    !isSchedulingEnabled || isAlreadyScheduled,
                })}
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4">●</div>
                    Scheduling...
                  </>
                ) : isAlreadyScheduled ? (
                  "Already Scheduled"
                ) : (
                  "Schedule Camp"
                )}
              </Button>
              
            </div>
            {isAlreadyScheduled && (
                <Alert className="mt-4 border-green-400 bg-green-50">
                  <AlertTitle>Camp Already Scheduled</AlertTitle>
                  <AlertDescription>
                    This camp has already been scheduled. You can view its
                    details but cannot reschedule it.
                  </AlertDescription>
                </Alert>
              )}

            {/* Status Notifications */}
            {campKey && (
              <Alert
                className={
                  hasChangedClinicData
                    ? "mt-4 border-amber-400 bg-amber-50"
                    : "mt-4"
                }
              >
                <AlertTitle>
                  {hasChangedClinicData
                    ? "Existing Clinic Data Will Be Updated"
                    : selectedCampCode
                    ? "Camp Selected"
                    : "Creating New Camp"}
                </AlertTitle>
                <AlertDescription>
                  {hasChangedClinicData
                    ? "You have modified clinic data. These changes will update this clinic and all related health camps."
                    : selectedCampCode
                    ? "You are updating and scheduling an existing camp. Review all details before proceeding."
                    : "Fill in all required details to create and schedule a new health camp."}
                </AlertDescription>
              </Alert>
            )}

            {isExistingClinic && !hasChangedClinicData && (
              <Alert className="mt-4">
                <AlertTitle>Existing Clinic Found</AlertTitle>
                <AlertDescription>
                  Using existing clinic data. You can edit any field if needed.
                </AlertDescription>
              </Alert>
            )}

            {isVendorConfirmed && !isSchedulingEnabled && (
              <Alert className="mt-4 border-blue-400 bg-blue-50">
                <AlertTitle>Vendor Confirmed</AlertTitle>
                <AlertDescription>
                  Please provide phlebo details to enable scheduling.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Vendor Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to confirm this vendor? Once confirmed, this
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVendor}>
              Yes, Confirm Vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ScheduledCamp;
