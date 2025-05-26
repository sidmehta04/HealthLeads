import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, X, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const StaffPerformanceDashboard = ({ healthCampData }) => {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Store references to each table's scroll container
  const scrollRefs = useRef({});
  
  // Function to download staff details as CSV
  const downloadStaffDetails = () => {
    // Prepare the data for download
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    csvContent += "Role,Name,Camps Done,Total Units,Avg Units/Camp\n";
    
    // Add data rows for each staff member across all roles
    Object.entries(staffMetrics).forEach(([roleKey, roleData]) => {
      const roleName = Object.values(roleData)[0]?.role || roleKey;
      
      Object.values(roleData).forEach(staff => {
        csvContent += `${roleName},${staff.name},${staff.campsDone},${staff.unitsSold},${staff.avgUnitsSold.toFixed(1)}\n`;
      });
    });
    
    // Create download link and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "staff_performance_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const extractStaffName = (staffField) => {
    if (!staffField) return null;
    const name = staffField.split('(')[0]?.trim();
    return name === 'N/A' ? null : name;
  };

  const normalizeStaffName = (name) => {
    return name ? name.toLowerCase() : null;
  };

  const getStaffMetrics = (data) => {
    const staffMetrics = {
      TL: { role: 'Team Leader', field: 'teamLeader' },
      SOM: { role: 'SOM', field: 'somName' },
      ROM: { role: 'ROM', field: 'roName' },
      DC: { role: 'DC', field: 'dcName' },
      Agent: { role: 'Agent', field: 'agentName' },
      Nurse: { role: 'Nurse', field: 'nurseName' }
    };
    
    const metrics = {};
    const nameMap = {}; // To store the display name for each normalized name
    
    Object.entries(staffMetrics).forEach(([key, { role }]) => {
      metrics[key] = {};
    });

    data.forEach(camp => {
      Object.entries(staffMetrics).forEach(([key, { role, field }]) => {
        const originalStaffName = extractStaffName(camp[field]);
        if (!originalStaffName) return;
        
        // Normalize the name for comparison but preserve original case for display
        const staffName = normalizeStaffName(originalStaffName);
        
        // Keep track of the display name (we'll use the first encountered version)
        if (!nameMap[staffName]) {
          nameMap[staffName] = originalStaffName;
        }

        if (!metrics[key][staffName]) {
          metrics[key][staffName] = {
            name: nameMap[staffName], // Use the display name for UI
            normalizedName: staffName, // Keep the normalized name for comparison
            role,
            campsDone: 0,
            unitsSold: 0,
            avgUnitsSold: 0
          };
        }

        const staff = metrics[key][staffName];
        staff.campsDone += 1;
        staff.unitsSold += parseInt(camp.unitsSold || 0);
        staff.avgUnitsSold = staff.unitsSold / staff.campsDone;

        if (!staff.relatedStaff) {
          staff.relatedStaff = {};
        }

        Object.entries(staffMetrics).forEach(([relatedKey, { field: relatedField }]) => {
          if (relatedKey === key) return;
          if (!staff.relatedStaff[relatedKey]) {
            staff.relatedStaff[relatedKey] = {};
          }
          
          const originalRelatedName = extractStaffName(camp[relatedField]);
          if (!originalRelatedName) return;
          
          const relatedName = normalizeStaffName(originalRelatedName);
          
          // Track display name for related staff too
          if (!nameMap[relatedName]) {
            nameMap[relatedName] = originalRelatedName;
          }

          if (!staff.relatedStaff[relatedKey][relatedName]) {
            staff.relatedStaff[relatedKey][relatedName] = {
              name: nameMap[relatedName], // Use the display name for UI
              normalizedName: relatedName, // Keep the normalized name for comparison
              campsDone: 0,
              unitsSold: 0,
              avgUnitsSold: 0
            };
          }

          const relatedStaff = staff.relatedStaff[relatedKey][relatedName];
          relatedStaff.campsDone += 1;
          relatedStaff.unitsSold += parseInt(camp.unitsSold || 0);
          relatedStaff.avgUnitsSold = relatedStaff.unitsSold / relatedStaff.campsDone;
        });
      });
    });
    return metrics;
  };

  const staffMetrics = getStaffMetrics(healthCampData);

  const filterStaffBySearch = (roleData) => {
    if (!searchQuery) return roleData;
    
    const normalizedQuery = searchQuery.toLowerCase();
    
    return Object.fromEntries(
      Object.entries(roleData).filter(([_, staff]) =>
        staff.normalizedName.includes(normalizedQuery)
      )
    );
  };

  const handleStaffClick = (staff, role, e) => {
    e.preventDefault();
    setSelectedStaff(staff);
    setSelectedRole(role);
  };

  const handleClearSelection = () => {
    setSelectedStaff(null);
    setSelectedRole(null);
  };

  const StaffTable = ({ roleData, title, role }) => {
    const filteredData = filterStaffBySearch(roleData);
    const hasData = Object.keys(filteredData).length > 0;
    
    // Use a ref to reference the scroll container
    if (!scrollRefs.current[role]) {
      scrollRefs.current[role] = React.createRef();
    }

    if (!hasData) return null;

    // Sort staff members to show related staff at the top
    const sortedStaff = Object.values(filteredData).sort((a, b) => {
      if (!selectedStaff) return 0;
      
      // Use normalized names for comparison
      const aIsRelated = selectedStaff.relatedStaff[role]?.[a.normalizedName];
      const bIsRelated = selectedStaff.relatedStaff[role]?.[b.normalizedName];
      
      if (aIsRelated && !bIsRelated) return -1;
      if (!aIsRelated && bIsRelated) return 1;
      return 0;
    });

    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="overflow-auto h-80 w-full" 
            ref={scrollRefs.current[role]}
          >
            <Table>
              <TableHeader style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Camps Done</TableHead>
                  <TableHead className="text-right">Total Units</TableHead>
                  <TableHead className="text-right">Avg Units/Camp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStaff.map((staff, index) => {
                  // Compare normalized names for selection and relation checks
                  const isSelected = selectedStaff?.normalizedName === staff.normalizedName;
                  const isRelated = selectedStaff?.relatedStaff[role]?.[staff.normalizedName];
                  
                  const rowClass = isSelected 
                    ? 'bg-blue-100 hover:bg-blue-200' 
                    : isRelated 
                      ? 'bg-blue-50 hover:bg-blue-100' 
                      : 'hover:bg-gray-100';

                  return (
                    <TableRow 
                      key={index}
                      className={`cursor-pointer transition-colors ${rowClass}`}
                      onClick={(e) => handleStaffClick(staff, role, e)}
                    >
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell className="text-right">{staff.campsDone}</TableCell>
                      <TableCell className="text-right">{staff.unitsSold}</TableCell>
                      <TableCell className="text-right">
                        {staff.avgUnitsSold.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Staff Performance Dashboard</h2>
          {selectedStaff && (
            <button
              onClick={handleClearSelection}
              className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
              Clear Selection
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={downloadStaffDetails}
          >
            <Download className="h-4 w-4" />
            Download Staff Details
          </Button>
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {Object.entries(staffMetrics).map(([role, data]) => (
          <StaffTable 
            key={role} 
            roleData={data} 
            role={role}
            title={`${Object.values(data)[0]?.role || role} Performance`}
          />
        ))}
      </div>
    </div>
  );
};

export default StaffPerformanceDashboard;