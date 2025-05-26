import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { ColumnHeader } from "./FilterComponent";
import { DownloadButton } from "./Download";

export const HealthCampComponent = ({ data, filterOptions, userRole }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState({});
  const [activeFilter, setActiveFilter] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'date', direction: 'desc' });
  const itemsPerPage = 15;

  // Modified to show only date without time
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Format number for display
  const formatNumber = (value) => {
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string' && !isNaN(value)) {
      return parseFloat(value);
    }
    return value;
  };

  const getUniqueValues = (field) => {
    if (field === 'date') {
      return [];  // Date field will use calendar picker instead
    }
    if (field.startsWith('staff_')) {
      const staffType = field.split('_')[1];
      const staffFieldMap = {
        agent: 'agentName',
        nurse: 'nurseName',
        som: 'somName',
        dc: 'dcName',
        teamLeader: 'teamLeader',
        phlebo: 'phleboName'
      };
      return [...new Set(data.map(item => item[staffFieldMap[staffType]]))]
        .filter(Boolean)
        .sort();
    }
    return [...new Set(data.map(item => item[field]))].filter(Boolean).sort();
  };

  const getStatusColor = (status) => ({
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100",
    pending: "bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100",
    active: "bg-sky-50 text-sky-700 border-sky-200 shadow-sky-100",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200 shadow-rose-100",
    sent: "bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100"
  }[status?.toLowerCase()] || "bg-gray-50 text-gray-700 border-gray-200 shadow-gray-100");

  const handleFilterChange = (field, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    setSortConfig(prevSort => ({
      field,
      direction: prevSort.field === field && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const columnConfig = [
    { header: "Camp Code", field: "campCode", sortable: true },
    { header: "Clinic Code", field: "clinicCode", sortable: true },
    { header: "Date", field: "date", sortable: true, type: "date" },
    { header: "Agent Name", field: "agentName", sortable: true },
    { header: "Nurse Name", field: "nurseName", sortable: true },
    { header: "DC Name", field: "dcName", sortable: true },
    { header: "SOM Name", field: "somName", sortable: true },
    { header: "RO Name", field: "roName", sortable: true },
    { header: "Team Leader", field: "teamLeader", sortable: true },
    { header: "Phlebo Name", field: "phleboName", sortable: true },
    { header: "Phlebo Mobile", field: "phleboMobileNo", sortable: true },
    { header: "Mobile No", field: "mobileNo", sortable: true },
    { header: "Address", field: "address", sortable: true },
    { header: "District", field: "district", sortable: true },
    { header: "State", field: "state", sortable: true },
    { header: "Pin Code", field: "pinCode", sortable: true },
    { header: "Partner Name", field: "partnerName", sortable: true },
    { header: "Partner Adjusted Count", field: "partnerAdjustedCount", sortable: true, type: "number" },
    { header: "Partner Adjustment Amount", field: "partnerAdjustmentAmount", sortable: true, type: "number" },
    { header: "Units Sold", field: "unitsSold", sortable: true, type: "number" },
    { header: "Revenue", field: "revenue", sortable: true, type: "number" },
    { header: "Amount Paid", field: "amountPaidToFinance", sortable: true, type: "number" },
    { header: "Marketing Expense", field: "marketingExpense", sortable: true, type: "number" },
    { header: "Operational Expense", field: "operationalExpense", sortable: true, type: "number" },
    { header: "Transaction ID", field: "transactionId", sortable: true },
    { header: "Vendor Name", field: "vendorName", sortable: true },
    { header: "Status", field: "status", sortable: true },
    { header: "Report Status", field: "reportStatus", sortable: true },
    { header: "Report Status Updated At", field: "reportStatusUpdatedAt", sortable: true, type: "date" },
    { header: "Report Status Updated By", field: "reportStatusUpdatedBy", sortable: true },
    { header: "Created At", field: "createdAt", sortable: true, type: "date" },
    { header: "Created By", field: "createdBy", sortable: true },
    { header: "Completed At", field: "completedAt", sortable: true, type: "date" },
    { header: "Completed By", field: "completedBy", sortable: true },
    { header: "Last Modified", field: "lastModified", sortable: true, type: "date" }
  ];

  // Apply filters and sorting
  const sortAndFilterData = (data) => {
    // First apply filters
    let filteredData = data.filter(item => {
      return Object.entries(columnFilters).every(([field, value]) => {
        if (!value) return true;
        if (field === 'date' && value instanceof Date) {
          const itemDate = new Date(item[field]);
          return itemDate.toDateString() === value.toDateString();
        }
        return item[field] === value;
      });
    });

    // Then apply sorting
    if (sortConfig.field) {
      filteredData.sort((a, b) => {
        let aValue = a[sortConfig.field];
        let bValue = b[sortConfig.field];

        // Handle date fields
        if (sortConfig.field.includes('At') || sortConfig.field === 'date' || sortConfig.field === 'lastModified' || sortConfig.field === 'reportStatusUpdatedAt') {
          aValue = new Date(aValue || 0).getTime();
          bValue = new Date(bValue || 0).getTime();
        }
        // Handle numeric fields
        else if (typeof aValue === 'number' && typeof bValue === 'number') {
          // Already in correct format
        }
        // Handle string fields
        else {
          aValue = (aValue || '').toString().toLowerCase();
          bValue = (bValue || '').toString().toLowerCase();
        }

        if (sortConfig.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return filteredData;
  };

  const filteredAndSortedData = sortAndFilterData(data);
  const pageCount = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="mb-6 shadow-lg border border-gray-100 rounded-lg overflow-hidden">
      <CardHeader className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-gray-900 font-semibold">
            Health Camp Records
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors px-3 py-1 text-xs">
              Total: {filteredAndSortedData.length}
            </Badge>
            {Object.keys(columnFilters).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setColumnFilters({});
                  setActiveFilter(null);
                }}
                className="h-8 text-xs"
              >
                Clear All Filters
              </Button>
            )}
            {userRole === "superadmin" && (
              <DownloadButton 
                data={filteredAndSortedData.map(row => {
                  const formattedRow = { ...row };
                  columnConfig.forEach(({ field, type }) => {
                    if (type === 'date' && row[field]) {
                      formattedRow[field] = formatDate(row[field]);
                    } else if (type === 'number' && row[field]) {
                      formattedRow[field] = formatNumber(row[field]);
                    }
                  });
                  return formattedRow;
                })}
                filename="health_camp_records"
                columns={columnConfig}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b">
                {columnConfig.map(({ header, field, sortable }) => (
                  <TableHead 
                    key={field}
                    className="text-xs font-medium text-gray-600 px-4 py-3 relative whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      {field === 'date' ? (
                        <div className="flex items-center gap-2">
                          <span>{header}</span>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="h-8 w-8 p-0"
                              >
                                <CalendarIcon className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={columnFilters[field]}
                                onSelect={(date) => handleFilterChange(field, date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      ) : (
                        <ColumnHeader
                          field={field}
                          header={header}
                          value={columnFilters[field]}
                          options={getUniqueValues(field)}
                          onFilterChange={handleFilterChange}
                          isActive={activeFilter === field}
                          onFilterClick={(field) => setActiveFilter(field)}
                        />
                      )}
                      {sortable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleSort(field)}
                        >
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnConfig.length} className="text-center py-8">
                    <div className="flex flex-col items-center text-gray-500">
                      <span className="text-sm">No records found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((camp) => (
                  <TableRow 
                    key={camp.id} 
                    className="hover:bg-gray-50 transition-colors border-b"
                  >
                    {columnConfig.map(({ field, type }) => (
                      <TableCell 
                        key={field} 
                        className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap"
                      >
                        {type === 'date' ? (
                          formatDate(camp[field])
                        ) : field === 'reportStatus' || field === 'status' ? (
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium shadow-sm ${getStatusColor(camp[field])}`}>
                            {camp[field]}
                          </span>
                        ) : field.includes('Expense') || field === 'amountPaidToFinance' || field === 'revenue' || field === 'partnerAdjustmentAmount' ? (
                          `₹${camp[field] || '0'}`
                        ) : type === 'number' ? (
                          formatNumber(camp[field]) || 'N/A'
                        ) : (
                          camp[field] || 'N/A'
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
            <span className="text-xs text-gray-500">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedData.length)} of {filteredAndSortedData.length} entries
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-8 px-3"
              >
                Previous
              </button>
              
              <span className="text-xs text-gray-600 min-w-[100px] text-center">
                Page {currentPage} of {pageCount}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
                className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900 h-8 px-3"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthCampComponent;